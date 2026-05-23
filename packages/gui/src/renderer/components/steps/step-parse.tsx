"use client";

import { Search, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/src/renderer/components/ui/button";
import { Input } from "@/src/renderer/components/ui/input";
import { Card, CardContent } from "@/src/renderer/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/renderer/components/ui/select";
import { StepHeader } from "@/src/renderer/components/shared/step-header";
import { PathDisplay } from "@/src/renderer/components/shared/path-display";
import { MediaTagBadges } from "@/src/renderer/components/shared/tag-badge";
import { t, type Locale } from "@/src/renderer/lib/i18n";
import type { ParsedMedia } from "@metarr/core";

interface StepParseProps {
  locale: Locale;
  parsed: ParsedMedia;
  mediaType: "tv" | "movie" | "auto";
  searchQuery: string;
  loading: boolean;
  onSearchQueryChange: (query: string) => void;
  onSearch: () => void;
  onMediaTypeChange: (type: "tv" | "movie" | "auto") => void;
}

export function StepParse({
  locale,
  parsed,
  mediaType,
  searchQuery,
  loading,
  onSearchQueryChange,
  onSearch,
  onMediaTypeChange,
}: StepParseProps) {
  const text = t(locale);

  const typeLabel =
    parsed.type === "tv"
      ? text.tvShow
      : parsed.type === "movie"
        ? text.movie
        : "-";

  return (
    <>
      <StepHeader title={text.steps.parse} description={text.stepDesc.parse} />

      {/* Parsed info */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">{text.sourceDir}: </span>
              <PathDisplay path={parsed.originalDirName} />
            </div>
            <div>
              <span className="text-muted-foreground">{text.mediaType}: </span>
              <span className="font-medium">{typeLabel}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{text.chineseTitle}: </span>
              <span className="font-medium">{parsed.chineseTitle || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{text.englishTitle}: </span>
              <span className="font-medium">{parsed.englishTitle || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{text.year}: </span>
              <span>{parsed.year || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{text.fileCount}: </span>
              <span>{parsed.episodes.length}</span>
            </div>
          </div>
          <div className="mt-4">
            <MediaTagBadges tags={parsed.tags} />
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="mb-4 text-lg font-semibold">{text.searchTmdb}</h3>

          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
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

          <div className="mt-4 flex items-center gap-3">
            <Select
              value={mediaType}
              onValueChange={(v) => onMediaTypeChange(v as "tv" | "movie" | "auto")}
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
        </CardContent>
      </Card>
    </>
  );
}
