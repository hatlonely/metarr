import type { MediaType } from './media.js';
import type { TMDBMatch } from './tmdb.js';

export interface RenameTask {
  source: string;
  target: string;
  operation: 'rename' | 'move' | 'create-dir';
  description: string;
}

export interface RenamePlan {
  mediaType: MediaType;
  tmdbMatch: TMDBMatch;
  sourcePath: string;
  destPath: string;
  tasks: RenameTask[];
  summary: string;
}

export interface RenameOptions {
  destPath: string;
  dryRun: boolean;
  preferImdbId: boolean;
}

export interface ExecutionResult {
  succeeded: RenameTask[];
  failed: { task: RenameTask; error: Error }[];
  cleanedSourcePath?: string;
}
