'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Database, FolderTree, Captions, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/src/renderer/components/ui/input';
import { Label } from '@/src/renderer/components/ui/label';
import { Button } from '@/src/renderer/components/ui/button';
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

/* --- Building blocks --- */

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-tight">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs leading-tight text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  required,
  requiredLabel,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  required?: boolean;
  requiredLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Label htmlFor={htmlFor}>{label}</Label>
        {required && (
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
            {requiredLabel}
          </span>
        )}
      </div>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SecretInput({
  id,
  value,
  placeholder,
  onChange,
}: {
  id: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type={revealed ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-9"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setRevealed((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
      >
        {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 px-3 py-2.5">
      <div className="min-w-0">
        <Label className="cursor-default">{label}</Label>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

const SUBTITLE_LANGUAGES = [
  { key: 'zh', label: '简体中文' },
  { key: 'zh-TW', label: '繁體中文' },
  { key: 'en', label: 'English' },
  { key: 'ja', label: '日本語' },
  { key: 'ko', label: '한국어' },
];

const CUSTOM_TEMPLATE_FIELDS = [
  'tvDir',
  'seasonDir',
  'episodeFile',
  'movieDir',
  'movieFile',
] as const;

/* --- Main --- */

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

  const templateLabels: Record<(typeof CUSTOM_TEMPLATE_FIELDS)[number], string> = {
    tvDir: text.namingTemplateTvDir,
    seasonDir: text.namingTemplateSeasonDir,
    episodeFile: text.namingTemplateEpisodeFile,
    movieDir: text.namingTemplateMovieDir,
    movieFile: text.namingTemplateMovieFile,
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>{text.settingsTitle}</SheetTitle>
          <SheetDescription>{text.settingsDescription}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">
          {/* TMDB */}
          <Section
            icon={Database}
            title={text.settingsSectionTmdb}
            description={text.settingsSectionTmdbDesc}
          >
            <Field
              label={text.tmdbApiKey}
              htmlFor="tmdb-key"
              required
              requiredLabel={text.settingsRequired}
              hint={text.tmdbApiKeyHint}
            >
              <SecretInput
                id="tmdb-key"
                value={localConfig.tmdbKey}
                onChange={(value) => setLocalConfig((prev) => ({ ...prev, tmdbKey: value }))}
                placeholder={text.tmdbApiKeyPlaceholder}
              />
            </Field>
          </Section>

          {/* Renaming */}
          <Section
            icon={FolderTree}
            title={text.settingsSectionRenaming}
            description={text.settingsSectionRenamingDesc}
          >
            <Field label={text.destPath} htmlFor="dest-path">
              <Input
                id="dest-path"
                type="text"
                value={localConfig.destPath}
                onChange={(e) => setLocalConfig((prev) => ({ ...prev, destPath: e.target.value }))}
                placeholder={text.destPathPlaceholder}
              />
            </Field>

            <Field label={text.namingPreset}>
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
                <div className="mt-2 space-y-2.5 rounded-lg border bg-muted/30 p-3">
                  {CUSTOM_TEMPLATE_FIELDS.map((field) => (
                    <div key={field} className="space-y-1">
                      <label className="text-xs text-muted-foreground">
                        {templateLabels[field]}
                      </label>
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
                        className="h-8 font-mono text-xs"
                      />
                    </div>
                  ))}
                </div>
              )}
            </Field>

            <ToggleRow
              label={text.preferImdbId}
              description={text.preferImdbIdDesc}
              checked={localConfig.preferImdbId}
              onCheckedChange={(checked) =>
                setLocalConfig((prev) => ({ ...prev, preferImdbId: checked }))
              }
            />

            <Field label={text.trashDir} htmlFor="trash-dir" hint={text.trashDirHint}>
              <Input
                id="trash-dir"
                type="text"
                value={localConfig.trashDir}
                onChange={(e) => setLocalConfig((prev) => ({ ...prev, trashDir: e.target.value }))}
                placeholder={text.trashDirPlaceholder}
              />
            </Field>
          </Section>

          {/* Subtitles */}
          <Section
            icon={Captions}
            title={text.settingsSectionSubtitle}
            description={text.settingsSectionSubtitleDesc}
          >
            <Field label={text.subdlApiKey} htmlFor="subdl-key">
              <SecretInput
                id="subdl-key"
                value={localConfig.subdlApiKey}
                onChange={(value) => setLocalConfig((prev) => ({ ...prev, subdlApiKey: value }))}
                placeholder={text.subdlApiKeyPlaceholder}
              />
            </Field>

            <Field label={text.assrtToken} htmlFor="assrt-token" hint={text.subtitleSourceHint}>
              <SecretInput
                id="assrt-token"
                value={localConfig.assrtToken}
                onChange={(value) => setLocalConfig((prev) => ({ ...prev, assrtToken: value }))}
                placeholder={text.assrtTokenPlaceholder}
              />
            </Field>

            <Field label={text.subtitleLanguages}>
              <div className="flex flex-wrap gap-2">
                {SUBTITLE_LANGUAGES.map(({ key, label }) => {
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
            </Field>
          </Section>

          {/* General */}
          <Section icon={SlidersHorizontal} title={text.settingsSectionGeneral}>
            <Field label={text.displayLanguage}>
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
            </Field>
          </Section>
        </div>

        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {text.cancel}
          </Button>
          <Button onClick={handleSave}>{text.saveSettings}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
