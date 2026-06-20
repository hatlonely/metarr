import type { ParsedAlbum } from '../types/media.js';
import { parseAlbumDirName } from '../parser/audio-parser.js';
import type { MusicBrainzClient } from './client.js';
import type { MusicBrainzRelease } from './types.js';
import { scoreRelease, type NameGuess, type PreferLang } from './score.js';
import { localizeRelease, type TitleScript } from './localize.js';

export interface LocateReleaseOptions {
  limit?: number;
  /** Bias ranking toward this language (from the display-language setting). */
  preferLang?: PreferLang;
  /** Normalize candidate titles to this Chinese script for display. */
  titleScript?: TitleScript;
}

/**
 * Search MusicBrainz for the parsed album and rank candidate releases by
 * relevance. Rather than trust our (rule-based, fragile) artist/album split, we
 * throw several interpretations at the database and let order-agnostic scoring
 * decide:
 *   1. artist + album as parsed
 *   2. the two swapped (handles "Album - Artist" / reversed names)
 *   3. the whole cleaned name as a release title (handles odd separators)
 * Results are merged (deduped by MBID) and ranked. Returns summaries — fetch
 * the chosen release with `client.getRelease(mbid)` for its canonical tracks.
 */
export async function locateReleases(
  client: MusicBrainzClient,
  album: ParsedAlbum,
  opts: LocateReleaseOptions = {},
): Promise<MusicBrainzRelease[]> {
  const limit = opts.limit ?? 8;

  // Interpretations to try: the tag-derived guess plus the folder-name parse
  // (which is often better — e.g. Chinese title when tags are romanized).
  const dn = parseAlbumDirName(album.originalDirName);
  const guesses: NameGuess[] = [{ artist: album.albumArtist, album: album.album }];
  if (dn.artist || dn.album) guesses.push({ artist: dn.artist, album: dn.album });
  if (!guesses.some((g) => g.artist || g.album)) return [];

  // Build deduped search queries from every guess. Album-title-only first: it's
  // the most reliable matcher (artist strings are often messy / romanized), and
  // order-agnostic scoring ranks the results correctly.
  const queries: [string | undefined, string | undefined][] = [];
  for (const g of guesses) {
    if (g.album) queries.push([undefined, g.album]);
    if (g.artist && g.album) {
      queries.push([g.artist, g.album]);
      queries.push([g.album, g.artist]); // reversed
    } else if (g.artist) {
      queries.push([g.artist, undefined]);
    }
  }

  const MAX_QUERIES = 6; // bound latency (MusicBrainz allows ~1 req/s)
  const merged = new Map<string, MusicBrainzRelease>();
  const seenQuery = new Set<string>();
  let ran = 0;
  for (const [artist, release] of queries) {
    const key = `${artist ?? ''}|${release ?? ''}`;
    if (seenQuery.has(key)) continue;
    seenQuery.add(key);
    if (ran >= MAX_QUERIES) break;
    ran++;
    try {
      for (const r of await client.searchReleases(artist, release, limit)) {
        if (!merged.has(r.mbid)) merged.set(r.mbid, r);
      }
    } catch {
      // Skip a failed query; other candidates may still match.
    }
    if (merged.size >= limit * 2) break;
  }

  const altNames = guesses.slice(1); // dirname guess(es); the album guess is implicit
  const ranked = [...merged.values()]
    .map((r) => ({ ...r, matchScore: scoreRelease(r, album, altNames, opts.preferLang) }))
    .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
    .slice(0, limit);

  // Normalize displayed titles to the preferred Chinese script.
  if (opts.titleScript) {
    return Promise.all(ranked.map((r) => localizeRelease(r, opts.titleScript!)));
  }
  return ranked;
}
