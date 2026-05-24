import { stat } from 'node:fs/promises';
import type {
  RenamePlan,
  ConflictCheckResult,
  FileConflict,
  ConflictFileInfo,
} from '../types/index.js';

async function getFileInfo(path: string): Promise<ConflictFileInfo | null> {
  try {
    const s = await stat(path);
    return {
      path,
      size: s.size,
      mtime: s.mtime.toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Pre-flight check for file conflicts in a rename plan.
 * For every 'rename' task, checks whether the target path already exists.
 */
export async function checkConflicts(plan: RenamePlan): Promise<ConflictCheckResult> {
  const conflicts: FileConflict[] = [];

  for (let i = 0; i < plan.tasks.length; i++) {
    const task = plan.tasks[i];
    if (task.operation !== 'rename') continue;

    const targetInfo = await getFileInfo(task.target);
    if (!targetInfo) continue;

    const sourceInfo = await getFileInfo(task.source);
    if (!sourceInfo) continue;

    const isSameFile = sourceInfo.size === targetInfo.size && sourceInfo.mtime === targetInfo.mtime;

    conflicts.push({
      taskIndex: i,
      task,
      sourceInfo,
      targetInfo,
      isSameFile,
    });
  }

  const duplicateCount = conflicts.filter((c) => c.isSameFile).length;
  const overwriteCount = conflicts.length - duplicateCount;

  return {
    conflicts,
    hasConflicts: conflicts.length > 0,
    duplicateCount,
    overwriteCount,
  };
}
