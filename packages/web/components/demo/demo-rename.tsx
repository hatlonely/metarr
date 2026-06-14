import type { FakeRenamePlan } from '@/lib/demo-data';
import { FolderOpen, ArrowRight } from 'lucide-react';

interface DemoRenameProps {
  plan: FakeRenamePlan;
  labels: {
    original: string;
    renamed: string;
    newStructure: string;
  };
}

export function DemoRename({ plan, labels }: DemoRenameProps) {
  return (
    <div className="space-y-4">
      {/* Directory rename */}
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <div className="min-w-0 flex-1 rounded-lg border bg-destructive/5 p-3">
          <p className="mb-1 text-xs text-muted-foreground">{labels.original}</p>
          <p className="truncate font-mono text-sm">{plan.originalDirName}</p>
        </div>
        <ArrowRight className="hidden h-5 w-5 shrink-0 text-muted-foreground sm:block" />
        <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground sm:hidden rotate-90" />
        <div className="min-w-0 flex-1 rounded-lg border bg-primary/5 p-3">
          <p className="mb-1 text-xs text-muted-foreground">{labels.renamed}</p>
          <p className="truncate font-mono text-sm">{plan.newDirName}</p>
        </div>
      </div>

      {/* File rename table */}
      <div>
        <p className="mb-2 text-sm font-medium">{labels.newStructure}</p>
        <div className="rounded-lg border">
          {/* New dir header */}
          <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-2">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-sm font-medium">{plan.newDirName}/</span>
          </div>

          {/* Files */}
          <div className="divide-y">
            {plan.files.map((file, i) => (
              <div key={i}>
                {file.renamed.includes('/') && (
                  <div className="flex items-center gap-2 border-b bg-muted/10 px-6 py-1.5">
                    <FolderOpen className="h-3 w-3 text-muted-foreground" />
                    <span className="font-mono text-xs text-muted-foreground">
                      {file.renamed.split('/')[0]}/
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3 px-6 py-2">
                  <span className="truncate font-mono text-xs text-destructive">
                    {file.original}
                  </span>
                  <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <span className="truncate font-mono text-xs text-primary">
                    {file.renamed.includes('/')
                      ? file.renamed.split('/').slice(1).join('/')
                      : file.renamed}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
