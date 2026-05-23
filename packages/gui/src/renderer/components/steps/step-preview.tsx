"use client";

import { useMemo, useRef, useCallback } from "react";
import { ArrowLeft, ArrowRight, Play, Loader2, Folder, File } from "lucide-react";
import { Button } from "@/src/renderer/components/ui/button";
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

  // Skip virtual root
  const startNode = node.name === "" && node.children.length === 1 ? node.children[0] : node;
  const startDepth = node.name === "" && node.children.length === 1 ? depth : depth;

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

  walk(startNode, startDepth);
  return rows;
}

export function StepPreview({
  locale,
  plan,
  executing,
  onBack,
  onExecute,
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

  const sourceBase = plan.sourcePath.split("/").pop() || plan.sourcePath;
  const targetBase = plan.destPath;

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

      {/* Left-Right two-panel comparison */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left panel: original structure */}
        <div className="rounded-lg border p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <ArrowLeft className="h-4 w-4" />
            {text.originalStructure}
          </div>
          <p className="mb-3 truncate font-mono text-xs text-muted-foreground">
            {sourceBase}
          </p>
          <div
            ref={leftRef}
            className="max-h-[28rem] space-y-px overflow-y-auto overflow-x-auto"
            onScroll={() => handleScroll("left")}
          >
            {rows.map((row, i) =>
              row.type === "file" ? (
                <div
                  key={i}
                  className="flex items-center gap-1.5 whitespace-nowrap py-0.5 text-xs text-muted-foreground"
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
          <p className="mb-3 truncate font-mono text-xs text-muted-foreground">
            {targetBase}
          </p>
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
                  className="flex items-center gap-1.5 whitespace-nowrap py-0.5 text-xs text-muted-foreground"
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
