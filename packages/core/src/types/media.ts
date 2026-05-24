export type MediaType = 'tv' | 'movie';

export interface MediaTags {
  resolution?: string;
  codec?: string;
  audioCodec?: string;
  source?: string;
  isHDR?: boolean;
  isDV?: boolean;
  releaseGroup?: string;
  isHQ?: boolean;
}

export interface ParsedEpisode {
  originalFileName: string;
  extension: string;
  season: number;
  episodes: number[];
  tags: MediaTags;
  /** Associated subtitle/auxiliary files with the same base name */
  associatedFiles: string[];
}

export interface ParsedMedia {
  type: MediaType | 'unknown';
  chineseTitle?: string;
  englishTitle?: string;
  year?: number;
  tags: MediaTags;
  episodes: ParsedEpisode[];
  originalDirName: string;
  sourcePath: string;
  isClean: boolean;
  /** User-selected single file path (only in single-file mode) */
  selectedFile?: string;
}

export interface ParseOptions {
  type?: MediaType | 'auto';
}

export const VIDEO_EXTENSIONS = new Set([
  '.mkv',
  '.mp4',
  '.avi',
  '.wmv',
  '.mov',
  '.ts',
  '.rmvb',
  '.flv',
  '.webm',
]);

export const SUBTITLE_EXTENSIONS = new Set(['.srt', '.ass', '.ssa', '.sub', '.idx', '.sup']);
