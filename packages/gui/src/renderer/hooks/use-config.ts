'use client';

import { useState, useEffect, useCallback } from 'react';
import { ipc } from '@/src/renderer/lib/ipc';
import type { NamingTemplate } from '@metarr/core';

export interface AppConfig {
  tmdbKey: string;
  destPath: string;
  displayLanguage: string;
  preferImdbId: boolean;
  namingPreset: string;
  customNamingTemplate: NamingTemplate;
  subdlApiKey: string;
  assrtToken: string;
  subtitleLanguages: string[];
}

export const DEFAULT_CUSTOM_NAMING_TEMPLATE: NamingTemplate = {
  tvDir: '{name} ({year})',
  seasonDir: 'Season {season:02}',
  episodeFile: '{name} S{season:02}E{episode:02}{ext}',
  movieDir: '{name} ({year})',
  movieFile: '{name} ({year}){ext}',
};

const defaultConfig: AppConfig = {
  tmdbKey: '',
  destPath: '',
  displayLanguage: 'zh-CN',
  preferImdbId: true,
  namingPreset: 'universal',
  customNamingTemplate: DEFAULT_CUSTOM_NAMING_TEMPLATE,
  subdlApiKey: '',
  assrtToken: '',
  subtitleLanguages: ['zh', 'en'],
};

function parseNamingTemplate(raw: unknown): NamingTemplate | null {
  if (!raw || typeof raw !== 'object') return null;
  const t = raw as Record<string, unknown>;
  if (
    typeof t.tvDir === 'string' &&
    typeof t.seasonDir === 'string' &&
    typeof t.episodeFile === 'string' &&
    typeof t.movieDir === 'string' &&
    typeof t.movieFile === 'string'
  ) {
    return t as unknown as NamingTemplate;
  }
  return null;
}

export function useConfig() {
  const [config, setConfigState] = useState<AppConfig>(defaultConfig);
  const [loaded, setLoaded] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      const raw = await ipc.getConfig();
      setConfigState({
        tmdbKey: (raw.tmdbKey as string) || '',
        destPath: (raw.destPath as string) || '',
        displayLanguage: (raw.displayLanguage as string) || 'zh-CN',
        preferImdbId: raw.preferImdbId !== undefined ? (raw.preferImdbId as boolean) : true,
        namingPreset: (raw.namingPreset as string) || 'universal',
        customNamingTemplate:
          parseNamingTemplate(raw.namingTemplate) ?? DEFAULT_CUSTOM_NAMING_TEMPLATE,
        subdlApiKey: (raw.subdlApiKey as string) || '',
        assrtToken: (raw.assrtToken as string) || '',
        subtitleLanguages: Array.isArray(raw.subtitleLanguages)
          ? (raw.subtitleLanguages as string[])
          : ['zh', 'en'],
      });
    } catch {
      // Use defaults if IPC not available (dev mode)
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const setConfig = useCallback(
    async (updates: Partial<AppConfig>) => {
      const newConfig = { ...config, ...updates };
      setConfigState(newConfig);

      try {
        for (const [key, value] of Object.entries(updates)) {
          // customNamingTemplate maps to core's namingTemplate key
          const configKey = key === 'customNamingTemplate' ? 'namingTemplate' : key;
          await ipc.setConfig(configKey, value);
        }
      } catch {
        // Ignore in dev mode
      }
    },
    [config],
  );

  const showSettings = loaded && !config.tmdbKey;

  return { config, loaded, setConfig, showSettings };
}
