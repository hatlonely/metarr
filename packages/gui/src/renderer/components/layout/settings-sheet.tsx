'use client';

import { useState } from 'react';
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

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setLocalConfig(config);
    }
    onOpenChange(isOpen);
  };

  const handleSave = () => {
    onSave(localConfig);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
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

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave}>{text.saveSettings}</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
