'use client';

import { useState, useEffect } from 'react';
import { NavRail, type AppView } from './nav-rail';
import { useConfig } from '@/src/renderer/hooks/use-config';
import type { AppConfig } from '@/src/renderer/hooks/use-config';
import { RenamePage } from '@/src/renderer/components/pages/rename-page';
import { BatchPage } from '@/src/renderer/components/pages/batch-page';
import { HistoryPage } from '@/src/renderer/components/pages/history-page';
import { SettingsPage } from '@/src/renderer/components/pages/settings-page';

export function AppShell() {
  const { config, setConfig, showSettings } = useConfig();
  const [activeView, setActiveView] = useState<AppView>('rename');

  // First launch with no TMDB key → land on Settings so the user can configure.
  useEffect(() => {
    if (showSettings) setActiveView('settings');
  }, [showSettings]);

  const locale = config.displayLanguage.startsWith('zh') ? 'zh' : 'en';

  const handleSaveConfig = (updates: Partial<AppConfig>) => {
    setConfig(updates);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <NavRail
        activeView={activeView}
        onNavigate={setActiveView}
        onToggleLanguage={() =>
          setConfig({ displayLanguage: config.displayLanguage.startsWith('zh') ? 'en-US' : 'zh-CN' })
        }
        locale={locale}
      />
      <div className="relative min-w-0 flex-1">
        {activeView === 'rename' && <RenamePage config={config} locale={locale} />}
        {activeView === 'batch' && <BatchPage locale={locale} />}
        {activeView === 'history' && <HistoryPage locale={locale} />}
        {activeView === 'settings' && (
          <SettingsPage config={config} onSave={handleSaveConfig} locale={locale} />
        )}
      </div>
    </div>
  );
}
