'use client';

import { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Play,
  Loader2,
  Folder,
  File,
  Image,
  Captions,
  AlertTriangle,
  FileQuestion,
  Trash2,
  ChevronDown,
  FileEdit,
  Ban,
  ShieldAlert,
  FolderOpen,
} from 'lucide-react';
import { Button } from '@/src/renderer/components/ui/button';
import { Card, CardContent } from '@/src/renderer/components/ui/card';
import { Input } from '@/src/renderer/components/ui/input';
import { Label } from '@/src/renderer/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/src/renderer/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/src/renderer/components/ui/alert-dialog';
import { Badge } from '@/src/renderer/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/renderer/components/ui/select';
import { Switch } from '@/src/renderer/components/ui/switch';
import { StepHeader } from '@/src/renderer/components/shared/step-header';
import { t, type Locale } from '@/src/renderer/lib/i18n';
import { ipc } from '@/src/renderer/lib/ipc';
import type {
  RenamePlan,
  ConflictCheckResult,
  ConflictResolutionMap,
  ConflictResolution,
  UnmatchedFileInfo,
  NamingTemplate,
  ArtworkPlan,
  ArtworkType,
  MetadataTask,
  SubtitlePlan,
} from '@metarr/core';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

interface StepPreviewProps {
  locale: Locale;
  step: number;
  plan: RenamePlan;
  executing: boolean;
  regenerating: boolean;
  conflictResult: ConflictCheckResult | null;
  conflictResolutions: ConflictResolutionMap;
  unmatchedFiles: UnmatchedFileInfo[];
  filesToRemove: string[];
  artworkPlan: ArtworkPlan | null;
  artworkLoading: boolean;
  selectedArtworkPaths: string[];
  initialNamingPreset: string;
  initialCustomNamingTemplate: NamingTemplate;
  onBack: () => void;
  onExecute: () => void;
  onRegenerate: (destPath: string, namingPreset: string, customTemplate?: NamingTemplate) => void;
  onSetConflictResolution: (taskIndex: number, resolution: ConflictResolution) => void;
  onSetAllConflictResolutions: (resolution: ConflictResolution) => void;
  onToggleFileRemoval: (filePath: string) => void;
  onSetAllFilesToRemove: (remove: boolean) => void;
  onToggleArtwork: (targetPath: string) => void;
  onSetAllArtwork: (select: boolean) => void;
  subtitlePlan: SubtitlePlan | null;
  subtitleLoading: boolean;
  selectedSubtitlePaths: string[];
  onToggleSubtitle: (targetPath: string) => void;
  onSetAllSubtitles: (select: boolean) => void;
}

/** Extra (download-only) entries injected into the tree alongside renames. */
type FileKind = 'artwork' | 'subtitle';

interface PairFile {
  source: string;
  target: string;
  kind?: FileKind;
}

interface PairNode {
  name: string;
  children: PairNode[];
  files: PairFile[];
}

function buildPairTree(tasks: PairFile[], sourceRoot: string, targetRoot: string): PairNode {
  const root: PairNode = { name: '', children: [], files: [] };

  for (const task of tasks) {
    const srcRel = task.source.replace(sourceRoot + '/', '').replace(sourceRoot, '');
    const tgtRel = task.target.replace(targetRoot + '/', '').replace(targetRoot, '');

    const srcName = srcRel.split('/').pop() || srcRel;
    const tgtParts = tgtRel.split('/').filter(Boolean);

    let node = root;
    for (let i = 0; i < tgtParts.length - 1; i++) {
      let child = node.children.find((c) => c.name === tgtParts[i]);
      if (!child) {
        child = { name: tgtParts[i], children: [], files: [] };
        node.children.push(child);
      }
      node = child;
    }
    node.files.push({ source: srcName, target: tgtParts[tgtParts.length - 1], kind: task.kind });
  }

  return root;
}

/** Flatten the tree into rows: directory spacers and file pairs */
interface TreeRow {
  type: 'dir' | 'file';
  depth: number;
  dirName?: string;
  source?: string;
  target?: string;
  /** Set for injected download-only entries (artwork / subtitle) */
  kind?: FileKind;
}

function flattenTree(node: PairNode, depth: number): TreeRow[] {
  const rows: TreeRow[] = [];

  const startNode = node.name === '' && node.children.length === 1 ? node.children[0] : node;

  function walk(n: PairNode, d: number) {
    if (n.name) {
      rows.push({ type: 'dir', depth: d, dirName: n.name });
    }
    for (const child of n.children) {
      walk(child, d + 1);
    }
    for (const file of n.files) {
      rows.push({
        type: 'file',
        depth: d,
        source: file.source,
        target: file.target,
        kind: file.kind,
      });
    }
  }

  walk(startNode, depth);
  return rows;
}

/** Breadcrumb: show last 2 components with "..." prefix if more exist */
function formatBreadcrumb(path: string): string {
  const parts = path.split('/').filter(Boolean);
  if (parts.length <= 2) return path;
  return '.../' + parts.slice(-2).join('/');
}

/** Clickable path display: breadcrumb by default, full path on click */
function PathDisplay({ path }: { path: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = path.length > 40;
  const display = isLong && !expanded ? formatBreadcrumb(path) : path;

  return (
    <p
      className={`mb-3 cursor-pointer font-mono text-xs text-muted-foreground ${
        isLong && !expanded ? 'truncate' : 'break-all'
      }`}
      onClick={() => isLong && setExpanded(!expanded)}
      title={path}
    >
      {display}
    </p>
  );
}

function artworkTypeLabel(type: ArtworkType, text: ReturnType<typeof t>): string {
  if (type === 'poster') return text.artworkPoster;
  if (type === 'fanart') return text.artworkFanart;
  return text.artworkSeasonPoster;
}

export function StepPreview({
  locale,
  step,
  plan,
  executing,
  regenerating,
  conflictResult,
  conflictResolutions,
  unmatchedFiles,
  filesToRemove,
  artworkPlan,
  artworkLoading,
  selectedArtworkPaths,
  initialNamingPreset,
  initialCustomNamingTemplate,
  onBack,
  onExecute,
  onRegenerate,
  onSetConflictResolution,
  onSetAllConflictResolutions,
  onToggleFileRemoval,
  onSetAllFilesToRemove,
  onToggleArtwork,
  onSetAllArtwork,
  subtitlePlan,
  subtitleLoading,
  selectedSubtitlePaths,
  onToggleSubtitle,
  onSetAllSubtitles,
}: StepPreviewProps) {
  const text = t(locale);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [destPath, setDestPath] = useState(plan.destPath);
  const [namingPreset, setNamingPreset] = useState(initialNamingPreset);
  const [customTemplate, setCustomTemplate] = useState<NamingTemplate>(initialCustomNamingTemplate);

  useEffect(() => {
    setDestPath(plan.destPath);
  }, [plan.destPath]);

  const handleBrowse = async () => {
    try {
      const dir = await ipc.openDirectory();
      if (dir) setDestPath(dir);
    } catch {
      // Ignore
    }
  };

  // Auto-regenerate the plan when output path or naming changes. onRegenerate
  // is an unstable inline prop, so hold the latest via a ref to keep it out of
  // the effect deps (otherwise every render would re-trigger). Skip the first
  // run so entering the step doesn't immediately re-generate the existing plan.
  const onRegenerateRef = useRef(onRegenerate);
  onRegenerateRef.current = onRegenerate;
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    const timer = setTimeout(() => {
      onRegenerateRef.current(
        destPath,
        namingPreset,
        namingPreset === 'custom' ? customTemplate : undefined,
      );
    }, 600);
    return () => clearTimeout(timer);
  }, [destPath, namingPreset, customTemplate]);

  const executeSummary = useMemo(() => {
    const renameTasks = plan.tasks.filter((t) => t.operation === 'rename');
    const overwriteCount = Object.values(conflictResolutions).filter(
      (r) => r === 'overwrite',
    ).length;
    const totalConflicts = conflictResult?.conflicts.length ?? 0;
    const skipCount = totalConflicts - overwriteCount;
    const renamedCount = renameTasks.length - skipCount;
    const metadataCount = selectedArtworkPaths.length;
    const subtitleCount = selectedSubtitlePaths.length;
    return {
      renamedCount,
      skipCount,
      overwriteCount,
      removedCount: filesToRemove.length,
      metadataCount,
      subtitleCount,
    };
  }, [plan, conflictResolutions, conflictResult, filesToRemove, selectedArtworkPaths, selectedSubtitlePaths]);

  const handleConfirmExecute = useCallback(() => {
    setConfirmOpen(false);
    onExecute();
  }, [onExecute]);

  const handleScroll = useCallback((source: 'left' | 'right') => {
    if (syncing.current) return;
    syncing.current = true;
    const srcEl = source === 'left' ? leftRef.current : rightRef.current;
    const tgtEl = source === 'left' ? rightRef.current : leftRef.current;
    if (srcEl && tgtEl) {
      tgtEl.scrollTop = srcEl.scrollTop;
    }
    requestAnimationFrame(() => {
      syncing.current = false;
    });
  }, []);

  const { rows, stats } = useMemo(() => {
    const renameTasks = plan.tasks.filter((task) => task.operation === 'rename');
    const dirCount = plan.tasks.filter((task) => task.operation === 'create-dir').length;

    // Inject selected artwork + subtitles as download-only entries (no source)
    const artworkTasks: PairFile[] = (artworkPlan?.tasks ?? [])
      .filter((t) => selectedArtworkPaths.includes(t.targetPath))
      .map((t) => ({ source: '', target: t.targetPath, kind: 'artwork' }));
    const subtitleTasks: PairFile[] = (subtitlePlan?.tasks ?? [])
      .filter((t) => selectedSubtitlePaths.includes(t.targetPath))
      .map((t) => ({ source: '', target: t.targetPath, kind: 'subtitle' }));

    const tree = buildPairTree(
      [...renameTasks, ...artworkTasks, ...subtitleTasks],
      plan.sourcePath,
      plan.destPath,
    );

    return {
      rows: flattenTree(tree, 0),
      stats: { dirCount, fileCount: renameTasks.length },
    };
  }, [plan, artworkPlan, selectedArtworkPaths, subtitlePlan, selectedSubtitlePaths]);

  const conflictedTargets = useMemo(() => {
    if (!conflictResult) return new Set<string>();
    return new Set(conflictResult.conflicts.map((c) => c.task.target));
  }, [conflictResult]);

  const indent = (depth: number) => ({ paddingLeft: `${depth * 16 + 8}px` });

  return (
    <>
      <StepHeader title={text.previewPlan} description={text.stepDesc.preview} step={step} />

      {/* Output path + naming config */}
      <Card className="mb-4">
        <CardContent className="space-y-4 pt-4">
          {/* Row 1: output path */}
          <div className="space-y-1.5">
            <Label>{text.outputPath}</Label>
            <div className="flex gap-2">
              <Input
                value={destPath}
                onChange={(e) => setDestPath(e.target.value)}
                placeholder="/path/to/media/library"
                className="flex-1 font-mono text-sm"
              />
              <Button variant="outline" size="sm" onClick={handleBrowse}>
                <FolderOpen className="mr-1.5 h-4 w-4" />
                {text.browseDir}
              </Button>
            </div>
          </div>

          {/* Row 2: naming preset */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label>{text.namingPreset}</Label>
              {regenerating && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {text.regenerating}
                </span>
              )}
            </div>
            <Select value={namingPreset} onValueChange={setNamingPreset}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="universal">{text.namingPresetUniversal}</SelectItem>
                <SelectItem value="jellyfin">{text.namingPresetJellyfin}</SelectItem>
                <SelectItem value="emby">{text.namingPresetEmby}</SelectItem>
                <SelectItem value="plex">{text.namingPresetPlex}</SelectItem>
                <SelectItem value="kodi">{text.namingPresetKodi}</SelectItem>
                <SelectItem value="custom">{text.namingPresetCustom}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {namingPreset === 'custom' && (
            <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
              {(
                [
                  ['tvDir', text.namingTemplateTvDir],
                  ['seasonDir', text.namingTemplateSeasonDir],
                  ['episodeFile', text.namingTemplateEpisodeFile],
                  ['movieDir', text.namingTemplateMovieDir],
                  ['movieFile', text.namingTemplateMovieFile],
                ] as const
              ).map(([field, label]) => (
                <div key={field} className="space-y-1">
                  <label className="text-xs text-muted-foreground">{label}</label>
                  <Input
                    value={customTemplate[field]}
                    onChange={(e) =>
                      setCustomTemplate((prev) => ({ ...prev, [field]: e.target.value }))
                    }
                    className="font-mono text-xs"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="mb-4 text-sm text-muted-foreground">
        {plan.summary.mediaType === 'tv'
          ? text.planSummaryTv
              .replace('{name}', plan.summary.name)
              .replace('{count}', String(plan.summary.fileCount))
          : text.planSummaryMovie.replace('{name}', plan.summary.name)}
      </p>

      {/* Stats */}
      <div className="mb-4 flex gap-4 text-sm text-muted-foreground">
        <span>
          {stats.dirCount} {text.dirCount}
        </span>
        <span>·</span>
        <span>
          {stats.fileCount} {text.fileCount}
        </span>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          {/* Conflict warning section */}
          {conflictResult?.hasConflicts && (
            <Collapsible>
              <div className="rounded-lg border border-muted bg-muted/50">
                <CollapsibleTrigger className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-muted/30 [&[data-state=open]>svg]:rotate-180">
                  <div className="flex items-center gap-2 border-l-4 border-yellow-500 pl-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-sm font-semibold">
                      {text.conflictDetected} ({conflictResult.conflicts.length})
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t px-3 pb-3 pt-2">
                    <div className="mb-2 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSetAllConflictResolutions('skip')}
                      >
                        {text.skipAll}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSetAllConflictResolutions('overwrite')}
                      >
                        {text.overwriteAll}
                      </Button>
                    </div>

                    <div className="space-y-1.5">
                      {conflictResult.conflicts.map((conflict) => (
                        <div
                          key={conflict.taskIndex}
                          className="flex items-center gap-3 rounded-md border bg-background p-1.5 text-xs"
                        >
                          <Badge variant={conflict.isSameFile ? 'secondary' : 'destructive'}>
                            {conflict.isSameFile ? text.duplicate : text.conflict}
                          </Badge>

                          <span className="flex-1 truncate font-mono">
                            {conflict.task.target.replace(plan.destPath + '/', '')}
                          </span>

                          <span className="shrink-0 text-muted-foreground">
                            {text.source}: {formatFileSize(conflict.sourceInfo.size)}
                          </span>

                          <span className="shrink-0 text-muted-foreground">
                            {text.target}: {formatFileSize(conflict.targetInfo.size)}
                          </span>

                          <Select
                            value={conflictResolutions[conflict.taskIndex] || 'skip'}
                            onValueChange={(val) =>
                              onSetConflictResolution(conflict.taskIndex, val as ConflictResolution)
                            }
                          >
                            <SelectTrigger className="h-7 w-24 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="overwrite">{text.overwrite}</SelectItem>
                              <SelectItem value="skip">{text.skip}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          )}

          {/* Unmatched files section */}
          {unmatchedFiles.length > 0 && (
            <Collapsible>
              <div className="rounded-lg border border-muted bg-muted/50">
                <CollapsibleTrigger className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-muted/30 [&[data-state=open]>svg]:rotate-180">
                  <div className="flex items-center gap-2 border-l-4 border-orange-500 pl-2">
                    <FileQuestion className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-sm font-semibold">
                      {text.unmatchedFiles} ({unmatchedFiles.length})
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t px-3 pb-3 pt-2">
                    <div className="mb-2 flex items-center justify-end gap-2">
                      <span className="text-xs text-muted-foreground">{text.removeAll}</span>
                      <Switch
                        checked={
                          filesToRemove.length === unmatchedFiles.length &&
                          unmatchedFiles.length > 0
                        }
                        onCheckedChange={(checked) => onSetAllFilesToRemove(checked)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      {unmatchedFiles.map((file) => (
                        <div
                          key={file.path}
                          className="flex items-center gap-3 rounded-md border bg-background p-1.5 text-xs"
                        >
                          <Switch
                            checked={filesToRemove.includes(file.path)}
                            onCheckedChange={() => onToggleFileRemoval(file.path)}
                          />
                          <Badge variant="outline">{file.type}</Badge>
                          <span className="flex-1 truncate font-mono">{file.name}</span>
                          <span className="shrink-0 text-muted-foreground">
                            {formatFileSize(file.size)}
                          </span>
                          {filesToRemove.includes(file.path) && (
                            <Trash2 className="h-3 w-3 text-destructive" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          )}

          {/* Artwork + NFO section */}
          {(artworkLoading || (artworkPlan && artworkPlan.tasks.length > 0)) && (() => {
            const imageTasks = (artworkPlan?.tasks ?? []).filter((t): t is Extract<MetadataTask, { kind: 'image' }> => t.kind === 'image');
            const nfoTasks = (artworkPlan?.tasks ?? []).filter((t): t is Extract<MetadataTask, { kind: 'nfo' }> => t.kind === 'nfo');
            return (
              <Collapsible defaultOpen>
                <div className="rounded-lg border border-muted bg-muted/50">
                  <CollapsibleTrigger className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-muted/30 [&[data-state=open]>svg]:rotate-180">
                    <div className="flex items-center gap-2 border-l-4 border-blue-500 pl-2">
                      <span className="text-sm font-semibold">
                        {text.artwork}
                        {artworkPlan && ` (${artworkPlan.tasks.length})`}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t px-3 pb-3 pt-2">
                      {artworkLoading ? (
                        <p className="py-2 text-xs text-muted-foreground">{text.artworkLoading}</p>
                      ) : (
                        <div className="space-y-3">
                          {/* Select all / deselect all */}
                          {artworkPlan && artworkPlan.tasks.length > 0 && (
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => onSetAllArtwork(true)}>
                                {text.artworkSelectAll}
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => onSetAllArtwork(false)}>
                                {text.artworkDeselectAll}
                              </Button>
                            </div>
                          )}

                          {/* Image thumbnails */}
                          {imageTasks.length > 0 && (
                            <div className="flex flex-wrap gap-3">
                              {imageTasks.map((task) => {
                                const selected = selectedArtworkPaths.includes(task.targetPath);
                                return (
                                  <div
                                    key={task.targetPath}
                                    onClick={() => onToggleArtwork(task.targetPath)}
                                    className={`relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${selected ? 'border-primary' : 'border-transparent opacity-50'}`}
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={task.previewUrl}
                                      alt={task.description}
                                      className={`object-cover ${task.type === 'fanart' ? 'h-20 w-36' : task.type === 'episode-thumb' ? 'h-16 w-28' : 'h-28 w-20'}`}
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-0.5">
                                      <p className="truncate text-center text-xs text-white">
                                        {artworkTypeLabel(task.type, text)}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* NFO file list */}
                          {nfoTasks.length > 0 && (
                            <div className="space-y-1">
                              {nfoTasks.map((task) => {
                                const selected = selectedArtworkPaths.includes(task.targetPath);
                                return (
                                  <div
                                    key={task.targetPath}
                                    onClick={() => onToggleArtwork(task.targetPath)}
                                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1 text-xs transition-all ${selected ? 'border-primary bg-primary/5' : 'border-transparent opacity-50'}`}
                                  >
                                    <File className="h-3 w-3 shrink-0 text-blue-500" />
                                    <span className="font-mono text-muted-foreground">{task.description}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })()}

          {/* Subtitle section */}
          {(subtitleLoading || (subtitlePlan && subtitlePlan.tasks.length > 0)) && (
            <Collapsible defaultOpen>
              <div className="rounded-lg border border-muted bg-muted/50">
                <CollapsibleTrigger className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-muted/30 [&[data-state=open]>svg]:rotate-180">
                  <div className="flex items-center gap-2 border-l-4 border-green-500 pl-2">
                    <span className="text-sm font-semibold">
                      {text.subtitleSection}
                      {subtitlePlan && ` (${subtitlePlan.tasks.length})`}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t px-3 pb-3 pt-2">
                    {subtitleLoading ? (
                      <p className="py-2 text-xs text-muted-foreground">{text.subtitleLoading}</p>
                    ) : subtitlePlan && subtitlePlan.tasks.length > 0 ? (
                      <>
                        <div className="mb-2 flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => onSetAllSubtitles(true)}>
                            {text.subtitleSelectAll}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => onSetAllSubtitles(false)}>
                            {text.subtitleDeselectAll}
                          </Button>
                        </div>
                        <div className="space-y-1">
                          {subtitlePlan.tasks.map((task) => {
                            const selected = selectedSubtitlePaths.includes(task.targetPath);
                            return (
                              <div
                                key={task.targetPath}
                                onClick={() => onToggleSubtitle(task.targetPath)}
                                className={`flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-xs transition-all ${
                                  selected ? 'border-primary bg-primary/5' : 'border-transparent opacity-50'
                                }`}
                              >
                                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                  task.source === 'subdl'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                                }`}>
                                  {task.source === 'subdl' ? 'SubDL' : 'Assrt'}
                                </span>
                                <span className="font-medium text-foreground">{task.languageDisplay}</span>
                                <span className="truncate text-muted-foreground">{task.description}</span>
                                {task.downloadCount > 0 && (
                                  <span className="ml-auto shrink-0 text-muted-foreground">
                                    ↓{task.downloadCount.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <p className="py-2 text-xs text-muted-foreground">{text.subtitleNoResults}</p>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          )}

          {/* Left-Right two-panel comparison */}
          <div className="grid grid-cols-2 gap-4">
            {/* Left panel: original structure */}
            <Card>
              <CardContent className="pt-6">
                <div className="mb-2 flex items-center gap-2 rounded-md bg-muted/30 px-3 py-1.5 text-sm font-semibold">
                  <ArrowLeft className="h-4 w-4" />
                  {text.originalStructure}
                </div>
                <PathDisplay path={plan.sourcePath} />
                <div
                  ref={leftRef}
                  className="max-h-[28rem] space-y-0.5 overflow-y-auto overflow-x-auto"
                  onScroll={() => handleScroll('left')}
                >
                  {rows.map((row, i) =>
                    row.type === 'file' ? (
                      row.kind ? (
                        // Injected (artwork/subtitle) rows have no source: blank placeholder keeps scroll in sync
                        <div key={i} className="h-5 py-0.5" style={indent(row.depth + 1)} />
                      ) : (
                        <div
                          key={i}
                          className={`flex items-center gap-1.5 whitespace-nowrap py-0.5 text-xs text-muted-foreground ${
                            conflictedTargets.has(plan.destPath + '/' + (row.target || ''))
                              ? 'rounded bg-yellow-100 dark:bg-yellow-900/30'
                              : ''
                          }`}
                          style={indent(row.depth + 1)}
                        >
                          <File className="h-3 w-3 shrink-0" />
                          <span className="font-mono">{row.source}</span>
                        </div>
                      )
                    ) : (
                      <div key={i} className="h-6" />
                    ),
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Right panel: new structure */}
            <Card>
              <CardContent className="pt-6">
                <div className="mb-2 flex items-center gap-2 rounded-md bg-muted/30 px-3 py-1.5 text-sm font-semibold">
                  <ArrowRight className="h-4 w-4" />
                  {text.newStructure}
                </div>
                <PathDisplay path={plan.destPath} />
                <div
                  ref={rightRef}
                  className="max-h-[28rem] space-y-0.5 overflow-y-auto overflow-x-auto"
                  onScroll={() => handleScroll('right')}
                >
                  {rows.map((row, i) =>
                    row.type === 'dir' ? (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 whitespace-nowrap py-0.5 text-sm font-medium"
                        style={indent(row.depth)}
                      >
                        <Folder className="h-3.5 w-3.5 text-muted-foreground" />
                        {row.dirName}
                      </div>
                    ) : row.kind === 'artwork' ? (
                      // Artwork file: image icon + blue tint
                      <div
                        key={i}
                        className="flex items-center gap-1.5 whitespace-nowrap py-0.5 text-xs text-blue-500 dark:text-blue-400"
                        style={indent(row.depth + 1)}
                      >
                        <Image className="h-3 w-3 shrink-0" />
                        <span className="font-mono">{row.target}</span>
                      </div>
                    ) : row.kind === 'subtitle' ? (
                      // Subtitle file: captions icon + green tint
                      <div
                        key={i}
                        className="flex items-center gap-1.5 whitespace-nowrap py-0.5 text-xs text-green-600 dark:text-green-400"
                        style={indent(row.depth + 1)}
                      >
                        <Captions className="h-3 w-3 shrink-0" />
                        <span className="font-mono">{row.target}</span>
                      </div>
                    ) : (
                      <div
                        key={i}
                        className={`flex items-center gap-1.5 whitespace-nowrap py-0.5 text-xs text-muted-foreground ${
                          conflictedTargets.has(plan.destPath + '/' + (row.target || ''))
                            ? 'rounded bg-yellow-100 dark:bg-yellow-900/30'
                            : ''
                        }`}
                        style={indent(row.depth + 1)}
                      >
                        <File className="h-3 w-3 shrink-0" />
                        <span className="font-mono">{row.target}</span>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {text.back}
            </Button>
            <Button variant="default" onClick={() => setConfirmOpen(true)} disabled={executing}>
              {executing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {executing ? text.executing : text.confirmExecute}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500/10">
                <ShieldAlert className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />
              </div>
              {text.confirmExecuteTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="sr-only">
              {text.confirmExecuteDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 pt-1">
            <p className="text-sm text-muted-foreground">{text.confirmExecuteDesc}</p>

            <div className="space-y-1.5 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/10">
                    <FileEdit className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  </div>
                  {text.executeRenamed}
                </div>
                <span className="tabular-nums font-semibold">{executeSummary.renamedCount}</span>
              </div>

              {executeSummary.metadataCount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10">
                      <Image className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    {text.executeMetadata}
                  </div>
                  <span className="tabular-nums font-semibold">{executeSummary.metadataCount}</span>
                </div>
              )}

              {executeSummary.subtitleCount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/10">
                      <Captions className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    {text.subtitleSection}
                  </div>
                  <span className="tabular-nums font-semibold">{executeSummary.subtitleCount}</span>
                </div>
              )}

              {executeSummary.overwriteCount > 0 && (
                <div className="flex items-center justify-between rounded-md bg-yellow-500/10 px-1.5 py-1 text-sm">
                  <div className="flex items-center gap-2.5 text-yellow-700 dark:text-yellow-300">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500/20">
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </div>
                    {text.executeOverwritten}
                  </div>
                  <span className="tabular-nums font-semibold text-yellow-700 dark:text-yellow-300">
                    {executeSummary.overwriteCount}
                  </span>
                </div>
              )}

              {executeSummary.skipCount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                      <Ban className="h-3.5 w-3.5" />
                    </div>
                    {text.executeSkipped}
                  </div>
                  <span className="tabular-nums text-muted-foreground">
                    {executeSummary.skipCount}
                  </span>
                </div>
              )}

              {executeSummary.removedCount > 0 && (
                <div className="flex items-center justify-between rounded-md bg-destructive/10 px-1.5 py-1 text-sm">
                  <div className="flex items-center gap-2.5 text-destructive">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive/20">
                      <Trash2 className="h-3.5 w-3.5" />
                    </div>
                    {text.executeRemoved}
                  </div>
                  <span className="tabular-nums font-semibold text-destructive">
                    {executeSummary.removedCount}
                  </span>
                </div>
              )}
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>{text.close}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmExecute}>
              {text.confirmExecute}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
