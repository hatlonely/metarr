import type { MediaType } from '../types/media.js';

/** One trashed file and where it landed (null = system trash, not restorable). */
export interface TrashedItem {
  original: string;
  trashPath: string | null;
}

/** A single executed rename run, with everything needed to undo it. */
export interface HistoryEntry {
  /** Sortable id: `<yyyymmdd-hhmmss>-<rand>`. */
  id: string;
  timestamp: string;
  mediaName: string;
  mediaType: MediaType;
  sourcePath: string;
  destPath: string;
  /** Successful rename moves (undo = move `to` back to `from`). */
  renamed: { from: string; to: string }[];
  /** Directories created by the plan (undo = remove if empty). */
  createdDirs: string[];
  /** Replaced targets + unmatched files moved to the trash. */
  trashed: TrashedItem[];
  /** Downloaded artwork / .nfo / subtitle files (undo = trash them). */
  createdFiles: string[];
  /** Emptied source dir removed during execution (undo = recreate). */
  cleanedSourcePath?: string;
  /** Set once this run has been undone. */
  restoredAt?: string;
}

export interface UndoResult {
  restored: number;
  skipped: { path: string; reason: string }[];
  failed: { path: string; error: string }[];
}
