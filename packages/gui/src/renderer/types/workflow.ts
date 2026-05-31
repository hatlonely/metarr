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
} from '@metarr/core';

export type StepId = 'select' | 'parse' | 'search' | 'preview' | 'execute';

export interface WorkflowState {
  currentStep: StepId;
  sourcePath: string | null;
  parsed: ParsedMedia | null;
  mediaType: 'tv' | 'movie' | 'auto';
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
  | { type: 'SET_EXECUTING'; executing: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'RESET' };
