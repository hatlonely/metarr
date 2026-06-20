import { resolve } from 'node:path';
import {
  parseAlbumDir,
  isAlbumComplete,
  MusicBrainzClient,
  locateReleases,
  generateMusicRenamePlan,
  fetchAlbumCover,
  localizeAlbum,
  localizeRelease,
  checkConflicts,
  findUnmatchedFiles,
  executeRenamePlan,
  createTrashFn,
  getConfig,
  buildHistoryEntry,
  recordHistory,
} from '@metarr/core';
import type { MusicBrainzRelease, ConflictResolution, ConflictResolutionMap } from '@metarr/core';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import trash from 'trash';

export interface MusicRenameOptions {
  dest: string;
  dryRun: boolean;
}

/** Title language/script preference from the display-language setting. */
function musicPref(): { preferLang?: 'zh' | 'en'; titleScript?: 'zh-Hans' | 'zh-Hant' } {
  const lang = getConfig('displayLanguage') || 'zh-CN';
  if (lang === 'zh-TW') return { preferLang: 'zh', titleScript: 'zh-Hant' };
  if (lang.startsWith('zh')) return { preferLang: 'zh', titleScript: 'zh-Hans' };
  return { preferLang: 'en' };
}

export async function musicRenameAction(
  sourcePath: string,
  options: MusicRenameOptions,
): Promise<void> {
  // Step 1: read embedded tags → album model
  const spinner = ora('读取音频标签...').start();
  let album;
  try {
    album = await parseAlbumDir(sourcePath);
  } catch (err) {
    spinner.fail(chalk.red('读取音频标签失败'));
    console.error(err);
    process.exit(1);
  }
  spinner.succeed(`解析完成: ${album.tracks.length} 个音轨`);

  console.log();
  console.log(chalk.bold('专辑信息:'));
  console.log(`  艺术家: ${album.albumArtist || chalk.gray('未知')}`);
  console.log(`  专辑: ${album.album || chalk.gray('未知')}`);
  console.log(`  年份: ${album.year || chalk.gray('未知')}`);
  if (album.discCount > 1) console.log(`  碟片: ${album.discCount}`);

  // Step 2: choose source of truth — local tags or a MusicBrainz release
  let release: MusicBrainzRelease | null = null;
  const complete = isAlbumComplete(album);
  const { online } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'online',
      message: complete
        ? '标签齐全。是否联网用 MusicBrainz 校对 / 补封面？'
        : '标签不全。是否联网用 MusicBrainz 搜索补全？',
      default: !complete,
    },
  ]);

  if (online) {
    const searchSpinner = ora('搜索 MusicBrainz...').start();
    const client = new MusicBrainzClient();
    try {
      const candidates = await locateReleases(client, album, musicPref());
      searchSpinner.succeed(`找到 ${candidates.length} 个候选`);
      if (candidates.length > 0) {
        const { mbid } = await inquirer.prompt([
          {
            type: 'list',
            name: 'mbid',
            message: '选择匹配的发行版:',
            choices: [
              ...candidates.map((c) => ({
                name: `${c.artist} - ${c.title}${c.year ? ` (${c.year})` : ''} · ${c.trackCount} 轨`,
                value: c.mbid,
              })),
              { name: chalk.gray('跳过（使用本地标签）'), value: '' },
            ],
          },
        ]);
        if (mbid) {
          const detailSpinner = ora('获取音轨列表...').start();
          release = await client.getRelease(mbid);
          release.coverUrl = await fetchAlbumCover(release.artist, release.title);
          detailSpinner.succeed(`${release.artist} - ${release.title} · ${release.tracks.length} 轨`);
        }
      }
    } catch {
      searchSpinner.fail(chalk.yellow('MusicBrainz 查询失败，改用本地标签'));
    }
  }

  // Step 3: build plan
  const destPath = resolve(options.dest);
  const { titleScript } = musicPref();
  const a = titleScript ? await localizeAlbum(album, titleScript) : album;
  const r = titleScript && release ? await localizeRelease(release, titleScript) : release;
  const plan = generateMusicRenamePlan(a, r, { destPath });

  console.log();
  console.log(chalk.bold('整理计划:'));
  for (const task of plan.tasks) {
    const rel = task.target.replace(destPath + '/', '');
    if (task.operation === 'create-dir') {
      console.log(`  ${chalk.green('+')} ${chalk.green(rel)}`);
    } else {
      console.log(`  ${chalk.cyan('→')} ${chalk.white(rel)}`);
    }
  }

  if (options.dryRun) {
    console.log();
    console.log(chalk.yellow('Dry-run 模式，未执行任何操作'));
    return;
  }

  // Step 4: unmatched files (cue / log / cover …) → optional trash
  const unmatched = await findUnmatchedFiles(plan);
  let filesToRemove: string[] = [];
  if (unmatched.length > 0) {
    console.log();
    console.log(chalk.bold(`发现 ${unmatched.length} 个未匹配文件:`));
    for (const f of unmatched) console.log(`  ${chalk.gray('[未匹配]')} ${f.name}`);
    const { removeUnmatched } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'removeUnmatched',
        message: `是否将这 ${unmatched.length} 个未匹配文件移入回收站？`,
        default: false,
      },
    ]);
    if (removeUnmatched) filesToRemove = unmatched.map((f) => f.path);
  }

  // Step 5: conflicts
  let resolutions: ConflictResolutionMap | undefined;
  const conflictResult = await checkConflicts(plan);
  if (conflictResult.hasConflicts) {
    console.log();
    console.log(chalk.bold.yellow(`! 检测到 ${conflictResult.conflicts.length} 个文件冲突`));
    const { resolution } = await inquirer.prompt([
      {
        type: 'list',
        name: 'resolution',
        message: '如何处理？',
        choices: [
          { name: '全部替换 (旧文件移入回收站，再放入新文件)', value: 'overwrite' },
          { name: '跳过所有', value: 'skip' },
          { name: '中止操作', value: 'abort' },
        ],
      },
    ]);
    if (resolution === 'abort') {
      console.log(chalk.yellow('已取消'));
      return;
    }
    resolutions = {};
    for (const c of conflictResult.conflicts) resolutions[c.taskIndex] = resolution as ConflictResolution;
  }

  // Step 6: confirm + execute (reuse the shared pipeline)
  console.log();
  const { confirm } = await inquirer.prompt([
    { type: 'confirm', name: 'confirm', message: '确认执行以上整理操作？', default: false },
  ]);
  if (!confirm) {
    console.log(chalk.yellow('已取消'));
    return;
  }

  const execSpinner = ora('整理中...').start();
  const trashItem = createTrashFn({
    trashDir: getConfig('trashDir'),
    systemTrash: (p) => trash([p]),
  });
  const result = await executeRenamePlan(plan, {
    resolutions,
    filesToRemove: filesToRemove.length > 0 ? filesToRemove : undefined,
    trashItem,
  });
  execSpinner.succeed(`完成: ${result.succeeded.length} 个操作成功`);

  recordHistory(buildHistoryEntry({ plan, result }));

  if (result.failed.length > 0) {
    console.log();
    console.log(chalk.red(`${result.failed.length} 个操作失败:`));
    for (const { task, error } of result.failed) {
      console.log(`  ${chalk.red('✗')} ${task.description}: ${error.message}`);
    }
  }
  if (result.removedUnmatched && result.removedUnmatched.length > 0) {
    console.log(chalk.gray(`  已将 ${result.removedUnmatched.length} 个未匹配文件移入回收站`));
  }
}
