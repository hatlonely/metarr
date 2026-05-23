import type { MediaTags } from '../types/media.js';
import { parseTags } from './tag-parser.js';

/**
 * Parse a directory name to extract title, year, and media tags.
 */
export function parseDirName(dirName: string): {
  chineseTitle?: string;
  englishTitle?: string;
  year?: number;
  tags: MediaTags;
  isClean: boolean;
} {
  // Pattern 1: Already in clean format "Title (Year)" or "Title (Year) [tmdbid-XXX]"
  const cleanMatch = dirName.match(/^(.+?)\s*\((\d{4})\)\s*(?:\[.+\])?\s*$/);
  if (cleanMatch) {
    const [, title, yearStr] = cleanMatch;
    const year = parseInt(yearStr, 10);
    const hasIdTag = /\[(?:tmdbid|imdbid|tvdbid|doubanid)-/.test(dirName);
    return {
      chineseTitle: title,
      year,
      tags: {},
      isClean: true,
    };
  }

  let workingName = dirName;

  // Strip 【...】 Chinese bracket prefix (e.g., 【高清剧集网发布 www.QQHDTV.com】)
  workingName = workingName.replace(/^【[^】]*】\s*/, '');

  // Extract year (4-digit number in 19xx or 20xx range)
  let year: number | undefined;
  const yearMatch = workingName.match(/(?:^|[.\s])(\d{4})(?:[.\s]|$)/);
  if (yearMatch) {
    const y = parseInt(yearMatch[1], 10);
    if (y >= 1900 && y <= 2030) {
      year = y;
    }
  }

  // Strip [...] metadata blocks (e.g., [杜比视界版本], [全24集], [国语音轨+简繁英字幕])
  workingName = workingName.replace(/\[[^\]]*\]/g, ' ');

  // Parse media tags from the full original name
  const tags = parseTags(dirName);

  // Remove media tag patterns (resolution, codec, audio, source) from working name
  // to isolate the title portion
  let titlePortion = workingName;
  titlePortion = titlePortion.replace(/\.?\d{3,4}[pPiI]\b/g, ' ');
  titlePortion = titlePortion.replace(/\.?(?:H\.?265|HEVC|x265|H\.?264|AVC|x264|VP9|AV1)\b/gi, ' ');
  titlePortion = titlePortion.replace(
    /\.?(?:WEB-DL|WEBRip|BluRay|BDRip|HDTV|HDRip|DVDRip|REMUX)\b/gi,
    ' ',
  );
  titlePortion = titlePortion.replace(
    /\.?(?:DDP?[\s.]?5[\s.]?1|DTS[\s.]?HD[\s.]?MA|DTS[\s.]?5[\s.]?1|TrueHD|AAC|FLAC|PCM)\b/gi,
    ' ',
  );
  titlePortion = titlePortion.replace(/\.?(?:HDR|DV|HQ|IQ)\b/gi, ' ');
  titlePortion = titlePortion.replace(/\.?Dolby[\s.]?Vision\b/gi, ' ');
  // Remove release group (-XXX at end) and trailing audio count like 3Audios
  titlePortion = titlePortion.replace(/-\w+\s*$/, ' ');
  titlePortion = titlePortion.replace(/\b\d+Audios?\b/gi, ' ');
  // Remove year from title portion
  if (year) {
    titlePortion = titlePortion.replace(new RegExp(`[.\\s]${year}[.\\s]`, 'g'), ' ');
  }

  // Split Chinese and English segments
  const chineseTitle = extractChineseTitle(titlePortion);
  const englishTitle = extractEnglishTitle(titlePortion, chineseTitle);

  return {
    chineseTitle: chineseTitle || undefined,
    englishTitle: englishTitle || undefined,
    year,
    tags,
    isClean: false,
  };
}

/**
 * Extract Chinese title from text.
 * Chinese characters are in Unicode range \u4e00-\u9fff, also include CJK punctuation.
 */
function extractChineseTitle(text: string): string | null {
  // Match contiguous CJK characters (including CJK punctuation)
  const cjkRegex = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3000-\u303f\uff00-\uffef]+/g;
  const matches = text.match(cjkRegex);
  if (!matches || matches.length === 0) {
    return null;
  }

  // Filter out common non-title CJK patterns (release group metadata in Chinese)
  const metadataPatterns = [
    /全\d+集/,
    /国语/,
    /中文/,
    /字幕/,
    /音轨/,
    /配音/,
    /高清/,
    /杜比/,
    /视界/,
    /版本/,
    /高码/,
  ];

  const titleParts: string[] = [];
  for (const match of matches) {
    const isMetadata = metadataPatterns.some((p) => p.test(match));
    if (!isMetadata) {
      titleParts.push(match.trim());
    }
  }

  return titleParts.length > 0 ? titleParts.join('') : null;
}

/**
 * Extract English title from text, excluding already-extracted Chinese parts.
 */
function extractEnglishTitle(text: string, chineseTitle: string | null): string | null {
  // Remove Chinese characters
  let remaining = text.replace(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3000-\u303f\uff00-\uffef]/g, ' ');

  // Remove dots and normalize
  remaining = remaining.replace(/\./g, ' ');

  // Split into words, filter out empty and media-tag-like words
  const mediaTagWords = new Set([
    'the', 'and', 'or', 'for', 'with', 'version', 'complete', 'season', 'episode',
    'web', 'dl', 'bluray', 'bdrip', 'hdtv', 'hdr', 'dv', 'hq',
  ]);

  const words = remaining
    .split(/\s+/)
    .filter((w) => w.length > 1 && !mediaTagWords.has(w.toLowerCase()));

  if (words.length === 0) {
    return null;
  }

  // English title is typically at the end of the remaining text (after Chinese title)
  // or it's the main ASCII portion
  const title = words.join(' ').trim();
  if (title.length < 2) {
    return null;
  }

  return title;
}
