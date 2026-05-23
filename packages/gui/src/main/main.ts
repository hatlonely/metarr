import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseMediaDir,
  TMDBClient,
  generateTvRenamePlan,
  generateMovieRenamePlan,
  executeRenamePlan,
} from '@metarr/core';
import type { ParsedMedia, MediaType, RenameOptions, TMDBMatch } from '@metarr/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../../renderer/out/index.html'));
  }
}

// IPC: Open directory dialog
ipcMain.handle('dialog:openDirectory', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  return result.filePaths[0] || null;
});

// IPC: Parse directory
ipcMain.handle(
  'parse:directory',
  async (_event, dirPath: string, type?: string) => {
    return parseMediaDir(dirPath, {
      type: type === 'tv' || type === 'movie' ? (type as MediaType) : undefined,
    });
  },
);

// IPC: TMDB search
ipcMain.handle(
  'tmdb:search',
  async (_event, apiKey: string, query: string, type: string, year?: number) => {
    const client = new TMDBClient({ apiKey });
    return client.searchWithBothLanguages(query, type as 'tv' | 'movie', year);
  },
);

// IPC: Get movie details (for IMDB ID)
ipcMain.handle(
  'tmdb:getMovieDetails',
  async (_event, apiKey: string, id: number) => {
    const client = new TMDBClient({ apiKey });
    return client.getMovieDetails(id);
  },
);

// IPC: Generate rename plan
ipcMain.handle(
  'rename:generatePlan',
  async (_event, parsed: ParsedMedia, match: TMDBMatch, options: RenameOptions) => {
    if (parsed.type === 'tv') {
      return generateTvRenamePlan(parsed, match, options);
    }
    return generateMovieRenamePlan(parsed, match, options);
  },
);

// IPC: Execute rename plan
ipcMain.handle('rename:execute', async (_event, plan) => {
  return executeRenamePlan(plan);
});

// IPC: Config (simple in-memory for now, can use electron-store later)
const config: Record<string, unknown> = {};

ipcMain.handle('config:get', async () => {
  return { ...config };
});

ipcMain.handle('config:set', async (_event, key: string, value: unknown) => {
  config[key] = value;
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
