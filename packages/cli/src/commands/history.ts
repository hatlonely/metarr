import {
  listHistory,
  getHistory,
  undoHistory,
  createTrashFn,
  getConfig,
} from '@metarr/core';
import chalk from 'chalk';
import ora from 'ora';
import trash from 'trash';

export async function historyListAction(): Promise<void> {
  const entries = listHistory();
  if (entries.length === 0) {
    console.log(chalk.gray('暂无历史记录'));
    return;
  }
  console.log(chalk.bold(`历史记录 (${entries.length}):`));
  console.log();
  for (const e of entries) {
    const when = new Date(e.timestamp).toLocaleString();
    const counts = [
      `重命名 ${e.renamed.length}`,
      e.trashed.length > 0 ? `回收 ${e.trashed.length}` : '',
      e.createdFiles.length > 0 ? `下载 ${e.createdFiles.length}` : '',
    ]
      .filter(Boolean)
      .join(', ');
    const restored = e.restoredAt ? chalk.gray(' [已撤销]') : '';
    console.log(`  ${chalk.cyan(e.id)}${restored}`);
    console.log(`    ${e.mediaName} · ${chalk.gray(when)} · ${chalk.gray(counts)}`);
  }
  console.log();
  console.log(chalk.gray('撤销某次: metarr history undo <id>'));
}

export async function historyUndoAction(id: string): Promise<void> {
  const entry = getHistory(id);
  if (!entry) {
    console.error(chalk.red(`未找到历史记录: ${id}`));
    process.exit(1);
  }

  const spinner = ora('撤销中...').start();
  const trashItem = createTrashFn({
    trashDir: getConfig('trashDir'),
    systemTrash: (p) => trash([p]),
  });
  const result = await undoHistory(entry, { trashItem });
  spinner.succeed(`已恢复 ${result.restored} 个文件`);

  if (result.skipped.length > 0) {
    console.log();
    console.log(chalk.yellow(`跳过 ${result.skipped.length} 项:`));
    for (const s of result.skipped) {
      console.log(`  ${chalk.gray('-')} ${s.path}: ${s.reason}`);
    }
  }
  if (result.failed.length > 0) {
    console.log();
    console.log(chalk.red(`${result.failed.length} 项失败:`));
    for (const f of result.failed) {
      console.log(`  ${chalk.red('✗')} ${f.path}: ${f.error}`);
    }
  }
}
