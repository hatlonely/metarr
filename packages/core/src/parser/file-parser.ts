import type { MediaTags, ParsedEpisode } from '../types/media.js';
import { parseTags } from './tag-parser.js';

/**
 * Parse a video file name to extract season/episode info and media tags.
 */
export function parseFileName(fileName: string): ParsedEpisode {
  const extension = getExtension(fileName);

  // Try to extract S##E## pattern
  const epPattern = /[Ss](\d{1,2})[Ee](\d{1,2}(?:-\d{1,2})?)/;
  const epMatch = fileName.match(epPattern);

  let season = 0;
  let episodes: number[] = [];

  if (epMatch) {
    season = parseInt(epMatch[1], 10);
    const epPart = epMatch[2];
    if (epPart.includes('-')) {
      const [start, end] = epPart.split('-').map(Number);
      for (let i = start; i <= end; i++) {
        episodes.push(i);
      }
    } else {
      episodes.push(parseInt(epPart, 10));
    }
  }

  const tags = parseTags(fileName);

  return {
    originalFileName: fileName,
    extension,
    season,
    episodes,
    tags,
    associatedFiles: [],
  };
}

function getExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) return '';
  return fileName.slice(lastDot).toLowerCase();
}

/**
 * Parse a subtitle file name and check if it's associated with a video file.
 */
export function parseSubtitleFile(
  fileName: string,
  videoFiles: string[],
): { isAssociated: boolean; videoBaseName: string | null } {
  const ext = getExtension(fileName);
  if (!['.srt', '.ass', '.ssa', '.sub', '.idx', '.sup'].includes(ext)) {
    return { isAssociated: false, videoBaseName: null };
  }

  // Remove subtitle extension (and any language tag like .zh, .en, .zh-cn)
  const subBase = fileName
    .replace(/\.(srt|ass|ssa|sub|idx|sup)$/i, '')
    .replace(/\.(zh|en|zh-cn|zh-tw|chi|eng|jpn|kor)\b/i, '');

  for (const vf of videoFiles) {
    const videoBase = vf.replace(/\.[^.]+$/, '');
    if (videoBase === subBase || subBase.startsWith(videoBase)) {
      return { isAssociated: true, videoBaseName: videoBase };
    }
  }

  return { isAssociated: false, videoBaseName: null };
}
