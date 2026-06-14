'use client';

import { Settings, Sun, Moon, Monitor, Languages } from 'lucide-react';
import { Separator } from '@/src/renderer/components/ui/separator';
import { Button } from '@/src/renderer/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/src/renderer/components/ui/tooltip';
import { SidebarStep } from './sidebar-step';
import { Logo } from '@/src/renderer/components/shared/logo';
import { t } from '@/src/renderer/lib/i18n';
import type { StepId } from '@/src/renderer/types/workflow';
import { useAppTheme } from '@/src/renderer/hooks/use-theme';

interface SidebarProps {
  steps: StepId[];
  currentStepIndex: number;
  onStepClick: (step: StepId) => void;
  onOpenSettings: () => void;
  onToggleLanguage: () => void;
  locale: 'zh' | 'en';
}

export function Sidebar({
  steps,
  currentStepIndex,
  onStepClick,
  onOpenSettings,
  onToggleLanguage,
  locale,
}: SidebarProps) {
  const { resolvedTheme, toggleTheme, theme } = useAppTheme();
  const text = t(locale);

  const stepLabels = [
    text.steps.select,
    text.steps.parse,
    text.steps.search,
    text.steps.preview,
    text.steps.execute,
  ];

  return (
    <div className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar-background">
      {/* Logo */}
      <div className="px-4 py-5">
        <Logo title={text.appName} subtitle={text.appDesc} />
      </div>

      <Separator />

      {/* Steps */}
      <nav className="flex-1 space-y-1 p-3">
        {steps.map((step, index) => (
          <SidebarStep
            key={step}
            id={step}
            index={index}
            label={stepLabels[index]}
            current={index === currentStepIndex}
            completed={index < currentStepIndex}
            isLast={index === steps.length - 1}
            onClick={() => {
              if (index <= currentStepIndex) {
                onStepClick(step);
              }
            }}
          />
        ))}
      </nav>

      <Separator />

      {/* Footer */}
      <div className="flex items-center justify-between p-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onOpenSettings}>
              <Settings className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{text.settings}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onToggleLanguage}>
              <Languages className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{locale === 'zh' ? '切换语言 / Language' : 'Language / 切换语言'}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'system' ? (
                <Monitor className="h-4 w-4" />
              ) : resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {theme === 'system' ? text.system : resolvedTheme === 'dark' ? text.dark : text.light}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
