#!/usr/bin/env node
import { Command } from 'commander';
import { renameAction } from './commands/rename.js';

const program = new Command();

program
  .name('metarr')
  .description('Media file renaming tool for Jellyfin-compatible naming conventions')
  .version('0.1.0');

program
  .command('rename <source>')
  .description('Rename a TV show or movie directory')
  .option('-d, --dest <path>', 'Target parent directory', process.cwd())
  .option('-t, --type <type>', 'Media type: tv, movie, or auto', 'auto')
  .option('--dry-run', 'Preview rename plan without executing', false)
  .option('--tmdb-key <key>', 'TMDB API key (or set METARR_TMDB_KEY env var)')
  .option('--lang <lang>', 'Preferred title language: zh or en', 'zh')
  .option('--no-imdb', 'Do not prefer IMDB ID for movies')
  .action(renameAction);

program.parse();
