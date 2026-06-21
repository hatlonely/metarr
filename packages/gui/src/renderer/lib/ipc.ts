import type {
  ParsedMedia,
  TMDBMatch,
  RenamePlan,
  RenameOptions,
  ExecutionResult,
  ConflictCheckResult,
  ConflictResolutionMap,
  UnmatchedFileInfo,
  ArtworkPlan,
  ArtworkExecutionResult,
  MetadataTask,
  SubtitlePlan,
  SubtitleExecutionResult,
  SubtitleTask,
  HistoryEntry,
  UndoResult,
  ParsedAlbum,
  MusicBrainzRelease,
  BatchItem,
  BatchOptions,
  BatchCacheInfo,
} from '@metarr/core';
import type { BatchState, BatchPlanPreview } from '@/src/shared/ipc-types';
import type { OpenMediaResult } from '@/src/shared/ipc-types';

function getApi() {
  if (typeof window === 'undefined' || !window.metarrAPI) {
    throw new Error('Electron API not available');
  }
  return window.metarrAPI;
}

export const ipc = {
  openMedia: (): Promise<OpenMediaResult | null> => getApi().openMedia(),

  openDirectory: (): Promise<string | null> => getApi().openDirectory(),

  parseDirectory: (dirPath: string, type?: string): Promise<ParsedMedia> =>
    getApi().parseDirectory(dirPath, type),

  parseFile: (filePath: string, type?: string): Promise<ParsedMedia> =>
    getApi().parseFile(filePath, type),

  tmdbSearch: (
    apiKey: string,
    query: string,
    type: string,
    year?: number,
    language?: string,
  ): Promise<TMDBMatch[]> => getApi().tmdbSearch(apiKey, query, type, year, language),

  tmdbLocate: (
    apiKey: string,
    parsed: ParsedMedia,
    options: { type?: string; language?: string; manualQuery?: string },
  ): Promise<TMDBMatch[]> => getApi().tmdbLocate(apiKey, parsed, options),

  tmdbGetMovieDetails: (apiKey: string, id: number): Promise<{ imdb_id?: string }> =>
    getApi().tmdbGetMovieDetails(apiKey, id),

  generateRenamePlan: (
    parsed: ParsedMedia,
    match: TMDBMatch,
    options: RenameOptions,
  ): Promise<RenamePlan> => getApi().generateRenamePlan(parsed, match, options),

  checkConflicts: (plan: RenamePlan): Promise<ConflictCheckResult> => getApi().checkConflicts(plan),

  findUnmatchedFiles: (plan: RenamePlan, selectedFile?: string): Promise<UnmatchedFileInfo[]> =>
    getApi().findUnmatchedFiles(plan, selectedFile),

  executeRename: (
    plan: RenamePlan,
    resolutions?: ConflictResolutionMap,
    filesToRemove?: string[],
  ): Promise<ExecutionResult> => getApi().executeRename(plan, resolutions, filesToRemove),

  historyRecord: (
    plan: RenamePlan,
    result: ExecutionResult,
    artworkResult?: ArtworkExecutionResult | null,
    subtitleResult?: SubtitleExecutionResult | null,
  ): Promise<void> => getApi().historyRecord(plan, result, artworkResult, subtitleResult),

  historyList: (): Promise<HistoryEntry[]> => getApi().historyList(),

  historyUndo: (id: string): Promise<UndoResult | null> => getApi().historyUndo(id),

  historyDelete: (id: string): Promise<void> => getApi().historyDelete(id),

  resolveMediaPath: (path: string): Promise<OpenMediaResult> => getApi().resolveMediaPath(path),

  openPath: (path: string): Promise<string> => getApi().openPath(path),

  getConfig: (): Promise<Record<string, unknown>> => getApi().getConfig(),

  setConfig: (key: string, value: unknown): Promise<void> => getApi().setConfig(key, value),

  generateArtworkPlan: (
    apiKey: string,
    match: TMDBMatch,
    options: RenameOptions,
    plan: RenamePlan,
  ): Promise<ArtworkPlan> => getApi().generateArtworkPlan(apiKey, match, options, plan),

  executeArtworkPlan: (tasks: MetadataTask[]): Promise<ArtworkExecutionResult> =>
    getApi().executeArtworkPlan(tasks),

  generateSubtitlePlan: (
    match: TMDBMatch,
    plan: RenamePlan,
    options: { subdlApiKey?: string; assrtToken?: string; languages: string[] },
  ): Promise<SubtitlePlan> => getApi().generateSubtitlePlan(match, plan, options),

  executeSubtitlePlan: (tasks: SubtitleTask[]): Promise<SubtitleExecutionResult> =>
    getApi().executeSubtitlePlan(tasks),

  getPathForFile: (file: File): string => getApi().getPathForFile(file),

  detectMediaKind: (dirPath: string): Promise<'music' | 'video'> =>
    getApi().detectMediaKind(dirPath),

  parseAlbum: (dirPath: string): Promise<ParsedAlbum> => getApi().parseAlbum(dirPath),

  musicLocate: (album: ParsedAlbum): Promise<MusicBrainzRelease[]> => getApi().musicLocate(album),

  musicGetRelease: (mbid: string): Promise<MusicBrainzRelease> => getApi().musicGetRelease(mbid),

  musicGeneratePlan: (
    album: ParsedAlbum,
    release: MusicBrainzRelease | null,
  ): Promise<RenamePlan> => getApi().musicGeneratePlan(album, release),

  batchScan: (parentPath: string): Promise<void> => getApi().batchScan(parentPath),
  batchState: (): Promise<BatchState | null> => getApi().batchState(),
  batchCancel: (): Promise<void> => getApi().batchCancel(),
  batchClear: (): Promise<void> => getApi().batchClear(),
  batchSetChoice: (id: string, candidateId: string | null): Promise<BatchItem | null> =>
    getApi().batchSetChoice(id, candidateId),
  batchSetSkip: (id: string, skipped: boolean): Promise<BatchItem | null> =>
    getApi().batchSetSkip(id, skipped),
  batchSetDestPath: (destPath: string): Promise<void> => getApi().batchSetDestPath(destPath),
  batchGetPlan: (id: string): Promise<BatchPlanPreview | null> => getApi().batchGetPlan(id),
  batchSetItemOptions: (id: string, options: Partial<BatchOptions> | null): Promise<BatchItem | null> =>
    getApi().batchSetItemOptions(id, options),
  batchExecute: (ids: string[]): Promise<void> => getApi().batchExecute(ids),
  batchListCaches: (): Promise<BatchCacheInfo[]> => getApi().batchListCaches(),
  batchDeleteCache: (id: string): Promise<void> => getApi().batchDeleteCache(id),
  batchClearCaches: (): Promise<void> => getApi().batchClearCaches(),
};
