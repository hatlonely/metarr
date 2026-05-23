"use client";

import { Settings, Sun, Moon, Monitor } from "lucide-react";
import { Separator } from "@/src/renderer/components/ui/separator";
import { Button } from "@/src/renderer/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/src/renderer/components/ui/tooltip";
import { SidebarStep } from "./sidebar-step";
import { t } from "@/src/renderer/lib/i18n";
import type { StepId } from "@/src/renderer/types/workflow";
import { useAppTheme } from "@/src/renderer/hooks/use-theme";

interface SidebarProps {
  steps: StepId[];
  currentStepIndex: number;
  onStepClick: (step: StepId) => void;
  onOpenSettings: () => void;
  locale: "zh" | "en";
}

export function Sidebar({ steps, currentStepIndex, onStepClick, onOpenSettings, locale }: SidebarProps) {
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
      <div className="border-l-4 border-primary px-5 py-5">
        <h1 className="text-lg font-bold tracking-tight text-sidebar-foreground">{text.appName}</h1>
        <p className="mt-0.5 text-[11px] text-sidebar-foreground/50">{text.appDesc}</p>
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
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "system" ? (
                <Monitor className="h-4 w-4" />
              ) : resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {theme === "system"
              ? text.system
              : resolvedTheme === "dark"
                ? text.dark
                : text.light}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
