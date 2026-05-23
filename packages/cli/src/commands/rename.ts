import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { MediaType, ParsedMedia, RenameOptions, RenamePlan, TMDBMatch, ConflictResolution, ConflictResolutionMap } from '@metarr/core';
import {
  parseMediaDir,
  TMDBClient,
  generateTvRenamePlan,
  generateMovieRenamePlan,
  executeRenamePlan,
  checkConflicts,
  findUnmatchedFiles,
  getTmdbKey,
  getConfig,
} from '@metarr/core';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';

interface RenameCommandOptions {
  dest: string;
  type: string;
  dryRun: boolean;
  tmdbKey?: string;
  lang?: string;
  imdb: boolean;
}

export async function renameAction(source: string, options: RenameCommandOptions): Promise<void> {
  // Validate source
  const sourcePath = resolve(source);
  if (!existsSync(sourcePath)) {
    console.error(chalk.red(`错误: 源目录不存在: ${sourcePath}`));
    process.exit(1);
  }

  const apiKey = getTmdbKey(options.tmdbKey);
  if (!apiKey) {
    console.error(chalk.red('错误: 请通过以下方式之一提供 TMDB API Key:'));
    console.error(chalk.red('  1. --tmdb-key 参数'));
    console.error(chalk.red('  2. METARR_TMDB_KEY 环境变量'));
    console.error(chalk.red('  3. metarr config set tmdbKey <key>'));
    process.exit(1);
  }

  const destPath = resolve(options.dest);
  const displayLanguage = getConfig('displayLanguage', options.lang) || 'zh-CN';

  // Step 1: Parse directory
  const spinner = ora('解析目录...').start();
  let parsed: ParsedMedia;
  try {
    parsed = await parseMediaDir(sourcePath, {
      type: options.type === 'auto' ? undefined : (options.type as MediaType),
    });
  } catch (err) {
    spinner.fail(chalk.red('解析目录失败'));
    console.error(err);
    process.exit(1);
  }
  spinner.succeed('解析目录完成');

  // Display parse results
  console.log();
  console.log(chalk.bold('解析结果:'));
  console.log(`  中文标题: ${parsed.chineseTitle || chalk.gray('未检测到')}`);
  console.log(`  英文标题: ${parsed.englishTitle || chalk.gray('未检测到')}`);
  console.log(`  年份: ${parsed.year || chalk.gray('未检测到')}`);
  console.log(`  类型: ${parsed.type === 'unknown' ? chalk.yellow('未确定') : parsed.type === 'tv' ? '电视剧' : '电影'}`);
  console.log(`  文件数: ${parsed.episodes.length}`);
  if (parsed.tags.resolution) console.log(`  分辨率: ${parsed.tags.resolution}`);
  if (parsed.tags.codec) console.log(`  编码: ${parsed.tags.codec}`);
  if (parsed.tags.isDV) console.log(`  杜比视界: 是`);

  // Step 2: Confirm or override media type
  let mediaType: MediaType;
  if (parsed.type !== 'unknown') {
    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: `媒体类型为 "${parsed.type === 'tv' ? '电视剧' : '电影'}"，是否正确？`,
        default: true,
      },
    ]);
    mediaType = confirmed ? (parsed.type as MediaType) : await askMediaType();
  } else {
    mediaType = await askMediaType();
  }

  // Step 3: Search TMDB
  const client = new TMDBClient({ apiKey, language: displayLanguage });

  // Build list of queries to try in order
  const queries: string[] = [];
  if (parsed.chineseTitle) queries.push(parsed.chineseTitle);
  if (parsed.englishTitle && parsed.englishTitle !== parsed.chineseTitle) {
    queries.push(parsed.englishTitle);
  }
  if (parsed.originalDirName) queries.push(parsed.originalDirName);

  let matches: TMDBMatch[] = [];
  const triedQueries: string[] = [];

  for (const query of queries) {
    if (triedQueries.includes(query)) continue;
    triedQueries.push(query);
    const searchSpinner = ora(`搜索 TMDB: ${query}...`).start();
    try {
      // 先带年份搜索，如果无结果则去掉年份重试
      matches = await client.fuzzySearch(query, mediaType, parsed.year);
    } catch (err) {
      searchSpinner.fail(chalk.red('TMDB 搜索失败'));
      console.error(err);
      process.exit(1);
    }
    searchSpinner.succeed(`"${query}" 找到 ${matches.length} 个结果`);
    if (matches.length > 0) break;
  }

  // If still no results, let user enter custom query
  if (matches.length === 0) {
    console.log(chalk.yellow('自动搜索未找到结果，请输入关键词手动搜索'));
    const { customQuery } = await inquirer.prompt([
      {
        type: 'input',
        name: 'customQuery',
        message: '搜索关键词:',
      },
    ]);
    if (!customQuery.trim()) process.exit(0);

    const searchSpinner = ora(`搜索 TMDB: ${customQuery}...`).start();
    try {
      matches = await client.search(customQuery, mediaType);
    } catch (err) {
      searchSpinner.fail(chalk.red('TMDB 搜索失败'));
      console.error(err);
      process.exit(1);
    }
    searchSpinner.succeed(`找到 ${matches.length} 个结果`);
  }

  if (matches.length === 0) {
    console.log(chalk.yellow('未找到匹配结果'));
    process.exit(0);
  }

  // Step 4: User selects match
  console.log();
  const { selectedId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedId',
      message: '选择正确的匹配项:',
      choices: matches.map((m) => {
        const name = m.displayName || m.originalName;
        const suffix = m.originalName && m.displayName && m.originalName !== m.displayName
          ? ` - ${m.originalName}` : '';
        return {
          name: `${name} (${m.year}) [tmdbid-${m.id}]${suffix}`,
          value: m.id,
        };
      }),
    },
  ]);

  const tmdbMatch = matches.find((m) => m.id === selectedId)!;

  // Step 5: Get IMDB ID for movies
  if (mediaType === 'movie') {
    try {
      const details = await client.getMovieDetails(tmdbMatch.id);
      tmdbMatch.imdbId = details.imdb_id;
    } catch {
      // Ignore - will use tmdbid instead
    }
  }

  // Step 6: Generate rename plan
  const renameOptions: RenameOptions = {
    destPath,
    dryRun: options.dryRun,
    preferImdbId: options.imdb,
  };

  const plan: RenamePlan =
    mediaType === 'tv'
      ? generateTvRenamePlan(parsed, tmdbMatch, renameOptions)
      : generateMovieRenamePlan(parsed, tmdbMatch, renameOptions);

  // Step 7: Display rename plan
  console.log();
  console.log(chalk.bold('重命名计划:'));
  console.log(chalk.gray(`  ${plan.summary}`));
  console.log();
  for (const task of plan.tasks) {
    if (task.operation === 'create-dir') {
      console.log(`  ${chalk.green('+')} ${chalk.green(task.target)}`);
    } else {
      const shortSource = task.source.replace(parsed.sourcePath + '/', '');
      const shortTarget = task.target.replace(destPath + '/', '');
      console.log(`  ${chalk.cyan('→')} ${chalk.gray(shortSource)}`);
      console.log(`    ${chalk.white(shortTarget)}`);
    }
  }

  if (options.dryRun) {
    console.log();
    console.log(chalk.yellow('Dry-run 模式，未执行任何操作'));
    return;
  }

  // Step 7.3: Find unmatched files
  const unmatchedFiles = await findUnmatchedFiles(sourcePath, plan);
  let filesToRemove: string[] = [];

  if (unmatchedFiles.length > 0) {
    console.log();
    console.log(chalk.bold(`发现 ${unmatchedFiles.length} 个未匹配文件:`));
    for (const file of unmatchedFiles) {
      console.log(`  ${chalk.gray('[未匹配]')} ${file.name} (${formatFileSize(file.size)}) [${file.type}]`);
    }

    const { removeUnmatched } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'removeUnmatched',
        message: `是否删除这 ${unmatchedFiles.length} 个未匹配文件？`,
        default: false,
      },
    ]);

    if (removeUnmatched) {
      filesToRemove = unmatchedFiles.map(f => f.path);
    }
  }

  // Step 7.5: Check for conflicts
  let resolutions: ConflictResolutionMap | undefined;
  const conflictResult = await checkConflicts(plan);

  if (conflictResult.hasConflicts) {
    console.log();
    console.log(chalk.bold.yellow(`! 检测到 ${conflictResult.conflicts.length} 个文件冲突:`));
    console.log();

    for (const conflict of conflictResult.conflicts) {
      const shortTarget = conflict.task.target.replace(destPath + '/', '');
      if (conflict.isSameFile) {
        console.log(`  ${chalk.gray('[重复]')} ${chalk.cyan(shortTarget)}`);
      } else {
        console.log(`  ${chalk.red('[冲突]')} ${chalk.cyan(shortTarget)}`);
      }
      console.log(`    源: ${formatFileSize(conflict.sourceInfo.size)}, ${conflict.sourceInfo.mtime}`);
      console.log(`    目标: ${formatFileSize(conflict.targetInfo.size)}, ${conflict.targetInfo.mtime}`);
      if (conflict.isSameFile) {
        console.log(chalk.gray('    文件大小和修改时间相同，可能是重复文件'));
      }
      console.log();
    }

    const { resolution } = await inquirer.prompt([
      {
        type: 'list',
        name: 'resolution',
        message: '检测到文件冲突，如何处理？',
        choices: [
          { name: '全部覆盖 (所有冲突文件将被覆盖)', value: 'overwrite' },
          { name: '跳过所有 (跳过所有冲突文件，保留目标文件)', value: 'skip' },
          { name: '中止操作 (不执行任何操作)', value: 'abort' },
        ],
      },
    ]);

    if (resolution === 'abort') {
      console.log(chalk.yellow('已取消'));
      return;
    }

    resolutions = {};
    for (const conflict of conflictResult.conflicts) {
      resolutions[conflict.taskIndex] = resolution as ConflictResolution;
    }
  }

  // Step 8: Confirm and execute
  console.log();
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: '确认执行以上重命名操作？',
      default: false,
    },
  ]);

  if (!confirm) {
    console.log(chalk.yellow('已取消'));
    return;
  }

  const execSpinner = ora('执行重命名...').start();
  const result = await executeRenamePlan(plan, resolutions, filesToRemove.length > 0 ? filesToRemove : undefined);
  execSpinner.succeed(`完成: ${result.succeeded.length} 个操作成功`);

  if (result.failed.length > 0) {
    console.log();
    console.log(chalk.red(`${result.failed.length} 个操作失败:`));
    for (const { task, error } of result.failed) {
      console.log(`  ${chalk.red('✗')} ${task.description}: ${error.message}`);
    }
  }

  if (result.cleanedSourcePath) {
    console.log();
    console.log(chalk.gray(`  已清理空源目录: ${result.cleanedSourcePath}`));
  }

  if (result.removedUnmatched && result.removedUnmatched.length > 0) {
    console.log();
    console.log(chalk.gray(`  已删除 ${result.removedUnmatched.length} 个未匹配文件`));
  }
}

async function askMediaType(): Promise<MediaType> {
  const { type } = await inquirer.prompt([
    {
      type: 'list',
      name: 'type',
      message: '请选择媒体类型:',
      choices: [
        { name: '电视剧 (TV)', value: 'tv' },
        { name: '电影 (Movie)', value: 'movie' },
      ],
    },
  ]);
  return type as MediaType;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
