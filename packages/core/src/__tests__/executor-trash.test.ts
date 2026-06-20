import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { executeRenamePlan } from '../renamer/executor.js';
import type { RenamePlan, RenameTask } from '../types/renamer.js';

let root: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'metarr-exec-'));
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function plan(tasks: RenameTask[]): RenamePlan {
  return {
    mediaType: 'movie',
    sourcePath: join(root, 'src'),
    destPath: join(root, 'dst'),
    tasks,
    summary: {},
  } as unknown as RenamePlan;
}

describe('executeRenamePlan – trash (never delete)', () => {
  it('sends a replaced target to trashItem, not unlink', async () => {
    const src = join(root, 'a.mkv');
    writeFileSync(src, 'new');
    const tgt = join(root, 'b.mkv');
    writeFileSync(tgt, 'old');

    const trashed: string[] = [];
    const r = await executeRenamePlan(plan([{ operation: 'rename', source: src, target: tgt, description: '' }]), {
      resolutions: { 0: 'overwrite' },
      trashItem: async (p) => {
        trashed.push(p);
        rmSync(p); // mock: moved away
      },
    });

    expect(trashed).toEqual([tgt]); // old target was trashed, not silently deleted
    expect(r.trashedFiles).toEqual([tgt]);
    expect(r.overwrittenCount).toBe(1);
    expect(readFileSync(tgt, 'utf8')).toBe('new'); // new file moved into place
  });

  it('sends unmatched files to trashItem', async () => {
    const f = join(root, 'x.nfo');
    writeFileSync(f, 'junk');
    const trashed: string[] = [];
    const r = await executeRenamePlan(plan([]), {
      filesToRemove: [f],
      trashItem: async (p) => {
        trashed.push(p);
        rmSync(p);
      },
    });
    expect(trashed).toEqual([f]);
    expect(r.removedUnmatched).toEqual([f]);
    expect(r.trashedFiles).toEqual([f]);
  });

  it('records a failed trashItem and does NOT fall back to deleting', async () => {
    const f = join(root, 'keep.nfo');
    writeFileSync(f, 'keep');
    const r = await executeRenamePlan(plan([]), {
      filesToRemove: [f],
      trashItem: async () => {
        throw new Error('trash failed');
      },
    });
    expect(r.failed).toHaveLength(1);
    expect(readFileSync(f, 'utf8')).toBe('keep'); // still there — never deleted
  });
});
