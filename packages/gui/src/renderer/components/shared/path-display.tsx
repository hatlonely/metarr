"use client";

interface PathDisplayProps {
  path: string;
  className?: string;
}

export function PathDisplay({ path, className }: PathDisplayProps) {
  return (
    <code className={`rounded bg-muted/50 px-1.5 py-0.5 font-mono text-xs text-muted-foreground ${className || ""}`}>
      {path}
    </code>
  );
}
