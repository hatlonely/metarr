'use client';

import { Search, Loader2, ScanSearch } from 'lucide-react';
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
  const typeLabel = parsed.type === 'tv' ? text.tvShow : parsed.type === 'movie' ? text.movie : '-';

  const infoItems = [
    { label: text.sourceDir, value: parsed.originalDirName },
    { label: text.mediaType, value: typeLabel },
    { label: text.chineseTitle, value: parsed.chineseTitle || '-' },
    { label: text.englishTitle, value: parsed.englishTitle || '-' },
    { label: text.year, value: String(parsed.year || '-') },
    { label: text.fileCount, value: String(parsed.episodes.length) },
  ];

  return (
    <StepShell
      title={text.steps.parse}
      description={text.stepDesc.parse}
      step={step}
      width="md"
      footer={
        <StepFooter onBack={onBack} backLabel={text.back}>
          <Button variant="brand" onClick={onSearch} disabled={loading || !searchQuery}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {text.searchTmdb}
          </Button>
        </StepFooter>
      }
    >
      <div className="space-y-5">
        <Section title={text.steps.parse} icon={ScanSearch} accent="brand">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3.5">
            {infoItems.map((item) => (
              <div key={item.label} className="min-w-0">
                <dt className="text-xs text-muted-foreground">{item.label}</dt>
                <dd className="mt-0.5 truncate text-sm font-medium" title={item.value}>
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
          {parsed.tags && (
            <div className="mt-4 border-t pt-4">
              <span className="text-xs text-muted-foreground">{text.mediaTags}</span>
              <div className="mt-2">
                <MediaTagBadges tags={parsed.tags} />
              </div>
            </div>
          )}
        </Section>

        {/* Search query + type */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{text.searchTmdb}</label>
            <Input
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              placeholder={text.searchPlaceholder}
            />
          </div>
          <Select
            value={mediaType}
            onValueChange={(v) => onMediaTypeChange(v as 'tv' | 'movie' | 'auto')}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">{text.autoDetect}</SelectItem>
              <SelectItem value="tv">{text.tvShow}</SelectItem>
              <SelectItem value="movie">{text.movie}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </StepShell>
  );
}
