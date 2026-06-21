import type { TMDBMatch } from '../types/tmdb.js';
import type { MusicBrainzRelease } from '../musicbrainz/types.js';
import type { Assessment } from './types.js';

// Thresholds tuned conservatively against real-library testing: better to flag
// an item for review than to auto-apply a wrong match. All values are tunable.
const VIDEO_HIGH_SCORE = 55;
const VIDEO_MIN_GAP = 12;
const MUSIC_HIGH_SCORE = 95;
const MUSIC_STRONG_SCORE = 80;
const MUSIC_MIN_GAP = 15;

function yearOk(a?: number, b?: number): boolean {
  return !a || !b || Math.abs(a - b) <= 1;
}

/** Confidence of the top TMDB match for a parsed video item. */
export function assessVideo(matches: TMDBMatch[], parsed: { year?: number }): Assessment {
  if (matches.length === 0) return { level: 'none', reason: 'no-match' };
  const top = matches[0];
  if (top.matchReason?.includes('ID')) return { level: 'high', reason: 'id-hit' };
  const score = top.matchScore ?? 0;
  const gap = score - (matches[1]?.matchScore ?? 0);
  const yOk = yearOk(parsed.year, top.year);
  if (score >= VIDEO_HIGH_SCORE && gap >= VIDEO_MIN_GAP && yOk) return { level: 'high' };
  return {
    level: 'low',
    reason: !yOk ? 'year-mismatch' : score < VIDEO_HIGH_SCORE ? 'low-score' : 'ambiguous',
  };
}

/** Confidence of the top MusicBrainz release for a parsed album. */
export function assessMusic(
  releases: MusicBrainzRelease[],
  album: { year?: number; trackCount: number },
): Assessment {
  if (releases.length === 0) return { level: 'none', reason: 'no-match' };
  const top = releases[0];
  const score = top.matchScore ?? 0;
  const gap = score - (releases[1]?.matchScore ?? 0);
  const yOk = yearOk(album.year, top.year);
  const trackOk = !top.trackCount || !album.trackCount || Math.abs(top.trackCount - album.trackCount) <= 1;
  if (score >= MUSIC_HIGH_SCORE && yOk && trackOk) return { level: 'high' };
  if (score >= MUSIC_STRONG_SCORE && gap >= MUSIC_MIN_GAP && yOk) return { level: 'high' };
  return {
    level: 'low',
    reason: !yOk ? 'year-mismatch' : !trackOk ? 'track-mismatch' : 'low-score',
  };
}
