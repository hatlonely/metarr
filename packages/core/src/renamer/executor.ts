import { rename, mkdir, rm, readdir, unlink, stat } from 'node:fs/promises';
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

async function exists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

export interface ExecuteOptions {
  resolutions?: ConflictResolutionMap;
  filesToRemove?: string[];
  /**
   * When provided, a conflicting target being replaced and any unmatched files
   * are moved here (the trash) instead of being deleted, returning the trash
   * path (or `null` when the system trash was used). If it throws, the operation
   * is recorded as failed — we never fall back to deleting.
   */
  trashItem?: (path: string) => Promise<string | null>;
}

/**
 * Execute a rename plan: create directories and move/rename files. Replaced
 * targets and unmatched files go to the trash (via `trashItem`) rather than
 * being deleted; only the emptied source directory is removed outright.
 */
export async function executeRenamePlan(
  plan: RenamePlan,
  options?: ExecuteOptions,
): Promise<ExecutionResult> {
  const { resolutions, filesToRemove, trashItem } = options ?? {};

  const succeeded: RenameTask[] = [];
  const failed: { task: RenameTask; error: Error }[] = [];
  let skippedCount = 0;
  let overwrittenCount = 0;
  const trashedFiles: string[] = [];
  const trashedItems: { original: string; trashPath: string | null }[] = [];

  for (let i = 0; i < plan.tasks.length; i++) {
    const task = plan.tasks[i];
    const resolution = resolutions?.[i];

    try {
      switch (task.operation) {
        case 'create-dir':
          await mkdir(task.target, { recursive: true });
          break;
        case 'rename':
          if (resolution === 'skip' || task.source === task.target) {
            skippedCount++;
            continue;
          }
          // 'overwrite'/replace: move the existing target to the trash first
          // (or delete only when no trashItem is injected).
          if (await exists(task.target)) {
            if (trashItem) {
              const trashPath = await trashItem(task.target);
              trashedFiles.push(task.target);
              trashedItems.push({ original: task.target, trashPath });
            } else {
              await unlink(task.target);
            }
            overwrittenCount++;
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

  // Unmatched files → trash (or delete when no trashItem)
  const removedUnmatched: string[] = [];
  if (filesToRemove && filesToRemove.length > 0) {
    for (const filePath of filesToRemove) {
      try {
        if (trashItem) {
          const trashPath = await trashItem(filePath);
          trashedFiles.push(filePath);
          trashedItems.push({ original: filePath, trashPath });
        } else {
          await rm(filePath, { force: true });
        }
        removedUnmatched.push(filePath);
      } catch (error) {
        failed.push({
          task: {
            source: filePath,
            target: '',
            operation: 'create-dir',
            description: `移至回收站 ${filePath}`,
          },
          error: error as Error,
        });
      }
    }
  }

  // Clean up the emptied source directory (no data → removed outright)
  let cleanedSourcePath: string | undefined;
  if (succeeded.length > 0 && plan.sourcePath && (await isDirEmpty(plan.sourcePath))) {
    try {
      await rm(plan.sourcePath, { recursive: true, force: true });
      cleanedSourcePath = plan.sourcePath;
    } catch {
      // Ignore cleanup failure
    }
  }

  return {
    succeeded,
    failed,
    skippedCount,
    overwrittenCount,
    cleanedSourcePath,
    removedUnmatched,
    trashedFiles,
    trashedItems,
  };
}
