'use client';

import { useMemo, useRef, useCallback, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Play,
  Loader2,
  Folder,
  File,
  AlertTriangle,
  FileQuestion,
  Trash2,
  ChevronDown,
  FileEdit,
  Ban,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/src/renderer/components/ui/button';
import { Card, CardContent } from '@/src/renderer/components/ui/card';
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
import type {
  RenamePlan,
  ConflictCheckResult,
  ConflictResolutionMap,
  ConflictResolution,
  UnmatchedFileInfo,
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
  conflictResult: ConflictCheckResult | null;
  conflictResolutions: ConflictResolutionMap;
  unmatchedFiles: UnmatchedFileInfo[];
  filesToRemove: string[];
  onBack: () => void;
  onExecute: () => void;
  onSetConflictResolution: (taskIndex: number, resolution: ConflictResolution) => void;
  onSetAllConflictResolutions: (resolution: ConflictResolution) => void;
  onToggleFileRemoval: (filePath: string) => void;
  onSetAllFilesToRemove: (remove: boolean) => void;
}

interface PairNode {
  name: string;
  children: PairNode[];
  files: { source: string; target: string }[];
}

function buildPairTree(
  tasks: { source: string; target: string }[],
  sourceRoot: string,
  targetRoot: string,
): PairNode {
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
    node.files.push({ source: srcName, target: tgtParts[tgtParts.length - 1] });
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
      rows.push({ type: 'file', depth: d, source: file.source, target: file.target });
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

export function StepPreview({
  locale,
  step,
  plan,
  executing,
  conflictResult,
  conflictResolutions,
  unmatchedFiles,
  filesToRemove,
  onBack,
  onExecute,
  onSetConflictResolution,
  onSetAllConflictResolutions,
  onToggleFileRemoval,
  onSetAllFilesToRemove,
}: StepPreviewProps) {
  const text = t(locale);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const executeSummary = useMemo(() => {
    const renameTasks = plan.tasks.filter((t) => t.operation === 'rename');
    const overwriteCount = Object.values(conflictResolutions).filter(
      (r) => r === 'overwrite',
    ).length;
    const totalConflicts = conflictResult?.conflicts.length ?? 0;
    const skipCount = totalConflicts - overwriteCount;
    const renamedCount = renameTasks.length - skipCount;
    return { renamedCount, skipCount, overwriteCount, removedCount: filesToRemove.length };
  }, [plan, conflictResolutions, conflictResult, filesToRemove]);

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
    const tree = buildPairTree(renameTasks, plan.sourcePath, plan.destPath);

    return {
      rows: flattenTree(tree, 0),
      stats: { dirCount, fileCount: renameTasks.length },
    };
  }, [plan]);

  const conflictedTargets = useMemo(() => {
    if (!conflictResult) return new Set<string>();
    return new Set(conflictResult.conflicts.map((c) => c.task.target));
  }, [conflictResult]);

  const indent = (depth: number) => ({ paddingLeft: `${depth * 16 + 8}px` });

  return (
    <>
      <StepHeader title={text.previewPlan} description={text.stepDesc.preview} step={step} />

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
