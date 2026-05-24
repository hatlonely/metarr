import { rename, mkdir, rm, readdir, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
import type {
  RenamePlan,
  RenameTask,
  ExecutionResult,
  ConflictResolutionMap,
} from '../types/index.js';

async function isDirEmpty(dirPath: string): Promise<boolean> {
  try {
    const entries = await readdir(dirPath);
    return entries.length === 0;
  } catch {
    return false;
  }
}

/**
 * Execute a rename plan: create directories and move/rename files.
 */
export async function executeRenamePlan(
  plan: RenamePlan,
  resolutions?: ConflictResolutionMap,
  filesToRemove?: string[],
): Promise<ExecutionResult> {
  const succeeded: RenameTask[] = [];
  const failed: { task: RenameTask; error: Error }[] = [];
  let skippedCount = 0;
  let overwrittenCount = 0;

  for (let i = 0; i < plan.tasks.length; i++) {
    const task = plan.tasks[i];
    const resolution = resolutions?.[i];

    try {
      switch (task.operation) {
        case 'create-dir':
          await mkdir(task.target, { recursive: true });
          break;
        case 'rename':
          if (resolution === 'skip') {
            skippedCount++;
            continue;
          }
          // 'overwrite' or no resolution: remove target if exists, then rename
          try {
            await unlink(task.target);
            overwrittenCount++;
          } catch {
            // Target doesn't exist, that's fine
          }
          await mkdir(dirname(task.target), { recursive: true });
          await rename(task.source, task.target);
          break;
      }
      succeeded.push(task);
    } catch (error) {
      failed.push({ task, error: error as Error });
    }
  }

  // Remove unmatched files
  const removedUnmatched: string[] = [];
  if (filesToRemove && filesToRemove.length > 0) {
    for (const filePath of filesToRemove) {
      try {
        await rm(filePath, { force: true });
        removedUnmatched.push(filePath);
      } catch (error) {
        failed.push({
          task: {
            source: filePath,
            target: '',
            operation: 'create-dir',
            description: `删除未匹配文件 ${filePath}`,
          },
          error: error as Error,
        });
      }
    }
  }

  // Clean up empty source directory
  let cleanedSourcePath: string | undefined;
  if (succeeded.length > 0 && plan.sourcePath && (await isDirEmpty(plan.sourcePath))) {
    try {
      await rm(plan.sourcePath, { recursive: true, force: true });
      cleanedSourcePath = plan.sourcePath;
    } catch {
      // Ignore cleanup failure
    }
  }

  return { succeeded, failed, skippedCount, overwrittenCount, cleanedSourcePath, removedUnmatched };
}
