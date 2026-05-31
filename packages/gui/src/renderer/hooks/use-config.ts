'use client';

import { useState, useEffect, useCallback } from 'react';
import { ipc } from '@/src/renderer/lib/ipc';

export interface AppConfig {
  tmdbKey: string;
  destPath: string;
  displayLanguage: string;
  preferImdbId: boolean;
  namingPreset: string;
}

const defaultConfig: AppConfig = {
  tmdbKey: '',
  destPath: '',
  displayLanguage: 'zh-CN',
  preferImdbId: true,
  namingPreset: 'universal',
};

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
          await ipc.setConfig(key, value);
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
