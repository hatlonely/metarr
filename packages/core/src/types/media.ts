export type MediaType = 'tv' | 'movie' | 'music';

/** External IDs that can locate a title on TMDB (or be displayed). */
export interface MediaIds {
  tmdb?: number;
  imdb?: string;
  tvdb?: number;
  douban?: number;
}

/** A title guess extracted from a messy name, to be searched against TMDB. */
export interface TitleCandidate {
  /** The cleaned string used as the TMDB search query. */
  query: string;
  lang: 'zh' | 'en' | 'unknown';
  /** Where it came from — drives the prior confidence weight. */
  source: 'clean' | 'bracket' | 'dir' | 'file';
  /** Prior confidence in [0,1], higher = more trustworthy. */
  weight: number;
}

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
  /** External IDs extracted from the name (for direct TMDB lookup). */
  ids?: MediaIds;
  /** Title guesses to search, ranked by prior weight. */
  titleCandidates?: TitleCandidate[];
  /** All plausible 4-digit years, most likely first. */
  yearCandidates?: number[];
}

/**
 * Pure extraction result from a messy directory/file name. Produced without any
 * network access; the locate layer turns these candidates into ranked TMDB matches.
 */
export interface ExtractResult {
  ids: MediaIds;
  mediaType: MediaType | 'unknown';
  season?: number;
  episodes: ParsedEpisode[];
  tags: MediaTags;
  titleCandidates: TitleCandidate[];
  yearCandidates: number[];
  originalName: string;
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

export const AUDIO_EXTENSIONS = new Set([
  '.mp3',
  '.flac',
  '.m4a',
  '.ogg',
  '.opus',
  '.wav',
  '.ape',
  '.wma',
  '.aac',
  '.alac',
  '.dsf', // DSD
  '.dff', // DSD
  '.wv', // WavPack
  '.tak',
  '.tta',
  '.mka',
  '.aiff',
  '.aif',
]);

/** One audio track in an album, from embedded tags (filename as fallback). */
export interface AudioTrack {
  /** Original file name (basename). */
  originalFileName: string;
  /** Path relative to the album root (e.g. "Disc 01/01 - x.flac"); for a flat
   *  album this equals originalFileName. */
  relPath?: string;
  extension: string;
  /** Disc number (1 when single-disc / unknown). */
  disc: number;
  /** Track number within the disc, or undefined when unknown. */
  track?: number;
  title?: string;
  /** Track artist (may differ from album artist on compilations). */
  artist?: string;
}

/** An album parsed from a directory of audio files (embedded tags first). */
export interface ParsedAlbum {
  albumArtist?: string;
  album?: string;
  year?: number;
  /** Number of discs (1 unless multi-disc tags seen). */
  discCount: number;
  tracks: AudioTrack[];
  originalDirName: string;
  sourcePath: string;
}
