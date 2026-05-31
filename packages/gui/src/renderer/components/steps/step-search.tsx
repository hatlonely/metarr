'use client';

import { Loader2, RefreshCw, ArrowRight, Search } from 'lucide-react';
import { Button } from '@/src/renderer/components/ui/button';
import { Skeleton } from '@/src/renderer/components/ui/skeleton';
import { StepHeader } from '@/src/renderer/components/shared/step-header';
import { PosterCard } from '@/src/renderer/components/shared/poster-card';
import { t, type Locale } from '@/src/renderer/lib/i18n';
import type { TMDBMatch } from '@metarr/core';

interface StepSearchProps {
  locale: Locale;
  step: number;
  results: TMDBMatch[];
  selectedMatch: TMDBMatch | null;
  searchQuery: string;
  loading: boolean;
  onSelectMatch: (match: TMDBMatch) => void;
  onReSearch: () => void;
  onGeneratePlan: () => void;
}

export function StepSearch({
  locale,
  step,
  results,
  selectedMatch,
  searchQuery,
  loading,
  onSelectMatch,
  onReSearch,
  onGeneratePlan,
}: StepSearchProps) {
  const text = t(locale);

  return (
    <>
      <StepHeader title={text.selectMatch} description={text.stepDesc.search} step={step} />

      <div className="mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Search className="h-3.5 w-3.5" />
          &ldquo;{searchQuery}&rdquo; &middot; {results.length}{' '}
          {results.length === 1 ? 'result' : 'results'}
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
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 rounded-xl border p-3">
              <Skeleton className="h-28 w-20 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-2">
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
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          {text.noResults}
        </div>
      )}

      {selectedMatch && (
        <div className="mt-6 flex justify-end">
          <Button onClick={onGeneratePlan} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <>
                {text.generatePlan}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </>
  );
}
