import type { ParsedAlbum } from '../types/media.js';
import { titleSimilarity } from '../tmdb/score.js';
import { hasHan } from './localize.js';
import type { MusicBrainzRelease } from './types.js';

/** Language preference for ranking (from the user's display-language setting). */
export type PreferLang = 'zh' | 'en';

/** Bonus for a release whose title matches the preferred language. Strong enough
 *  to favor a Chinese release over an English-titled duplicate, but not to
 *  promote a poorly-matching one over a clearly-correct match. */
const LANG_PREFERENCE_BONUS = 30;

/** Similarity of two strings (0–1), tolerant of one being missing. */
function sim(a: string | undefined, b: string): number {
  return a ? titleSimilarity(a, b, b) : 0;
}

/** An alternative (artist, album) interpretation, e.g. parsed from the folder
 *  name when the embedded tags are romanized or wrong. */
export interface NameGuess {
  artist?: string;
  album?: string;
}

/**
 * Relevance score for a MusicBrainz release against the parsed album. Higher =
 * better. Title/artist matching is **order-agnostic and multi-candidate**:
 * since our album/artist guesses (from tags or messy folder names) may be
 * reversed or romanized, we score every interpretation in both pairings and
 * take the best — so a database result that matches ANY interpretation wins.
 * Year and track-count closeness add confidence.
 */
export function scoreRelease(
  release: MusicBrainzRelease,
  album: ParsedAlbum,
  altNames: NameGuess[] = [],
  preferLang?: PreferLang,
): number {
  const guesses: NameGuess[] = [{ artist: album.albumArtist, album: album.album }, ...altNames];
  let best = 0;
  for (const g of guesses) {
    const direct = sim(g.album, release.title) * 50 + sim(g.artist, release.artist) * 30;
    const swapped = sim(g.artist, release.title) * 50 + sim(g.album, release.artist) * 30;
    best = Math.max(best, direct, swapped);
  }
  let score = best;
  if (album.year && release.year) {
    const d = Math.abs(album.year - release.year);
    score += d === 0 ? 15 : d <= 1 ? 6 : -8;
  }
  if (release.trackCount && album.tracks.length) {
    const d = Math.abs(release.trackCount - album.tracks.length);
    score += d === 0 ? 10 : d <= 1 ? 4 : 0;
  }
  // Prefer titles in the user's language (e.g. Chinese over an English-titled
  // duplicate of the same album). Output is then normalized to the right script.
  if (preferLang === 'zh' && hasHan(release.title)) score += LANG_PREFERENCE_BONUS;
  else if (preferLang === 'en' && !hasHan(release.title)) score += LANG_PREFERENCE_BONUS / 3;
  return Math.round(score * 100) / 100;
}
