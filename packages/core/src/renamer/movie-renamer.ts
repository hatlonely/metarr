import { join } from 'node:path';
import type { ParsedMedia, RenameOptions, RenamePlan, RenameTask, MediaType } from '../types/index.js';
import type { TMDBMatch } from '../types/tmdb.js';

/**
 * Generate a rename plan for a movie.
 */
export function generateMovieRenamePlan(
  parsed: ParsedMedia,
  tmdbMatch: TMDBMatch,
  options: RenameOptions,
): RenamePlan {
  const tasks: RenameTask[] = [];
  const movieName = tmdbMatch.displayName || tmdbMatch.originalName;
  const year = tmdbMatch.year;

  // Determine ID tag: prefer imdbid, fallback to tmdbid
  const idTag =
    options.preferImdbId && tmdbMatch.imdbId
      ? `[imdbid-${tmdbMatch.imdbId}]`
      : `[tmdbid-${tmdbMatch.id}]`;

  const newDirName = `${movieName} (${year}) ${idTag}`;
  const newDirPath = join(options.destPath, newDirName);

  tasks.push({
    operation: 'create-dir',
    source: '',
    target: newDirPath,
    description: `创建目录 ${newDirName}`,
  });

  // Rename the main video file
  const mainVideo = parsed.episodes[0];
  if (mainVideo) {
    const newFileName = `${movieName} (${year}) ${idTag}${mainVideo.extension}`;
    tasks.push({
      operation: 'rename',
      source: join(parsed.sourcePath, mainVideo.originalFileName),
      target: join(newDirPath, newFileName),
      description: `${mainVideo.originalFileName} -> ${newFileName}`,
    });

    // Rename associated subtitle files
    for (const assocFile of mainVideo.associatedFiles) {
      const newSubFileName = replaceBaseName(assocFile, mainVideo.originalFileName, newFileName);
      tasks.push({
        operation: 'rename',
        source: join(parsed.sourcePath, assocFile),
        target: join(newDirPath, newSubFileName),
        description: `${assocFile} -> ${newSubFileName}`,
      });
    }
  }

  return {
    mediaType: 'movie' as MediaType,
    tmdbMatch,
    sourcePath: parsed.sourcePath,
    destPath: options.destPath,
    tasks,
    summary: `电影 "${movieName}"`,
  };
}

function replaceBaseName(
  fileName: string,
  oldVideoName: string,
  newVideoName: string,
): string {
  const oldBase = oldVideoName.replace(/\.[^.]+$/, '');
  const newBase = newVideoName.replace(/\.[^.]+$/, '');
  const ext = fileName.match(/\.[^.]+$/)?.[0] || '';
  const withoutExt = fileName.slice(0, -ext.length);
  const suffix = withoutExt.replace(oldBase, '');
  return newBase + suffix + ext;
}
