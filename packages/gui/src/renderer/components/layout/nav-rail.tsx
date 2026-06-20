'use client';

import { Clapperboard, Wand2, History, Settings, Sun, Moon, Monitor, Languages } from 'lucide-react';
import { cn } from '@/src/renderer/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/src/renderer/components/ui/tooltip';
import { useAppTheme } from '@/src/renderer/hooks/use-theme';
import { t } from '@/src/renderer/lib/i18n';

export type AppView = 'rename' | 'history' | 'settings';

interface NavRailProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  onToggleLanguage: () => void;
  locale: 'zh' | 'en';
}

function NavButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full flex-col items-center gap-1 rounded-lg py-1 transition-colors',
        active ? 'text-brand' : 'text-sidebar-foreground/50 hover:text-sidebar-foreground',
      )}
    >
      <span
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
          active ? 'bg-brand/10' : 'hover:bg-sidebar-accent/60',
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-[10px] leading-none">{label}</span>
    </button>
  );
}

export function NavRail({ activeView, onNavigate, onToggleLanguage, locale }: NavRailProps) {
  const { resolvedTheme, toggleTheme, theme } = useAppTheme();
  const text = t(locale);

  const features: { id: AppView; icon: typeof Wand2; label: string }[] = [
    { id: 'rename', icon: Wand2, label: text.navRename },
    { id: 'history', icon: History, label: text.history },
  ];

  return (
    <div className="flex h-full w-16 shrink-0 flex-col items-center border-r border-sidebar-border bg-sidebar-background">
      {/* Brand mark */}
      <div className="py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-sm shadow-brand/30">
          <Clapperboard className="h-5 w-5" />
        </span>
      </div>

      {/* Feature destinations */}
      <nav className="flex w-full flex-1 flex-col items-center gap-1 px-2 pt-1">
        {features.map((f) => (
          <NavButton
            key={f.id}
            icon={f.icon}
            label={f.label}
            active={activeView === f.id}
            onClick={() => onNavigate(f.id)}
          />
        ))}
      </nav>

      {/* Settings + utility toggles */}
      <div className="flex w-full flex-col items-center gap-1 px-2 pb-3">
        <NavButton
          icon={Settings}
          label={text.settings}
          active={activeView === 'settings'}
          onClick={() => onNavigate('settings')}
        />
        <div className="my-1 h-px w-7 bg-sidebar-border" />
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onToggleLanguage}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            >
              <Languages className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {locale === 'zh' ? '切换语言 / Language' : 'Language / 切换语言'}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            >
              {theme === 'system' ? (
                <Monitor className="h-4 w-4" />
              ) : resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {theme === 'system' ? text.system : resolvedTheme === 'dark' ? text.dark : text.light}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
