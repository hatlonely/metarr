"use client";

import { ArrowLeft, Play, Loader2 } from "lucide-react";
import { Button } from "@/src/renderer/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/renderer/components/ui/table";
import { StepHeader } from "@/src/renderer/components/shared/step-header";
import { t, type Locale } from "@/src/renderer/lib/i18n";
import type { RenamePlan } from "@metarr/core";

interface StepPreviewProps {
  locale: Locale;
  plan: RenamePlan;
  executing: boolean;
  onBack: () => void;
  onExecute: () => void;
}

export function StepPreview({
  locale,
  plan,
  executing,
  onBack,
  onExecute,
}: StepPreviewProps) {
  const text = t(locale);

  const operationLabel = (op: string) => {
    switch (op) {
      case "create-dir":
        return `+ ${text.operation.createDir}`;
      case "rename":
        return text.operation.rename;
      case "move":
        return text.operation.move;
      default:
        return op;
    }
  };

  return (
    <>
      <StepHeader title={text.previewPlan} description={text.stepDesc.preview} />

      <p className="mb-4 text-sm text-muted-foreground">{plan.summary}</p>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-36">{text.operationType}</TableHead>
              <TableHead>{text.path}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plan.tasks.map((task, i) => (
              <TableRow key={i}>
                <TableCell className="text-xs font-medium">
                  {operationLabel(task.operation)}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {task.operation === "create-dir"
                    ? task.target.replace(plan.destPath + "/", "")
                    : task.description}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {text.back}
        </Button>
        <Button
          variant="default"
          onClick={onExecute}
          disabled={executing}
        >
          {executing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          {executing ? text.executing : text.confirmExecute}
        </Button>
      </div>
    </>
  );
}
