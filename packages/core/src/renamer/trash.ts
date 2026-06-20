import { statSync } from 'node:fs';
import { rename, mkdir, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, basename, dirname, extname } from 'node:path';

/** Nearest existing ancestor of `p` (so a not-yet-created path still resolves
 *  to a real directory on its volume). */
function nearestExisting(p: string): string {
  let cur = p;
  while (cur && cur !== dirname(cur)) {
    try {
      statSync(cur);
      return cur;
    } catch {
      cur = dirname(cur);
    }
  }
  return cur;
}

/** Device id of the nearest existing ancestor of `p`. */
function nearestDev(p: string): number {
  return statSync(nearestExisting(p)).dev;
}

/** Whether two paths live on the same volume (so `rename` is atomic, no copy). */
export function sameVolume(a: string, b: string): boolean {
  try {
    return nearestDev(a) === nearestDev(b);
  } catch {
    return false;
  }
}

/** Mount point of the volume holding `p`: walk up from the nearest existing
 *  ancestor until the parent directory is on a different device. */
export function volumeRoot(p: string): string {
  let cur = nearestExisting(p);
  const dev = statSync(cur).dev;
  while (cur !== dirname(cur)) {
    const parent = dirname(cur);
    let parentDev: number;
    try {
      parentDev = statSync(parent).dev;
    } catch {
      break;
    }
    if (parentDev !== dev) break;
    cur = parent;
  }
  return cur;
}

/**
 * Default trash directory for `filePath` — always on the same volume so we can
 * `rename` (never copy) and later restore from a known location:
 *   - same volume as $HOME → `~/.metarr/trash`
 *   - other volumes (e.g. a NAS mount) → `<volumeMount>/.metarr-trash`
 */
export function defaultTrashDir(filePath: string): string {
  if (sameVolume(filePath, homedir())) {
    return join(homedir(), '.metarr', 'trash');
  }
  return join(volumeRoot(filePath), '.metarr-trash');
}

async function exists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Move a file into `trashDir` (which must be on the same volume), renaming with
 * a timestamp suffix on collision so nothing in the trash is overwritten either.
 * Returns the final destination path.
 */
export async function moveToTrashDir(path: string, trashDir: string): Promise<string> {
  await mkdir(trashDir, { recursive: true });
  const name = basename(path);
  let dest = join(trashDir, name);
  if (await exists(dest)) {
    const ext = extname(name);
    const base = name.slice(0, name.length - ext.length);
    const ts = new Date()
      .toISOString()
      .replace(/[:T]/g, '')
      .replace(/\..+/, '')
      .replace(/-/g, '');
    dest = join(trashDir, `${base}.${ts}${ext}`);
    let n = 1;
    while (await exists(dest)) dest = join(trashDir, `${base}.${ts}-${n++}${ext}`);
  }
  await rename(path, dest);
  return dest;
}

export interface CreateTrashOptions {
  /** Optional same-volume trash directory; overrides the smart default when set
   *  and on the same volume as the file. */
  trashDir?: string;
  /** Last-resort system trash mover (GUI: electron shell.trashItem; CLI: trash
   *  lib), used only when the managed trash dir can't be written. */
  systemTrash: (path: string) => Promise<void>;
}

/**
 * Build a `trashItem(path)` that moves files to a managed same-volume trash
 * directory (the configured `trashDir` when on the same volume, otherwise the
 * smart per-volume default) and returns the final trash path so the move can be
 * undone later. Falls back to the system trash only when the managed move
 * fails, returning `null` (then the file can't be restored programmatically).
 * Never copies across volumes.
 */
export function createTrashFn(opts: CreateTrashOptions): (path: string) => Promise<string | null> {
  return async (path: string) => {
    const dir =
      opts.trashDir && sameVolume(path, opts.trashDir) ? opts.trashDir : defaultTrashDir(path);
    try {
      return await moveToTrashDir(path, dir);
    } catch {
      await opts.systemTrash(path);
      return null;
    }
  };
}
