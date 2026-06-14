'use client';

import { useLocale } from '@/hooks/use-locale';
import { t } from '@/lib/i18n';
import { useDemoWorkflow, type DemoStep } from '@/hooks/use-demo-workflow';
import { DemoInput } from './demo-input';
import { DemoParsed } from './demo-parsed';
import { DemoSearch } from './demo-search';
import { DemoRename } from './demo-rename';
import { DemoSubtitle } from './demo-subtitle';
import { DemoArtwork } from './demo-artwork';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, Loader2, RotateCcw, Check } from 'lucide-react';

export function DemoWorkflow() {
  const { locale } = useLocale();
  const tr = t(locale);
  const workflow = useDemoWorkflow();
  const steps = tr.demo.steps;
  const current = steps[workflow.step - 1];
  const matchType = workflow.selectedMatch?.type ?? 'tv';

  return (
    <div className="space-y-6">
      {/* Step indicators */}
      <div className="flex items-center justify-center gap-1.5 overflow-x-auto pb-1">
        {steps.map((step, i) => {
          const num = (i + 1) as DemoStep;
          const isActive = workflow.step === num;
          const isDone = workflow.step > num;
          return (
            <div key={step.title} className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  if (num < workflow.step) workflow.goToStep(num);
                }}
                className={cn(
                  'flex items-center gap-2 rounded-full px-3 py-1 text-sm transition-colors',
                  isActive
                    ? 'bg-brand-gradient text-white shadow-sm'
                    : isDone
                      ? 'cursor-pointer bg-brand/10 text-brand'
                      : 'bg-muted text-muted-foreground',
                )}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-medium">
                  {isDone ? <Check className="h-3 w-3" /> : num}
                </span>
                <span className="hidden whitespace-nowrap sm:inline">{step.title}</span>
              </button>
              {i < steps.length - 1 && (
                <div className={cn('h-px w-4', isDone ? 'bg-brand' : 'bg-border')} />
              )}
            </div>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{current.title}</CardTitle>
          <CardDescription>{current.desc}</CardDescription>
        </CardHeader>
        <CardContent>
          {workflow.step === 1 && (
            <DemoInput
              inputDirName={workflow.inputDirName}
              inputFiles={workflow.inputFiles}
              onInput={workflow.setInput}
              onParse={workflow.parse}
            />
          )}

          {workflow.step === 2 && workflow.parsedDir && (
            <div className="space-y-4">
              <DemoParsed
                parsedDir={workflow.parsedDir}
                parsedFiles={workflow.parsedFiles}
                labels={{
                  dirName: tr.demo.dirName,
                  titleLabel: tr.demo.titleLabel,
                  year: tr.demo.year,
                  tags: tr.demo.tags,
                  episodes: tr.demo.episodes,
                  season: tr.demo.season,
                  episode: tr.demo.episode,
                }}
              />
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={workflow.back}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button variant="brand" onClick={workflow.search} disabled={workflow.loading}>
                  {workflow.loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {tr.demo.searchTmdb}
                </Button>
              </div>
            </div>
          )}

          {workflow.step === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">{tr.demo.demoDataNote}</p>
              <DemoSearch
                results={workflow.searchResults}
                selectedId={workflow.selectedMatch?.id ?? null}
                loading={workflow.loading}
                onSelect={workflow.selectMatch}
                labels={{ selectMatch: tr.demo.selectMatch }}
              />
              <Button variant="outline" size="icon" onClick={workflow.back}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          )}

          {workflow.step === 4 && workflow.renamePlan && (
            <div className="space-y-4">
              <DemoRename
                plan={workflow.renamePlan}
                labels={{
                  original: tr.demo.original,
                  renamed: tr.demo.renamed,
                  newStructure: tr.demo.newStructure,
                }}
              />
              <NavRow tr={tr} onBack={workflow.back} onNext={workflow.next} />
            </div>
          )}

          {workflow.step === 5 && workflow.renamePlan && (
            <div className="space-y-4">
              <DemoSubtitle
                plan={workflow.renamePlan}
                labels={{
                  subtitleFor: tr.demo.subtitleFor,
                  language: tr.demo.language,
                  source: tr.demo.source,
                  note: tr.demo.demoDataNote,
                }}
              />
              <NavRow tr={tr} onBack={workflow.back} onNext={workflow.next} />
            </div>
          )}

          {workflow.step === 6 && workflow.renamePlan && (
            <div className="space-y-4">
              <DemoArtwork
                plan={workflow.renamePlan}
                type={matchType}
                labels={{
                  images: tr.demo.artworkImages,
                  nfo: tr.demo.artworkNfo,
                  note: tr.demo.demoDataNote,
                }}
              />
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={workflow.back}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button variant="brand" onClick={workflow.reset}>
                  <RotateCcw className="h-4 w-4" />
                  {tr.demo.restart}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NavRow({
  tr,
  onBack,
  onNext,
}: {
  tr: ReturnType<typeof t>;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="icon" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <Button variant="brand" onClick={onNext}>
        {tr.demo.next}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
