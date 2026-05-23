import type { ParsedMedia, TMDBMatch, RenamePlan, RenameOptions, ExecutionResult, ConflictCheckResult, ConflictResolutionMap, UnmatchedFileInfo } from '@metarr/core';

function getApi() {
  if (typeof window === 'undefined' || !window.metarrAPI) {
    throw new Error('Electron API not available');
  }
  return window.metarrAPI;
}

export const ipc = {
  openDirectory: (): Promise<string | null> => getApi().openDirectory(),

  parseDirectory: (dirPath: string, type?: string): Promise<ParsedMedia> =>
    getApi().parseDirectory(dirPath, type),

  tmdbSearch: (
    apiKey: string,
    query: string,
    type: string,
    year?: number,
    language?: string,
  ): Promise<TMDBMatch[]> => getApi().tmdbSearch(apiKey, query, type, year, language),

  tmdbGetMovieDetails: (apiKey: string, id: number): Promise<{ imdb_id?: string }> =>
    getApi().tmdbGetMovieDetails(apiKey, id),

  generateRenamePlan: (
    parsed: ParsedMedia,
    match: TMDBMatch,
    options: RenameOptions,
  ): Promise<RenamePlan> => getApi().generateRenamePlan(parsed, match, options),

  checkConflicts: (plan: RenamePlan): Promise<ConflictCheckResult> =>
    getApi().checkConflicts(plan),

  findUnmatchedFiles: (sourcePath: string, plan: RenamePlan): Promise<UnmatchedFileInfo[]> =>
    getApi().findUnmatchedFiles(sourcePath, plan),

  executeRename: (plan: RenamePlan, resolutions?: ConflictResolutionMap, filesToRemove?: string[]): Promise<ExecutionResult> =>
    getApi().executeRename(plan, resolutions, filesToRemove),

  getConfig: (): Promise<Record<string, unknown>> => getApi().getConfig(),

  setConfig: (key: string, value: unknown): Promise<void> => getApi().setConfig(key, value),
};
