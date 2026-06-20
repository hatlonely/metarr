'use client';

import { useEffect } from 'react';
import { Loader2, RefreshCw, ArrowRight, Search } from 'lucide-react';
import { Button } from '@/src/renderer/components/ui/button';
import { Skeleton } from '@/src/renderer/components/ui/skeleton';
import { StepShell } from '@/src/renderer/components/layout/step-shell';
import { StepFooter } from '@/src/renderer/components/layout/step-footer';
import { ResultCard, type SearchCandidate } from '@/src/renderer/components/shared/result-card';
import { Reveal, RevealItem } from '@/src/renderer/components/ui/reveal';
import { t, type Locale } from '@/src/renderer/lib/i18n';

interface StepSearchProps {
  locale: Locale;
  step?: number;
  title?: string;
  description?: string;
  results: SearchCandidate[];
  selectedId: string | number | null;
  loading: boolean;
  /** Note shown above the list, e.g. `"query" · 5 results`. */
  resultsNote?: string;
  /** Provided by the video flow → shows a re-search button. */
  onReSearch?: () => void;
  confirmLabel?: string;
  onBack: () => void;
  onSelect: (id: string | number) => void;
  onConfirm: () => void;
}

export function StepSearch({
  locale,
  step,
  title,
  description,
  results,
  selectedId,
  loading,
  resultsNote,
  onReSearch,
  confirmLabel,
  onBack,
  onSelect,
  onConfirm,
}: StepSearchProps) {
  const text = t(locale);

  // Results are ranked — default-select the top one so the user can confirm
  // immediately (still free to pick another).
  useEffect(() => {
    if (!loading && results.length > 0 && selectedId == null) {
      onSelect(results[0].id);
    }
  }, [loading, results, selectedId, onSelect]);

  // Press Enter to confirm once something is selected (no text inputs here).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && selectedId != null && !loading) onConfirm();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId, loading, onConfirm]);

  return (
    <StepShell
      title={title ?? text.selectMatch}
      description={description ?? text.stepDesc.search}
      step={step}
      width="lg"
      footer={
        <StepFooter onBack={onBack} backLabel={text.back}>
          <Button variant="brand" onClick={onConfirm} disabled={loading || selectedId == null}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {confirmLabel ?? text.generatePlan}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </StepFooter>
      }
    >
      <div className="space-y-4">
        {(resultsNote || onReSearch) && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Search className="h-3.5 w-3.5" />
              {resultsNote ?? `${results.length} ${text.resultsLabel}`}
            </span>
            {onReSearch && (
              <Button variant="outline" size="sm" onClick={onReSearch} disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                )}
                {text.reSearch}
              </Button>
            )}
          </div>
        )}

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
            {results.map((candidate) => (
              <RevealItem key={candidate.id}>
                <ResultCard
                  candidate={candidate}
                  selected={selectedId === candidate.id}
                  onClick={() => onSelect(candidate.id)}
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
