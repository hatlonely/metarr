export interface MusicBrainzTrack {
  /** Disc / medium number (1-based). */
  disc: number;
  /** Track position within the disc (1-based). */
  position: number;
  title: string;
}

export interface MusicBrainzRelease {
  mbid: string;
  /** Album title. */
  title: string;
  /** Album artist (credited name). */
  artist: string;
  year?: number;
  trackCount: number;
  discCount: number;
  /** Canonical track list — populated by getRelease, empty for search results. */
  tracks: MusicBrainzTrack[];
  /** Front cover URL (Cover Art Archive), set lazily by the caller. */
  coverUrl?: string;
  /** Relevance score from locate (higher = better). */
  matchScore?: number;
}
