import { contextBridge, ipcRenderer } from 'electron';
import type { IPCApi } from '../shared/ipc-types.js';

contextBridge.exposeInMainWorld('metarrAPI', {
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  parseDirectory: (dirPath: string, type?: string) =>
    ipcRenderer.invoke('parse:directory', dirPath, type),
  tmdbSearch: (apiKey: string, query: string, type: string, year?: number, language?: string) =>
    ipcRenderer.invoke('tmdb:search', apiKey, query, type, year, language),
  tmdbGetMovieDetails: (apiKey: string, id: number) =>
    ipcRenderer.invoke('tmdb:getMovieDetails', apiKey, id),
  generateRenamePlan: (parsed: unknown, match: unknown, options: unknown) =>
    ipcRenderer.invoke('rename:generatePlan', parsed, match, options),
  checkConflicts: (plan: unknown) => ipcRenderer.invoke('rename:checkConflicts', plan),
  findUnmatchedFiles: (sourcePath: string, plan: unknown) =>
    ipcRenderer.invoke('unmatched:find', sourcePath, plan),
  executeRename: (plan: unknown, resolutions?: unknown, filesToRemove?: unknown) =>
    ipcRenderer.invoke('rename:execute', plan, resolutions, filesToRemove),
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (key: string, value: unknown) =>
    ipcRenderer.invoke('config:set', key, value),
} satisfies Record<string, (...args: unknown[]) => unknown>);
