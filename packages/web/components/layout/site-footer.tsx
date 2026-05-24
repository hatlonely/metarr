'use client';

import Link from 'next/link';
import { useLocale } from '@/hooks/use-locale';
import { t } from '@/lib/i18n';
import { Film } from 'lucide-react';

export function SiteFooter() {
  const { locale } = useLocale();
  const tr = t(locale);

  return (
    <footer className="border-t">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Film className="h-4 w-4" />
            <span>{tr.footer.description}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/docs" className="hover:text-foreground">{tr.nav.docs}</Link>
            <Link href="/download" className="hover:text-foreground">{tr.nav.download}</Link>
            <Link href="/changelog" className="hover:text-foreground">{tr.nav.changelog}</Link>
          </div>
        </div>
        <div className="mt-4 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {tr.footer.copyright}
        </div>
      </div>
    </footer>
  );
}
