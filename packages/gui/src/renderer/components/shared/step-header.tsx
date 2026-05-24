'use client';

interface StepHeaderProps {
  title: string;
  description: string;
  step: number;
}

export function StepHeader({ title, description, step }: StepHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          {step}
        </span>
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      </div>
      <p className="mt-1.5 pl-10 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
