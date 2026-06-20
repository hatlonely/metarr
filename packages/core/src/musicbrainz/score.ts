import type { ParsedAlbum } from '../types/media.js';
import { titleSimilarity } from '../tmdb/score.js';
import type { MusicBrainzRelease } from './types.js';

/**
 * Relevance score for a MusicBrainz release against the parsed album. Higher =
 * better. Factors: album title + artist similarity, year match, track-count
 * closeness.
 */
export function scoreRelease(release: MusicBrainzRelease, album: ParsedAlbum): number {
  let score = 0;
  if (album.album) score += titleSimilarity(album.album, release.title, release.title) * 50;
  if (album.albumArtist)
    score += titleSimilarity(album.albumArtist, release.artist, release.artist) * 30;
  if (album.year && release.year) {
    const d = Math.abs(album.year - release.year);
    score += d === 0 ? 15 : d <= 1 ? 6 : -8;
  }
  if (release.trackCount && album.tracks.length) {
    const d = Math.abs(release.trackCount - album.tracks.length);
    score += d === 0 ? 10 : d <= 1 ? 4 : 0;
  }
  return Math.round(score * 100) / 100;
}
