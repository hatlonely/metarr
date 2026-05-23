"use client";

import { cn } from "@/src/renderer/lib/utils";
import type { StepId } from "@/src/renderer/types/workflow";

interface SidebarStepProps {
  id: StepId;
  index: number;
  label: string;
  current: boolean;
  completed: boolean;
  onClick: () => void;
}

export function SidebarStep({ id, index, label, current, completed, onClick }: SidebarStepProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        current
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : completed
            ? "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            : "text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
      )}
    >
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
          current
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : completed
              ? "bg-sidebar-primary/20 text-sidebar-primary"
              : "bg-muted text-muted-foreground",
        )}
      >
        {completed ? "✓" : index + 1}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}
