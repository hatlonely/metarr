import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { unzipSync } from 'fflate';
import { AssrtClient } from './assrt.js';
import type { SubtitleTask, SubtitleExecutionResult } from './types.js';

const SUBTITLE_EXTS = ['srt', 'ass', 'ssa', 'sub', 'vtt'];

/** Pick the best subtitle file from an unzipped archive, preferring .srt. */
function pickSubtitleEntry(files: Record<string, Uint8Array>): { name: string; data: Uint8Array } | null {
  const entries = Object.entries(files).filter(([name]) => {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    return SUBTITLE_EXTS.includes(ext);
  });
  if (entries.length === 0) return null;
  entries.sort(([a], [b]) => {
    const extA = a.split('.').pop()?.toLowerCase() ?? '';
    const extB = b.split('.').pop()?.toLowerCase() ?? '';
    return SUBTITLE_EXTS.indexOf(extA) - SUBTITLE_EXTS.indexOf(extB);
  });
  const [name, data] = entries[0];
  return { name, data };
}

function replaceExt(path: string, ext: string): string {
  return path.replace(/\.[^.]+$/, `.${ext}`);
}

export async function executeSubtitlePlan(tasks: SubtitleTask[]): Promise<SubtitleExecutionResult> {
  const succeeded: SubtitleTask[] = [];
  const failed: { task: SubtitleTask; error: Error }[] = [];

  for (const task of tasks) {
    try {
      let finalPath = task.targetPath;
      let bytes: Uint8Array;

      if (task.resolveInfo.kind === 'subdl') {
        // SubDL serves ZIP archives; download and extract the subtitle file.
        const res = await fetch(task.resolveInfo.downloadUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const zipBytes = new Uint8Array(await res.arrayBuffer());
        const files = unzipSync(zipBytes);
        const entry = pickSubtitleEntry(files);
        if (!entry) throw new Error('No subtitle file in archive');
        bytes = entry.data;
        const realExt = entry.name.split('.').pop()?.toLowerCase() ?? 'srt';
        finalPath = replaceExt(task.targetPath, realExt);
      } else {
        // Assrt: resolve the direct download URL lazily, then fetch the file.
        const client = new AssrtClient(task.resolveInfo.token);
        const result = await client.getDirectUrl(task.resolveInfo.subId);
        if (!result) throw new Error('Assrt detail returned no download URL');
        const res = await fetch(result.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        bytes = new Uint8Array(await res.arrayBuffer());
        finalPath = replaceExt(task.targetPath, result.ext);
      }

      await mkdir(dirname(finalPath), { recursive: true });
      await writeFile(finalPath, bytes);
      succeeded.push({ ...task, targetPath: finalPath });
    } catch (error) {
      failed.push({ task, error: error as Error });
    }
  }

  return { succeeded, failed };
}
