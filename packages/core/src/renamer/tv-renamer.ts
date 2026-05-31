import { join } from 'node:path';
import type { ParsedMedia, RenameOptions, RenamePlan, RenameTask, MediaType } from '../types/index.js';
import type { TMDBMatch } from '../types/tmdb.js';
import { resolveNamingTemplate, renderTemplate } from './naming.js';

/**
 * Generate a rename plan for a TV show.
 */
export function generateTvRenamePlan(
  parsed: ParsedMedia,
  tmdbMatch: TMDBMatch,
  options: RenameOptions,
): RenamePlan {
  const tasks: RenameTask[] = [];
  const template = resolveNamingTemplate(options.namingPreset);

  const name = tmdbMatch.displayName || tmdbMatch.originalName;
  const { year, id: tmdbId, imdbId } = tmdbMatch;
  const idTag =
    options.preferImdbId && imdbId ? `[imdbid-${imdbId}]` : `[tmdbid-${tmdbId}]`;

  const baseVars = { name, year, tmdbId, imdbId, idTag };

  const newDirName = renderTemplate(template.tvDir, baseVars);
  const newDirPath = join(options.destPath, newDirName);

  tasks.push({
    operation: 'create-dir',
    source: '',
    target: newDirPath,
    description: `创建目录 ${newDirName}`,
  });

  const validEpisodes = parsed.episodes.filter((ep) => ep.episodes.length > 0);
  const episodesBySeason = groupBySeason(validEpisodes);

  for (const [seasonNum, episodes] of episodesBySeason) {
    const seasonDirName = renderTemplate(template.seasonDir, { season: seasonNum });
    const seasonDirPath = join(newDirPath, seasonDirName);

    tasks.push({
      operation: 'create-dir',
      source: '',
      target: seasonDirPath,
      description: `创建目录 ${seasonDirName}`,
    });

    for (const ep of episodes) {
      const newFileName = renderTemplate(template.episodeFile, {
        ...baseVars,
        season: ep.season,
        episode: ep.episodes[0],
        ext: ep.extension,
      });
      const newFilePath = join(seasonDirPath, newFileName);

      tasks.push({
        operation: 'rename',
        source: join(parsed.sourcePath, ep.originalFileName),
        target: newFilePath,
        description: `${ep.originalFileName} -> ${newFileName}`,
      });

      for (const assocFile of ep.associatedFiles) {
        const newSubFileName = replaceBaseName(assocFile, ep.originalFileName, newFileName);
        tasks.push({
          operation: 'rename',
          source: join(parsed.sourcePath, assocFile),
          target: join(seasonDirPath, newSubFileName),
          description: `${assocFile} -> ${newSubFileName}`,
        });
      }
    }
  }

  return {
    mediaType: 'tv' as MediaType,
    tmdbMatch,
    sourcePath: parsed.sourcePath,
    destPath: options.destPath,
    tasks,
    summary: { name, mediaType: 'tv' as MediaType, fileCount: validEpisodes.length },
  };
}

function groupBySeason(episodes: ParsedMedia['episodes']): Map<number, ParsedMedia['episodes']> {
  const map = new Map<number, ParsedMedia['episodes']>();
  for (const ep of episodes) {
    const season = ep.season || 1;
    if (!map.has(season)) map.set(season, []);
    map.get(season)!.push(ep);
  }
  for (const eps of map.values()) {
    eps.sort((a, b) => a.episodes[0] - b.episodes[0]);
  }
  return map;
}

function replaceBaseName(fileName: string, oldVideoName: string, newVideoName: string): string {
  const oldBase = oldVideoName.replace(/\.[^.]+$/, '');
  const newBase = newVideoName.replace(/\.[^.]+$/, '');
  const ext = fileName.match(/\.[^.]+$/)?.[0] || '';
  const withoutExt = fileName.slice(0, -ext.length);
  const suffix = withoutExt.replace(oldBase, '');
  return newBase + suffix + ext;
}
