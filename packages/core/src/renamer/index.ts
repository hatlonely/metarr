import { dirname } from 'node:path';
import { generateTvRenamePlan } from './tv-renamer.js';
import { generateMovieRenamePlan } from './movie-renamer.js';
import type { ParsedMedia, RenameOptions, RenamePlan, TMDBMatch } from '../types/index.js';

export { executeRenamePlan } from './executor.js';
export type { ExecuteOptions } from './executor.js';
export { createTrashFn, moveToTrashDir, sameVolume, volumeRoot, defaultTrashDir } from './trash.js';
export type { CreateTrashOptions } from './trash.js';
export { checkConflicts } from './conflict-checker.js';
export { findUnmatchedFiles } from './unmatched-finder.js';
export { NAMING_PRESETS, DEFAULT_NAMING_PRESET, resolveNamingTemplate } from './naming.js';
export {
  MUSIC_NAMING_PRESETS,
  DEFAULT_MUSIC_PRESET,
  resolveMusicNamingTemplate,
} from './naming.js';
export type { MusicNamingTemplate } from './naming.js';
export { generateMusicRenamePlan } from './music-renamer.js';
export type { MusicRenameOptions } from './music-renamer.js';

/**
 * Default output location when none is configured: put the renamed result next
 * to the source — a file's containing directory, or the parent of a source
 * folder (so the new folder sits alongside the original, not nested inside it).
 */
function defaultDestPath(parsed: ParsedMedia): string {
  return parsed.selectedFile ? parsed.sourcePath : dirname(parsed.sourcePath);
}

export function generateRenamePlan(
  parsed: ParsedMedia,
  tmdbMatch: TMDBMatch,
  options: RenameOptions,
): RenamePlan {
  const destPath = options.destPath?.trim() ? options.destPath : defaultDestPath(parsed);
  const opts = destPath === options.destPath ? options : { ...options, destPath };
  return tmdbMatch.type === 'tv'
    ? generateTvRenamePlan(parsed, tmdbMatch, opts)
    : generateMovieRenamePlan(parsed, tmdbMatch, opts);
}
