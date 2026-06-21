import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { statSync, existsSync } from 'node:fs';
import {
  parseMediaDir,
  parseMediaFile,
  TMDBClient,
  generateRenamePlan,
  executeRenamePlan,
  checkConflicts,
  findUnmatchedFiles,
  generateArtworkPlan,
  executeArtworkPlan,
  generateSubtitlePlan,
  executeSubtitlePlan,
  getAllConfig,
  setConfig as coreSetConfig,
  locate,
  createTrashFn,
  buildHistoryEntry,
  recordHistory,
  listHistory,
  getHistory,
  deleteHistory,
  undoHistory,
  detectMediaKind,
  parseAlbumDir,
  MusicBrainzClient,
  locateReleases,
  generateMusicRenamePlan,
  fetchAlbumCover,
  localizeAlbum,
  localizeRelease,
  findMediaItems,
  analyzeDir,
  isAlreadyOrganized,
  DEFAULT_BATCH_OPTIONS,
  dirSignature,
  loadBatchCache,
  saveBatchCache,
  listBatchCaches,
  deleteBatchCache,
  clearBatchCaches,
  pruneBatchCaches,
} from '@metarr/core';
import type {
  ParsedMedia,
  MediaType,
  RenameOptions,
  TMDBMatch,
  RenamePlan,
  ConflictResolutionMap,
  ArtworkPlan,
  SubtitleTask,
  ExtractResult,
  TitleCandidate,
  ExecutionResult,
  ArtworkExecutionResult,
  SubtitleExecutionResult,
  ParsedAlbum,
  MusicBrainzRelease,
  BatchItem,
  BatchOptions,
  AnalyzeContext,
} from '@metarr/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    icon: join(__dirname, '../../icon.png'),
    width: 1200,
    height: 800,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

// IPC: Open media dialog (file or directory)
ipcMain.handle('dialog:openMedia', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'openDirectory'],
    filters: [
      {
        name: 'Video Files',
        extensions: ['mkv', 'mp4', 'avi', 'wmv', 'mov', 'ts', 'rmvb', 'flv', 'webm'],
      },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  const filePath = result.filePaths[0];
  if (!filePath) return null;
  const stat = statSync(filePath);
  const isDir = stat.isDirectory();
  return {
    type: isDir ? ('dir' as const) : ('file' as const),
    path: filePath,
    sourcePath: isDir ? filePath : dirname(filePath),
  };
});

// IPC: Open directory dialog (for destination path selection)
ipcMain.handle('dialog:openDirectory', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  return result.filePaths[0] || null;
});

// IPC: Parse directory
ipcMain.handle('parse:directory', async (_event, dirPath: string, type?: string) => {
  return parseMediaDir(dirPath, {
    type: type === 'tv' || type === 'movie' ? (type as MediaType) : undefined,
  });
});

// IPC: Parse single file
ipcMain.handle('parse:file', async (_event, filePath: string, type?: string) => {
  return parseMediaFile(filePath, {
    type: type === 'tv' || type === 'movie' ? (type as MediaType) : undefined,
  });
});

// IPC: TMDB search (with language support)
ipcMain.handle(
  'tmdb:search',
  async (_event, apiKey: string, query: string, type: string, year?: number, language?: string) => {
    const client = new TMDBClient({
      apiKey,
      language: language || 'zh-CN',
    });
    return client.fuzzySearch(query, type as 'tv' | 'movie', year);
  },
);

// IPC: Locate — candidate/ID extraction → ranked TMDB matches
ipcMain.handle(
  'tmdb:locate',
  async (
    _event,
    apiKey: string,
    parsed: ParsedMedia,
    options: { type?: string; language?: string; manualQuery?: string },
  ) => {
    const client = new TMDBClient({ apiKey, language: options.language || 'zh-CN' });

    const titleCandidates: TitleCandidate[] = [...(parsed.titleCandidates ?? [])];
    const manual = options.manualQuery?.trim();
    if (manual) {
      // User-edited query takes top priority as a high-weight candidate.
      const lang = /[一-鿿]/.test(manual) ? 'zh' : 'en';
      titleCandidates.unshift({ query: manual, lang, source: 'dir', weight: 1 });
    }

    const extract: ExtractResult = {
      ids: parsed.ids ?? {},
      mediaType: parsed.type,
      episodes: parsed.episodes,
      tags: parsed.tags,
      titleCandidates,
      yearCandidates: parsed.yearCandidates ?? (parsed.year ? [parsed.year] : []),
      originalName: parsed.originalDirName,
    };

    const type = options.type === 'tv' || options.type === 'movie' ? options.type : undefined;
    return locate(client, extract, { type, year: parsed.year });
  },
);

// IPC: Get movie details (for IMDB ID)
ipcMain.handle('tmdb:getMovieDetails', async (_event, apiKey: string, id: number) => {
  const client = new TMDBClient({ apiKey });
  return client.getMovieDetails(id);
});

// IPC: Generate rename plan
ipcMain.handle(
  'rename:generatePlan',
  async (_event, parsed: ParsedMedia, match: TMDBMatch, options: RenameOptions) => {
    return generateRenamePlan(parsed, match, options);
  },
);

// Never delete: replaced targets / unmatched files go to a managed same-volume
// trash dir (so they can be restored later), falling back to the system trash.
// Built here in main (callbacks can't cross IPC).
function makeTrashItem(): (path: string) => Promise<string | null> {
  const trashDir = (getAllConfig().trashDir as string) || undefined;
  return createTrashFn({ trashDir, systemTrash: (p) => shell.trashItem(p) });
}

// IPC: Execute rename plan
ipcMain.handle(
  'rename:execute',
  async (
    _event,
    plan: RenamePlan,
    resolutions?: ConflictResolutionMap,
    filesToRemove?: string[],
  ) => {
    return executeRenamePlan(plan, { resolutions, filesToRemove, trashItem: makeTrashItem() });
  },
);

// IPC: Record a rename run into history (after rename + artwork + subtitles)
ipcMain.handle(
  'history:record',
  async (
    _event,
    plan: RenamePlan,
    result: ExecutionResult,
    artworkResult?: ArtworkExecutionResult | null,
    subtitleResult?: SubtitleExecutionResult | null,
  ) => {
    recordHistory(buildHistoryEntry({ plan, result, artworkResult, subtitleResult }));
  },
);

// IPC: List history entries (newest first)
ipcMain.handle('history:list', async () => listHistory());

// IPC: Undo a whole run by id
ipcMain.handle('history:undo', async (_event, id: string) => {
  const entry = getHistory(id);
  if (!entry) return null;
  return undoHistory(entry, { trashItem: makeTrashItem() });
});

// IPC: Delete a history record (does not touch files)
ipcMain.handle('history:delete', async (_event, id: string) => {
  deleteHistory(id);
});

// IPC: Check conflicts
ipcMain.handle('rename:checkConflicts', async (_event, plan: RenamePlan) => {
  return checkConflicts(plan);
});

// IPC: Find unmatched files
ipcMain.handle(
  'unmatched:find',
  async (_event, plan: RenamePlan, selectedFile?: string) => {
    return findUnmatchedFiles(plan, selectedFile);
  },
);

// IPC: Reveal a path in the OS file manager (Finder / Explorer). Falls back to
// the nearest existing ancestor so a not-yet-created target directory still
// opens the output library location.
ipcMain.handle('shell:openPath', async (_event, targetPath: string) => {
  let p = targetPath;
  while (p && p !== dirname(p) && !existsSync(p)) p = dirname(p);
  if (!existsSync(p)) return `path not found: ${targetPath}`;
  return shell.openPath(p); // '' on success, error string otherwise
});

// IPC: Resolve media path (for drag & drop)
ipcMain.handle('fs:resolveMediaPath', async (_event, filePath: string) => {
  const stat = statSync(filePath);
  const isDir = stat.isDirectory();
  return {
    type: isDir ? ('dir' as const) : ('file' as const),
    path: filePath,
    sourcePath: isDir ? filePath : dirname(filePath),
  };
});

// IPC: Config - uses @metarr/core config persistence
ipcMain.handle('config:get', async () => {
  return getAllConfig();
});

ipcMain.handle('config:set', async (_event, key: string, value: unknown) => {
  coreSetConfig(key as keyof import('@metarr/core').MetarrConfig, value as never);
});

// IPC: Generate artwork plan
ipcMain.handle(
  'artwork:generatePlan',
  async (_event, apiKey: string, match: TMDBMatch, options: RenameOptions, plan: RenamePlan) => {
    const client = new TMDBClient({ apiKey, language: 'zh-CN' });
    return generateArtworkPlan(match, options, client, plan);
  },
);

// IPC: Execute artwork plan
ipcMain.handle('artwork:execute', async (_event, tasks: ArtworkPlan['tasks']) => {
  return executeArtworkPlan(tasks);
});

// IPC: Generate subtitle plan
ipcMain.handle(
  'subtitle:generatePlan',
  async (
    _event,
    match: TMDBMatch,
    plan: RenamePlan,
    options: { subdlApiKey?: string; assrtToken?: string; languages: string[] },
  ) => {
    return generateSubtitlePlan(match, plan, options);
  },
);

// IPC: Execute subtitle plan
ipcMain.handle('subtitle:execute', async (_event, tasks: SubtitleTask[]) => {
  return executeSubtitlePlan(tasks);
});

// IPC: Detect whether a directory is music or video (auto-route the flow)
ipcMain.handle('media:detectKind', async (_event, dirPath: string) => {
  return detectMediaKind(dirPath);
});

// IPC: Parse an album directory (embedded tags + filename fallback)
ipcMain.handle('music:parseAlbum', async (_event, dirPath: string) => {
  return parseAlbumDir(dirPath);
});

// Language/script preference for music titles, from the display-language
// setting (same preference video uses): zh-CN → Simplified, zh-TW → Traditional.
function musicLangPref(): {
  preferLang?: 'zh' | 'en';
  titleScript?: 'zh-Hans' | 'zh-Hant';
} {
  const lang = (getAllConfig().displayLanguage as string) || 'zh-CN';
  if (lang === 'zh-TW') return { preferLang: 'zh', titleScript: 'zh-Hant' };
  if (lang.startsWith('zh')) return { preferLang: 'zh', titleScript: 'zh-Hans' };
  return { preferLang: 'en' };
}

// IPC: Search MusicBrainz for matching releases (ranked by language preference),
// enriched with cover art from iTunes/Deezer (Cover Art Archive is too sparse).
ipcMain.handle('music:locate', async (_event, album: ParsedAlbum) => {
  const client = new MusicBrainzClient();
  const { preferLang, titleScript } = musicLangPref();
  const releases = await locateReleases(client, album, { limit: 8, preferLang, titleScript });
  await Promise.all(
    releases.map(async (r) => {
      r.coverUrl = await fetchAlbumCover(r.artist, r.title);
    }),
  );
  return releases;
});

// IPC: Fetch a release's canonical track list + cover art
ipcMain.handle('music:getRelease', async (_event, mbid: string) => {
  const client = new MusicBrainzClient();
  const release = await client.getRelease(mbid);
  release.coverUrl = await fetchAlbumCover(release.artist, release.title);
  return release;
});

// IPC: Generate a music rename plan (release optional → pure local organize).
// Titles are normalized to the preferred Chinese script (e.g. Traditional →
// Simplified for zh-CN) so the output library is consistent.
ipcMain.handle(
  'music:generatePlan',
  async (_event, album: ParsedAlbum, release: MusicBrainzRelease | null) => {
    const destPath = (getAllConfig().destPath as string) || '';
    const { titleScript } = musicLangPref();
    const a = titleScript ? await localizeAlbum(album, titleScript) : album;
    const r = titleScript && release ? await localizeRelease(release, titleScript) : release;
    return generateMusicRenamePlan(a, r, { destPath });
  },
);

// ---- Batch orchestration ----
// One in-memory session per scanned parent directory. The scan/execute loops run
// async; the renderer polls batch:state. Analysis is cached on disk so a scan can
// be interrupted and resumed.
interface BatchSession {
  parentPath: string;
  ctx: AnalyzeContext;
  items: Map<string, BatchItem>; // by item id (refs shared with cache arrays)
  cache: Record<string, BatchItem[]>; // by leaf directory, persisted for resume
  order: string[];
  total: number;
  scanned: number;
  phase: 'scanning' | 'analyzing' | 'done' | 'executing';
  running: boolean;
  cancel: boolean;
  executeTotal: number;
  executeDone: number;
}
let batch: BatchSession | null = null;

/** Strip heavy raw fields before sending an item to the renderer. */
function lightItem(it: BatchItem) {
  const { parsedVideo: _v, parsedAlbum: _a, videoMatches: _m, musicReleases: _r, plan: _p, ...rest } = it;
  return rest;
}

function buildAnalyzeCtx(): AnalyzeContext {
  const cfg = getAllConfig();
  const { preferLang, titleScript } = musicLangPref();
  return {
    tmdbClient: new TMDBClient({ apiKey: (cfg.tmdbKey as string) || '', language: (cfg.displayLanguage as string) || 'zh-CN' }),
    mbClient: new MusicBrainzClient(),
    language: cfg.displayLanguage as string,
    preferLang,
    titleScript,
    destPath: (cfg.destPath as string) || '',
    preferImdbId: cfg.preferImdbId !== undefined ? (cfg.preferImdbId as boolean) : true,
    namingPreset: cfg.namingPreset as string,
  };
}

// IPC: start (or resume) a batch scan of a parent directory
ipcMain.handle('batch:scan', async (_event, parentPath: string) => {
  if (batch?.running) return;
  const ctx = buildAnalyzeCtx();
  const session: BatchSession = {
    parentPath, ctx, items: new Map(), cache: loadBatchCache(parentPath), order: [],
    total: 0, scanned: 0, phase: 'scanning', running: true, cancel: false,
    executeTotal: 0, executeDone: 0,
  };
  batch = session;
  (async () => {
    try {
      const dirs = await findMediaItems(parentPath);
      session.total = dirs.length;
      session.phase = 'analyzing';
      let sinceSave = 0;
      for (const dir of dirs) {
        if (session.cancel) break;
        const sig = dirSignature(dir);
        const cached = session.cache[dir];
        let dirItems: BatchItem[];
        if (cached && cached[0]?.signature === sig && !cached.some((i) => i.status === 'error')) {
          dirItems = cached;
        } else {
          try {
            dirItems = await analyzeDir(dir, session.ctx, sig);
          } catch (e) {
            dirItems = [{ id: dir, sourcePath: dir, kind: 'video', status: 'error', level: 'none', candidates: [], signature: sig, error: (e as Error).message }];
          }
          session.cache[dir] = dirItems;
          if (++sinceSave >= 10) { saveBatchCache(parentPath, session.cache); sinceSave = 0; }
        }
        for (const it of dirItems) {
          session.items.set(it.id, it);
          session.order.push(it.id);
        }
        session.scanned++;
      }
    } finally {
      saveBatchCache(session.parentPath, session.cache);
      session.running = false;
      session.phase = 'done';
    }
  })();
});

// IPC: poll the current batch session (light items, no raw payloads)
ipcMain.handle('batch:state', async () => {
  if (!batch) return null;
  return {
    parentPath: batch.parentPath,
    phase: batch.phase,
    running: batch.running,
    cancelling: batch.cancel && batch.running,
    scanned: batch.scanned,
    total: batch.total,
    executeTotal: batch.executeTotal,
    executeDone: batch.executeDone,
    items: batch.order.map((id) => lightItem(batch!.items.get(id)!)),
  };
});

// IPC: request cancellation of the running scan/execute (stops after current item)
ipcMain.handle('batch:cancel', async () => {
  if (batch) batch.cancel = true;
});

// IPC: clear the session (stop any running loop, reset to idle). Already-applied
// items remain on disk + in history; the cache persists for a later resume.
ipcMain.handle('batch:clear', async () => {
  if (batch) {
    batch.cancel = true;
    saveBatchCache(batch.parentPath, batch.cache);
  }
  batch = null;
});

// IPC: list cached scans (prunes stale/empty ones first) for the resume/cleanup UI.
ipcMain.handle('batch:listCaches', async () => {
  pruneBatchCaches();
  return listBatchCaches();
});

// IPC: delete one cached scan by id.
ipcMain.handle('batch:deleteCache', async (_event, id: string) => {
  deleteBatchCache(id);
});

// IPC: delete every cached scan.
ipcMain.handle('batch:clearCaches', async () => {
  clearBatchCaches();
});

// IPC: re-pick a candidate for one item (or null = local tags / fallback)
ipcMain.handle('batch:setChoice', async (_event, id: string, candidateId: string | null) => {
  const it = batch?.items.get(id);
  if (!it || !batch) return null;
  const { ctx } = batch;
  if (it.kind === 'music' && it.parsedAlbum) {
    let release: MusicBrainzRelease | null = null;
    if (candidateId) {
      release = await ctx.mbClient.getRelease(candidateId);
      release.coverUrl = await fetchAlbumCover(release.artist, release.title);
    }
    const a = ctx.titleScript ? await localizeAlbum(it.parsedAlbum, ctx.titleScript) : it.parsedAlbum;
    const r = release && ctx.titleScript ? await localizeRelease(release, ctx.titleScript) : release;
    it.plan = generateMusicRenamePlan(a, r, { destPath: ctx.destPath, namingPreset: ctx.namingPreset });
    it.poster = release?.coverUrl;
    it.title = it.plan.mediaSummary?.name;
    it.year = it.plan.mediaSummary?.year;
  } else if (it.kind === 'video' && it.parsedVideo) {
    const match = candidateId ? it.videoMatches?.find((m) => String(m.id) === candidateId) : undefined;
    if (match) {
      it.plan = generateRenamePlan(it.parsedVideo, match, { destPath: ctx.destPath, preferImdbId: ctx.preferImdbId ?? true, namingPreset: ctx.namingPreset });
      it.poster = match.posterUrl;
      it.title = match.displayName;
      it.year = match.year;
    }
  }
  it.chosenId = candidateId;
  it.targetPath = it.plan?.tasks.find((t) => t.operation === 'create-dir')?.target;
  it.status = isAlreadyOrganized(it.plan) ? 'organized' : candidateId ? 'auto' : 'nomatch';
  saveBatchCache(batch.parentPath, batch.cache);
  return lightItem(it);
});

// IPC: set (or clear) per-item option overrides. null = inherit global defaults.
ipcMain.handle('batch:setItemOptions', async (_event, id: string, options: Partial<BatchOptions> | null) => {
  const it = batch?.items.get(id);
  if (!it || !batch) return null;
  if (options && Object.keys(options).length > 0) it.options = options;
  else delete it.options;
  saveBatchCache(batch.parentPath, batch.cache);
  return lightItem(it);
});

// IPC: mark an item skipped / unskipped
ipcMain.handle('batch:setSkip', async (_event, id: string, skipped: boolean) => {
  const it = batch?.items.get(id);
  if (!it) return null;
  it.status = skipped
    ? 'skipped'
    : isAlreadyOrganized(it.plan)
      ? 'organized'
      : it.chosenId
        ? 'auto'
        : 'nomatch';
  return lightItem(it);
});

// IPC: execute the chosen items (sequential, never overwrites; records history)
ipcMain.handle('batch:execute', async (_event, ids: string[]) => {
  if (!batch || batch.running) return;
  const session = batch;
  session.phase = 'executing';
  session.running = true;
  session.cancel = false;
  session.executeTotal = ids.length;
  session.executeDone = 0;
  const trashItem = makeTrashItem();
  const cfg = getAllConfig();
  const globalOpts: BatchOptions = { ...DEFAULT_BATCH_OPTIONS, ...((cfg.batchOptions as Partial<BatchOptions>) ?? {}) };
  const subOpts = {
    subdlApiKey: (cfg.subdlApiKey as string) || undefined,
    assrtToken: (cfg.assrtToken as string) || undefined,
    languages: (cfg.subtitleLanguages as string[]) ?? [],
  };
  // Subtitles need a configured source + at least one language, regardless of the toggle.
  const subsConfigured = Boolean((subOpts.subdlApiKey || subOpts.assrtToken) && subOpts.languages.length > 0);
  (async () => {
    try {
      for (const id of ids) {
        if (session.cancel) break;
        const it = session.items.get(id);
        if (it?.plan) {
          try {
            // Effective options = global defaults overlaid with this item's overrides.
            const eff: BatchOptions = { ...globalOpts, ...(it.options ?? {}) };

            // Conflicts: 'skip' marks every conflicting task to be skipped; 'overwrite'
            // leaves resolutions empty so the executor trashes the old target then renames.
            let resolutions: ConflictResolutionMap | undefined;
            if (eff.onConflict === 'skip') {
              const { conflicts } = await checkConflicts(it.plan);
              resolutions = {};
              for (const c of conflicts) resolutions[c.taskIndex] = 'skip';
            }
            // Unmatched cleanup: trash every file in the source not covered by the plan.
            const filesToRemove = eff.removeUnmatched
              ? (await findUnmatchedFiles(it.plan)).map((f) => f.path)
              : undefined;

            // Last chance to bail before touching files — the item stays untouched.
            if (session.cancel) break;

            const result = await executeRenamePlan(it.plan, { trashItem, resolutions, filesToRemove });
            // The rename is now applied. Add-ons (network, slow) are each gated on the
            // cancel flag so 中断 takes effect as soon as the current request returns.
            let artworkResult: ArtworkExecutionResult | null = null;
            let subtitleResult: SubtitleExecutionResult | null = null;
            const mediaDir = it.plan.tasks.find((t) => t.operation === 'create-dir')?.target;
            if (eff.scrapeArtwork && !session.cancel && it.kind === 'music' && it.poster && mediaDir) {
              artworkResult = await executeArtworkPlan([
                { kind: 'image', type: 'poster', downloadUrl: it.poster, previewUrl: it.poster, targetPath: `${mediaDir}/cover.jpg`, description: 'cover.jpg' },
              ]);
            } else if (it.kind === 'video' && it.chosenId) {
              // Scrape poster/fanart/nfo and download subtitles for the movie/show,
              // mirroring the single flow. Reuse the plan's resolved destPath so
              // artwork lands in the same directory the rename created.
              const match = it.videoMatches?.find((m) => String(m.id) === it.chosenId);
              if (match) {
                if (eff.scrapeArtwork && !session.cancel) {
                  const artworkPlan = await generateArtworkPlan(
                    match,
                    { destPath: it.plan.destPath, namingPreset: session.ctx.namingPreset },
                    session.ctx.tmdbClient,
                    it.plan,
                  );
                  if (!session.cancel) artworkResult = await executeArtworkPlan(artworkPlan.tasks);
                }
                if (eff.downloadSubtitles && subsConfigured && !session.cancel) {
                  const subPlan = await generateSubtitlePlan(match, it.plan, subOpts);
                  if (!session.cancel) subtitleResult = await executeSubtitlePlan(subPlan.tasks);
                }
              }
            }
            recordHistory(buildHistoryEntry({ plan: it.plan, result, artworkResult, subtitleResult }));
            it.status = 'done';
          } catch (e) {
            it.status = 'error';
            it.error = (e as Error).message;
          }
        }
        session.executeDone++;
      }
    } finally {
      saveBatchCache(session.parentPath, session.cache);
      session.running = false;
      session.phase = 'done';
    }
  })();
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
