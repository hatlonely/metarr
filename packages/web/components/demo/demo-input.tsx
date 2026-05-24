'use client';

import { useLocale } from '@/hooks/use-locale';
import { t } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { demoData, type DemoPreset } from '@/lib/demo-data';
import { Search } from 'lucide-react';
import { useState } from 'react';
import type { Locale } from '@/lib/i18n';

interface DemoInputProps {
  inputDirName: string;
  inputFiles: string[];
  onInput: (dirName: string, files: string[]) => void;
  onParse: () => void;
}

export function DemoInput({ inputDirName, inputFiles, onInput, onParse }: DemoInputProps) {
  const { locale } = useLocale();
  const tr = t(locale);
  const [presetIndex, setPresetIndex] = useState<number | null>(null);
  const presets = demoData.presets[locale as Locale];

  const handlePresetChange = (idx: number) => {
    setPresetIndex(idx);
    const preset = presets[idx];
    onInput(preset.dirName, preset.files);
  };

  const handleInputChange = (value: string) => {
    setPresetIndex(null);
    onInput(value, []);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">{tr.demo.preset}</label>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset, idx) => (
            <Button
              key={idx}
              variant={presetIndex === idx ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetChange(idx)}
            >
              {preset.dirName.split('.').slice(0, 2).join(' ')}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">{tr.demo.inputPlaceholder}</label>
        <Input
          value={inputDirName}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={tr.demo.inputPlaceholder}
          className="font-mono text-sm"
        />
      </div>

      <Button onClick={onParse} disabled={!inputDirName.trim()}>
        <Search className="h-4 w-4" />
        {tr.demo.parse}
      </Button>
    </div>
  );
}
