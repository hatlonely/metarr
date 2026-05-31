export interface SubDLSubtitle {
  sd_id: number;
  url: string;
  language: string;  // 'zh', 'en', 'zh-TW', etc.
  release_name: string;
  zipDownload: boolean;
  download_count: number;
  hi: boolean;
}

interface SubDLSearchParams {
  tmdbId?: number;
  type: 'movie' | 'tv';
  season?: number;
  episode?: number;
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
    url.searchParams.set('subs_per_page', '5');
    if (params.tmdbId) url.searchParams.set('tmdb_id', String(params.tmdbId));
    if (params.season !== undefined) url.searchParams.set('season_number', String(params.season));
    if (params.episode !== undefined) url.searchParams.set('episode_number', String(params.episode));

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`SubDL ${res.status}`);
    const data = await res.json() as { status: boolean; subtitles?: SubDLSubtitle[] };
    return data.subtitles ?? [];
  }

  downloadUrl(subUrl: string): string {
    return `${DL_BASE}${subUrl}?api_key=${this.apiKey}`;
  }
}
