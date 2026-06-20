import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  renameSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';

// Point ~/.metarr at a throwaway HOME *before* importing the history module
// (os.homedir() reads $HOME on POSIX), so tests never touch the real home dir.
const tmpHome = mkdtempSync(join(tmpdir(), 'metarr-home-'));
process.env.HOME = tmpHome;
process.env.USERPROFILE = tmpHome;

const {
  buildHistoryEntry,
  recordHistory,
  listHistory,
  getHistory,
  deleteHistory,
  pruneHistory,
  undoHistory,
  HISTORY_DIR,
} = await import('../history/index.js');
import type { HistoryEntry } from '../history/types.js';
import type { RenamePlan, ExecutionResult } from '../types/renamer.js';

const CONFIG_FILE = join(tmpHome, '.metarr', 'config.json');

let root: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'metarr-hist-'));
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
  rmSync(HISTORY_DIR, { recursive: true, force: true });
  rmSync(CONFIG_FILE, { force: true });
});

function writeEntryFile(e: HistoryEntry): void {
  mkdirSync(HISTORY_DIR, { recursive: true });
  writeFileSync(join(HISTORY_DIR, `${e.id}.json`), JSON.stringify(e), 'utf-8');
}

function baseEntry(over: Partial<HistoryEntry>): HistoryEntry {
  return {
    id: '20260101-000000-aaaa',
    timestamp: '2026-01-01T00:00:00.000Z',
    mediaName: 'X',
    mediaType: 'movie',
    sourcePath: join(root, 'src'),
    destPath: join(root, 'dst'),
    renamed: [],
    createdDirs: [],
    trashed: [],
    createdFiles: [],
    ...over,
  };
}

function setConfigFile(obj: Record<string, unknown>): void {
  mkdirSync(join(tmpHome, '.metarr'), { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(obj), 'utf-8');
}

describe('buildHistoryEntry', () => {
  it('maps succeeded tasks, trashed items and downloads', () => {
    const plan = {
      mediaType: 'tv',
      tmdbMatch: { displayName: '雨霖铃', originalName: 'Yu' },
      sourcePath: '/s',
      destPath: '/d',
    } as unknown as RenamePlan;
    const result: ExecutionResult = {
      succeeded: [
        { operation: 'create-dir', source: '', target: '/d/Show', description: '' },
        { operation: 'rename', source: '/s/a.mkv', target: '/d/Show/a.mkv', description: '' },
      ],
      failed: [],
      skippedCount: 0,
      overwrittenCount: 1,
      cleanedSourcePath: '/s',
      trashedItems: [{ original: '/d/Show/old.mkv', trashPath: '/trash/old.mkv' }],
    };
    const entry = buildHistoryEntry({
      plan,
      result,
      artworkResult: { succeeded: [{ targetPath: '/d/Show/poster.jpg' }], failed: [] } as never,
      subtitleResult: { succeeded: [{ targetPath: '/d/Show/a.zh.srt' }], failed: [] } as never,
    });

    expect(entry.mediaName).toBe('雨霖铃');
    expect(entry.mediaType).toBe('tv');
    expect(entry.renamed).toEqual([{ from: '/s/a.mkv', to: '/d/Show/a.mkv' }]);
    expect(entry.createdDirs).toEqual(['/d/Show']);
    expect(entry.trashed).toEqual([{ original: '/d/Show/old.mkv', trashPath: '/trash/old.mkv' }]);
    expect(entry.createdFiles).toEqual(['/d/Show/poster.jpg', '/d/Show/a.zh.srt']);
    expect(entry.cleanedSourcePath).toBe('/s');
    expect(entry.id).toMatch(/^\d{8}-\d{6}-/);
  });
});

describe('record / list / get / delete', () => {
  it('round-trips an entry', () => {
    const e = baseEntry({ id: '20260101-000001-bbbb', renamed: [{ from: '/a', to: '/b' }] });
    recordHistory(e);
    expect(listHistory().map((x) => x.id)).toContain(e.id);
    expect(getHistory(e.id)?.renamed).toEqual([{ from: '/a', to: '/b' }]);
    deleteHistory(e.id);
    expect(getHistory(e.id)).toBeNull();
  });

  it('does not record an empty run', () => {
    recordHistory(baseEntry({ id: '20260101-000002-cccc' }));
    expect(listHistory()).toHaveLength(0);
  });

  it('lists newest first', () => {
    recordHistory(baseEntry({ id: '20260101-000000-a', renamed: [{ from: '/a', to: '/b' }] }));
    recordHistory(baseEntry({ id: '20260103-000000-b', renamed: [{ from: '/a', to: '/b' }] }));
    recordHistory(baseEntry({ id: '20260102-000000-c', renamed: [{ from: '/a', to: '/b' }] }));
    expect(listHistory().map((x) => x.id)).toEqual([
      '20260103-000000-b',
      '20260102-000000-c',
      '20260101-000000-a',
    ]);
  });
});

describe('pruneHistory', () => {
  it('keeps only the newest N by count', () => {
    setConfigFile({ historyMaxEntries: 2 });
    writeEntryFile(baseEntry({ id: '20260101-000000-a' }));
    writeEntryFile(baseEntry({ id: '20260102-000000-b' }));
    writeEntryFile(baseEntry({ id: '20260103-000000-c' }));
    pruneHistory();
    expect(listHistory().map((x) => x.id)).toEqual(['20260103-000000-c', '20260102-000000-b']);
  });

  it('drops entries older than the age limit', () => {
    setConfigFile({ historyMaxAgeDays: 365 });
    writeEntryFile(baseEntry({ id: '20200101-000000-old', timestamp: '2020-01-01T00:00:00.000Z' }));
    writeEntryFile(
      baseEntry({ id: '29990101-000000-new', timestamp: new Date().toISOString() }),
    );
    pruneHistory();
    const ids = listHistory().map((x) => x.id);
    expect(ids).toContain('29990101-000000-new');
    expect(ids).not.toContain('20200101-000000-old');
  });
});

describe('undoHistory', () => {
  function trashFn() {
    const trashDir = join(root, 'trash');
    const moved: string[] = [];
    const trashItem = async (p: string): Promise<string | null> => {
      mkdirSync(trashDir, { recursive: true });
      const dest = join(trashDir, `${basename(p)}.${Math.random().toString(36).slice(2, 6)}`);
      renameSync(p, dest);
      moved.push(p);
      return dest;
    };
    return { trashItem, moved };
  }

  it('moves files back, restores trashed, cleans downloads and empty dirs', async () => {
    const srcDir = join(root, 'src');
    const showDir = join(root, 'dst', 'Show');
    mkdirSync(showDir, { recursive: true });
    // post-execution state
    writeFileSync(join(showDir, 'a.mkv'), 'video'); // the renamed file, now at dest
    const oldTrash = join(root, 'trashed-old.mkv');
    writeFileSync(oldTrash, 'old'); // the replaced target, sitting in trash
    writeFileSync(join(showDir, 'poster.jpg'), 'img'); // downloaded artifact

    const entry = baseEntry({
      id: '20260101-000010-undo',
      renamed: [{ from: join(srcDir, 'a.mkv'), to: join(showDir, 'a.mkv') }],
      createdDirs: [join(root, 'dst'), showDir],
      trashed: [{ original: join(showDir, 'old.mkv'), trashPath: oldTrash }],
      createdFiles: [join(showDir, 'poster.jpg')],
      cleanedSourcePath: srcDir,
    });
    writeEntryFile(entry);

    const { trashItem } = trashFn();
    const r = await undoHistory(entry, { trashItem });

    expect(r.restored).toBe(2); // 1 renamed + 1 trashed
    expect(r.failed).toHaveLength(0);
    expect(readFileSync(join(srcDir, 'a.mkv'), 'utf8')).toBe('video'); // moved back
    expect(existsSync(join(showDir, 'a.mkv'))).toBe(false);
    expect(readFileSync(join(showDir, 'old.mkv'), 'utf8')).toBe('old'); // restored from trash
    expect(existsSync(join(showDir, 'poster.jpg'))).toBe(false); // download trashed
    expect(existsSync(srcDir)).toBe(true); // source dir recreated
    // restoredAt persisted
    expect(getHistory(entry.id)?.restoredAt).toBeTruthy();
  });

  it('skips a missing renamed target and a system-trash entry', async () => {
    const entry = baseEntry({
      id: '20260101-000011-skip',
      renamed: [{ from: join(root, 'from.mkv'), to: join(root, 'gone.mkv') }],
      trashed: [{ original: join(root, 'orig.mkv'), trashPath: null }],
    });
    const { trashItem } = trashFn();
    const r = await undoHistory(entry, { trashItem });
    expect(r.restored).toBe(0);
    expect(r.skipped).toHaveLength(2);
    expect(r.skipped[1].reason).toContain('系统回收站');
  });

  it('never overwrites — trashes whatever occupies the restore target first', async () => {
    const from = join(root, 'from.mkv');
    const to = join(root, 'to.mkv');
    writeFileSync(from, 'occupied'); // restore target already taken
    writeFileSync(to, 'incoming');

    const entry = baseEntry({ id: '20260101-000012-noovr', renamed: [{ from, to }] });
    const { trashItem, moved } = trashFn();
    const r = await undoHistory(entry, { trashItem });

    expect(r.restored).toBe(1);
    expect(moved).toEqual([from]); // the occupant went to trash, not overwritten
    expect(readFileSync(from, 'utf8')).toBe('incoming');
  });
});
