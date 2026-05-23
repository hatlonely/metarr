import { rename, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { RenamePlan, RenameTask, ExecutionResult } from '../types/index.js';

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

  return { succeeded, failed };
}
