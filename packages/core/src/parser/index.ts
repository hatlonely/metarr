import { basename, dirname } from 'node:path';
import type { ParsedMedia, MediaType, ParseOptions, TitleCandidate } from '../types/media.js';
import { extractMedia } from './extract.js';
import { scanDirectory } from './scanner.js';
import { parseFileName, parseSubtitleFile } from './file-parser.js';

export { parseDirName } from './dir-parser.js';
export { extractMedia, extractIds, extractYearCandidates } from './extract.js';
export { parseFileName, parseSubtitleFile, parseSeasonEpisode } from './file-parser.js';
export { scanDirectory, scanMediaDirectories } from './scanner.js';
export { parseTags, stripMediaTags } from './tag-parser.js';

/** A directory/file is "clean" if it already looks like `Title (Year) [id]`. */
const CLEAN_RE = /^.+?\s*\(\d{4}\)\s*(?:\[[^\]]*\])?\s*$/;

function topTitle(candidates: TitleCandidate[], lang: 'zh' | 'en'): string | undefined {
  return candidates.find((c) => c.lang === lang)?.query;
}

/**
 * Parse a single media file: scan its parent directory but keep only the
 * selected file and its associated subtitles.
 */
export async function parseMediaFile(
  filePath: string,
  options?: ParseOptions,
): Promise<ParsedMedia> {
  const dirPath = dirname(filePath);
  const fileName = basename(filePath);

  const scan = await scanDirectory(dirPath);
  const selectedVideo = scan.videoFiles.find((f) => f.name === fileName);
  if (!selectedVideo) {
    throw new Error(`Selected file is not a video file: ${fileName}`);
  }

  const selectedEpisode = parseFileName(selectedVideo.name);

  const videoNames = scan.videoFiles.map((f) => f.name);
  for (const sf of scan.subtitleFiles) {
    const result = parseSubtitleFile(sf.name, videoNames);
    if (result.isAssociated && result.videoBaseName) {
      const videoBase = selectedVideo.name.replace(/\.[^.]+$/, '');
      if (result.videoBaseName === videoBase) {
        selectedEpisode.associatedFiles.push(sf.name);
      }
    }
  }

  // File name is the primary signal; parent directory name is a fallback.
  const extract = extractMedia(fileName, [basename(dirPath)]);

  let type: MediaType | 'unknown';
  if (options?.type && options.type !== 'auto') {
    type = options.type;
  } else {
    // Fix: a selected episode (S01E05 / E05 / 第5集) means TV, not movie.
    type = selectedEpisode.season > 0 || selectedEpisode.episodes.length > 0 ? 'tv' : 'movie';
  }

  return {
    type,
    chineseTitle: topTitle(extract.titleCandidates, 'zh'),
    englishTitle: topTitle(extract.titleCandidates, 'en'),
    year: extract.yearCandidates[0],
    tags: extract.tags,
    episodes: [selectedEpisode],
    originalDirName: fileName,
    sourcePath: dirPath,
    isClean: CLEAN_RE.test(basename(dirPath).trim()),
    selectedFile: filePath,
    ids: extract.ids,
    titleCandidates: extract.titleCandidates,
    yearCandidates: extract.yearCandidates,
  };
}

/**
 * Parse a media directory: extract metadata from the directory name + its
 * contents, producing title candidates / IDs / years for the locate layer.
 */
export async function parseMediaDir(dirPath: string, options?: ParseOptions): Promise<ParsedMedia> {
  const originalDirName = basename(dirPath);
  const scan = await scanDirectory(dirPath);

  // Feed a few sample file names so a poor directory name can fall back to them.
  const sampleNames = scan.videoFiles.slice(0, 3).map((f) => f.name);
  const extract = extractMedia(originalDirName, sampleNames);

  let type: MediaType | 'unknown';
  if (options?.type && options.type !== 'auto') {
    type = options.type;
  } else {
    const hasEpisodes = scan.episodes.some((ep) => ep.episodes.length > 0);
    if (hasEpisodes) type = 'tv';
    else if (scan.videoFiles.length === 1) type = 'movie';
    else if (scan.videoFiles.length > 1) type = 'tv';
    else type = extract.mediaType;
  }

  return {
    type,
    chineseTitle: topTitle(extract.titleCandidates, 'zh'),
    englishTitle: topTitle(extract.titleCandidates, 'en'),
    year: extract.yearCandidates[0],
    tags: extract.tags,
    episodes: scan.episodes,
    originalDirName,
    sourcePath: dirPath,
    isClean: CLEAN_RE.test(originalDirName.trim()),
    ids: extract.ids,
    titleCandidates: extract.titleCandidates,
    yearCandidates: extract.yearCandidates,
  };
}
