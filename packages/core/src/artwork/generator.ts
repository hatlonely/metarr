import { join, basename } from 'node:path';
import type { TMDBMatch } from '../types/tmdb.js';
import type { RenameOptions, RenamePlan } from '../types/renamer.js';
import type { TMDBClient } from '../tmdb/client.js';
import { resolveNamingTemplate, renderTemplate } from '../renamer/naming.js';
import { generateMovieNfo, generateTvShowNfo, generateEpisodeNfo } from './nfo.js';
import type { ArtworkTask, NfoTask, MetadataTask, ArtworkPlan } from './types.js';

const TMDB_BASE = 'https://image.tmdb.org/t/p';

function imgUrl(path: string, size: 'w342' | 'w500' | 'w780' | 'w1280'): string {
  return `${TMDB_BASE}/${size}${path}`;
}

/** Replace the w500 preview size with a higher-res download size */
function toDownloadUrl(previewUrl: string, size: 'w780' | 'w1280'): string {
  return previewUrl.replace(/\/t\/p\/[^/]+\//, `/t/p/${size}/`);
}

/** Parse season/episode numbers from a source filename like "Show.S01E03.mkv" */
function parseSE(fileName: string): { season: number; episode: number } | null {
  const m = fileName.match(/[Ss](\d{1,2})[Ee](\d{1,2})/);
  if (!m) return null;
  return { season: parseInt(m[1], 10), episode: parseInt(m[2], 10) };
}

export async function generateArtworkPlan(
  tmdbMatch: TMDBMatch,
  options: RenameOptions,
  client: TMDBClient,
  plan?: RenamePlan,
): Promise<ArtworkPlan> {
  const template = options.namingTemplate ?? resolveNamingTemplate(options.namingPreset);
  const posterFile = template.posterFile ?? 'poster.jpg';
  const fanartFile = template.fanartFile ?? 'fanart.jpg';
  const nfoFile = template.nfoFile ?? 'movie.nfo';

  const name = tmdbMatch.displayName || tmdbMatch.originalName;
  const { year, id: tmdbId, imdbId } = tmdbMatch;
  const idTag = imdbId ? `[imdbid-${imdbId}]` : `[tmdbid-${tmdbId}]`;
  const baseVars = { name, year, tmdbId, imdbId, idTag };

  const tasks: MetadataTask[] = [];

  if (tmdbMatch.type === 'movie') {
    const mediaDirPath = join(options.destPath, renderTemplate(template.movieDir, baseVars));

    if (tmdbMatch.posterUrl) {
      tasks.push({
        kind: 'image', type: 'poster',
        downloadUrl: toDownloadUrl(tmdbMatch.posterUrl, 'w780'),
        previewUrl: tmdbMatch.posterUrl,
        targetPath: join(mediaDirPath, renderTemplate(posterFile, baseVars)),
        description: `${name} 海报`,
      });
    }
    if (tmdbMatch.backdropUrl) {
      tasks.push({
        kind: 'image', type: 'fanart',
        downloadUrl: toDownloadUrl(tmdbMatch.backdropUrl, 'w1280'),
        previewUrl: tmdbMatch.backdropUrl,
        targetPath: join(mediaDirPath, renderTemplate(fanartFile, baseVars)),
        description: `${name} 背景图`,
      });
    }

    // Movie NFO — use getMovieDetails (already has genres, studios, etc.)
    const movieDetails = await client.getMovieDetails(tmdbMatch.id);
    const nfoContent = generateMovieNfo(tmdbMatch, movieDetails);
    tasks.push({
      kind: 'nfo', type: 'movie',
      content: nfoContent,
      targetPath: join(mediaDirPath, renderTemplate(nfoFile, baseVars)),
      description: `${name} NFO`,
    });
  } else {
    // TV show
    const showDirPath = join(options.destPath, renderTemplate(template.tvDir, baseVars));

    if (tmdbMatch.posterUrl) {
      tasks.push({
        kind: 'image', type: 'poster',
        downloadUrl: toDownloadUrl(tmdbMatch.posterUrl, 'w780'),
        previewUrl: tmdbMatch.posterUrl,
        targetPath: join(showDirPath, renderTemplate(posterFile, baseVars)),
        description: `${name} 海报`,
      });
    }

    // TV details — backdrop, season posters, genres/networks for NFO
    const tvDetails = await client.getTvDetails(tmdbMatch.id);

    if (tvDetails.backdrop_path) {
      tasks.push({
        kind: 'image', type: 'fanart',
        downloadUrl: imgUrl(tvDetails.backdrop_path, 'w1280'),
        previewUrl: imgUrl(tvDetails.backdrop_path, 'w500'),
        targetPath: join(showDirPath, renderTemplate(fanartFile, baseVars)),
        description: `${name} 背景图`,
      });
    }

    // TV show NFO
    const tvNfoContent = generateTvShowNfo(tmdbMatch, tvDetails);
    tasks.push({
      kind: 'nfo', type: 'tvshow',
      content: tvNfoContent,
      targetPath: join(showDirPath, 'tvshow.nfo'),
      description: `${name} NFO`,
    });

    // Season posters
    for (const season of tvDetails.seasons) {
      if (!season.poster_path || season.season_number === 0) continue;
      const seasonDirPath = join(showDirPath, renderTemplate(template.seasonDir, { season: season.season_number }));
      tasks.push({
        kind: 'image', type: 'season-poster',
        downloadUrl: imgUrl(season.poster_path, 'w780'),
        previewUrl: imgUrl(season.poster_path, 'w342'),
        targetPath: join(seasonDirPath, renderTemplate(posterFile, { ...baseVars, season: season.season_number })),
        description: `第 ${season.season_number} 季海报`,
      });
    }

    // Episode-level: thumbnails + NFO — one getSeasonDetails call per season in plan
    if (plan) {
      const renameTasks = plan.tasks.filter((t) => t.operation === 'rename');
      const seasonNumbers = new Set<number>();
      for (const t of renameTasks) {
        const se = parseSE(basename(t.source));
        if (se) seasonNumbers.add(se.season);
      }

      for (const seasonNum of seasonNumbers) {
        const seasonDirPath = join(showDirPath, renderTemplate(template.seasonDir, { season: seasonNum }));
        let seasonDetail;
        try {
          seasonDetail = await client.getSeasonDetails(tmdbMatch.id, seasonNum);
        } catch {
          continue;
        }

        for (const episode of seasonDetail.episodes) {
          const episodeTask = renameTasks.find((t) => {
            const se = parseSE(basename(t.source));
            return se?.season === seasonNum && se?.episode === episode.episode_number;
          });
          if (!episodeTask) continue;

          // Episode thumbnail
          if (episode.still_path) {
            const videoFileName = basename(episodeTask.target);
            const thumbFileName = videoFileName.replace(/\.[^.]+$/, '-thumb.jpg');
            tasks.push({
              kind: 'image', type: 'episode-thumb',
              downloadUrl: imgUrl(episode.still_path, 'w780'),
              previewUrl: imgUrl(episode.still_path, 'w342'),
              targetPath: join(seasonDirPath, thumbFileName),
              description: `S${String(seasonNum).padStart(2, '0')}E${String(episode.episode_number).padStart(2, '0')} 缩略图`,
            });
          }

          // Episode NFO
          const nfoContent = generateEpisodeNfo(episode, seasonNum);
          const videoFileName = basename(episodeTask.target);
          const nfoFileName = videoFileName.replace(/\.[^.]+$/, '.nfo');
          tasks.push({
            kind: 'nfo', type: 'episode',
            content: nfoContent,
            targetPath: join(seasonDirPath, nfoFileName),
            description: `S${String(seasonNum).padStart(2, '0')}E${String(episode.episode_number).padStart(2, '0')} NFO`,
          });
        }
      }
    }
  }

  return { tasks };
}
