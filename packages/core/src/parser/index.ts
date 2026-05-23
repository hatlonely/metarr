import { basename } from 'node:path';
import type { ParsedMedia, MediaType, ParseOptions } from '../types/media.js';
import { parseDirName, extractFromFileName } from './dir-parser.js';
import { scanDirectory } from './scanner.js';

export { parseDirName, extractFromFileName } from './dir-parser.js';
export { parseFileName, parseSubtitleFile } from './file-parser.js';
export { scanDirectory, scanMediaDirectories } from './scanner.js';
export { parseTags } from './tag-parser.js';

/**
 * Parse a media directory: extract metadata from the directory name and its contents.
 */
export async function parseMediaDir(
  dirPath: string,
  options?: ParseOptions,
): Promise<ParsedMedia> {
  const originalDirName = basename(dirPath);
  const dirInfo = parseDirName(originalDirName);
  const scan = await scanDirectory(dirPath);

  // Auto-detect media type
  let type: MediaType | 'unknown' = dirInfo.isClean ? 'unknown' : 'unknown';

  if (options?.type && options.type !== 'auto') {
    type = options.type;
  } else {
    // Heuristic: if files have S##E## pattern, it's TV
    const hasEpisodes = scan.episodes.some((ep) => ep.season > 0 && ep.episodes.length > 0);
    if (hasEpisodes) {
      type = 'tv';
    } else if (scan.videoFiles.length === 1) {
      // Single video file with no episode pattern -> likely a movie
      type = 'movie';
    } else if (scan.videoFiles.length > 1) {
      // Multiple video files without S##E## -> still likely TV
      type = 'tv';
    }
  }

  // Fallback: if directory name didn't yield a title, try extracting from file names
  let chineseTitle = dirInfo.chineseTitle;
  let englishTitle = dirInfo.englishTitle;
  let year = dirInfo.year;
  let tags = dirInfo.tags;

  if (!chineseTitle && !englishTitle && scan.episodes.length > 0) {
    const fileFirst = extractFromFileName(scan.episodes[0].originalFileName);
    chineseTitle = fileFirst.chineseTitle;
    englishTitle = fileFirst.englishTitle;
    if (!year) year = fileFirst.year;
    if (!tags.resolution) tags = fileFirst.tags;
  }

  return {
    type,
    chineseTitle,
    englishTitle,
    year,
    tags,
    episodes: scan.episodes,
    originalDirName,
    sourcePath: dirPath,
    isClean: dirInfo.isClean,
  };
}
