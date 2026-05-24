// Parser
export {
  parseMediaDir,
  parseMediaFile,
  parseDirName,
  parseFileName,
  scanDirectory,
  scanMediaDirectories,
} from './parser/index.js';

// TMDB
export { TMDBClient } from './tmdb/index.js';
export { TMDBError } from './tmdb/index.js';
export type { TMDBClientOptions } from './tmdb/index.js';

// Renamer
export {
  generateTvRenamePlan,
  generateMovieRenamePlan,
  executeRenamePlan,
  checkConflicts,
  findUnmatchedFiles,
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
  VIDEO_EXTENSIONS,
  SUBTITLE_EXTENSIONS,
} from './types/media.js';
export type {
  TMDBMatch,
  TMDBSearchResult,
  TMDBTvDetails,
  TMDBMovieDetails,
  TMDBSeasonDetail,
  TMDBEpisode,
  TMDBSeason,
} from './types/tmdb.js';
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
