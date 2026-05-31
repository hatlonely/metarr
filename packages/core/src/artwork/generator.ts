import { join } from 'node:path';
import type { TMDBMatch } from '../types/tmdb.js';
import type { RenameOptions } from '../types/renamer.js';
import type { TMDBClient } from '../tmdb/client.js';
import { resolveNamingTemplate, renderTemplate } from '../renamer/naming.js';
import type { ArtworkTask, ArtworkPlan } from './types.js';

const TMDB_BASE = 'https://image.tmdb.org/t/p';

function posterDownloadUrl(previewUrl: string): string {
  return previewUrl.replace(`${TMDB_BASE}/w500/`, `${TMDB_BASE}/w780/`);
}

function backdropDownloadUrl(previewUrl: string): string {
  return previewUrl.replace(`${TMDB_BASE}/w500/`, `${TMDB_BASE}/w1280/`);
}

function seasonImageUrl(path: string, size: 'w342' | 'w780' | 'w1280'): string {
  return `${TMDB_BASE}/${size}${path}`;
}

export async function generateArtworkPlan(
  tmdbMatch: TMDBMatch,
  options: RenameOptions,
  client: TMDBClient,
): Promise<ArtworkPlan> {
  const template = options.namingTemplate ?? resolveNamingTemplate(options.namingPreset);
  const posterFile = template.posterFile ?? 'poster.jpg';
  const fanartFile = template.fanartFile ?? 'fanart.jpg';

  const name = tmdbMatch.displayName || tmdbMatch.originalName;
  const { year, id: tmdbId, imdbId } = tmdbMatch;
  const idTag = imdbId ? `[imdbid-${imdbId}]` : `[tmdbid-${tmdbId}]`;
  const baseVars = { name, year, tmdbId, imdbId, idTag };

  const tasks: ArtworkTask[] = [];

  if (tmdbMatch.type === 'movie') {
    const mediaDirPath = join(options.destPath, renderTemplate(template.movieDir, baseVars));

    if (tmdbMatch.posterUrl) {
      tasks.push({
        type: 'poster',
        downloadUrl: posterDownloadUrl(tmdbMatch.posterUrl),
        previewUrl: tmdbMatch.posterUrl,
        targetPath: join(mediaDirPath, renderTemplate(posterFile, baseVars)),
        description: `${name} 海报`,
      });
    }

    if (tmdbMatch.backdropUrl) {
      tasks.push({
        type: 'fanart',
        downloadUrl: backdropDownloadUrl(tmdbMatch.backdropUrl),
        previewUrl: tmdbMatch.backdropUrl,
        targetPath: join(mediaDirPath, renderTemplate(fanartFile, baseVars)),
        description: `${name} 背景图`,
      });
    }
  } else {
    // TV show
    const showDirPath = join(options.destPath, renderTemplate(template.tvDir, baseVars));

    if (tmdbMatch.posterUrl) {
      tasks.push({
        type: 'poster',
        downloadUrl: posterDownloadUrl(tmdbMatch.posterUrl),
        previewUrl: tmdbMatch.posterUrl,
        targetPath: join(showDirPath, renderTemplate(posterFile, baseVars)),
        description: `${name} 海报`,
      });
    }

    // Fetch TV details for backdrop + season posters
    const tvDetails = await client.getTvDetails(tmdbMatch.id);

    if (tvDetails.backdrop_path) {
      const previewUrl = seasonImageUrl(tvDetails.backdrop_path, 'w342');
      tasks.push({
        type: 'fanart',
        downloadUrl: seasonImageUrl(tvDetails.backdrop_path, 'w1280'),
        previewUrl,
        targetPath: join(showDirPath, renderTemplate(fanartFile, baseVars)),
        description: `${name} 背景图`,
      });
    }

    for (const season of tvDetails.seasons) {
      if (!season.poster_path || season.season_number === 0) continue;

      const seasonDirPath = join(
        showDirPath,
        renderTemplate(template.seasonDir, { season: season.season_number }),
      );
      tasks.push({
        type: 'season-poster',
        downloadUrl: seasonImageUrl(season.poster_path, 'w780'),
        previewUrl: seasonImageUrl(season.poster_path, 'w342'),
        targetPath: join(seasonDirPath, renderTemplate(posterFile, { ...baseVars, season: season.season_number })),
        description: `第 ${season.season_number} 季海报`,
      });
    }
  }

  return { tasks };
}
