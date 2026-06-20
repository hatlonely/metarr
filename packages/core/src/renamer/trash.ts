import { statSync } from 'node:fs';
import { rename, mkdir, stat } from 'node:fs/promises';
import { join, basename, dirname, extname } from 'node:path';

/** Device id of the nearest existing ancestor of `p` (so a not-yet-created
 *  path still resolves to its volume). */
function nearestDev(p: string): number {
  let cur = p;
  while (cur && cur !== dirname(cur)) {
    try {
      return statSync(cur).dev;
    } catch {
      cur = dirname(cur);
    }
  }
  return statSync(cur).dev;
}

/** Whether two paths live on the same volume (so `rename` is atomic, no copy). */
export function sameVolume(a: string, b: string): boolean {
  try {
    return nearestDev(a) === nearestDev(b);
  } catch {
    return false;
  }
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
  /** Optional same-volume trash directory; falls back to systemTrash if unset
   *  or on a different volume. */
  trashDir?: string;
  /** System trash mover (GUI: electron shell.trashItem; CLI: trash lib). */
  systemTrash: (path: string) => Promise<void>;
}

/**
 * Build a `trashItem(path)` that moves files to a same-volume `trashDir` when
 * configured, otherwise to the system trash. Never copies across volumes.
 */
export function createTrashFn(opts: CreateTrashOptions): (path: string) => Promise<void> {
  return async (path: string) => {
    if (opts.trashDir && sameVolume(path, opts.trashDir)) {
      await moveToTrashDir(path, opts.trashDir);
    } else {
      await opts.systemTrash(path);
    }
  };
}
