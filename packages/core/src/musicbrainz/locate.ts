import type { ParsedAlbum } from '../types/media.js';
import type { MusicBrainzClient } from './client.js';
import type { MusicBrainzRelease } from './types.js';
import { scoreRelease } from './score.js';

export interface LocateReleaseOptions {
  limit?: number;
}

/**
 * Search MusicBrainz for the parsed album and rank candidate releases by
 * relevance. Returns summaries (no track list) — fetch the chosen release with
 * `client.getRelease(mbid)` to get its canonical tracks.
 */
export async function locateReleases(
  client: MusicBrainzClient,
  album: ParsedAlbum,
  opts: LocateReleaseOptions = {},
): Promise<MusicBrainzRelease[]> {
  if (!album.album && !album.albumArtist) return [];
  const results = await client.searchReleases(album.albumArtist, album.album, opts.limit ?? 8);
  return results
    .map((r) => ({ ...r, matchScore: scoreRelease(r, album) }))
    .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
}
