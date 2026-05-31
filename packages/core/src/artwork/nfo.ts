import type { TMDBMatch } from '../types/tmdb.js';
import type { TMDBMovieDetails, TMDBTvDetails, TMDBEpisode } from '../types/tmdb.js';

function esc(s: string | number | undefined | null): string {
  if (s === undefined || s === null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function tag(name: string, value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === '') return '';
  return `  <${name}>${esc(value)}</${name}>\n`;
}

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

export function generateMovieNfo(match: TMDBMatch, details: TMDBMovieDetails): string {
  const genres = (details.genres ?? []).map((g) => tag('genre', g.name)).join('');
  const studios = (details.production_companies ?? [])
    .slice(0, 3)
    .map((c) => tag('studio', c.name))
    .join('');

  const imdbId = match.imdbId
    ? `  <uniqueid type="imdb" default="true">${esc(match.imdbId)}</uniqueid>\n`
    : '';
  const tmdbId = `  <uniqueid type="tmdb"${!match.imdbId ? ' default="true"' : ''}>${match.id}</uniqueid>\n`;

  return (
    XML_HEADER +
    '<movie>\n' +
    tag('title', match.displayName) +
    tag('originaltitle', match.originalName) +
    tag('year', match.year) +
    tag('premiered', details.release_date) +
    tag('plot', match.overview) +
    tag('tagline', details.tagline) +
    tag('runtime', details.runtime) +
    tag('rating', details.vote_average?.toFixed(1)) +
    tag('votes', details.vote_count) +
    genres +
    studios +
    imdbId +
    tmdbId +
    '</movie>\n'
  );
}

export function generateTvShowNfo(match: TMDBMatch, details: TMDBTvDetails): string {
  const genres = (details.genres ?? []).map((g) => tag('genre', g.name)).join('');
  const studios = (details.networks ?? [])
    .slice(0, 3)
    .map((n) => tag('studio', n.name))
    .join('');

  const tmdbId = `  <uniqueid type="tmdb" default="true">${match.id}</uniqueid>\n`;

  return (
    XML_HEADER +
    '<tvshow>\n' +
    tag('title', match.displayName) +
    tag('originaltitle', match.originalName) +
    tag('year', match.year) +
    tag('premiered', details.first_air_date) +
    tag('plot', match.overview) +
    tag('rating', details.vote_average?.toFixed(1)) +
    tag('votes', details.vote_count) +
    tag('status', details.status) +
    genres +
    studios +
    tmdbId +
    '</tvshow>\n'
  );
}

export function generateEpisodeNfo(
  episode: TMDBEpisode,
  seasonNumber: number,
): string {
  return (
    XML_HEADER +
    '<episodedetails>\n' +
    tag('title', episode.name) +
    tag('season', seasonNumber) +
    tag('episode', episode.episode_number) +
    tag('aired', episode.air_date) +
    tag('plot', episode.overview) +
    tag('rating', episode.vote_average?.toFixed(1)) +
    `  <uniqueid type="tmdb" default="true">${episode.id}</uniqueid>\n` +
    '</episodedetails>\n'
  );
}
