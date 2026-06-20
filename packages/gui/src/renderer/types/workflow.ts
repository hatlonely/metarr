import type {
  ParsedMedia,
  TMDBMatch,
  RenamePlan,
  ExecutionResult,
  ConflictCheckResult,
  ConflictResolutionMap,
  UnmatchedFileInfo,
  ArtworkPlan,
  ArtworkExecutionResult,
  SubtitlePlan,
  SubtitleExecutionResult,
  ParsedAlbum,
  MusicBrainzRelease,
} from '@metarr/core';

export type StepId = 'select' | 'parse' | 'search' | 'preview' | 'execute';

export interface WorkflowState {
  currentStep: StepId;
  /** Which pipeline the selected source routes to. */
  kind: 'video' | 'music';
  sourcePath: string | null;
  parsed: ParsedMedia | null;
  mediaType: 'tv' | 'movie' | 'auto';
  // Music
  album: ParsedAlbum | null;
  releases: MusicBrainzRelease[];
  selectedRelease: MusicBrainzRelease | null;
  /** Pending search selection: a release MBID, or '__local__' for local tags. */
  selectedReleaseId: string | null;
  searchQuery: string;
  tmdbResults: TMDBMatch[];
  selectedMatch: TMDBMatch | null;
  plan: RenamePlan | null;
  executionResult: ExecutionResult | null;
  conflictResult: ConflictCheckResult | null;
  conflictResolutions: ConflictResolutionMap;
  unmatchedFiles: UnmatchedFileInfo[];
  filesToRemove: string[];
  artworkPlan: ArtworkPlan | null;
  artworkLoading: boolean;
  selectedArtworkPaths: string[];
  artworkResult: ArtworkExecutionResult | null;
  subtitlePlan: SubtitlePlan | null;
  subtitleLoading: boolean;
  selectedSubtitlePaths: string[];
  subtitleResult: SubtitleExecutionResult | null;
  executing: boolean;
  error: string | null;
  loading: boolean;
}

export type WorkflowAction =
  | { type: 'SET_STEP'; step: StepId }
  | { type: 'SET_SOURCE_PATH'; path: string }
  | { type: 'SET_PARSED'; parsed: ParsedMedia }
  | { type: 'SET_MEDIA_TYPE'; mediaType: 'tv' | 'movie' | 'auto' }
  | { type: 'SET_SEARCH_QUERY'; query: string }
  | { type: 'SET_TMDB_RESULTS'; results: TMDBMatch[] }
  | { type: 'SELECT_MATCH'; match: TMDBMatch | null }
  | { type: 'SET_PLAN'; plan: RenamePlan | null }
  | { type: 'SET_EXECUTION_RESULT'; result: ExecutionResult | null }
  | { type: 'SET_CONFLICT_RESULT'; result: ConflictCheckResult | null }
  | { type: 'SET_CONFLICT_RESOLUTIONS'; resolutions: ConflictResolutionMap }
  | { type: 'SET_UNMATCHED_FILES'; files: UnmatchedFileInfo[] }
  | { type: 'SET_FILES_TO_REMOVE'; paths: string[] }
  | { type: 'SET_ARTWORK_PLAN'; plan: ArtworkPlan | null }
  | { type: 'SET_ARTWORK_LOADING'; loading: boolean }
  | { type: 'SET_SELECTED_ARTWORK'; paths: string[] }
  | { type: 'SET_ARTWORK_RESULT'; result: ArtworkExecutionResult | null }
  | { type: 'SET_SUBTITLE_PLAN'; plan: SubtitlePlan | null }
  | { type: 'SET_SUBTITLE_LOADING'; loading: boolean }
  | { type: 'SET_SELECTED_SUBTITLES'; paths: string[] }
  | { type: 'SET_SUBTITLE_RESULT'; result: SubtitleExecutionResult | null }
  | { type: 'SET_EXECUTING'; executing: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_KIND'; kind: 'video' | 'music' }
  | { type: 'SET_ALBUM'; album: ParsedAlbum | null }
  | { type: 'SET_RELEASES'; releases: MusicBrainzRelease[] }
  | { type: 'SELECT_RELEASE'; release: MusicBrainzRelease | null }
  | { type: 'SET_SELECTED_RELEASE_ID'; id: string | null }
  | { type: 'RESET' };
