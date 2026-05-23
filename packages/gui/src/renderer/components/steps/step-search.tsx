"use client";

import { useState, useEffect } from "react";
import { Loader2, RefreshCw, ArrowRight, FolderOpen } from "lucide-react";
import { Button } from "@/src/renderer/components/ui/button";
import { Input } from "@/src/renderer/components/ui/input";
import { Label } from "@/src/renderer/components/ui/label";
import { Skeleton } from "@/src/renderer/components/ui/skeleton";
import { StepHeader } from "@/src/renderer/components/shared/step-header";
import { PosterCard } from "@/src/renderer/components/shared/poster-card";
import { t, type Locale } from "@/src/renderer/lib/i18n";
import { ipc } from "@/src/renderer/lib/ipc";
import type { TMDBMatch } from "@metarr/core";

interface StepSearchProps {
  locale: Locale;
  results: TMDBMatch[];
  selectedMatch: TMDBMatch | null;
  searchQuery: string;
  loading: boolean;
  defaultDestPath: string;
  onSelectMatch: (match: TMDBMatch) => void;
  onReSearch: () => void;
  onGeneratePlan: (destPath: string) => void;
}

export function StepSearch({
  locale,
  results,
  selectedMatch,
  searchQuery,
  loading,
  defaultDestPath,
  onSelectMatch,
  onReSearch,
  onGeneratePlan,
}: StepSearchProps) {
  const text = t(locale);
  const [destPath, setDestPath] = useState(defaultDestPath);

  useEffect(() => {
    setDestPath(defaultDestPath);
  }, [defaultDestPath]);

  const handleBrowse = async () => {
    try {
      const dir = await ipc.openDirectory();
      if (dir) {
        setDestPath(dir);
      }
    } catch {
      // Ignore
    }
  };

  return (
    <>
      <StepHeader title={text.selectMatch} description={text.stepDesc.search} />

      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          &ldquo;{searchQuery}&rdquo; - {results.length} {results.length === 1 ? "result" : "results"}
        </span>
        <Button variant="outline" size="sm" onClick={onReSearch} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          )}
          {text.reSearch}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 rounded-lg border p-3">
              <Skeleton className="h-28 w-20 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-3">
          {results.map((match) => (
            <PosterCard
              key={match.id}
              match={match}
              selected={selectedMatch?.id === match.id}
              onClick={() => onSelectMatch(match)}
              locale={locale}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No results found
        </div>
      )}

      {selectedMatch && (
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>{text.outputPath}</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={destPath}
                onChange={(e) => setDestPath(e.target.value)}
                placeholder="/path/to/media/library"
                className="flex-1 font-mono text-sm"
              />
              <Button variant="outline" onClick={handleBrowse}>
                <FolderOpen className="mr-1.5 h-4 w-4" />
                {text.browseDir}
              </Button>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => onGeneratePlan(destPath)}>
              {text.generatePlan}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
