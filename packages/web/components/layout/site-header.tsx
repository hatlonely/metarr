'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useLocale } from '@/hooks/use-locale';
import { t } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Film, Sun, Moon, Monitor, Globe, Menu } from 'lucide-react';

export function SiteHeader() {
  const { locale, setLocale } = useLocale();
  const { theme, setTheme } = useTheme();
  const tr = t(locale);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: '/features', label: tr.nav.features },
    { href: '/demo', label: tr.nav.demo },
    { href: '/docs', label: tr.nav.docs },
    { href: '/download', label: tr.nav.download },
    { href: '/changelog', label: tr.nav.changelog },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Film className="h-5 w-5" />
          <span>Metarr</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}>
            <Globe className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (theme === 'light') setTheme('dark');
              else if (theme === 'dark') setTheme('system');
              else setTheme('light');
            }}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : theme === 'light' ? <Moon className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
          </Button>

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t bg-background md:hidden">
          <nav className="container mx-auto max-w-5xl flex flex-col gap-1 px-4 py-3">
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
          </nav>
        </div>
      )}
    </header>
  );
}
