'use client';

import { useLocale } from '@/hooks/use-locale';
import { t } from '@/lib/i18n';
import { useDemoWorkflow, type DemoStep } from '@/hooks/use-demo-workflow';
import { DemoInput } from './demo-input';
import { DemoParsed } from './demo-parsed';
import { DemoSearch } from './demo-search';
import { DemoRename } from './demo-rename';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

export function DemoWorkflow() {
  const { locale } = useLocale();
  const tr = t(locale);
  const workflow = useDemoWorkflow();

  const steps: { num: DemoStep; title: string; desc: string }[] = [
    { num: 1, title: tr.demo.step1Title, desc: tr.demo.step1Desc },
    { num: 2, title: tr.demo.step2Title, desc: tr.demo.step2Desc },
    { num: 3, title: tr.demo.step3Title, desc: tr.demo.step3Desc },
    { num: 4, title: tr.demo.step4Title, desc: tr.demo.step4Desc },
  ];

  return (
    <div className="space-y-6">
      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((step, i) => (
          <div key={step.num} className="flex items-center gap-2">
            <button
              onClick={() => {
                if (step.num < workflow.step) workflow.goToStep(step.num);
              }}
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1 text-sm transition-colors',
                workflow.step === step.num
                  ? 'bg-primary text-primary-foreground'
                  : workflow.step > step.num
                    ? 'bg-primary/10 text-primary cursor-pointer'
                    : 'bg-muted text-muted-foreground',
              )}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current/10 text-xs font-medium">
                {step.num}
              </span>
              <span className="hidden sm:inline">{step.title}</span>
            </button>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'h-px w-6',
                  workflow.step > step.num ? 'bg-primary' : 'bg-border',
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[workflow.step - 1].title}</CardTitle>
          <CardDescription>{steps[workflow.step - 1].desc}</CardDescription>
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
                <Button variant="outline" onClick={workflow.back}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button onClick={workflow.search} disabled={workflow.loading}>
                  {workflow.loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {tr.demo.searchTmdb}
                </Button>
              </div>
            </div>
          )}

          {workflow.step === 3 && (
            <div className="space-y-4">
              <DemoSearch
                results={workflow.searchResults}
                selectedId={workflow.selectedMatch?.id ?? null}
                loading={workflow.loading}
                onSelect={workflow.selectMatch}
                labels={{ selectMatch: tr.demo.selectMatch }}
              />
              <Button variant="outline" onClick={workflow.back}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          )}

          {workflow.step === 4 && workflow.renamePlan && (
            <DemoRename
              plan={workflow.renamePlan}
              labels={{
                original: tr.demo.original,
                renamed: tr.demo.renamed,
                newStructure: tr.demo.newStructure,
                restart: tr.demo.restart,
              }}
              onRestart={workflow.reset}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
