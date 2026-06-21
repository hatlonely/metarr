import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { findMediaItems } from '../batch/scan.js';

let root: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'metarr-batch-'));
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function touch(...parts: string[]) {
  const p = join(root, ...parts);
  mkdirSync(join(p, '..'), { recursive: true });
  writeFileSync(p, 'x');
}

describe('findMediaItems', () => {
  it('treats a flat album/movie folder as one item', async () => {
    touch('Album A', '01.flac');
    touch('Movie B', 'movie.mkv');
    const items = (await findMediaItems(root)).map((p) => relative(root, p)).sort();
    expect(items).toEqual(['Album A', 'Movie B']);
  });

  it('treats a multi-disc album (Disc subdirs) as one item', async () => {
    touch('2CD Album', 'Disc 01', '01.flac');
    touch('2CD Album', 'Disc 02', '01.flac');
    touch('2CD Album', 'cover.jpg');
    const items = (await findMediaItems(root)).map((p) => relative(root, p));
    expect(items).toEqual(['2CD Album']);
  });

  it('treats a TV show (Season subdirs) as one item', async () => {
    touch('Show X', 'Season 01', 'e01.mkv');
    touch('Show X', 'Season 02', 'e01.mkv');
    const items = (await findMediaItems(root)).map((p) => relative(root, p));
    expect(items).toEqual(['Show X']);
  });

  it('recurses into artist / nested container folders', async () => {
    touch('刘德华', 'WAV', '专辑1', '01.flac');
    touch('刘德华', 'WAV', '专辑2', '01.flac');
    touch('周杰伦', '范特西', '01.flac');
    const items = (await findMediaItems(root)).map((p) => relative(root, p)).sort();
    expect(items).toEqual(['刘德华/WAV/专辑1', '刘德华/WAV/专辑2', '周杰伦/范特西']);
  });

  it('ignores dot/@ system folders', async () => {
    touch('Album', '01.flac');
    mkdirSync(join(root, '.@__thumb'), { recursive: true });
    writeFileSync(join(root, '.@__thumb', 'x.jpg'), 'x');
    const items = (await findMediaItems(root)).map((p) => relative(root, p));
    expect(items).toEqual(['Album']);
  });
});
