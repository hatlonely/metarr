'use client';

import Link from 'next/link';
import { useLocale } from '@/hooks/use-locale';
import { t } from '@/lib/i18n';
import { siteConfig } from '@/lib/site';
import { Logo } from '@/components/layout/logo';
import { GitHubIcon } from '@/components/ui/icons';

export function SiteFooter() {
  const { locale } = useLocale();
  const tr = t(locale);

  const productLinks = [
    { href: '/features', label: tr.nav.features },
    { href: '/demo', label: tr.nav.demo },
    { href: '/download', label: tr.nav.download },
  ];
  const resourceLinks = [
    { href: '/docs', label: tr.nav.docs },
    { href: '/changelog', label: tr.nav.changelog },
  ];

  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-[1.5fr_1fr_1fr_auto]">
          <div className="space-y-3">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground">{tr.footer.description}</p>
            <p className="text-xs text-muted-foreground/80">{tr.footer.tagline}</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">{tr.footer.product}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {productLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition-colors hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">{tr.footer.resources}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {resourceLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition-colors hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={siteConfig.github}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                >
                  <GitHubIcon className="h-3.5 w-3.5" /> GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {siteConfig.name}. {tr.footer.copyright}
        </div>
      </div>
    </footer>
  );
}
