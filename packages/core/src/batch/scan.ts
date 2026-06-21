import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { VIDEO_EXTENSIONS, AUDIO_EXTENSIONS } from '../types/media.js';

/** Disc subdir: "Disc 1" / "CD2" / "Disc II" (roman). Season subdir: "Season 1"
 *  / "S01" / "第N季". Either marks the parent directory as a single item. */
const DISC_RE = /^(?:disc|disk|cd)\s*(?:\d+|[ivxlcdm]+)\b/i;
const SEASON_RE = /^(?:season|s)\s*\d+\b|第\s*[0-9一二三四五六七八九十]+\s*[季部]/i;

function isDiscOrSeasonDir(name: string): boolean {
  return DISC_RE.test(name) || SEASON_RE.test(name);
}

function isMediaFile(name: string): boolean {
  const i = name.lastIndexOf('.');
  if (i < 0) return false;
  const ext = name.slice(i).toLowerCase();
  return VIDEO_EXTENSIONS.has(ext) || AUDIO_EXTENSIONS.has(ext);
}

/** Single readdir per directory (no per-file stat) for speed on network drives. */
async function inspect(dir: string): Promise<{ hasMedia: boolean; subdirs: string[] }> {
  let hasMedia = false;
  const subdirs: string[] = [];
  try {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (!e.name.startsWith('.') && !e.name.startsWith('@')) subdirs.push(e.name);
      } else if (e.isFile() && !hasMedia && isMediaFile(e.name)) {
        hasMedia = true;
      }
    }
  } catch {
    // unreadable → treat as empty
  }
  return { hasMedia, subdirs };
}

/**
 * Recursively find media-item directories under a parent. A directory is one
 * media item when it directly contains media (an album / movie) or when its
 * subdirectories are Disc/Season folders containing media (a multi-disc album /
 * a TV show). Pure container directories (artist / category folders) are
 * recursed into, up to `maxDepth` levels.
 */
export async function findMediaItems(parentPath: string, maxDepth = 5): Promise<string[]> {
  const items: string[] = [];

  async function walk(dir: string, depth: number): Promise<void> {
    const { hasMedia, subdirs } = await inspect(dir);
    if (hasMedia) {
      items.push(dir);
      return;
    }
    if (subdirs.length === 0) return;

    // Disc/Season subdirs → this dir is a single item (multi-disc album / show).
    for (const s of subdirs) {
      if (isDiscOrSeasonDir(s) && (await inspect(join(dir, s))).hasMedia) {
        items.push(dir);
        return;
      }
    }

    // Otherwise recurse (artist / category folder), possibly several levels deep.
    if (depth >= maxDepth) return;
    for (const s of subdirs) await walk(join(dir, s), depth + 1);
  }

  const top = await inspect(parentPath);
  for (const s of top.subdirs) await walk(join(parentPath, s), 1);
  return items;
}
