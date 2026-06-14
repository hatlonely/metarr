'use client';

import { useState, useCallback, useEffect } from 'react';
import { FileVideo, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/src/renderer/components/ui/button';
import { Card, CardContent } from '@/src/renderer/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/renderer/components/ui/select';
import { StepHeader } from '@/src/renderer/components/shared/step-header';
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
    const prevent = (e: DragEvent) => {
      e.preventDefault();
    };
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
      if (file) {
        const filePath = ipc.getPathForFile(file);
        onDrop(filePath);
      }
    },
    [onDrop],
  );

  return (
    <>
      <StepHeader title={text.steps.select} description={text.stepDesc.select} step={step} />

      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
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

          {/* 拖拽区域 */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-all duration-200',
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/40',
            )}
          >
            <Upload className="mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{text.dragDropHint}</p>
            <p className="mt-1 text-xs text-muted-foreground/60">{text.dragDropFormats}</p>
          </div>

          {/* 分隔线 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-xs text-muted-foreground">{text.or}</span>
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex justify-center">
            <Button variant="brand" size="lg" onClick={onSelect} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileVideo className="mr-2 h-4 w-4" />
              )}
              {text.selectMedia}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
