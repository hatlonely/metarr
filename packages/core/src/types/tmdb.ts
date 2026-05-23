export interface TMDBSearchResult {
  id: number;
  name?: string;
  title?: string;
  original_name?: string;
  original_title?: string;
  first_air_date?: string;
  release_date?: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  popularity?: number;
  vote_average?: number;
}

export interface TMDBTvDetails {
  id: number;
  name: string;
  original_name: string;
  first_air_date: string;
  overview: string;
  number_of_seasons: number;
  seasons: TMDBSeason[];
  poster_path?: string;
  backdrop_path?: string;
}

export interface TMDBSeason {
  id: number;
  season_number: number;
  name: string;
  episode_count: number;
  air_date?: string;
}

export interface TMDBSeasonDetail {
  id: number;
  season_number: number;
  name: string;
  episodes: TMDBEpisode[];
}

export interface TMDBEpisode {
  id: number;
  episode_number: number;
  name: string;
  overview?: string;
  air_date?: string;
  still_path?: string;
}

export interface TMDBMovieDetails {
  id: number;
  title: string;
  original_title: string;
  release_date: string;
  overview: string;
  imdb_id?: string;
  poster_path?: string;
  backdrop_path?: string;
  runtime?: number;
}

export interface TMDBMatch {
  id: number;
  type: 'tv' | 'movie';
  displayName: string;
  originalName: string;
  year: number;
  imdbId?: string;
  overview: string;
  posterUrl?: string;
}

export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
