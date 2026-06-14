'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useLocale } from '@/hooks/use-locale';
import { t } from '@/lib/i18n';
import { siteConfig } from '@/lib/site';
import { Logo } from '@/components/layout/logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sun, Moon, Monitor, Languages, Menu, X } from 'lucide-react';
import { GitHubIcon } from '@/components/ui/icons';

export function SiteHeader() {
  const { locale, setLocale } = useLocale();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const tr = t(locale);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const navItems = [
    { href: '/features', label: tr.nav.features },
    { href: '/demo', label: tr.nav.demo },
    { href: '/docs', label: tr.nav.docs },
    { href: '/download', label: tr.nav.download },
    { href: '/changelog', label: tr.nav.changelog },
  ];

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const ThemeIcon = !mounted || theme === 'system' ? Monitor : theme === 'dark' ? Sun : Moon;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 glass">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Metarr">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-md px-3 py-2 text-sm transition-colors',
                  active
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Language"
            onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
          >
            <Languages className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Theme" onClick={cycleTheme}>
            <ThemeIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="GitHub" asChild className="hidden sm:inline-flex">
            <a href={siteConfig.github} target="_blank" rel="noreferrer">
              <GitHubIcon className="h-4 w-4" />
            </a>
          </Button>
          <Button variant="brand" size="sm" asChild className="ml-1 hidden sm:inline-flex">
            <Link href="/download">{tr.nav.download}</Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Menu"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <a
              href={siteConfig.github}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <GitHubIcon className="h-4 w-4" /> {tr.nav.github}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
