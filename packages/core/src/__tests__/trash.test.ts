import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createTrashFn, moveToTrashDir, sameVolume } from '../renamer/trash.js';

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

describe('createTrashFn', () => {
  it('uses the same-volume trash dir when configured', async () => {
    const trash = join(root, 'trash');
    const calls: string[] = [];
    const trashItem = createTrashFn({ trashDir: trash, systemTrash: async (p) => void calls.push(p) });
    const f = file('ep.mkv');
    await trashItem(f);
    expect(existsSync(f)).toBe(false);
    expect(readdirSync(trash)).toHaveLength(1);
    expect(calls).toHaveLength(0); // did not fall back to system trash
  });

  it('falls back to systemTrash when no trash dir is set', async () => {
    const calls: string[] = [];
    const trashItem = createTrashFn({ systemTrash: async (p) => void calls.push(p) });
    const f = file('ep.mkv');
    await trashItem(f);
    expect(calls).toEqual([f]);
  });

  it('falls back to systemTrash when the trash dir is on another volume', async () => {
    const calls: string[] = [];
    // /dev is a different device than the temp dir on macOS/Linux
    const trashItem = createTrashFn({ trashDir: '/dev/metarr-x', systemTrash: async (p) => void calls.push(p) });
    const f = file('ep.mkv');
    await trashItem(f);
    expect(calls).toEqual([f]);
    expect(existsSync(f)).toBe(true); // not moved by us
  });
});
