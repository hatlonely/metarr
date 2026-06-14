import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { unzipSync } from 'fflate';
import { createExtractorFromData } from 'node-unrar-js';
import { AssrtClient } from './assrt.js';
import { LANG_FILENAME_TOKENS } from './types.js';
import type { SubtitleTask, SubtitleExecutionResult } from './types.js';

const SUBTITLE_EXTS = ['srt', 'ass', 'ssa', 'sub', 'vtt'];

function extOf(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

function isSubtitleFile(name: string): boolean {
  return SUBTITLE_EXTS.includes(extOf(name));
}

/** Extract a zip or rar archive into a { filename: bytes } map. */
async function extractArchive(bytes: Uint8Array, ext: string): Promise<Record<string, Uint8Array>> {
  if (ext === 'zip') {
    return unzipSync(bytes);
  }
  if (ext === 'rar') {
    const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const extractor = await createExtractorFromData({ data: ab });
    const { files } = extractor.extract();
    const out: Record<string, Uint8Array> = {};
    for (const file of files) {
      if (file.fileHeader.flags.directory || !file.extraction) continue;
      out[file.fileHeader.name] = file.extraction;
    }
    return out;
  }
  throw new Error(`Unsupported archive: .${ext}`);
}

function matchesEpisode(name: string, season?: number, episode?: number): boolean {
  if (season === undefined || episode === undefined) return true;
  const s = String(season).padStart(2, '0');
  const e = String(episode).padStart(2, '0');
  const lower = name.toLowerCase();
  // S01E01 / s01e01 / 1x01
  return (
    lower.includes(`s${s}e${e}`) ||
    lower.includes(`${season}x${e}`) ||
    lower.includes(`.${s}${e}.`)
  );
}

function languageScore(name: string, language: string): number {
  const tokens = LANG_FILENAME_TOKENS[language] ?? [];
  const lower = name.toLowerCase();
  return tokens.some((tok) => lower.includes(tok)) ? 1 : 0;
}

/**
 * Pick the best subtitle entry from an extracted archive for a given
 * episode + language. Prefers episode match, then language match, then .srt.
 */
function pickEntry(
  files: Record<string, Uint8Array>,
  language: string,
  season?: number,
  episode?: number,
): { name: string; data: Uint8Array } | null {
  let candidates = Object.keys(files).filter(isSubtitleFile);
  if (candidates.length === 0) return null;

  const epMatches = candidates.filter((n) => matchesEpisode(n, season, episode));
  if (epMatches.length > 0) candidates = epMatches;

  candidates.sort((a, b) => {
    const langDiff = languageScore(b, language) - languageScore(a, language);
    if (langDiff !== 0) return langDiff;
    // prefer .srt over other formats
    return SUBTITLE_EXTS.indexOf(extOf(a)) - SUBTITLE_EXTS.indexOf(extOf(b));
  });

  const name = candidates[0];
  return { name, data: files[name] };
}

function replaceExt(path: string, ext: string): string {
  return path.replace(/\.[^.]+$/, `.${ext}`);
}

export async function executeSubtitlePlan(tasks: SubtitleTask[]): Promise<SubtitleExecutionResult> {
  const succeeded: SubtitleTask[] = [];
  const failed: { task: SubtitleTask; error: Error }[] = [];

  // Cache downloaded+extracted archives across tasks (season packs are shared).
  const archiveCache = new Map<string, Record<string, Uint8Array>>();
  const directBytesCache = new Map<string, { bytes: Uint8Array; ext: string }>();

  for (const task of tasks) {
    try {
      let finalPath = task.targetPath;
      let bytes: Uint8Array;

      if (task.resolveInfo.kind === 'subdl') {
        // SubDL always serves a ZIP with a single subtitle file.
        const res = await fetch(task.resolveInfo.downloadUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const files = await extractArchive(new Uint8Array(await res.arrayBuffer()), 'zip');
        const entry = pickEntry(files, task.language);
        if (!entry) throw new Error('No subtitle file in archive');
        bytes = entry.data;
        finalPath = replaceExt(task.targetPath, extOf(entry.name) || 'srt');
      } else {
        const { subId, token, season, episode, language } = task.resolveInfo;

        // Resolve the download URL (one detail call per subId).
        const client = new AssrtClient(token);
        const download = await client.getDownload(subId);
        if (!download) throw new Error('Assrt returned no download URL');

        if (isSubtitleFile(`x.${download.ext}`)) {
          // Direct subtitle file (not an archive).
          let cached = directBytesCache.get(download.url);
          if (!cached) {
            const res = await fetch(download.url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            cached = { bytes: new Uint8Array(await res.arrayBuffer()), ext: download.ext };
            directBytesCache.set(download.url, cached);
          }
          bytes = cached.bytes;
          finalPath = replaceExt(task.targetPath, cached.ext);
        } else {
          // Archive (zip/rar) — download once, extract, pick by episode+language.
          let files = archiveCache.get(download.url);
          if (!files) {
            const res = await fetch(download.url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            files = await extractArchive(new Uint8Array(await res.arrayBuffer()), download.ext);
            archiveCache.set(download.url, files);
          }
          const entry = pickEntry(files, language, season, episode);
          if (!entry) throw new Error('No matching subtitle in archive');
          bytes = entry.data;
          finalPath = replaceExt(task.targetPath, extOf(entry.name) || 'srt');
        }
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
