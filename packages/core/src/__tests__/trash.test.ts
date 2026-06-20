import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';
import {
  createTrashFn,
  moveToTrashDir,
  sameVolume,
  volumeRoot,
  defaultTrashDir,
} from '../renamer/trash.js';

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'metarr-trash-'));
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function file(name: string, content = 'x'): string {
  const p = join(root, name);
  writeFileSync(p, content);
  return p;
}

describe('sameVolume', () => {
  it('is true for two paths under the same temp root', () => {
    expect(sameVolume(file('a.mkv'), join(root, 'trash'))).toBe(true);
  });
});

describe('moveToTrashDir', () => {
  it('moves the file into the trash dir on the same volume', async () => {
    const f = file('ep.mkv');
    const trash = join(root, 'trash');
    const dest = await moveToTrashDir(f, trash);
    expect(existsSync(f)).toBe(false);
    expect(existsSync(dest)).toBe(true);
    expect(dest.startsWith(trash)).toBe(true);
  });

  it('renames on collision so it never overwrites inside the trash', async () => {
    const trash = join(root, 'trash');
    await moveToTrashDir(file('dup.mkv', 'first'), trash);
    await moveToTrashDir(file('dup.mkv', 'second'), trash);
    expect(readdirSync(trash)).toHaveLength(2);
  });
});

describe('volumeRoot / defaultTrashDir', () => {
  it('volumeRoot resolves to a real ancestor directory', () => {
    const vr = volumeRoot(join(root, 'a', 'b', 'c.mkv'));
    expect(existsSync(vr)).toBe(true);
    expect(root.startsWith(vr)).toBe(true);
  });

  it('defaultTrashDir uses ~/.metarr/trash for files on the home volume', () => {
    expect(defaultTrashDir(join(homedir(), 'Movies', 'x.mkv'))).toBe(
      join(homedir(), '.metarr', 'trash'),
    );
  });
});

describe('createTrashFn', () => {
  it('moves to the configured same-volume dir and returns the trash path', async () => {
    const trash = join(root, 'trash');
    const calls: string[] = [];
    const trashItem = createTrashFn({ trashDir: trash, systemTrash: async (p) => void calls.push(p) });
    const f = file('ep.mkv');
    const dest = await trashItem(f);
    expect(existsSync(f)).toBe(false);
    expect(dest).not.toBeNull();
    expect(existsSync(dest!)).toBe(true);
    expect(dest!.startsWith(trash)).toBe(true);
    expect(calls).toHaveLength(0); // did not fall back to system trash
  });

  it('returns null and uses systemTrash when the managed move fails', async () => {
    // A file blocks the trash dir path, so mkdir/rename inside it throws.
    const blocker = file('blocker', 'x');
    const calls: string[] = [];
    const trashItem = createTrashFn({
      trashDir: join(blocker, 'sub'),
      systemTrash: async (p) => void calls.push(p),
    });
    const f = file('ep.mkv');
    const dest = await trashItem(f);
    expect(dest).toBeNull();
    expect(calls).toEqual([f]);
    expect(existsSync(f)).toBe(true); // not moved by us
  });
});
