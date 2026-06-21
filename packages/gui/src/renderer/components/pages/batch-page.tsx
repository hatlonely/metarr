'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  FolderOpen, Loader2, Play, Ban, Music, Film, ChevronRight, ChevronDown, RotateCw, FolderInput, X, Trash2, History,
} from 'lucide-react';
import { toast } from 'sonner';
import type { BatchItem, BatchStatus, BatchOptions, BatchCacheInfo } from '@metarr/core';
import type { BatchState } from '@/src/shared/ipc-types';
import { PageShell } from '@/src/renderer/components/layout/page-shell';
import { Button } from '@/src/renderer/components/ui/button';
import { Switch } from '@/src/renderer/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/src/renderer/components/ui/select';
import { ResultCard, type SearchCandidate } from '@/src/renderer/components/shared/result-card';
import { cn } from '@/src/renderer/lib/utils';
import { ipc } from '@/src/renderer/lib/ipc';
import { t } from '@/src/renderer/lib/i18n';
import type { TranslationMap } from '@/src/renderer/lib/i18n';

// Kept in sync with core's DEFAULT_BATCH_OPTIONS. Inlined (not imported) so the
// renderer bundle never pulls in core's node-only runtime.
const DEFAULT_OPTS: BatchOptions = {
  scrapeArtwork: true,
  downloadSubtitles: true,
  removeUnmatched: false,
  onConflict: 'skip',
};

interface BatchPageProps {
  locale: 'zh' | 'en';
}

const baseName = (p: string) => p.split('/').filter(Boolean).pop() ?? p;
const fmt = (s: string, n: number, total: number) =>
  s.replace('{n}', String(n)).replace('{total}', String(total));

function relTime(ms: number, text: TranslationMap): string {
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  if (m < 1) return text.timeJustNow;
  if (m < 60) return text.timeMinutesAgo.replace('{n}', String(m));
  const h = Math.floor(m / 60);
  if (h < 24) return text.timeHoursAgo.replace('{n}', String(h));
  const d = Math.floor(h / 24);
  if (d <= 7) return text.timeDaysAgo.replace('{n}', String(d));
  return new Date(ms).toLocaleDateString();
}

function statusMeta(status: BatchStatus, text: TranslationMap): { label: string; cls: string } {
  switch (status) {
    case 'auto': return { label: text.batchStatusAuto, cls: 'bg-green-500/10 text-green-600 dark:text-green-400' };
    case 'review': return { label: text.batchStatusReview, cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' };
    case 'nomatch': return { label: text.batchStatusNomatch, cls: 'bg-muted text-muted-foreground' };
    case 'error': return { label: text.batchStatusError, cls: 'bg-destructive/10 text-destructive' };
    case 'done': return { label: text.batchStatusDone, cls: 'bg-brand/10 text-brand' };
    case 'organized': return { label: text.batchStatusOrganized, cls: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' };
    case 'skipped': return { label: text.batchStatusSkipped, cls: 'bg-muted text-muted-foreground/60' };
    default: return { label: status, cls: 'bg-muted text-muted-foreground' };
  }
}

function toCandidate(c: BatchItem['candidates'][number]): SearchCandidate {
  return { id: c.id, image: c.poster, title: c.title, year: c.year, subtitle: c.subtitle, meta: c.meta };
}

export function BatchPage({ locale }: BatchPageProps) {
  const text = t(locale);
  const [state, setState] = useState<BatchState | null>(null);
  const [filter, setFilter] = useState<BatchStatus | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [globalOpts, setGlobalOpts] = useState<BatchOptions>(DEFAULT_OPTS);
  const [subsConfigured, setSubsConfigured] = useState(false);

  // Load global batch options + whether subtitles are configured at all.
  useEffect(() => {
    ipc.getConfig().then((cfg) => {
      setGlobalOpts({ ...DEFAULT_OPTS, ...((cfg.batchOptions as Partial<BatchOptions>) ?? {}) });
      const langs = cfg.subtitleLanguages as string[] | undefined;
      setSubsConfigured(Boolean((cfg.subdlApiKey || cfg.assrtToken) && langs && langs.length > 0));
    });
  }, []);

  const updateGlobal = (patch: Partial<BatchOptions>) => {
    setGlobalOpts((prev) => {
      const next = { ...prev, ...patch };
      ipc.setConfig('batchOptions', next);
      return next;
    });
  };

  // Cached scans (shown on the empty state for resume / cleanup).
  const [caches, setCaches] = useState<BatchCacheInfo[]>([]);
  const loadCaches = useCallback(() => {
    ipc.batchListCaches().then(setCaches);
  }, []);

  const load = useCallback(async () => {
    setState(await ipc.batchState());
  }, []);

  // Poll while the page is open so scan/execute progress streams in.
  useEffect(() => {
    load();
    const timer = setInterval(load, 800);
    return () => clearInterval(timer);
  }, [load]);

  // Refresh the cached-scan list whenever we're back to the idle (no session) view.
  useEffect(() => {
    if (!state) loadCaches();
  }, [state, loadCaches]);

  const resumeCache = async (parentPath: string) => {
    await ipc.batchScan(parentPath);
    load();
  };
  const deleteCache = async (id: string) => {
    await ipc.batchDeleteCache(id);
    loadCaches();
  };
  const clearCaches = async () => {
    await ipc.batchClearCaches();
    loadCaches();
  };

  // Set/clear one per-item override; clears to inherit when no overrides remain.
  const setItemOpt = (it: BatchItem, key: keyof BatchOptions, tri: string) => {
    const next: Partial<BatchOptions> = { ...(it.options ?? {}) };
    if (tri === 'inherit') delete next[key];
    else if (key === 'onConflict') next.onConflict = tri as BatchOptions['onConflict'];
    else (next as Record<string, boolean>)[key] = tri === 'on';
    ipc.batchSetItemOptions(it.id, Object.keys(next).length > 0 ? next : null).then(load);
  };

  // Toast a summary when an execute run finishes.
  const wasExecuting = useRef(false);
  useEffect(() => {
    if (!state) {
      wasExecuting.current = false;
      return;
    }
    if (state.phase === 'executing') wasExecuting.current = true;
    else if (wasExecuting.current && !state.running) {
      wasExecuting.current = false;
      const done = state.items.filter((i) => i.status === 'done').length;
      const failed = state.items.filter((i) => i.status === 'error').length;
      const failedPart = failed > 0 ? text.batchResultFailed.replace('{n}', String(failed)) : '';
      toast(text.batchResult.replace('{done}', String(done)).replace('{failed}', failedPart));
    }
  }, [state, text]);

  const selectFolder = async () => {
    const dir = await ipc.openDirectory();
    if (dir) {
      await ipc.batchScan(dir);
      load();
    }
  };

  const clear = async () => {
    await ipc.batchClear();
    setState(null);
    setExpandedId(null);
    setFilter('all');
  };

  const items = state?.items ?? [];
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const it of items) c[it.status] = (c[it.status] ?? 0) + 1;
    return c;
  }, [items]);
  const runnable = items.filter((it) => it.status === 'auto');
  const shown = filter === 'all' ? items : items.filter((it) => it.status === filter);

  const handlePick = async (id: string, candidateId: string | null) => {
    await ipc.batchSetChoice(id, candidateId);
    load(); // keep the panel open so the new selection + options stay visible
  };
  const handleSkip = async (it: BatchItem) => {
    await ipc.batchSetSkip(it.id, it.status !== 'skipped');
    load();
  };
  const handleExecute = async () => {
    if (runnable.length === 0) return;
    if (!window.confirm(fmt(text.batchExecuteConfirm, runnable.length, 0))) return;
    await ipc.batchExecute(runnable.map((it) => it.id));
    load();
  };

  const progress =
    state?.phase === 'executing'
      ? fmt(text.batchExecuting, state.executeDone, state.executeTotal)
      : state?.running
        ? state.phase === 'scanning'
          ? text.batchScanning
          : fmt(text.batchAnalyzing, state.scanned, state.total)
        : null;

  return (
    <PageShell
      title={text.batchTitle}
      description={text.batchDesc}
      width="xl"
      actions={
        <div className="flex items-center gap-2">
          {state?.running && (
            <Button
              variant="outline"
              size="sm"
              disabled={state.cancelling}
              onClick={() => {
                ipc.batchCancel();
                toast(text.batchCancelling);
              }}
            >
              {state.cancelling ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Ban className="mr-1.5 h-3.5 w-3.5" />
              )}
              {state.cancelling ? text.batchCancelling : text.batchCancel}
            </Button>
          )}
          {state && !state.running && (
            <Button variant="ghost" size="sm" onClick={clear}>
              <X className="mr-1.5 h-3.5 w-3.5" />
              {text.batchClear}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={selectFolder} disabled={state?.running}>
            {state ? <RotateCw className="mr-1.5 h-3.5 w-3.5" /> : <FolderOpen className="mr-1.5 h-3.5 w-3.5" />}
            {state ? text.batchRescan : text.batchSelectFolder}
          </Button>
          <Button size="sm" onClick={handleExecute} disabled={state?.running || runnable.length === 0}>
            <Play className="mr-1.5 h-3.5 w-3.5" />
            {fmt(text.batchExecute, runnable.length, 0)}
          </Button>
        </div>
      }
    >
      {!state ? (
        <div className="space-y-5">
          <button
            onClick={selectFolder}
            className="flex h-48 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed text-muted-foreground transition-colors hover:border-brand/50 hover:text-foreground"
          >
            <FolderOpen className="h-8 w-8" />
            <span className="text-sm">{text.batchEmpty}</span>
          </button>

          {caches.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <History className="h-4 w-4" />
                  {text.batchCacheTitle}
                </h3>
                <Button variant="ghost" size="sm" onClick={clearCaches}>
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  {text.batchCacheClearAll}
                </Button>
              </div>
              <div className="space-y-1.5">
                {caches.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2 shadow-sm">
                    <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{baseName(c.parentPath) || text.batchCacheUnknown}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.parentPath || '—'}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {fmt(text.batchCacheItems, c.itemCount, 0)} · {relTime(c.scannedAt, text)}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => resumeCache(c.parentPath)} disabled={!c.parentPath}>
                      <RotateCw className="mr-1.5 h-3.5 w-3.5" />
                      {text.batchCacheResume}
                    </Button>
                    <Button variant="ghost" size="icon" title={text.batchCacheDelete} onClick={() => deleteCache(c.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Global execution options (persisted to config). */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border bg-muted/30 px-3 py-2.5 text-sm">
            <span className="text-xs font-medium text-muted-foreground">{text.batchOptGlobal}</span>
            <label className="flex items-center gap-2">
              <Switch checked={globalOpts.scrapeArtwork} onCheckedChange={(v) => updateGlobal({ scrapeArtwork: v })} />
              {text.batchOptScrape}
            </label>
            <label className="flex items-center gap-2" title={!subsConfigured ? text.batchOptSubtitleHint : undefined}>
              <Switch
                checked={globalOpts.downloadSubtitles && subsConfigured}
                disabled={!subsConfigured}
                onCheckedChange={(v) => updateGlobal({ downloadSubtitles: v })}
              />
              <span className={cn(!subsConfigured && 'text-muted-foreground/60')}>{text.batchOptSubtitle}</span>
            </label>
            <label className="flex items-center gap-2">
              <Switch checked={globalOpts.removeUnmatched} onCheckedChange={(v) => updateGlobal({ removeUnmatched: v })} />
              {text.batchOptRemoveUnmatched}
            </label>
            <div className="flex items-center gap-2">
              <span>{text.batchOptConflict}</span>
              <Select value={globalOpts.onConflict} onValueChange={(v) => updateGlobal({ onConflict: v as BatchOptions['onConflict'] })}>
                <SelectTrigger className="h-7 w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="skip">{text.batchConflictSkip}</SelectItem>
                  <SelectItem value="overwrite">{text.batchConflictOverwrite}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {progress && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {progress}
            </div>
          )}

          {/* Status filters */}
          <div className="flex flex-wrap gap-1.5">
            {(['all', 'auto', 'review', 'organized', 'nomatch', 'error', 'done', 'skipped'] as const).map((f) => {
              const n = f === 'all' ? items.length : counts[f] ?? 0;
              if (f !== 'all' && n === 0) return null;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-xs transition-colors',
                    filter === f ? 'border-brand bg-brand/10 text-brand' : 'text-muted-foreground hover:border-brand/40',
                  )}
                >
                  {f === 'all' ? text.batchFilterAll : statusMeta(f, text).label} {n}
                </button>
              );
            })}
          </div>

          {shown.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{text.batchNoItems}</p>
          ) : (
            <div className="space-y-2">
              {shown.map((it) => {
                const meta = statusMeta(it.status, text);
                const KindIcon = it.kind === 'music' ? Music : Film;
                const expanded = expandedId === it.id;
                const hasOverrides = Boolean(it.options && Object.keys(it.options).length > 0);
                const canConfigure = it.status === 'auto' || it.status === 'review';
                const hasMatch = it.candidates.length > 0 || it.kind === 'music';
                const expandable = it.status !== 'done';
                const triBool = (key: 'scrapeArtwork' | 'downloadSubtitles' | 'removeUnmatched') =>
                  it.options?.[key] === undefined ? 'inherit' : it.options[key] ? 'on' : 'off';
                return (
                  <div key={it.id} className="overflow-hidden rounded-lg border bg-card shadow-sm">
                    {/* Header row — click anywhere to expand (except the done open-dir icon). */}
                    <div
                      role={expandable ? 'button' : undefined}
                      onClick={expandable ? () => setExpandedId(expanded ? null : it.id) : undefined}
                      className={cn(
                        'flex items-center gap-3 p-3',
                        expandable && 'cursor-pointer hover:bg-muted/40',
                      )}
                    >
                      {it.poster ? (
                        <img src={it.poster} alt="" className="h-12 w-12 shrink-0 rounded object-cover ring-1 ring-black/5 dark:ring-white/10" />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
                          <KindIcon className="h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium', meta.cls)}>
                            {meta.label}
                          </span>
                          <span className="truncate text-sm font-medium">
                            {it.title || baseName(it.sourcePath)}
                            {it.year ? <span className="ml-1 text-muted-foreground">({it.year})</span> : null}
                          </span>
                          {hasOverrides && (
                            <span className="shrink-0 rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-medium text-brand">
                              {text.batchOptCustomized}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="truncate">{baseName(it.sourcePath)}</span>
                          {it.targetPath && (
                            <>
                              <ChevronRight className="h-3 w-3 shrink-0" />
                              <span className="truncate font-mono">{baseName(it.targetPath)}</span>
                            </>
                          )}
                        </div>
                        {it.error && <p className="mt-0.5 truncate text-xs text-destructive">{it.error}</p>}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {it.status === 'done' && it.targetPath && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title={text.openTargetDir}
                            onClick={(e) => { e.stopPropagation(); ipc.openPath(it.targetPath!); }}
                          >
                            <FolderInput className="h-4 w-4" />
                          </Button>
                        )}
                        {expandable && (
                          <ChevronDown
                            className={cn('h-4 w-4 text-muted-foreground transition-transform', expanded && 'rotate-180')}
                          />
                        )}
                      </div>
                    </div>

                    {/* Unified detail panel: 匹配 + 选项 + 动作. */}
                    {expanded && (
                      <div className="border-t bg-muted/20">
                        {hasMatch && (
                          <div className="space-y-2 p-3">
                            <p className="text-xs font-medium text-muted-foreground">{text.batchSectionMatch}</p>
                            <button
                              onClick={() => handlePick(it.id, null)}
                              className={cn(
                                'w-full rounded-lg border px-3 py-2 text-left text-sm hover:border-brand/50 hover:bg-brand/5',
                                it.chosenId == null ? 'border-brand bg-brand/5 text-foreground' : 'border-dashed text-muted-foreground',
                              )}
                            >
                              {it.kind === 'music' ? text.musicUseLocalTags : text.batchStatusNomatch}
                            </button>
                            {it.candidates.map((c) => (
                              <ResultCard
                                key={c.id}
                                candidate={toCandidate(c)}
                                selected={it.chosenId === c.id}
                                onClick={() => handlePick(it.id, c.id)}
                              />
                            ))}
                          </div>
                        )}

                        {canConfigure && (
                          <div className="space-y-2 border-t p-3">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-medium text-muted-foreground">{text.batchSectionOptions}</p>
                              {hasOverrides && (
                                <button
                                  onClick={() => ipc.batchSetItemOptions(it.id, null).then(load)}
                                  className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                                >
                                  {text.batchOptReset}
                                </button>
                              )}
                            </div>
                            {([
                              ['scrapeArtwork', text.batchOptScrape],
                              ['downloadSubtitles', text.batchOptSubtitle],
                              ['removeUnmatched', text.batchOptRemoveUnmatched],
                            ] as const).map(([key, label]) => (
                              <div key={key} className="flex items-center justify-between gap-3">
                                <span className="text-sm">{label}</span>
                                <Select value={triBool(key)} onValueChange={(v) => setItemOpt(it, key, v)}>
                                  <SelectTrigger className="h-7 w-32"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="inherit">{text.batchOptFollowGlobal}</SelectItem>
                                    <SelectItem value="on">{text.batchOptOn}</SelectItem>
                                    <SelectItem value="off">{text.batchOptOff}</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ))}
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm">{text.batchOptConflict}</span>
                              <Select value={it.options?.onConflict ?? 'inherit'} onValueChange={(v) => setItemOpt(it, 'onConflict', v)}>
                                <SelectTrigger className="h-7 w-32"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="inherit">{text.batchOptFollowGlobal}</SelectItem>
                                  <SelectItem value="skip">{text.batchConflictSkip}</SelectItem>
                                  <SelectItem value="overwrite">{text.batchConflictOverwrite}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-end border-t p-3">
                          <Button variant="ghost" size="sm" onClick={() => handleSkip(it)}>
                            {it.status === 'skipped' ? text.batchUnskip : text.batchSkip}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
