'use client';

import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trash2,
  FileEdit,
  Ban,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/src/renderer/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/renderer/components/ui/table';
import { Card, CardContent } from '@/src/renderer/components/ui/card';
import { StepHeader } from '@/src/renderer/components/shared/step-header';
import { t, type Locale } from '@/src/renderer/lib/i18n';
import type { ExecutionResult } from '@metarr/core';

interface StepExecuteProps {
  locale: Locale;
  step: number;
  result: ExecutionResult;
  onContinue: () => void;
}

export function StepExecute({ locale, step, result, onContinue }: StepExecuteProps) {
  const text = t(locale);

  const renamedCount = result.succeeded.filter((t) => t.operation === 'rename').length;
  const skippedCount = result.skippedCount;
  const overwrittenCount = result.overwrittenCount;
  const removedCount = result.removedUnmatched?.length ?? 0;
  const hasIssues = result.failed.length > 0 || overwrittenCount > 0 || removedCount > 0;

  return (
    <>
      <StepHeader title={text.executionComplete} description={text.stepDesc.execute} step={step} />

      {/* Main stats */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <Card className="overflow-hidden">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
              <FileEdit className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold tabular-nums tracking-tight">{renamedCount}</div>
              <div className="text-xs text-muted-foreground">{text.executeRenamed}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Ban className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="text-2xl font-bold tabular-nums tracking-tight">{skippedCount}</div>
              <div className="text-xs text-muted-foreground">{text.executeSkipped}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warning items */}
      {hasIssues && (
        <Card className="mb-6 border-yellow-500/30">
          <CardContent className="pt-6">
            <div className="space-y-3">
              {overwrittenCount > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-500/10">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <span className="text-yellow-700 dark:text-yellow-300">
                      {text.executeOverwritten}
                    </span>
                    <span className="ml-2 font-semibold tabular-nums text-yellow-700 dark:text-yellow-300">
                      {overwrittenCount}
                    </span>
                  </div>
                </div>
              )}
              {removedCount > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <span className="text-destructive">{text.executeRemoved}</span>
                    <span className="ml-2 font-semibold tabular-nums text-destructive">
                      {removedCount}
                    </span>
                  </div>
                </div>
              )}
              {result.failed.length > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                    <XCircle className="h-4 w-4 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <span className="text-destructive">{text.failed}</span>
                    <span className="ml-2 font-semibold tabular-nums text-destructive">
                      {result.failed.length}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cleanup info */}
      {(result.cleanedSourcePath ||
        (result.removedUnmatched && result.removedUnmatched.length > 0)) && (
        <div className="mb-6 space-y-2">
          {result.cleanedSourcePath && (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground">
              <Trash2 className="h-3.5 w-3.5" />
              <span>
                {text.cleanedSourceDir}: {result.cleanedSourcePath}
              </span>
            </div>
          )}
          {result.removedUnmatched && result.removedUnmatched.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground">
              <Trash2 className="h-3.5 w-3.5" />
              <span>
                {text.removedUnmatched}: {result.removedUnmatched.length}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error details */}
      {result.failed.length > 0 && (
        <div className="mb-6">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{text.path}</TableHead>
                  <TableHead className="w-48">{text.operationType}</TableHead>
                  <TableHead className="w-64">Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.failed.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{item.task.source}</TableCell>
                    <TableCell className="text-xs">{item.task.operation}</TableCell>
                    <TableCell className="text-xs text-destructive">{item.error.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <Button onClick={onContinue}>
          <RotateCcw className="mr-2 h-4 w-4" />
          {text.continueProcess}
        </Button>
      </div>
    </>
  );
}
