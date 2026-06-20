import { Command } from 'commander';
import { renameAction } from './commands/rename.js';
import { configAction, configSetAction } from './commands/config.js';
import { historyListAction, historyUndoAction } from './commands/history.js';

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
  .option('--lang <lang>', 'Override display language: zh or en')
  .option('--no-imdb', 'Do not prefer IMDB ID for movies')
  .action(renameAction);

const historyCmd = program
  .command('history')
  .description('List past rename runs')
  .action(historyListAction);

historyCmd
  .command('undo <id>')
  .description('Undo a past rename run (restore files to their original location)')
  .action(historyUndoAction);

const configCmd = program.command('config').description('Manage configuration');

configCmd
  .command('set <key> <value>')
  .description('Set a config value (e.g., tmdbKey, destPath, lang)')
  .action(configSetAction);

configCmd.command('show').description('Show current configuration').action(configAction);

program.parse();
