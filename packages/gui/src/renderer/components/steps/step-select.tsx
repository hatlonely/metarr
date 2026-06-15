'use client';

import { useState, useCallback, useEffect } from 'react';
import { FileVideo, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/src/renderer/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/renderer/components/ui/select';
import { StepShell } from '@/src/renderer/components/layout/step-shell';
import { StepFooter } from '@/src/renderer/components/layout/step-footer';
import { cn } from '@/src/renderer/lib/utils';
import { ipc } from '@/src/renderer/lib/ipc';
import { t, type Locale } from '@/src/renderer/lib/i18n';

interface StepSelectProps {
  locale: Locale;
  step: number;
  loading: boolean;
  mediaType: 'tv' | 'movie' | 'auto';
  onMediaTypeChange: (type: 'tv' | 'movie' | 'auto') => void;
  onSelect: () => void;
  onDrop: (filePath: string) => void;
}

export function StepSelect({
  locale,
  step,
  loading,
  mediaType,
  onMediaTypeChange,
  onSelect,
  onDrop,
}: StepSelectProps) {
  const text = t(locale);
  const [dragOver, setDragOver] = useState(false);

  // Prevent Electron from navigating to dropped files
  useEffect(() => {
    const prevent = (e: DragEvent) => e.preventDefault();
    document.addEventListener('dragover', prevent);
    document.addEventListener('drop', prevent);
    return () => {
      document.removeEventListener('dragover', prevent);
      document.removeEventListener('drop', prevent);
    };
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) onDrop(ipc.getPathForFile(file));
    },
    [onDrop],
  );

  return (
    <StepShell
      title={text.steps.select}
      description={text.stepDesc.select}
      step={step}
      width="md"
      footer={
        <StepFooter>
          <Button variant="brand" size="lg" onClick={onSelect} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileVideo className="h-4 w-4" />
            )}
            {text.selectMedia}
          </Button>
        </StepFooter>
      }
    >
      <div className="space-y-5">
        {/* Media type */}
        <div className="flex items-center justify-between gap-4">
          <label className="text-sm font-medium">{text.mediaType}</label>
          <Select
            value={mediaType}
            onValueChange={(v) => onMediaTypeChange(v as 'tv' | 'movie' | 'auto')}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">{text.autoDetect}</SelectItem>
              <SelectItem value="tv">{text.tvShow}</SelectItem>
              <SelectItem value="movie">{text.movie}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Drop zone (primary affordance) */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={onSelect}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-all duration-200',
            dragOver
              ? 'border-brand bg-brand/5'
              : 'border-border hover:border-brand/40 hover:bg-muted/30',
          )}
        >
          <div
            className={cn(
              'mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors',
              dragOver ? 'bg-brand-gradient text-white' : 'bg-brand/10 text-brand',
            )}
          >
            <Upload className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium">{text.dragDropHint}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {text.orClickSelect} · {text.dragDropFormats}
          </p>
        </div>
      </div>
    </StepShell>
  );
}
