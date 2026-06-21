import type { ParsedMedia, ParsedAlbum } from '../types/media.js';
import type { TMDBMatch } from '../types/tmdb.js';
import type { MusicBrainzRelease } from '../musicbrainz/types.js';
import type { RenamePlan } from '../types/renamer.js';

export type BatchKind = 'music' | 'video';

export type BatchStatus =
  | 'auto' // high confidence, ready to apply
  | 'review' // low confidence, needs a human look
  | 'nomatch' // no online candidate (falls back to local/dirname)
  | 'unsupported' // can't handle (e.g. cue/wav whole-disc image)
  | 'organized' // already named correctly — plan is a no-op, nothing to apply
  | 'skipped' // user excluded
  | 'done' // executed
  | 'error';

export type ConfidenceLevel = 'high' | 'low' | 'none';

/** Per-run execution toggles. Global defaults live in config (`batchOptions`);
 *  each item may override any subset via `BatchItem.options`. */
export interface BatchOptions {
  scrapeArtwork: boolean; // poster/fanart/nfo for video; cover.jpg for music
  downloadSubtitles: boolean; // video only; also requires a configured source + languages
  removeUnmatched: boolean; // trash files not covered by the rename plan (all of them)
  onConflict: 'skip' | 'overwrite'; // when a target already exists
}

export const DEFAULT_BATCH_OPTIONS: BatchOptions = {
  scrapeArtwork: true,
  downloadSubtitles: true,
  removeUnmatched: false,
  onConflict: 'skip',
};

export interface Assessment {
  level: ConfidenceLevel;
  reason?: string;
}

/** Normalized candidate for the review UI (maps onto ResultCard). */
export interface BatchCandidate {
  id: string; // tmdb id (string) or release mbid
  title: string;
  year?: number;
  subtitle?: string;
  meta?: string[];
  poster?: string;
  score: number;
}

/** One media item found under the batch parent, with its analysis. */
export interface BatchItem {
  id: string; // stable id derived from sourcePath
  sourcePath: string;
  kind: BatchKind;
  status: BatchStatus;
  level: ConfidenceLevel;
  reason?: string;
  /** Display info for the chosen/derived result. */
  title?: string;
  year?: number;
  poster?: string;
  targetPath?: string;
  candidates: BatchCandidate[];
  /** Chosen candidate id; null = local tags / dirname fallback (no online match). */
  chosenId?: string | null;
  plan?: RenamePlan;
  /** Per-item overrides; absent keys inherit the global BatchOptions. */
  options?: Partial<BatchOptions>;
  /** Raw analysis data kept so a re-choice can regenerate the plan. */
  parsedVideo?: ParsedMedia;
  parsedAlbum?: ParsedAlbum;
  videoMatches?: TMDBMatch[];
  musicReleases?: MusicBrainzRelease[];
  error?: string;
  /** Directory signature (mtime + entry count) for cache invalidation. */
  signature: string;
}
