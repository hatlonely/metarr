import type {
  ParsedMedia,
  RenameOptions,
  RenamePlan,
  ExecutionResult,
  TMDBMatch,
  ConflictCheckResult,
  ConflictResolutionMap,
  UnmatchedFileInfo,
  ArtworkPlan,
  ArtworkExecutionResult,
  MetadataTask,
  SubtitlePlan,
  SubtitleExecutionResult,
  SubtitleTask,
  HistoryEntry,
  UndoResult,
  ParsedAlbum,
  MusicBrainzRelease,
} from '@metarr/core';

export interface OpenMediaResult {
  type: 'file' | 'dir';
  path: string;
  /** Directory path (for file mode, this is dirname(path); for dir mode, same as path) */
  sourcePath: string;
}

export interface IPCApi {
  openMedia(): Promise<OpenMediaResult | null>;
  openDirectory(): Promise<string | null>;
  parseDirectory(dirPath: string, type?: string): Promise<ParsedMedia>;
  parseFile(filePath: string, type?: string): Promise<ParsedMedia>;
  tmdbSearch(
    apiKey: string,
    query: string,
    type: string,
    year?: number,
    language?: string,
  ): Promise<TMDBMatch[]>;
  /** Locate via the candidate/ID extraction in `parsed`, ranked by relevance. */
  tmdbLocate(
    apiKey: string,
    parsed: ParsedMedia,
    options: { type?: string; language?: string; manualQuery?: string },
  ): Promise<TMDBMatch[]>;
  tmdbGetMovieDetails(apiKey: string, id: number): Promise<{ imdb_id?: string }>;
  generateRenamePlan(
    parsed: ParsedMedia,
    match: TMDBMatch,
    options: RenameOptions,
  ): Promise<RenamePlan>;
  checkConflicts(plan: RenamePlan): Promise<ConflictCheckResult>;
  findUnmatchedFiles(plan: RenamePlan, selectedFile?: string): Promise<UnmatchedFileInfo[]>;
  executeRename(
    plan: RenamePlan,
    resolutions?: ConflictResolutionMap,
    filesToRemove?: string[],
  ): Promise<ExecutionResult>;
  historyRecord(
    plan: RenamePlan,
    result: ExecutionResult,
    artworkResult?: ArtworkExecutionResult | null,
    subtitleResult?: SubtitleExecutionResult | null,
  ): Promise<void>;
  historyList(): Promise<HistoryEntry[]>;
  historyUndo(id: string): Promise<UndoResult | null>;
  historyDelete(id: string): Promise<void>;
  resolveMediaPath(path: string): Promise<OpenMediaResult>;
  /** Reveal a path in the OS file manager. Resolves to '' on success. */
  openPath(path: string): Promise<string>;
  getConfig(): Promise<Record<string, unknown>>;
  setConfig(key: string, value: unknown): Promise<void>;
  generateArtworkPlan(apiKey: string, match: TMDBMatch, options: RenameOptions, plan: RenamePlan): Promise<ArtworkPlan>;
  generateSubtitlePlan(
    match: TMDBMatch,
    plan: RenamePlan,
    options: { subdlApiKey?: string; assrtToken?: string; languages: string[] },
  ): Promise<SubtitlePlan>;
  executeSubtitlePlan(tasks: SubtitleTask[]): Promise<SubtitleExecutionResult>;
  executeArtworkPlan(tasks: MetadataTask[]): Promise<ArtworkExecutionResult>;
  getPathForFile(file: File): string;
  // Music
  detectMediaKind(dirPath: string): Promise<'music' | 'video'>;
  parseAlbum(dirPath: string): Promise<ParsedAlbum>;
  musicLocate(album: ParsedAlbum): Promise<MusicBrainzRelease[]>;
  musicGetRelease(mbid: string): Promise<MusicBrainzRelease>;
  musicGeneratePlan(album: ParsedAlbum, release: MusicBrainzRelease | null): Promise<RenamePlan>;
}
