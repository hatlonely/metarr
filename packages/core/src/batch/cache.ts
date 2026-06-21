import {
  existsSync, mkdirSync, readFileSync, writeFileSync, statSync, readdirSync, rmSync,
} from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { CONFIG_DIR, getConfig } from '../config.js';
import type { BatchItem } from './types.js';

const BATCH_DIR = join(CONFIG_DIR, 'batch');

/** Drop caches whose last scan is older than this (housekeeping default). */
export const DEFAULT_BATCH_CACHE_MAX_AGE_DAYS = 30;
/** Keep at most this many cached scans (housekeeping default). */
export const DEFAULT_BATCH_CACHE_MAX_ENTRIES = 50;

type CacheDirs = Record<string, BatchItem[]>;

/** On-disk shape. Older files were the bare `CacheDirs` map; newer files wrap it
 *  with the parent path + scan time so the cache can be listed and managed. */
interface BatchCacheFile {
  parentPath: string;
  scannedAt: number; // epoch ms
  dirs: CacheDirs;
}

/** Summary of one cached scan, for the management UI. */
export interface BatchCacheInfo {
  id: string; // file stem (sha1 prefix) — stable delete key
  parentPath: string; // stored, or derived from leaf dirs for legacy files
  scannedAt: number; // stored scan time, else file mtime
  itemCount: number; // total BatchItem across all leaf dirs
  size: number; // file size in bytes
}

/** Cheap directory signature (mtime + entry count) to invalidate cached analysis
 *  only when the folder actually changed. */
export function dirSignature(dir: string): string {
  try {
    const s = statSync(dir);
    const count = readdirSync(dir).length;
    return `${Math.floor(s.mtimeMs)}:${count}`;
  } catch {
    return '0:0';
  }
}

function cacheId(parentPath: string): string {
  return createHash('sha1').update(parentPath).digest('hex').slice(0, 16);
}

function cacheFile(parentPath: string): string {
  return join(BATCH_DIR, `${cacheId(parentPath)}.json`);
}

/** Longest common directory prefix of the leaf dirs — the parent for legacy files. */
function commonParent(paths: string[]): string {
  if (paths.length === 0) return '';
  const split = paths.map((p) => p.split('/'));
  const first = split[0];
  let i = 0;
  for (; i < first.length; i++) {
    if (!split.every((s) => s[i] === first[i])) break;
  }
  return first.slice(0, i).join('/') || '/';
}

function isWrapped(raw: unknown): raw is BatchCacheFile {
  return typeof raw === 'object' && raw !== null && 'dirs' in raw && 'parentPath' in raw;
}

/** Load cached analysis for a parent dir, keyed by leaf directory path. Each
 *  directory maps to the item(s) it produced (a folder may yield several items,
 *  e.g. multiple loose movies). Accepts both the legacy and wrapped formats. */
export function loadBatchCache(parentPath: string): CacheDirs {
  const f = cacheFile(parentPath);
  if (!existsSync(f)) return {};
  try {
    const raw = JSON.parse(readFileSync(f, 'utf-8')) as unknown;
    return isWrapped(raw) ? raw.dirs : (raw as CacheDirs);
  } catch {
    return {};
  }
}

export function saveBatchCache(parentPath: string, items: CacheDirs): void {
  if (!existsSync(BATCH_DIR)) mkdirSync(BATCH_DIR, { recursive: true });
  const payload: BatchCacheFile = { parentPath, scannedAt: Date.now(), dirs: items };
  writeFileSync(cacheFile(parentPath), JSON.stringify(payload) + '\n', 'utf-8');
}

/** List every cached scan, newest first. */
export function listBatchCaches(): BatchCacheInfo[] {
  if (!existsSync(BATCH_DIR)) return [];
  const out: BatchCacheInfo[] = [];
  for (const name of readdirSync(BATCH_DIR)) {
    if (!name.endsWith('.json')) continue;
    const path = join(BATCH_DIR, name);
    try {
      const stat = statSync(path);
      const raw = JSON.parse(readFileSync(path, 'utf-8')) as unknown;
      const dirs = isWrapped(raw) ? raw.dirs : (raw as CacheDirs);
      const itemCount = Object.values(dirs).reduce((n, arr) => n + (arr?.length ?? 0), 0);
      out.push({
        id: name.replace(/\.json$/, ''),
        parentPath: isWrapped(raw) ? raw.parentPath : commonParent(Object.keys(dirs)),
        scannedAt: isWrapped(raw) && raw.scannedAt ? raw.scannedAt : Math.floor(stat.mtimeMs),
        itemCount,
        size: stat.size,
      });
    } catch {
      // Skip a corrupt cache file.
    }
  }
  return out.sort((a, b) => b.scannedAt - a.scannedAt);
}

/** Delete one cached scan by its id (file stem). */
export function deleteBatchCache(id: string): void {
  rmSync(join(BATCH_DIR, `${id}.json`), { force: true });
}

/** Delete every cached scan. */
export function clearBatchCaches(): void {
  if (!existsSync(BATCH_DIR)) return;
  for (const name of readdirSync(BATCH_DIR)) {
    if (name.endsWith('.json')) rmSync(join(BATCH_DIR, name), { force: true });
  }
}

/**
 * Housekeeping, mirroring history pruning: drop caches that are empty, older than
 * the configured max age, or beyond the configured max count (oldest first).
 * Reads `batchCacheMaxAgeDays` / `batchCacheMaxEntries` from config, with defaults.
 */
export function pruneBatchCaches(): void {
  const maxAgeDays = getConfig('batchCacheMaxAgeDays') ?? DEFAULT_BATCH_CACHE_MAX_AGE_DAYS;
  const maxEntries = getConfig('batchCacheMaxEntries') ?? DEFAULT_BATCH_CACHE_MAX_ENTRIES;
  const cutoff = Date.now() - maxAgeDays * 86_400_000;
  const caches = listBatchCaches(); // newest first
  caches.forEach((info, i) => {
    if (info.itemCount === 0 || info.scannedAt < cutoff || i >= maxEntries) {
      deleteBatchCache(info.id);
    }
  });
}

export { BATCH_DIR };
