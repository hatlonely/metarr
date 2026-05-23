"use client";

import { FolderOpen, Loader2 } from "lucide-react";
import { Button } from "@/src/renderer/components/ui/button";
import { Card, CardContent } from "@/src/renderer/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/renderer/components/ui/select";
import { StepHeader } from "@/src/renderer/components/shared/step-header";
import { t, type Locale } from "@/src/renderer/lib/i18n";

interface StepSelectProps {
  locale: Locale;
  loading: boolean;
  mediaType: "tv" | "movie" | "auto";
  onMediaTypeChange: (type: "tv" | "movie" | "auto") => void;
  onSelect: () => void;
}

export function StepSelect({
  locale,
  loading,
  mediaType,
  onMediaTypeChange,
  onSelect,
}: StepSelectProps) {
  const text = t(locale);

  return (
    <>
      <StepHeader title={text.steps.select} description={text.stepDesc.select} />

      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">{text.mediaType}</label>
            <Select value={mediaType} onValueChange={(v) => onMediaTypeChange(v as "tv" | "movie" | "auto")}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">{text.autoDetect}</SelectItem>
                <SelectItem value="tv">{text.tvShow}</SelectItem>
                <SelectItem value="movie">{text.movie}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button size="lg" onClick={onSelect} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FolderOpen className="mr-2 h-4 w-4" />
            )}
            {text.selectDir}
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
