'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/src/renderer/components/ui/input';
import { Label } from '@/src/renderer/components/ui/label';
import { Button } from '@/src/renderer/components/ui/button';
import { Separator } from '@/src/renderer/components/ui/separator';
import { Switch } from '@/src/renderer/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/renderer/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/src/renderer/components/ui/sheet';
import type { AppConfig } from '@/src/renderer/hooks/use-config';
import { t } from '@/src/renderer/lib/i18n';

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: AppConfig;
  onSave: (updates: Partial<AppConfig>) => void;
  locale: 'zh' | 'en';
}

export function SettingsSheet({ open, onOpenChange, config, onSave, locale }: SettingsSheetProps) {
  const text = t(locale);
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);

  // Sync from latest config whenever the sheet opens. Opening via the controlled
  // `open` prop does not fire onOpenChange, so syncing must not rely on it.
  useEffect(() => {
    if (open) {
      setLocalConfig(config);
    }
  }, [open, config]);

  const handleSave = () => {
    onSave(localConfig);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{text.settingsTitle}</SheetTitle>
          <SheetDescription>{text.settingsDescription}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* TMDB API Key */}
          <div className="space-y-2">
            <Label htmlFor="tmdb-key">{text.tmdbApiKey}</Label>
            <Input
              id="tmdb-key"
              type="password"
              value={localConfig.tmdbKey}
              onChange={(e) => setLocalConfig((prev) => ({ ...prev, tmdbKey: e.target.value }))}
              placeholder={text.tmdbApiKeyPlaceholder}
            />
          </div>

          {/* Destination Path */}
          <div className="space-y-2">
            <Label htmlFor="dest-path">{text.destPath}</Label>
            <Input
              id="dest-path"
              type="text"
              value={localConfig.destPath}
              onChange={(e) => setLocalConfig((prev) => ({ ...prev, destPath: e.target.value }))}
              placeholder={text.destPathPlaceholder}
            />
          </div>

          <Separator />

          {/* Display Language */}
          <div className="space-y-2">
            <Label>{text.displayLanguage}</Label>
            <Select
              value={localConfig.displayLanguage}
              onValueChange={(value) =>
                setLocalConfig((prev) => ({ ...prev, displayLanguage: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zh-CN">中文</SelectItem>
                <SelectItem value="en-US">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Naming Preset */}
          <div className="space-y-2">
            <Label>{text.namingPreset}</Label>
            <Select
              value={localConfig.namingPreset}
              onValueChange={(value) =>
                setLocalConfig((prev) => ({ ...prev, namingPreset: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="universal">{text.namingPresetUniversal}</SelectItem>
                <SelectItem value="jellyfin">{text.namingPresetJellyfin}</SelectItem>
                <SelectItem value="emby">{text.namingPresetEmby}</SelectItem>
                <SelectItem value="plex">{text.namingPresetPlex}</SelectItem>
                <SelectItem value="kodi">{text.namingPresetKodi}</SelectItem>
                <SelectItem value="custom">{text.namingPresetCustom}</SelectItem>
              </SelectContent>
            </Select>

            {localConfig.namingPreset === 'custom' && (
              <div className="space-y-2 rounded-md border p-3">
                {(
                  [
                    ['tvDir', text.namingTemplateTvDir],
                    ['seasonDir', text.namingTemplateSeasonDir],
                    ['episodeFile', text.namingTemplateEpisodeFile],
                    ['movieDir', text.namingTemplateMovieDir],
                    ['movieFile', text.namingTemplateMovieFile],
                  ] as const
                ).map(([field, label]) => (
                  <div key={field} className="space-y-1">
                    <label className="text-xs text-muted-foreground">{label}</label>
                    <Input
                      value={localConfig.customNamingTemplate[field]}
                      onChange={(e) =>
                        setLocalConfig((prev) => ({
                          ...prev,
                          customNamingTemplate: {
                            ...prev.customNamingTemplate,
                            [field]: e.target.value,
                          },
                        }))
                      }
                      className="font-mono text-xs"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Prefer IMDB ID */}
          <div className="flex items-center justify-between">
            <Label htmlFor="prefer-imdb">{text.preferImdbId}</Label>
            <Switch
              id="prefer-imdb"
              checked={localConfig.preferImdbId}
              onCheckedChange={(checked) =>
                setLocalConfig((prev) => ({ ...prev, preferImdbId: checked }))
              }
            />
          </div>

          <Separator />

          {/* SubDL API Key */}
          <div className="space-y-2">
            <Label htmlFor="subdl-key">{text.subdlApiKey}</Label>
            <Input
              id="subdl-key"
              type="password"
              value={localConfig.subdlApiKey}
              onChange={(e) => setLocalConfig((prev) => ({ ...prev, subdlApiKey: e.target.value }))}
              placeholder={text.subdlApiKeyPlaceholder}
            />
          </div>

          {/* Assrt Token */}
          <div className="space-y-2">
            <Label htmlFor="assrt-token">{text.assrtToken}</Label>
            <Input
              id="assrt-token"
              type="password"
              value={localConfig.assrtToken}
              onChange={(e) => setLocalConfig((prev) => ({ ...prev, assrtToken: e.target.value }))}
              placeholder={text.assrtTokenPlaceholder}
            />
          </div>

          {/* Subtitle Languages */}
          <div className="space-y-2">
            <Label>{text.subtitleLanguages}</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'zh', label: '简体中文' },
                { key: 'zh-TW', label: '繁體中文' },
                { key: 'en', label: 'English' },
                { key: 'ja', label: '日本語' },
                { key: 'ko', label: '한국어' },
              ].map(({ key, label }) => {
                const selected = localConfig.subtitleLanguages.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      const langs = selected
                        ? localConfig.subtitleLanguages.filter((l) => l !== key)
                        : [...localConfig.subtitleLanguages, key];
                      setLocalConfig((prev) => ({ ...prev, subtitleLanguages: langs }));
                    }}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      selected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/30 text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave}>{text.saveSettings}</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
