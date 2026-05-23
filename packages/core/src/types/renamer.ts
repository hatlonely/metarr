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

export interface ConflictFileInfo {
  path: string;
  size: number;
  mtime: string;
}

export interface FileConflict {
  taskIndex: number;
  task: RenameTask;
  sourceInfo: ConflictFileInfo;
  targetInfo: ConflictFileInfo;
  isSameFile: boolean;
}

export type ConflictResolution = 'skip' | 'overwrite' | 'abort';
export type ConflictResolutionMap = Record<number, ConflictResolution>;

export interface ConflictCheckResult {
  conflicts: FileConflict[];
  hasConflicts: boolean;
  duplicateCount: number;
  overwriteCount: number;
}
