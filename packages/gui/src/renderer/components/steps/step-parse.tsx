'use client';

import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/src/renderer/components/ui/button';
import { Input } from '@/src/renderer/components/ui/input';
import { Card, CardContent } from '@/src/renderer/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/renderer/components/ui/select';
import { StepHeader } from '@/src/renderer/components/shared/step-header';
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
    <>
      <StepHeader title={text.steps.parse} description={text.stepDesc.parse} step={step} />

      {/* Parsed info */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-x-6 gap-y-4">
            {infoItems.map((item) => (
              <div key={item.label} className="space-y-0.5">
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <p className="truncate text-sm font-medium">{item.value}</p>
              </div>
            ))}
          </div>

          {parsed.tags && (
            <div className="mt-5 space-y-2">
              <span className="text-xs text-muted-foreground">{text.mediaTags}</span>
              <MediaTagBadges tags={parsed.tags} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder={text.searchPlaceholder}
            className="flex-1"
          />
          <Button onClick={onSearch} disabled={loading || !searchQuery}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            {text.searchTmdb}
          </Button>
        </div>

        <Select
          value={mediaType}
          onValueChange={(v) => onMediaTypeChange(v as 'tv' | 'movie' | 'auto')}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">{text.autoDetect}</SelectItem>
            <SelectItem value="tv">{text.tvShow}</SelectItem>
            <SelectItem value="movie">{text.movie}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
