/** Subtitle entry as actually returned by the SubDL API. */
export interface SubDLSubtitle {
  /** Uppercase ISO-639-1 code, e.g. "EN", "ZH", "JA" */
  language: string;
  /** Human label, e.g. "English" */
  lang: string;
  release_name: string;
  /** Path to a ZIP archive, e.g. "/subtitle/3570225-8489216.zip" */
  url: string;
  author?: string;
  hi?: boolean;
  season?: number;
  episode?: number | null;
}

interface SubDLSearchParams {
  tmdbId?: number;
  type: 'movie' | 'tv';
  season?: number;
  episode?: number;
  /** Comma-separated uppercase SubDL language codes */
  languages: string;
}

const BASE = 'https://api.subdl.com/api/v1';
const DL_BASE = 'https://dl.subdl.com';

export class SubDLClient {
  constructor(private readonly apiKey: string) {}

  async search(params: SubDLSearchParams): Promise<SubDLSubtitle[]> {
    const url = new URL(`${BASE}/subtitles`);
    url.searchParams.set('api_key', this.apiKey);
    url.searchParams.set('type', params.type);
    url.searchParams.set('languages', params.languages);
    url.searchParams.set('subs_per_page', '30');
    if (params.tmdbId) url.searchParams.set('tmdb_id', String(params.tmdbId));
    if (params.season !== undefined) url.searchParams.set('season_number', String(params.season));
    if (params.episode !== undefined) url.searchParams.set('episode_number', String(params.episode));

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`SubDL ${res.status}`);
    const data = (await res.json()) as { status: boolean; subtitles?: SubDLSubtitle[] };
    return data.subtitles ?? [];
  }

  /** Full URL of the ZIP archive for a subtitle entry. */
  downloadUrl(subUrl: string): string {
    return `${DL_BASE}${subUrl}`;
  }
}
