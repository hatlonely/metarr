// Parser
export { parseMediaDir, parseMediaFile, extractMedia } from './parser/index.js';

// TMDB
export { TMDBClient } from './tmdb/index.js';
export { TMDBError } from './tmdb/index.js';
export { locate, scoreMatch, titleSimilarity } from './tmdb/index.js';
export type { TMDBClientOptions, LocateOptions } from './tmdb/index.js';

// Subtitle
export { generateSubtitlePlan, executeSubtitlePlan, LANGUAGE_CONFIG, DEFAULT_SUBTITLE_LANGUAGES } from './subtitle/index.js';
export type { SubtitleTask, SubtitlePlan, SubtitleExecutionResult, SubtitleSource } from './subtitle/index.js';

// Artwork
export { generateArtworkPlan, executeArtworkPlan } from './artwork/index.js';
export type {
  ArtworkTask,
  NfoTask,
  MetadataTask,
  ArtworkPlan,
  ArtworkExecutionResult,
  ArtworkType,
  NfoType,
} from './artwork/index.js';

// Renamer
export {
  generateRenamePlan,
  executeRenamePlan,
  checkConflicts,
  findUnmatchedFiles,
  NAMING_PRESETS,
  DEFAULT_NAMING_PRESET,
  resolveNamingTemplate,
} from './renamer/index.js';

// Config
export { getTmdbKey, getConfig, setConfig, getAllConfig, CONFIG_FILE } from './config.js';
export type { MetarrConfig } from './config.js';

// Types
export type {
  MediaType,
  MediaTags,
  ParsedEpisode,
  ParsedMedia,
  ParseOptions,
  MediaIds,
  TitleCandidate,
  ExtractResult,
} from './types/media.js';
export { VIDEO_EXTENSIONS, SUBTITLE_EXTENSIONS } from './types/media.js';
export type { TMDBMatch } from './types/tmdb.js';
export type { NamingTemplate } from './renamer/naming.js';
export type {
  RenameTask,
  RenamePlan,
  RenameOptions,
  ExecutionResult,
  ConflictFileInfo,
  FileConflict,
  ConflictResolution,
  ConflictResolutionMap,
  ConflictCheckResult,
  UnmatchedFileInfo,
} from './types/renamer.js';
