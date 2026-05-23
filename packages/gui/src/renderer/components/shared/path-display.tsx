"use client";

interface PathDisplayProps {
  path: string;
  className?: string;
}

export function PathDisplay({ path, className }: PathDisplayProps) {
  return (
    <code className={`rounded bg-muted px-2 py-1 font-mono text-xs ${className || ""}`}>
      {path}
    </code>
  );
}
