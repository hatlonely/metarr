// Parser
export { parseMediaDir, parseMediaFile, extractMedia, detectMediaKind } from './parser/index.js';
export { parseAlbumDir, aggregateAlbum, isAlbumComplete } from './parser/audio-parser.js';
export type { TrackTags, TrackInput } from './parser/audio-parser.js';

// MusicBrainz
export { MusicBrainzClient, locateReleases, scoreRelease } from './musicbrainz/index.js';
export type {
  MusicBrainzClientOptions,
  LocateReleaseOptions,
  MusicBrainzRelease,
  MusicBrainzTrack,
} from './musicbrainz/index.js';

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
  createTrashFn,
  moveToTrashDir,
  sameVolume,
  volumeRoot,
  defaultTrashDir,
  checkConflicts,
  findUnmatchedFiles,
  NAMING_PRESETS,
  DEFAULT_NAMING_PRESET,
  resolveNamingTemplate,
  MUSIC_NAMING_PRESETS,
  DEFAULT_MUSIC_PRESET,
  resolveMusicNamingTemplate,
  generateMusicRenamePlan,
} from './renamer/index.js';
export type {
  ExecuteOptions,
  CreateTrashOptions,
  MusicNamingTemplate,
  MusicRenameOptions,
} from './renamer/index.js';

// Config
export { getTmdbKey, getConfig, setConfig, getAllConfig, CONFIG_FILE } from './config.js';
export type { MetarrConfig } from './config.js';

// History
export {
  buildHistoryEntry,
  recordHistory,
  listHistory,
  getHistory,
  deleteHistory,
  pruneHistory,
  undoHistory,
} from './history/index.js';
export type { HistoryEntry, UndoResult, TrashedItem } from './history/index.js';

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
  ParsedAlbum,
  AudioTrack,
} from './types/media.js';
export { VIDEO_EXTENSIONS, SUBTITLE_EXTENSIONS, AUDIO_EXTENSIONS } from './types/media.js';
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
