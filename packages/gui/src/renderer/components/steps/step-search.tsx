'use client';

import { useEffect } from 'react';
import { Loader2, RefreshCw, ArrowRight, Search } from 'lucide-react';
import { Button } from '@/src/renderer/components/ui/button';
import { Skeleton } from '@/src/renderer/components/ui/skeleton';
import { StepShell } from '@/src/renderer/components/layout/step-shell';
import { StepFooter } from '@/src/renderer/components/layout/step-footer';
import { PosterCard } from '@/src/renderer/components/shared/poster-card';
import { Reveal, RevealItem } from '@/src/renderer/components/ui/reveal';
import { t, type Locale } from '@/src/renderer/lib/i18n';
import type { TMDBMatch } from '@metarr/core';

interface StepSearchProps {
  locale: Locale;
  step: number;
  results: TMDBMatch[];
  selectedMatch: TMDBMatch | null;
  searchQuery: string;
  loading: boolean;
  onBack: () => void;
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
  onBack,
  onSelectMatch,
  onReSearch,
  onGeneratePlan,
}: StepSearchProps) {
  const text = t(locale);

  // Press Enter to generate the plan once a match is selected (no text inputs here).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && selectedMatch && !loading) onGeneratePlan();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedMatch, loading, onGeneratePlan]);

  return (
    <StepShell
      title={text.selectMatch}
      description={text.stepDesc.search}
      step={step}
      width="lg"
      footer={
        <StepFooter onBack={onBack} backLabel={text.back}>
          <Button variant="brand" onClick={onGeneratePlan} disabled={loading || !selectedMatch}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {text.generatePlan}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </StepFooter>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
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
          <Reveal stagger className="space-y-2">
            {results.map((match) => (
              <RevealItem key={match.id}>
                <PosterCard
                  match={match}
                  selected={selectedMatch?.id === match.id}
                  onClick={() => onSelectMatch(match)}
                  locale={locale}
                />
              </RevealItem>
            ))}
          </Reveal>
        ) : (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            {text.noResults}
          </div>
        )}
      </div>
    </StepShell>
  );
}
