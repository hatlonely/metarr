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
