"use client";

import { cn } from "@/src/renderer/lib/utils";
import type { StepId } from "@/src/renderer/types/workflow";

interface SidebarStepProps {
  id: StepId;
  index: number;
  label: string;
  current: boolean;
  completed: boolean;
  isLast: boolean;
  onClick: () => void;
}

export function SidebarStep({ id, index, label, current, completed, isLast, onClick }: SidebarStepProps) {
  return (
    <div className="relative">
      {/* Vertical connector line */}
      {!isLast && (
        <div
          className={cn(
            "absolute bottom-0 left-[21px] top-8 -translate-x-1/2",
            completed ? "bg-sidebar-primary/20" : "bg-border",
          )}
          style={{ width: "2px" }}
        />
      )}

      <button
        onClick={onClick}
        className={cn(
          "relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150",
          current
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
            : completed
              ? "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              : "text-sidebar-foreground/40 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        )}
      >
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-all duration-150",
            current
              ? "bg-sidebar-primary text-sidebar-primary-foreground ring-2 ring-sidebar-primary/30"
              : completed
                ? "bg-sidebar-primary/20 text-sidebar-primary"
                : "bg-muted text-muted-foreground",
          )}
        >
          {completed ? "\u2713" : index + 1}
        </span>
        <span className="truncate">{label}</span>
      </button>
    </div>
  );
}
