import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import type { NamingTemplate } from './renamer/naming.js';

const CONFIG_DIR = join(homedir(), '.metarr');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export interface MetarrConfig {
  tmdbKey?: string;
  destPath?: string;
  displayLanguage?: string;
  preferImdbId?: boolean;
  namingPreset?: string;
  namingTemplate?: NamingTemplate;
  subdlApiKey?: string;
  assrtToken?: string;
  subtitleLanguages?: string[];
  /** Optional same-volume trash directory; empty = smart per-volume default. */
  trashDir?: string;
  /** Keep at most this many history entries (default 1000). */
  historyMaxEntries?: number;
  /** Drop history entries older than this many days (default 365). */
  historyMaxAgeDays?: number;
  /** Per-run batch execution option defaults (see BatchOptions). */
  batchOptions?: Record<string, unknown>;
  /** Keep at most this many cached scans (default 50). */
  batchCacheMaxEntries?: number;
  /** Drop cached scans older than this many days (default 30). */
  batchCacheMaxAgeDays?: number;
}

function readConfigFile(): MetarrConfig {
  if (!existsSync(CONFIG_FILE)) {
    return {};
  }
  try {
    const content = readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(content) as MetarrConfig;
  } catch {
    return {};
  }
}

function writeConfigFile(config: MetarrConfig): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

/**
 * Get TMDB API key with priority: explicit param > env var > config file
 */
export function getTmdbKey(explicitKey?: string): string | undefined {
  return explicitKey || process.env.METARR_TMDB_KEY || readConfigFile().tmdbKey;
}

/**
 * Get config value, with priority: explicit param > config file > default
 */
export function getConfig<K extends keyof MetarrConfig>(
  key: K,
  explicitValue?: MetarrConfig[K],
): MetarrConfig[K] | undefined {
  if (explicitValue !== undefined) return explicitValue;
  return readConfigFile()[key];
}

/**
 * Set a config value in the config file.
 */
export function setConfig<K extends keyof MetarrConfig>(key: K, value: MetarrConfig[K]): void {
  const config = readConfigFile();
  config[key] = value;
  writeConfigFile(config);
}

/**
 * Get all config values.
 */
export function getAllConfig(): MetarrConfig {
  return readConfigFile();
}

export { CONFIG_FILE, CONFIG_DIR };
