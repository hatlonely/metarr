"use client";

import { useMemo, useRef, useCallback, useState } from "react";
import { ArrowLeft, ArrowRight, Play, Loader2, Folder, File, AlertTriangle, FileQuestion, Trash2 } from "lucide-react";
import { Button } from "@/src/renderer/components/ui/button";
import { Badge } from "@/src/renderer/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/renderer/components/ui/select";
import { Switch } from "@/src/renderer/components/ui/switch";
import { StepHeader } from "@/src/renderer/components/shared/step-header";
import { t, type Locale } from "@/src/renderer/lib/i18n";
import type { RenamePlan, ConflictCheckResult, ConflictResolutionMap, ConflictResolution, UnmatchedFileInfo } from "@metarr/core";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

interface StepPreviewProps {
  locale: Locale;
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
  const root: PairNode = { name: "", children: [], files: [] };

  for (const task of tasks) {
    const srcRel = task.source.replace(sourceRoot + "/", "").replace(sourceRoot, "");
    const tgtRel = task.target.replace(targetRoot + "/", "").replace(targetRoot, "");

    const srcName = srcRel.split("/").pop() || srcRel;
    const tgtParts = tgtRel.split("/").filter(Boolean);

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
  type: "dir" | "file";
  depth: number;
  dirName?: string;
  source?: string;
  target?: string;
}

function flattenTree(node: PairNode, depth: number): TreeRow[] {
  const rows: TreeRow[] = [];

  const startNode = node.name === "" && node.children.length === 1 ? node.children[0] : node;

  function walk(n: PairNode, d: number) {
    if (n.name) {
      rows.push({ type: "dir", depth: d, dirName: n.name });
    }
    for (const child of n.children) {
      walk(child, d + 1);
    }
    for (const file of n.files) {
      rows.push({ type: "file", depth: d, source: file.source, target: file.target });
    }
  }

  walk(startNode, depth);
  return rows;
}

/** Breadcrumb: show last 2 components with "..." prefix if more exist */
function formatBreadcrumb(path: string): string {
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 2) return path;
  return ".../" + parts.slice(-2).join("/");
}

/** Clickable path display: breadcrumb by default, full path on click */
function PathDisplay({ path }: { path: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = path.length > 40;
  const display = isLong && !expanded ? formatBreadcrumb(path) : path;

  return (
    <p
      className={`mb-3 cursor-pointer font-mono text-xs text-muted-foreground ${
        isLong && !expanded ? "truncate" : "break-all"
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

  const handleScroll = useCallback(
    (source: "left" | "right") => {
      if (syncing.current) return;
      syncing.current = true;
      const srcEl = source === "left" ? leftRef.current : rightRef.current;
      const tgtEl = source === "left" ? rightRef.current : leftRef.current;
      if (srcEl && tgtEl) {
        tgtEl.scrollTop = srcEl.scrollTop;
      }
      requestAnimationFrame(() => {
        syncing.current = false;
      });
    },
    [],
  );

  const { rows, stats } = useMemo(() => {
    const renameTasks = plan.tasks.filter((task) => task.operation === "rename");
    const dirCount = plan.tasks.filter((task) => task.operation === "create-dir").length;
    const tree = buildPairTree(renameTasks, plan.sourcePath, plan.destPath);

    return {
      rows: flattenTree(tree, 0),
      stats: { dirCount, fileCount: renameTasks.length },
    };
  }, [plan]);

  const conflictedTargets = useMemo(() => {
    if (!conflictResult) return new Set<string>();
    return new Set(conflictResult.conflicts.map(c => c.task.target));
  }, [conflictResult]);

  const indent = (depth: number) => ({ paddingLeft: `${depth * 16 + 8}px` });

  return (
    <>
      <StepHeader title={text.previewPlan} description={text.stepDesc.preview} />

      <p className="mb-4 text-sm text-muted-foreground">{plan.summary}</p>

      {/* Stats */}
      <div className="mb-4 flex gap-4 text-sm text-muted-foreground">
        <span>{stats.dirCount} {text.dirCount}</span>
        <span>{stats.fileCount} {text.fileCount}</span>
      </div>

      {/* Conflict warning section */}
      {conflictResult?.hasConflicts && (
        <div className="mb-4 rounded-lg border border-yellow-500/50 bg-yellow-50 p-4 dark:bg-yellow-950/20">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                {text.conflictDetected} ({conflictResult.conflicts.length})
              </span>
            </div>
            <div className="flex items-center gap-2">
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
          </div>

          <div className="space-y-2">
            {conflictResult.conflicts.map((conflict) => (
              <div
                key={conflict.taskIndex}
                className="flex items-center gap-3 rounded-md border bg-background p-2 text-xs"
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
                  value={conflictResolutions[conflict.taskIndex] || 'overwrite'}
                  onValueChange={(val) => onSetConflictResolution(conflict.taskIndex, val as ConflictResolution)}
                >
                  <SelectTrigger className="h-7 w-24 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overwrite">{text.overwrite}</SelectItem>
                    <SelectItem value="skip">{text.skip}</SelectItem>
                    <SelectItem value="abort">{text.abort}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unmatched files section */}
      {unmatchedFiles.length > 0 && (
        <div className="mb-4 rounded-lg border border-orange-500/50 bg-orange-50 p-4 dark:bg-orange-950/20">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileQuestion className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                {text.unmatchedFiles} ({unmatchedFiles.length})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{text.removeAll}</span>
              <Switch
                checked={filesToRemove.length === unmatchedFiles.length && unmatchedFiles.length > 0}
                onCheckedChange={(checked) => onSetAllFilesToRemove(checked)}
              />
            </div>
          </div>

          <div className="space-y-2">
            {unmatchedFiles.map((file) => (
              <div
                key={file.path}
                className="flex items-center gap-3 rounded-md border bg-background p-2 text-xs"
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
      )}

      {/* Left-Right two-panel comparison */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left panel: original structure */}
        <div className="rounded-lg border p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <ArrowLeft className="h-4 w-4" />
            {text.originalStructure}
          </div>
          <PathDisplay path={plan.sourcePath} />
          <div
            ref={leftRef}
            className="max-h-[28rem] space-y-px overflow-y-auto overflow-x-auto"
            onScroll={() => handleScroll("left")}
          >
            {rows.map((row, i) =>
              row.type === "file" ? (
                <div
                  key={i}
                  className={`flex items-center gap-1.5 whitespace-nowrap py-0.5 text-xs text-muted-foreground ${
                    conflictedTargets.has(plan.destPath + '/' + (row.target || '')) ? 'rounded bg-yellow-100 dark:bg-yellow-900/30' : ''
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
        </div>

        {/* Right panel: new structure */}
        <div className="rounded-lg border p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <ArrowRight className="h-4 w-4" />
            {text.newStructure}
          </div>
          <PathDisplay path={plan.destPath} />
          <div
            ref={rightRef}
            className="max-h-[28rem] space-y-px overflow-y-auto overflow-x-auto"
            onScroll={() => handleScroll("right")}
          >
            {rows.map((row, i) =>
              row.type === "dir" ? (
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
                    conflictedTargets.has(plan.destPath + '/' + (row.target || '')) ? 'rounded bg-yellow-100 dark:bg-yellow-900/30' : ''
                  }`}
                  style={indent(row.depth + 1)}
                >
                  <File className="h-3 w-3 shrink-0" />
                  <span className="font-mono">{row.target}</span>
                </div>
              ),
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {text.back}
        </Button>
        <Button variant="default" onClick={onExecute} disabled={executing}>
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
