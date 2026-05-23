import type { ParsedMedia, RenameOptions, RenamePlan, ExecutionResult, TMDBMatch } from '@metarr/core';

export interface IPCApi {
  openDirectory(): Promise<string | null>;
  parseDirectory(dirPath: string, type?: string): Promise<ParsedMedia>;
  tmdbSearch(apiKey: string, query: string, type: string, year?: number): Promise<TMDBMatch[]>;
  tmdbGetMovieDetails(apiKey: string, id: number): Promise<{ imdb_id?: string }>;
  generateRenamePlan(
    parsed: ParsedMedia,
    match: TMDBMatch,
    options: RenameOptions,
  ): Promise<RenamePlan>;
  executeRename(plan: RenamePlan): Promise<ExecutionResult>;
  getConfig(): Promise<Record<string, unknown>>;
  setConfig(key: string, value: unknown): Promise<void>;
}
