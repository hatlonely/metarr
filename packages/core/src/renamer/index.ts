import { generateTvRenamePlan } from './tv-renamer.js';
import { generateMovieRenamePlan } from './movie-renamer.js';
import type { ParsedMedia, RenameOptions, RenamePlan, TMDBMatch } from '../types/index.js';

export { executeRenamePlan } from './executor.js';
export { checkConflicts } from './conflict-checker.js';
export { findUnmatchedFiles } from './unmatched-finder.js';
export { NAMING_PRESETS, DEFAULT_NAMING_PRESET, resolveNamingTemplate } from './naming.js';

export function generateRenamePlan(
  parsed: ParsedMedia,
  tmdbMatch: TMDBMatch,
  options: RenameOptions,
): RenamePlan {
  return tmdbMatch.type === 'tv'
    ? generateTvRenamePlan(parsed, tmdbMatch, options)
    : generateMovieRenamePlan(parsed, tmdbMatch, options);
}
