import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { rename, mkdir, rmdir, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { CONFIG_DIR, getConfig } from '../config.js';
import type { RenamePlan, ExecutionResult } from '../types/renamer.js';
import type { ArtworkExecutionResult } from '../artwork/types.js';
import type { SubtitleExecutionResult } from '../subtitle/types.js';
import type { HistoryEntry, UndoResult } from './types.js';

export type { HistoryEntry, UndoResult, TrashedItem } from './types.js';

const HISTORY_DIR = join(CONFIG_DIR, 'history');
const DEFAULT_MAX_ENTRIES = 1000;
const DEFAULT_MAX_AGE_DAYS = 365;

function ensureDir(): void {
  if (!existsSync(HISTORY_DIR)) mkdirSync(HISTORY_DIR, { recursive: true });
}

function entryPath(id: string): string {
  return join(HISTORY_DIR, `${id}.json`);
}

function genId(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  const ts = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  return `${ts}-${Math.random().toString(36).slice(2, 6)}`;
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

/** Assemble an undoable history entry from a rename run (and optional artwork /
 *  subtitle downloads that ran alongside it). */
export function buildHistoryEntry(input: {
  plan: RenamePlan;
  result: ExecutionResult;
  artworkResult?: ArtworkExecutionResult | null;
  subtitleResult?: SubtitleExecutionResult | null;
}): HistoryEntry {
  const { plan, result, artworkResult, subtitleResult } = input;
  const match = plan.tmdbMatch;
  const renamed = result.succeeded
    .filter((t) => t.operation === 'rename')
    .map((t) => ({ from: t.source, to: t.target }));
  const createdDirs = result.succeeded
    .filter((t) => t.operation === 'create-dir')
    .map((t) => t.target);
  const createdFiles = [
    ...(artworkResult?.succeeded ?? []).map((t) => t.targetPath),
    ...(subtitleResult?.succeeded ?? []).map((t) => t.targetPath),
  ];

  return {
    id: genId(),
    timestamp: new Date().toISOString(),
    mediaName: match.displayName || match.originalName,
    mediaType: plan.mediaType,
    originalName:
      match.originalName && match.originalName !== match.displayName
        ? match.originalName
        : undefined,
    year: match.year || undefined,
    poster: match.posterUrl,
    sourcePath: plan.sourcePath,
    destPath: plan.destPath,
    renamed,
    createdDirs,
    trashed: result.trashedItems ?? [],
    createdFiles,
    cleanedSourcePath: result.cleanedSourcePath,
  };
}

/** Persist an entry. No-op when nothing meaningful happened. */
export function recordHistory(entry: HistoryEntry): void {
  if (entry.renamed.length === 0 && entry.trashed.length === 0 && entry.createdFiles.length === 0) {
    return;
  }
  ensureDir();
  writeFileSync(entryPath(entry.id), JSON.stringify(entry, null, 2) + '\n', 'utf-8');
  pruneHistory();
}

/** All entries, newest first. */
export function listHistory(): HistoryEntry[] {
  if (!existsSync(HISTORY_DIR)) return [];
  const entries: HistoryEntry[] = [];
  for (const name of readdirSync(HISTORY_DIR)) {
    if (!name.endsWith('.json')) continue;
    try {
      entries.push(JSON.parse(readFileSync(join(HISTORY_DIR, name), 'utf-8')) as HistoryEntry);
    } catch {
      // Skip a corrupt entry.
    }
  }
  return entries.sort((a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
}

export function getHistory(id: string): HistoryEntry | null {
  const p = entryPath(id);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf-8')) as HistoryEntry;
  } catch {
    return null;
  }
}

export function deleteHistory(id: string): void {
  rmSync(entryPath(id), { force: true });
}

/** Drop entries beyond the configured count / age limits. */
export function pruneHistory(): void {
  const maxEntries = getConfig('historyMaxEntries') ?? DEFAULT_MAX_ENTRIES;
  const maxAgeDays = getConfig('historyMaxAgeDays') ?? DEFAULT_MAX_AGE_DAYS;
  const entries = listHistory(); // newest first
  const cutoff = Date.now() - maxAgeDays * 86_400_000;
  const remove = new Set<string>();
  entries.forEach((e, i) => {
    if (i >= maxEntries) remove.add(e.id);
    if (Date.parse(e.timestamp) < cutoff) remove.add(e.id);
  });
  for (const id of remove) deleteHistory(id);
}

/**
 * Undo a whole run: recreate the emptied source dir, move renamed files back,
 * restore trashed files from their trash path, trash any downloaded artifacts,
 * and drop now-empty created dirs. Never overwrites — anything occupying a
 * restore target is moved to the trash first.
 */
export async function undoHistory(
  entry: HistoryEntry,
  opts: { trashItem: (path: string) => Promise<string | null> },
): Promise<UndoResult> {
  const { trashItem } = opts;
  const skipped: UndoResult['skipped'] = [];
  const failed: UndoResult['failed'] = [];
  let restored = 0;

  // 1. Recreate the emptied source directory so source-area restores have a home.
  if (entry.cleanedSourcePath) {
    try {
      await mkdir(entry.cleanedSourcePath, { recursive: true });
    } catch {
      // Best-effort.
    }
  }

  // 2. Move renamed files back (to → from).
  for (const { from, to } of entry.renamed) {
    try {
      if (!(await pathExists(to))) {
        skipped.push({ path: to, reason: '目标文件已不存在' });
        continue;
      }
      if (await pathExists(from)) await trashItem(from); // never overwrite
      await mkdir(dirname(from), { recursive: true });
      await rename(to, from);
      restored++;
    } catch (e) {
      failed.push({ path: to, error: (e as Error).message });
    }
  }

  // 3. Restore trashed files (trashPath → original).
  for (const { original, trashPath } of entry.trashed) {
    if (!trashPath) {
      skipped.push({ path: original, reason: '在系统回收站,需手动恢复' });
      continue;
    }
    try {
      if (!(await pathExists(trashPath))) {
        skipped.push({ path: original, reason: '回收站中的文件已不存在' });
        continue;
      }
      if (await pathExists(original)) await trashItem(original); // never overwrite
      await mkdir(dirname(original), { recursive: true });
      await rename(trashPath, original);
      restored++;
    } catch (e) {
      failed.push({ path: original, error: (e as Error).message });
    }
  }

  // 4. Trash downloaded artifacts (artwork / nfo / subtitles).
  for (const f of entry.createdFiles) {
    try {
      if (await pathExists(f)) await trashItem(f);
    } catch (e) {
      failed.push({ path: f, error: (e as Error).message });
    }
  }

  // 5. Remove created dirs that are now empty (deepest first).
  for (const dir of [...entry.createdDirs].reverse()) {
    try {
      await rmdir(dir);
    } catch {
      // Not empty or already gone — leave it.
    }
  }

  // 6. Mark this run restored.
  entry.restoredAt = new Date().toISOString();
  try {
    if (existsSync(entryPath(entry.id))) {
      writeFileSync(entryPath(entry.id), JSON.stringify(entry, null, 2) + '\n', 'utf-8');
    }
  } catch {
    // Best-effort.
  }

  return { restored, skipped, failed };
}

export { HISTORY_DIR };
