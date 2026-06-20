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
