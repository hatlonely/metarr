import type {
  TMDBMatch,
  TMDBMovieDetails,
  TMDBSearchResult,
  TMDBSeasonDetail,
  TMDBTvDetails,
} from '../types/tmdb.js';
import { TMDB_IMAGE_BASE } from '../types/tmdb.js';
import { TMDBError } from './errors.js';

export interface TMDBClientOptions {
  apiKey: string;
  language?: string;
  baseUrl?: string;
}

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export class TMDBClient {
  private apiKey: string;
  private language: string;
  private baseUrl: string;
  private lastRequestTime = 0;
  private readonly minRequestInterval = 250;

  constructor(options: TMDBClientOptions) {
    this.apiKey = options.apiKey;
    this.language = options.language || 'zh-CN';
    this.baseUrl = options.baseUrl || TMDB_BASE_URL;
  }

  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const elapsed = Date.now() - this.lastRequestTime;
    if (elapsed < this.minRequestInterval) {
      await new Promise((resolve) => setTimeout(resolve, this.minRequestInterval - elapsed));
    }
    this.lastRequestTime = Date.now();

    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.set('api_key', this.apiKey);
    url.searchParams.set('language', this.language);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new TMDBError(response.status, await response.text());
    }
    return response.json() as Promise<T>;
  }

  async searchTv(query: string, year?: number): Promise<TMDBSearchResult[]> {
    const params: Record<string, string> = { query };
    if (year) params.first_air_date_year = String(year);
    const data = await this.request<{ results: TMDBSearchResult[] }>('/search/tv', params);
    return data.results;
  }

  async searchMovie(query: string, year?: number): Promise<TMDBSearchResult[]> {
    const params: Record<string, string> = { query };
    if (year) params.primary_release_year = String(year);
    const data = await this.request<{ results: TMDBSearchResult[] }>('/search/movie', params);
    return data.results;
  }

  async getTvDetails(id: number): Promise<TMDBTvDetails> {
    return this.request<TMDBTvDetails>(`/tv/${id}`);
  }

  async getMovieDetails(id: number): Promise<TMDBMovieDetails> {
    return this.request<TMDBMovieDetails>(`/movie/${id}`);
  }

  async getSeasonDetails(tvId: number, seasonNumber: number): Promise<TMDBSeasonDetail> {
    return this.request<TMDBSeasonDetail>(`/tv/${tvId}/season/${seasonNumber}`);
  }

  async findByExternalId(externalId: string): Promise<TMDBMatch[]> {
    const data = await this.request<{
      movie_results: TMDBSearchResult[];
      tv_results: TMDBSearchResult[];
    }>(`/find/${externalId}`, { external_source: 'imdb_id' });

    return [
      ...data.movie_results.map((r) => this.toMatch(r, 'movie')),
      ...data.tv_results.map((r) => this.toMatch(r, 'tv')),
    ];
  }

  async fuzzySearch(
    query: string,
    type: 'tv' | 'movie',
    year?: number,
  ): Promise<TMDBMatch[]> {
    let results = await this.search(query, type, year);
    if (results.length === 0 && year) {
      results = await this.search(query, type);
    }
    return results;
  }

  async search(
    query: string,
    type: 'tv' | 'movie',
    year?: number,
  ): Promise<TMDBMatch[]> {
    const results =
      type === 'tv' ? await this.searchTv(query, year) : await this.searchMovie(query, year);
    return results.map((r) => this.toMatch(r, type));
  }

  private toMatch(result: TMDBSearchResult, type: 'tv' | 'movie'): TMDBMatch {
    const displayName = result.name || result.title || '';
    const originalName = result.original_name || result.original_title || '';
    const dateStr = result.first_air_date || result.release_date || '';
    const year = dateStr ? parseInt(dateStr.slice(0, 4), 10) : 0;

    return {
      id: result.id,
      type,
      displayName: displayName || originalName,
      originalName,
      year,
      imdbId: undefined,
      overview: result.overview || '',
      posterUrl: result.poster_path ? `${TMDB_IMAGE_BASE}${result.poster_path}` : undefined,
    };
  }
}
