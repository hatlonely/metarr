import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { AssrtClient } from './assrt.js';
import type { SubtitleTask, SubtitleExecutionResult } from './types.js';

export async function executeSubtitlePlan(tasks: SubtitleTask[]): Promise<SubtitleExecutionResult> {
  const succeeded: SubtitleTask[] = [];
  const failed: { task: SubtitleTask; error: Error }[] = [];

  for (const task of tasks) {
    try {
      let downloadUrl: string;

      if (task.resolveInfo.kind === 'subdl') {
        downloadUrl = task.resolveInfo.downloadUrl;
      } else {
        const client = new AssrtClient(task.resolveInfo.token);
        const result = await client.getDirectUrl(task.resolveInfo.subId);
        if (!result) throw new Error('Assrt detail returned no download URL');
        downloadUrl = result.url;
      }

      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const content = await res.arrayBuffer();

      await mkdir(dirname(task.targetPath), { recursive: true });
      await writeFile(task.targetPath, Buffer.from(content));
      succeeded.push(task);
    } catch (error) {
      failed.push({ task, error: error as Error });
    }
  }

  return { succeeded, failed };
}
