import { contextBridge, ipcRenderer, webUtils } from 'electron';
import type { IPCApi } from '../shared/ipc-types.js';

contextBridge.exposeInMainWorld('metarrAPI', {
  openMedia: () => ipcRenderer.invoke('dialog:openMedia'),
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  parseDirectory: (dirPath: string, type?: string) =>
    ipcRenderer.invoke('parse:directory', dirPath, type),
  parseFile: (filePath: string, type?: string) => ipcRenderer.invoke('parse:file', filePath, type),
  tmdbSearch: (apiKey: string, query: string, type: string, year?: number, language?: string) =>
    ipcRenderer.invoke('tmdb:search', apiKey, query, type, year, language),
  tmdbLocate: (apiKey: string, parsed: unknown, options: unknown) =>
    ipcRenderer.invoke('tmdb:locate', apiKey, parsed, options),
  tmdbGetMovieDetails: (apiKey: string, id: number) =>
    ipcRenderer.invoke('tmdb:getMovieDetails', apiKey, id),
  generateRenamePlan: (parsed: unknown, match: unknown, options: unknown) =>
    ipcRenderer.invoke('rename:generatePlan', parsed, match, options),
  checkConflicts: (plan: unknown) => ipcRenderer.invoke('rename:checkConflicts', plan),
  findUnmatchedFiles: (plan: unknown, selectedFile?: string) =>
    ipcRenderer.invoke('unmatched:find', plan, selectedFile),
  executeRename: (plan: unknown, resolutions?: unknown, filesToRemove?: unknown) =>
    ipcRenderer.invoke('rename:execute', plan, resolutions, filesToRemove),
  resolveMediaPath: (path: string) => ipcRenderer.invoke('fs:resolveMediaPath', path),
  openPath: (path: string) => ipcRenderer.invoke('shell:openPath', path),
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (key: string, value: unknown) => ipcRenderer.invoke('config:set', key, value),
  generateArtworkPlan: (apiKey: string, match: unknown, options: unknown, plan: unknown) =>
    ipcRenderer.invoke('artwork:generatePlan', apiKey, match, options, plan),
  generateSubtitlePlan: (match: unknown, plan: unknown, options: unknown) =>
    ipcRenderer.invoke('subtitle:generatePlan', match, plan, options),
  executeSubtitlePlan: (tasks: unknown) => ipcRenderer.invoke('subtitle:execute', tasks),
  executeArtworkPlan: (tasks: unknown) => ipcRenderer.invoke('artwork:execute', tasks),
  getPathForFile: (file: File) => webUtils.getPathForFile(file),
} satisfies Record<string, (...args: unknown[]) => unknown>);
