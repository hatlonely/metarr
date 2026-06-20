'use client';

import { useState, useEffect, useCallback } from 'react';
import { Undo2, Trash2, FolderOpen, FolderInput, Loader2 } from 'lucide-react';
import type { HistoryEntry } from '@metarr/core';
import { Button } from '@/src/renderer/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/src/renderer/components/ui/sheet';
import { ipc } from '@/src/renderer/lib/ipc';
import { t } from '@/src/renderer/lib/i18n';

interface HistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: 'zh' | 'en';
}

interface UndoOutcome {
  restored: number;
  manual: boolean;
  failed: number;
}

function fmt(template: string, count: number): string {
  return template.replace('{count}', String(count));
}

export function HistorySheet({ open, onOpenChange, locale }: HistorySheetProps) {
  const text = t(locale);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [undoingId, setUndoingId] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<Record<string, UndoOutcome>>({});

  const load = useCallback(async () => {
    try {
      setEntries(await ipc.historyList());
    } catch {
      setEntries([]);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const handleUndo = async (entry: HistoryEntry) => {
    setUndoingId(entry.id);
    try {
      const result = await ipc.historyUndo(entry.id);
      if (result) {
        const manual = result.skipped.some((s) => s.reason.includes('系统回收站'));
        setOutcomes((prev) => ({
          ...prev,
          [entry.id]: { restored: result.restored, manual, failed: result.failed.length },
        }));
      }
      await load();
    } finally {
      setUndoingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    await ipc.historyDelete(id);
    await load();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>{text.historyTitle}</SheetTitle>
          <SheetDescription>{text.historyDescription}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto px-6 py-6">
          {entries.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {text.historyEmpty}
            </div>
          ) : (
            entries.map((entry) => {
              const outcome = outcomes[entry.id];
              const restored = !!entry.restoredAt;
              return (
                <div
                  key={entry.id}
                  className="rounded-lg border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">{entry.mediaName}</span>
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          {entry.mediaType === 'tv' ? text.tvShow : text.movie}
                        </span>
                        {restored && (
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {text.historyUndone}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title={text.historyOpenSource}
                        onClick={() => ipc.openPath(entry.sourcePath)}
                      >
                        <FolderOpen className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={text.historyOpenTarget}
                        onClick={() => ipc.openPath(entry.destPath)}
                      >
                        <FolderInput className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={text.historyDeleteRecord}
                        onClick={() => handleDelete(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{fmt(text.historyRenamedCount, entry.renamed.length)}</span>
                    {entry.trashed.length > 0 && (
                      <span>{fmt(text.historyTrashedCount, entry.trashed.length)}</span>
                    )}
                    {entry.createdFiles.length > 0 && (
                      <span>{fmt(text.historyCreatedCount, entry.createdFiles.length)}</span>
                    )}
                  </div>

                  {outcome && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {fmt(text.historyRestored, outcome.restored)}
                      {outcome.failed > 0 && ` · ${fmt(text.historyUndoFailedN, outcome.failed)}`}
                      {outcome.manual && ` · ${text.historyManualNote}`}
                    </p>
                  )}

                  <div className="mt-3 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={restored || undoingId === entry.id}
                      onClick={() => handleUndo(entry)}
                    >
                      {undoingId === entry.id ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Undo2 className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      {undoingId === entry.id ? text.historyUndoing : text.historyUndo}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
