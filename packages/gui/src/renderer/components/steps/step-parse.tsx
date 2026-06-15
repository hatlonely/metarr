'use client';

import { Search, Loader2, FolderOpen, Sparkles } from 'lucide-react';
import { Button } from '@/src/renderer/components/ui/button';
import { Input } from '@/src/renderer/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/renderer/components/ui/select';
import { StepShell } from '@/src/renderer/components/layout/step-shell';
import { StepFooter } from '@/src/renderer/components/layout/step-footer';
import { Section } from '@/src/renderer/components/shared/section';
import { MediaTagBadges } from '@/src/renderer/components/shared/tag-badge';
import { cn } from '@/src/renderer/lib/utils';
import { t, type Locale } from '@/src/renderer/lib/i18n';
import type { ParsedMedia } from '@metarr/core';

interface StepParseProps {
  locale: Locale;
  step: number;
  parsed: ParsedMedia;
  mediaType: 'tv' | 'movie' | 'auto';
  searchQuery: string;
  loading: boolean;
  onBack: () => void;
  onSearchQueryChange: (query: string) => void;
  onSearch: () => void;
  onMediaTypeChange: (type: 'tv' | 'movie' | 'auto') => void;
}

export function StepParse({
  locale,
  step,
  parsed,
  mediaType,
  searchQuery,
  loading,
  onBack,
  onSearchQueryChange,
  onSearch,
  onMediaTypeChange,
}: StepParseProps) {
  const text = t(locale);
  const L = (zh: string, en: string) => (locale === 'zh' ? zh : en);

  const candidates = parsed.titleCandidates ?? [];
  const ids = parsed.ids ?? {};
  const idEntries: [string, string | number][] = [];
  if (ids.tmdb) idEntries.push(['TMDB', ids.tmdb]);
  if (ids.imdb) idEntries.push(['IMDB', ids.imdb]);
  if (ids.tvdb) idEntries.push(['TVDB', ids.tvdb]);
  if (ids.douban) idEntries.push([L('豆瓣', 'Douban'), ids.douban]);

  const seasons = [...new Set(parsed.episodes.map((e) => e.season).filter((s) => s > 0))].sort(
    (a, b) => a - b,
  );

  return (
    <StepShell
      title={text.steps.parse}
      description={text.stepDesc.parse}
      step={step}
      width="md"
      footer={
        <StepFooter onBack={onBack} backLabel={text.back}>
          <Button
            variant="brand"
            onClick={onSearch}
            disabled={
              loading ||
              (!searchQuery.trim() && candidates.length === 0 && idEntries.length === 0)
            }
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {text.searchTmdb}
          </Button>
        </StepFooter>
      }
    >
      <div className="space-y-6">
        {/* Primary: what to search */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <label className="text-sm font-medium">{L('搜索关键词', 'Search query')}</label>
            {parsed.year ? (
              <span className="text-xs text-muted-foreground">
                {L('年份', 'Year')} {parsed.year}
              </span>
            ) : null}
          </div>

          <Input
            autoFocus
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder={text.searchPlaceholder}
            className="h-10"
          />

          {candidates.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">{L('候选', 'Candidates')}</span>
              {candidates.map((c, i) => (
                <button
                  key={`${c.lang}-${c.query}-${i}`}
                  type="button"
                  onClick={() => onSearchQueryChange(c.query)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
                    searchQuery === c.query
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-border text-muted-foreground hover:border-brand/40 hover:text-foreground',
                  )}
                >
                  <span className="text-[10px] opacity-70">
                    {c.lang === 'zh' ? '中' : c.lang === 'en' ? 'EN' : '?'}
                  </span>
                  {c.query}
                </button>
              ))}
            </div>
          )}

          <Select
            value={mediaType}
            onValueChange={(v) => onMediaTypeChange(v as 'tv' | 'movie' | 'auto')}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">{text.autoDetect}</SelectItem>
              <SelectItem value="tv">{text.tvShow}</SelectItem>
              <SelectItem value="movie">{text.movie}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ID detected → direct lookup (only when present) */}
        {idEntries.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-brand/30 bg-brand/5 px-3 py-2">
            <Sparkles className="h-4 w-4 shrink-0 text-brand" />
            <span className="text-xs font-medium text-brand">
              {L('已识别 ID，将直接定位', 'ID detected — direct lookup')}
            </span>
            <span className="flex flex-wrap gap-1.5">
              {idEntries.map(([k, v]) => (
                <span key={k} className="rounded bg-brand/10 px-1.5 py-0.5 font-mono text-xs text-brand">
                  {k} {v}
                </span>
              ))}
            </span>
          </div>
        )}

        {/* Secondary: parse details, collapsed by default */}
        <Section
          title={L('解析详情', 'Parse details')}
          icon={FolderOpen}
          accent="neutral"
          collapsible
          defaultOpen={false}
        >
          <div className="space-y-3">
            <div>
              <div className="mb-1 text-xs text-muted-foreground">{text.sourceDir}</div>
              <code className="block break-all rounded-md bg-muted/50 px-2 py-1.5 font-mono text-xs text-foreground/80">
                {parsed.originalDirName}
              </code>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs">
              <span>
                <span className="text-muted-foreground">{text.fileCount}: </span>
                {parsed.episodes.length}
              </span>
              {seasons.length > 0 && (
                <span>
                  <span className="text-muted-foreground">{L('季', 'Seasons')}: </span>
                  {seasons.join(', ')}
                </span>
              )}
            </div>

            {parsed.tags && (
              <div>
                <div className="mb-1.5 text-xs text-muted-foreground">{text.mediaTags}</div>
                <MediaTagBadges tags={parsed.tags} />
              </div>
            )}
          </div>
        </Section>
      </div>
    </StepShell>
  );
}
