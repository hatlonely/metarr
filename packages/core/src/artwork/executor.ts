import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { MetadataTask, ArtworkExecutionResult } from './types.js';

export async function executeArtworkPlan(tasks: MetadataTask[]): Promise<ArtworkExecutionResult> {
  const succeeded: MetadataTask[] = [];
  const failed: { task: MetadataTask; error: Error }[] = [];

  for (const task of tasks) {
    try {
      await mkdir(dirname(task.targetPath), { recursive: true });

      if (task.kind === 'image') {
        const response = await fetch(task.downloadUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const buffer = await response.arrayBuffer();
        await writeFile(task.targetPath, Buffer.from(buffer));
      } else {
        await writeFile(task.targetPath, task.content, 'utf-8');
      }

      succeeded.push(task);
    } catch (error) {
      failed.push({ task, error: error as Error });
    }
  }

  return { succeeded, failed };
}
