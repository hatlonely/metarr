"use client";

import { CheckCircle2, XCircle, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/src/renderer/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/renderer/components/ui/table";
import { Card, CardContent } from "@/src/renderer/components/ui/card";
import { StepHeader } from "@/src/renderer/components/shared/step-header";
import { t, type Locale } from "@/src/renderer/lib/i18n";
import type { ExecutionResult } from "@metarr/core";

interface StepExecuteProps {
  locale: Locale;
  result: ExecutionResult;
  onContinue: () => void;
}

export function StepExecute({ locale, result, onContinue }: StepExecuteProps) {
  const text = t(locale);

  return (
    <>
      <StepHeader title={text.executionComplete} description={text.stepDesc.execute} />

      <div className="mb-6 grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold">{result.succeeded.length}</div>
              <div className="text-sm text-muted-foreground">{text.succeeded}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <XCircle className="h-8 w-8 text-destructive" />
            <div>
              <div className="text-2xl font-bold">{result.failed.length}</div>
              <div className="text-sm text-muted-foreground">{text.failed}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {result.cleanedSourcePath && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
          <Trash2 className="h-4 w-4" />
          <span>{text.cleanedSourceDir}: {result.cleanedSourcePath}</span>
        </div>
      )}

      {result.failed.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold text-destructive">
            {text.failed} ({result.failed.length})
          </h3>
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
                    <TableCell className="font-mono text-xs">
                      {item.task.source}
                    </TableCell>
                    <TableCell className="text-xs">
                      {item.task.operation}
                    </TableCell>
                    <TableCell className="text-xs text-destructive">
                      {item.error.message}
                    </TableCell>
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
