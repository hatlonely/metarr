import type { MusicBrainzRelease, MusicBrainzTrack } from './types.js';

const MB_BASE = 'https://musicbrainz.org/ws/2';
const CAA_BASE = 'https://coverartarchive.org';

export interface MusicBrainzClientOptions {
  baseUrl?: string;
  /** MusicBrainz requires a descriptive User-Agent identifying the app. */
  userAgent?: string;
  /** Minimum ms between requests (MusicBrainz asks for ~1 req/s). */
  minIntervalMs?: number;
}

/* --- Loose shapes of the MusicBrainz JSON we read --- */
interface MBArtistCredit {
  name?: string;
  joinphrase?: string;
}
interface MBTrack {
  position?: number;
  number?: string;
  title?: string;
}
interface MBMedium {
  position?: number;
  'track-count'?: number;
  tracks?: MBTrack[];
}
interface MBRelease {
  id: string;
  title: string;
  date?: string;
  'artist-credit'?: MBArtistCredit[];
  'track-count'?: number;
  media?: MBMedium[];
}

function creditName(ac?: MBArtistCredit[]): string {
  if (!ac) return '';
  return ac.map((c) => (c.name ?? '') + (c.joinphrase ?? '')).join('').trim();
}

function yearOf(date?: string): number | undefined {
  const m = /^(\d{4})/.exec(date ?? '');
  return m ? Number(m[1]) : undefined;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const ESC = /([+\-!(){}[\]^"~*?:\\/]|&&|\|\|)/g;
function escapeLucene(s: string): string {
  return s.replace(ESC, '\\$1');
}

/**
 * Thin MusicBrainz + Cover Art Archive client. Serializes requests with a
 * minimum interval (their rate limit) and sends a descriptive User-Agent.
 */
export class MusicBrainzClient {
  private baseUrl: string;
  private userAgent: string;
  private minInterval: number;
  private last = 0;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(options: MusicBrainzClientOptions = {}) {
    this.baseUrl = options.baseUrl || MB_BASE;
    this.userAgent =
      options.userAgent || 'Metarr/0.1 ( https://github.com/hatlonely/metarr )';
    this.minInterval = options.minIntervalMs ?? 1100;
  }

  /** Serialize calls and keep ≥ minInterval between them. */
  private throttle<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      const wait = this.minInterval - (Date.now() - this.last);
      if (wait > 0) await delay(wait);
      this.last = Date.now();
      return fn();
    });
    this.queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  private get<T>(path: string, params: Record<string, string>): Promise<T> {
    return this.throttle(async () => {
      const url = new URL(`${this.baseUrl}${path}`);
      url.searchParams.set('fmt', 'json');
      for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
      const res = await fetch(url.toString(), { headers: { 'User-Agent': this.userAgent } });
      if (!res.ok) throw new Error(`MusicBrainz ${res.status}: ${await res.text()}`);
      return res.json() as Promise<T>;
    });
  }

  /** Search releases by album artist + title; returns summaries (no tracks). */
  async searchReleases(
    artist: string | undefined,
    album: string | undefined,
    limit = 8,
  ): Promise<MusicBrainzRelease[]> {
    const terms: string[] = [];
    if (album) terms.push(`release:"${escapeLucene(album)}"`);
    if (artist) terms.push(`artist:"${escapeLucene(artist)}"`);
    if (terms.length === 0) return [];
    const data = await this.get<{ releases?: MBRelease[] }>('/release', {
      query: terms.join(' AND '),
      limit: String(limit),
    });
    return (data.releases ?? []).map((r) => this.toSummary(r));
  }

  /** Full release with the canonical track list. */
  async getRelease(mbid: string): Promise<MusicBrainzRelease> {
    const data = await this.get<MBRelease>(`/release/${mbid}`, {
      inc: 'recordings+artist-credits',
    });
    const media = data.media ?? [];
    const tracks: MusicBrainzTrack[] = media.flatMap((m, i) =>
      (m.tracks ?? []).map((tk) => ({
        disc: m.position ?? i + 1,
        position: tk.position ?? (Number(tk.number) || 0),
        title: tk.title ?? '',
      })),
    );
    return {
      mbid: data.id,
      title: data.title,
      artist: creditName(data['artist-credit']),
      year: yearOf(data.date),
      trackCount: tracks.length,
      discCount: media.length || 1,
      tracks,
    };
  }

  /** Front cover image URL (Cover Art Archive). */
  coverArtUrl(mbid: string): string {
    return `${CAA_BASE}/release/${mbid}/front-500`;
  }

  private toSummary(r: MBRelease): MusicBrainzRelease {
    const media = r.media ?? [];
    const trackCount =
      r['track-count'] ?? media.reduce((s, m) => s + (m['track-count'] ?? 0), 0);
    return {
      mbid: r.id,
      title: r.title,
      artist: creditName(r['artist-credit']),
      year: yearOf(r.date),
      trackCount,
      discCount: media.length || 1,
      tracks: [],
    };
  }
}
