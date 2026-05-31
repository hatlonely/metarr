import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { ArtworkTask, ArtworkExecutionResult } from './types.js';

export async function executeArtworkPlan(tasks: ArtworkTask[]): Promise<ArtworkExecutionResult> {
  const succeeded: ArtworkTask[] = [];
  const failed: { task: ArtworkTask; error: Error }[] = [];

  for (const task of tasks) {
    try {
      const response = await fetch(task.downloadUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = await response.arrayBuffer();
      await mkdir(dirname(task.targetPath), { recursive: true });
      await writeFile(task.targetPath, Buffer.from(buffer));
      succeeded.push(task);
    } catch (error) {
      failed.push({ task, error: error as Error });
    }
  }

  return { succeeded, failed };
}
