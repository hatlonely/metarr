import { rename, mkdir, rm, readdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { RenamePlan, RenameTask, ExecutionResult } from '../types/index.js';

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
export async function executeRenamePlan(plan: RenamePlan): Promise<ExecutionResult> {
  const succeeded: RenameTask[] = [];
  const failed: { task: RenameTask; error: Error }[] = [];

  for (const task of plan.tasks) {
    try {
      switch (task.operation) {
        case 'create-dir':
          await mkdir(task.target, { recursive: true });
          break;
        case 'rename':
          await mkdir(dirname(task.target), { recursive: true });
          await rename(task.source, task.target);
          break;
      }
      succeeded.push(task);
    } catch (error) {
      failed.push({ task, error: error as Error });
    }
  }

  // Clean up empty source directory
  let cleanedSourcePath: string | undefined;
  if (succeeded.length > 0 && plan.sourcePath && await isDirEmpty(plan.sourcePath)) {
    try {
      await rm(plan.sourcePath, { recursive: true, force: true });
      cleanedSourcePath = plan.sourcePath;
    } catch {
      // Ignore cleanup failure
    }
  }

  return { succeeded, failed, cleanedSourcePath };
}
