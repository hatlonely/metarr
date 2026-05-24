import { join } from 'node:path';
import type {
  ParsedMedia,
  RenameOptions,
  RenamePlan,
  RenameTask,
  MediaType,
} from '../types/index.js';
import type { TMDBMatch } from '../types/tmdb.js';

/**
 * Generate a rename plan for a TV show.
 */
export function generateTvRenamePlan(
  parsed: ParsedMedia,
  tmdbMatch: TMDBMatch,
  options: RenameOptions,
): RenamePlan {
  const tasks: RenameTask[] = [];
  const showName = tmdbMatch.displayName || tmdbMatch.originalName;
  const year = tmdbMatch.year;
  const newDirName = `${showName} (${year}) [tmdbid-${tmdbMatch.id}]`;
  const newDirPath = join(options.destPath, newDirName);

  // Create root directory
  tasks.push({
    operation: 'create-dir',
    source: '',
    target: newDirPath,
    description: `创建目录 ${newDirName}`,
  });

  // Group episodes by season, skip entries without episode numbers
  const validEpisodes = parsed.episodes.filter((ep) => ep.episodes.length > 0);
  const episodesBySeason = groupBySeason(validEpisodes);

  for (const [seasonNum, episodes] of episodesBySeason) {
    const seasonDirName = `Season ${String(seasonNum).padStart(2, '0')}`;
    const seasonDirPath = join(newDirPath, seasonDirName);

    tasks.push({
      operation: 'create-dir',
      source: '',
      target: seasonDirPath,
      description: `创建目录 ${seasonDirName}`,
    });

    for (const ep of episodes) {
      // Rename video file
      const newFileName = formatEpisodeFileName(showName, year, ep);
      const newFilePath = join(seasonDirPath, newFileName);

      tasks.push({
        operation: 'rename',
        source: join(parsed.sourcePath, ep.originalFileName),
        target: newFilePath,
        description: `${ep.originalFileName} -> ${newFileName}`,
      });

      // Rename associated subtitle files
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
    summary: { name: showName, mediaType: 'tv' as MediaType, fileCount: validEpisodes.length },
  };
}

function formatEpisodeFileName(
  showName: string,
  year: number,
  ep: { season: number; episodes: number[]; extension: string },
): string {
  const s = String(ep.season).padStart(2, '0');
  const e = String(ep.episodes[0]).padStart(2, '0');
  return `${showName} (${year}) S${s}E${e}${ep.extension}`;
}

function groupBySeason(episodes: ParsedMedia['episodes']): Map<number, ParsedMedia['episodes']> {
  const map = new Map<number, ParsedMedia['episodes']>();
  for (const ep of episodes) {
    const season = ep.season || 1;
    if (!map.has(season)) {
      map.set(season, []);
    }
    map.get(season)!.push(ep);
  }
  // Sort episodes within each season
  for (const eps of map.values()) {
    eps.sort((a, b) => a.episodes[0] - b.episodes[0]);
  }
  return map;
}

function replaceBaseName(fileName: string, oldVideoName: string, newVideoName: string): string {
  const oldBase = oldVideoName.replace(/\.[^.]+$/, '');
  const newBase = newVideoName.replace(/\.[^.]+$/, '');

  // Handle subtitle files like "video.zh.srt" or "video.en.ass"
  const ext = fileName.match(/\.[^.]+$/)?.[0] || '';
  const withoutExt = fileName.slice(0, -ext.length);
  const suffix = withoutExt.replace(oldBase, '');

  return newBase + suffix + ext;
}
