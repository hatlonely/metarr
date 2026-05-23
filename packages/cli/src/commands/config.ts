import { setConfig, getAllConfig, CONFIG_FILE, type MetarrConfig } from '@metarr/core';
import chalk from 'chalk';

const CONFIG_KEYS: (keyof MetarrConfig)[] = ['tmdbKey', 'destPath', 'displayLanguage', 'preferImdbId'];

const KEY_DESCRIPTIONS: Record<string, string> = {
  tmdbKey: 'TMDB API Key',
  destPath: '默认目标目录',
  displayLanguage: '展示语言 (zh-CN/en-US)',
  preferImdbId: '电影优先使用 IMDB ID (true/false)',
};

export async function configSetAction(key: string, value: string): Promise<void> {
  const k = key as keyof MetarrConfig;
  if (!CONFIG_KEYS.includes(k)) {
    console.error(chalk.red(`未知配置项: ${key}`));
    console.error(chalk.gray(`可选配置项: ${CONFIG_KEYS.join(', ')}`));
    process.exit(1);
  }

  const typedValue: MetarrConfig[keyof MetarrConfig] =
    k === 'preferImdbId' ? value === 'true' : value;

  setConfig(k, typedValue as never);
  console.log(chalk.green(`已设置 ${KEY_DESCRIPTIONS[k]}: ${maskSecret(k, value)}`));
  console.log(chalk.gray(`配置文件: ${CONFIG_FILE}`));
}

export async function configAction(): Promise<void> {
  const config = getAllConfig();

  console.log(chalk.bold('Metarr 配置'));
  console.log(chalk.gray(`配置文件: ${CONFIG_FILE}`));
  console.log();

  if (Object.keys(config).length === 0) {
    console.log(chalk.yellow('  (空 - 使用 metarr config set <key> <value> 配置)'));
    console.log();
    console.log(chalk.bold('可配置项:'));
    for (const k of CONFIG_KEYS) {
      console.log(`  ${chalk.cyan(k.padEnd(15))} ${KEY_DESCRIPTIONS[k]}`);
    }
    return;
  }

  for (const k of CONFIG_KEYS) {
    const v = config[k];
    if (v !== undefined) {
      const display = k === 'tmdbKey' ? '****' + String(v).slice(-4) : String(v);
      console.log(`  ${chalk.cyan(k.padEnd(15))} ${display}`);
    }
  }
}

function maskSecret(key: string, value: string): string {
  if (key === 'tmdbKey' && value.length > 8) {
    return '****' + value.slice(-4);
  }
  return value;
}
