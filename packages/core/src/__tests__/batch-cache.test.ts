import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const tmpHome = mkdtempSync(join(tmpdir(), 'metarr-bhome-'));
process.env.HOME = tmpHome;
process.env.USERPROFILE = tmpHome;

const { loadBatchCache, saveBatchCache, dirSignature } = await import('../batch/cache.js');
import type { BatchItem } from '../batch/types.js';

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'metarr-bc-'));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function item(over: Partial<BatchItem>): BatchItem {
  return {
    id: '/a', sourcePath: '/a', kind: 'music', status: 'auto', level: 'high',
    candidates: [], signature: 'sig', ...over,
  };
}

describe('batch cache', () => {
  it('round-trips items keyed by directory', () => {
    saveBatchCache('/parent', { '/a': [item({})], '/b': [item({ id: '/b', sourcePath: '/b' })] });
    const loaded = loadBatchCache('/parent');
    expect(Object.keys(loaded).sort()).toEqual(['/a', '/b']);
    expect(loaded['/a'][0].kind).toBe('music');
  });

  it('returns empty for an unknown parent', () => {
    expect(loadBatchCache('/nope-' + Math.random())).toEqual({});
  });

  it('signature changes when directory contents change', () => {
    writeFileSync(join(dir, 'a.flac'), 'x');
    const s1 = dirSignature(dir);
    writeFileSync(join(dir, 'b.flac'), 'x');
    const s2 = dirSignature(dir);
    expect(s1).not.toBe(s2); // entry count changed
  });
});
