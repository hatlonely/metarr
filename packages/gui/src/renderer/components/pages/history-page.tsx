'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Undo2,
  Trash2,
  FolderOpen,
  FolderInput,
  Loader2,
  Search,
  Film,
  Tv,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import type { HistoryEntry } from '@metarr/core';
import { Button } from '@/src/renderer/components/ui/button';
import { Input } from '@/src/renderer/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/renderer/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/src/renderer/components/ui/collapsible';
import { PageShell } from '@/src/renderer/components/layout/page-shell';
import { cn } from '@/src/renderer/lib/utils';
import { ipc } from '@/src/renderer/lib/ipc';
import { t } from '@/src/renderer/lib/i18n';
import type { TranslationMap } from '@/src/renderer/lib/i18n';

interface HistoryPageProps {
  locale: 'zh' | 'en';
}

type TypeFilter = 'all' | 'tv' | 'movie';
type StatusFilter = 'all' | 'active' | 'restored';
type Bucket = 'today' | 'yesterday' | 'earlier';

const fmt = (template: string, count: number) => template.replace('{count}', String(count));
const fmtN = (template: string, n: number) => template.replace('{n}', String(n));
const basename = (p: string) => p.split('/').filter(Boolean).pop() ?? p;

function relativeTime(iso: string, text: TranslationMap): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return text.timeJustNow;
  if (m < 60) return fmtN(text.timeMinutesAgo, m);
  const h = Math.floor(m / 60);
  if (h < 24) return fmtN(text.timeHoursAgo, h);
  const d = Math.floor(h / 24);
  if (d <= 7) return fmtN(text.timeDaysAgo, d);
  return new Date(iso).toLocaleDateString();
}

function dateBucket(iso: string): Bucket {
  const t0 = new Date(iso).getTime();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (t0 >= startOfToday) return 'today';
  if (t0 >= startOfToday - 86_400_000) return 'yesterday';
  return 'earlier';
}

/* --- A row in the expandable detail section --- */
function DetailGroup({ label, items }: { label: string; items: React.ReactNode[] }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
        {label} · {items.length}
      </p>
      <ul className="space-y-0.5">
        {items.map((node, i) => (
          <li key={i} className="truncate font-mono text-[11px] text-muted-foreground">
            {node}
          </li>
        ))}
      </ul>
    </div>
  );
}

function HistoryCard({
  entry,
  text,
  undoing,
  onUndo,
  onDelete,
}: {
  entry: HistoryEntry;
  text: TranslationMap;
  undoing: boolean;
  onUndo: () => void;
  onDelete: () => void;
}) {
  const restored = !!entry.restoredAt;
  const TypeIcon = entry.mediaType === 'tv' ? Tv : Film;
  const outputDir = entry.createdDirs[0] ?? entry.destPath;
  const hasDetails =
    entry.renamed.length + entry.trashed.length + entry.createdFiles.length > 0;

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex gap-4">
        {/* Poster / type icon */}
        {entry.poster ? (
          <img
            src={entry.poster}
            alt=""
            className="h-[84px] w-14 shrink-0 rounded-lg object-cover ring-1 ring-black/5 dark:ring-white/10"
          />
        ) : (
          <div className="flex h-[84px] w-14 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <TypeIcon className="h-5 w-5" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          {/* Title row + actions */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-sm font-semibold">{entry.mediaName}</span>
                {entry.year ? (
                  <span className="text-sm text-muted-foreground">({entry.year})</span>
                ) : null}
                <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  <TypeIcon className="h-3 w-3" />
                  {entry.mediaType === 'tv' ? text.tvShow : text.movie}
                </span>
                {restored && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {text.historyUndone}
                  </span>
                )}
              </div>
              {entry.originalName && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{entry.originalName}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <Button variant="ghost" size="icon" title={text.historyOpenSource} onClick={() => ipc.openPath(entry.sourcePath)}>
                <FolderOpen className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" title={text.historyOpenTarget} onClick={() => ipc.openPath(outputDir)}>
                <FolderInput className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" title={text.historyDeleteRecord} onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Paths */}
          <div className="mt-2 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground" title={entry.sourcePath}>
              <FolderOpen className="h-3.5 w-3.5 shrink-0" />
              <span className="shrink-0 text-muted-foreground/60">{text.historySource}</span>
              <span className="truncate font-mono">{entry.sourcePath}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground" title={outputDir}>
              <FolderInput className="h-3.5 w-3.5 shrink-0" />
              <span className="shrink-0 text-muted-foreground/60">{text.historyOutput}</span>
              <span className="truncate font-mono">{outputDir}</span>
            </div>
          </div>

          {/* Summary + time */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{fmt(text.historyRenamedCount, entry.renamed.length)}</span>
            {entry.trashed.length > 0 && <span>{fmt(text.historyTrashedCount, entry.trashed.length)}</span>}
            {entry.createdFiles.length > 0 && <span>{fmt(text.historyCreatedCount, entry.createdFiles.length)}</span>}
            <span className="text-muted-foreground/50">·</span>
            <span title={new Date(entry.timestamp).toLocaleString()}>{relativeTime(entry.timestamp, text)}</span>
            {restored && entry.restoredAt && (
              <span className="text-muted-foreground/70">
                · {text.historyRestoredAt.replace('{time}', relativeTime(entry.restoredAt, text))}
              </span>
            )}
          </div>

          {/* Expandable details + undo */}
          <div className="mt-3 flex items-center justify-between gap-2">
            {hasDetails ? (
              <Collapsible>
                <CollapsibleTrigger className="group flex items-center gap-1 rounded text-xs text-muted-foreground transition-colors hover:text-foreground">
                  <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180" />
                  {text.historyDetails}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-3 rounded-lg border bg-muted/30 p-3">
                  <DetailGroup
                    label={text.historyRenamedLabel}
                    items={entry.renamed.map((r) => (
                      <span className="flex items-center gap-1.5">
                        <span className="truncate">{basename(r.from)}</span>
                        <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                        <span className="truncate text-foreground/80">{basename(r.to)}</span>
                      </span>
                    ))}
                  />
                  <DetailGroup
                    label={text.historyTrashedLabel}
                    items={entry.trashed.map((tr) => basename(tr.original))}
                  />
                  <DetailGroup
                    label={text.historyDownloadedLabel}
                    items={entry.createdFiles.map((f) => basename(f))}
                  />
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <span />
            )}

            <Button variant="outline" size="sm" disabled={restored || undoing} onClick={onUndo}>
              {undoing ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Undo2 className="mr-1.5 h-3.5 w-3.5" />
              )}
              {undoing ? text.historyUndoing : text.historyUndo}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HistoryPage({ locale }: HistoryPageProps) {
  const text = t(locale);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [undoingId, setUndoingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setEntries(await ipc.historyList());
    } catch {
      setEntries([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (
        q &&
        !e.mediaName.toLowerCase().includes(q) &&
        !(e.originalName?.toLowerCase().includes(q))
      )
        return false;
      if (typeFilter !== 'all' && e.mediaType !== typeFilter) return false;
      if (statusFilter === 'active' && e.restoredAt) return false;
      if (statusFilter === 'restored' && !e.restoredAt) return false;
      return true;
    });
  }, [entries, query, typeFilter, statusFilter]);

  const groups = useMemo(() => {
    const buckets: Record<Bucket, HistoryEntry[]> = { today: [], yesterday: [], earlier: [] };
    for (const e of filtered) buckets[dateBucket(e.timestamp)].push(e);
    return buckets;
  }, [filtered]);

  const handleUndo = async (entry: HistoryEntry) => {
    setUndoingId(entry.id);
    try {
      const result = await ipc.historyUndo(entry.id);
      if (result) {
        const manual = result.skipped.some((s) => s.reason.includes('系统回收站'));
        const parts = [fmt(text.historyRestored, result.restored)];
        if (result.failed.length > 0) parts.push(fmt(text.historyUndoFailedN, result.failed.length));
        if (manual) parts.push(text.historyManualNote);
        toast(parts.join(' · '));
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

  const groupLabels: Record<Bucket, string> = {
    today: text.dateToday,
    yesterday: text.dateYesterday,
    earlier: text.dateEarlier,
  };

  return (
    <PageShell
      title={text.historyTitle}
      description={text.historyDescription}
      width="lg"
      actions={
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={text.historySearchPlaceholder}
              className="h-9 w-44 pl-8"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
            <SelectTrigger className="h-9 w-[104px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{text.filterTypeAll}</SelectItem>
              <SelectItem value="tv">{text.tvShow}</SelectItem>
              <SelectItem value="movie">{text.movie}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="h-9 w-[104px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{text.filterStatusAll}</SelectItem>
              <SelectItem value="active">{text.filterStatusActive}</SelectItem>
              <SelectItem value="restored">{text.filterStatusRestored}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
    >
      {filtered.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          {text.historyEmpty}
        </div>
      ) : (
        <div className="space-y-6">
          {(['today', 'yesterday', 'earlier'] as const).map((bucket) =>
            groups[bucket].length === 0 ? null : (
              <section key={bucket} className="space-y-2">
                <h3 className={cn('text-xs font-medium uppercase tracking-wide text-muted-foreground')}>
                  {groupLabels[bucket]} · {groups[bucket].length}
                </h3>
                <div className="space-y-3">
                  {groups[bucket].map((entry) => (
                    <HistoryCard
                      key={entry.id}
                      entry={entry}
                      text={text}
                      undoing={undoingId === entry.id}
                      onUndo={() => handleUndo(entry)}
                      onDelete={() => handleDelete(entry.id)}
                    />
                  ))}
                </div>
              </section>
            ),
          )}
        </div>
      )}
    </PageShell>
  );
}
