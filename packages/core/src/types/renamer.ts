import type { MediaType } from './media.js';
import type { TMDBMatch } from './tmdb.js';
import type { NamingTemplate } from '../renamer/naming.js';

export type { TMDBMatch };

export interface RenameTask {
  source: string;
  target: string;
  operation: 'rename' | 'create-dir';
  description: string;
}

export interface RenamePlanSummary {
  name: string;
  mediaType: MediaType;
  fileCount: number;
}

export interface RenamePlan {
  mediaType: MediaType;
  tmdbMatch: TMDBMatch;
  sourcePath: string;
  destPath: string;
  tasks: RenameTask[];
  summary: RenamePlanSummary;
}

export interface RenameOptions {
  destPath: string;
  preferImdbId: boolean;
  namingPreset?: string;
  namingTemplate?: NamingTemplate;
}

export interface ExecutionResult {
  succeeded: RenameTask[];
  failed: { task: RenameTask; error: Error }[];
  skippedCount: number;
  /** Replaced targets — the old file was moved to the trash, not deleted. */
  overwrittenCount: number;
  cleanedSourcePath?: string;
  /** Unmatched files that were moved to the trash (kept name for compat). */
  removedUnmatched?: string[];
  /** Every path moved to the trash this run (replaced targets + unmatched). */
  trashedFiles?: string[];
}

export interface UnmatchedFileInfo {
  path: string;
  name: string;
  extension: string;
  size: number;
  type: 'nfo' | 'image' | 'subtitle' | 'other';
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

export type ConflictResolution = 'skip' | 'overwrite';
export type ConflictResolutionMap = Record<number, ConflictResolution>;

export interface ConflictCheckResult {
  conflicts: FileConflict[];
  hasConflicts: boolean;
  duplicateCount: number;
  overwriteCount: number;
}
