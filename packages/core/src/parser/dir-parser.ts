import type { MediaTags } from '../types/media.js';
import { extractMedia } from './extract.js';

const CLEAN_RE = /^.+?\s*\(\d{4}\)\s*(?:\[[^\]]*\])?\s*$/;

/**
 * Backward-compatible directory-name parse, now backed by {@link extractMedia}.
 * Returns the top Chinese/English title candidate plus the most likely year.
 * Kept for the browser demo and existing tests; new code should use extractMedia.
 */
export function parseDirName(dirName: string): {
  chineseTitle?: string;
  englishTitle?: string;
  year?: number;
  tags: MediaTags;
  isClean: boolean;
} {
  const ex = extractMedia(dirName);
  return {
    chineseTitle: ex.titleCandidates.find((c) => c.lang === 'zh')?.query,
    englishTitle: ex.titleCandidates.find((c) => c.lang === 'en')?.query,
    year: ex.yearCandidates[0],
    tags: ex.tags,
    isClean: CLEAN_RE.test(dirName.trim()),
  };
}
