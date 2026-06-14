import type { MediaTags, ParsedEpisode } from '../types/media.js';
import { parseTags } from './tag-parser.js';

/**
 * Parse a video file name to extract season/episode info and media tags.
 */
export function parseFileName(fileName: string): ParsedEpisode {
  const extension = getExtension(fileName);
  const { season, episodes } = parseSeasonEpisode(fileName);
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

/**
 * Extract season + episode numbers. Supports:
 *   S01E01, S1E1, S01E01-E03 / S01E01-03 (range), S01E01E02 (multi),
 *   1x01, 第01集 / 第1话 (season unknown), E01 / EP01 (no season).
 * Episode numbers allow up to 3 digits (long-running shows). The range end uses
 * a negative lookahead so `S01E01-1080p` is NOT read as episodes 1..1080.
 */
export function parseSeasonEpisode(fileName: string): { season: number; episodes: number[] } {
  const sxe = fileName.match(
    /[Ss](\d{1,2})[Ee](\d{1,3})(?:-[Ee]?(\d{1,3})(?![\dpPiI]))?((?:[Ee]\d{1,3})*)/,
  );
  if (sxe) {
    const season = parseInt(sxe[1], 10);
    const start = parseInt(sxe[2], 10);
    if (sxe[3]) {
      const end = parseInt(sxe[3], 10);
      const eps: number[] = [];
      for (let i = start; i <= end; i++) eps.push(i);
      return { season, episodes: eps };
    }
    const eps = [start];
    if (sxe[4]) {
      for (const m of sxe[4].matchAll(/[Ee](\d{1,3})/g)) eps.push(parseInt(m[1], 10));
    }
    return { season, episodes: eps };
  }

  const x = fileName.match(/\b(\d{1,2})x(\d{1,3})\b/i);
  if (x) return { season: parseInt(x[1], 10), episodes: [parseInt(x[2], 10)] };

  const cn = fileName.match(/第\s*(\d{1,3})\s*[集话話]/);
  if (cn) return { season: 0, episodes: [parseInt(cn[1], 10)] };

  const e = fileName.match(/\bE(?:P)?\s*(\d{1,3})\b/i);
  if (e) return { season: 0, episodes: [parseInt(e[1], 10)] };

  return { season: 0, episodes: [] };
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
