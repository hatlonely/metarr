'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from '@/hooks/use-locale';
import { t } from '@/lib/i18n';
import { siteConfig } from '@/lib/site';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Reveal } from '@/components/ui/reveal';
import { Monitor, TerminalSquare, Play, Copy, Check, Download } from 'lucide-react';

const INSTALL_CMD = `npm install -g ${siteConfig.cliPackage}`;
const RUN_CMD = `npx ${siteConfig.cliPackage} rename /path/to/media`;

export default function DownloadPage() {
  const { locale } = useLocale();
  const tr = t(locale);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-glow" />
      <section className="container relative mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <Reveal className="mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{tr.download.title}</h1>
          <p className="mt-3 text-muted-foreground">{tr.download.subtitle}</p>
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Desktop App */}
          <Reveal>
            <Card className="relative h-full border-brand/30">
              <CardContent className="space-y-5 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-sm">
                      <Monitor className="h-5 w-5" />
                    </span>
                    <h2 className="text-lg font-semibold">{tr.download.desktop}</h2>
                  </div>
                  <Badge className="bg-brand/10 text-brand">{tr.download.desktopBadge}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{tr.download.desktopDesc}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{tr.download.windows}</Badge>
                  <Badge variant="secondary">{tr.download.macOS}</Badge>
                </div>
                <Button variant="brand" className="w-full" asChild>
                  <a href={siteConfig.releases} target="_blank" rel="noreferrer">
                    <Download className="h-4 w-4" />
                    {tr.download.downloadFromGithub}
                  </a>
                </Button>
              </CardContent>
            </Card>
          </Reveal>

          {/* CLI Tool */}
          <Reveal delay={0.05}>
            <Card className="h-full">
              <CardContent className="space-y-5 p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <TerminalSquare className="h-5 w-5" />
                  </span>
                  <h2 className="text-lg font-semibold">{tr.download.cli}</h2>
                </div>
                <p className="text-sm text-muted-foreground">{tr.download.cliDesc}</p>
                <CommandLine label={tr.download.cliInstall} command={INSTALL_CMD} tr={tr} />
                <CommandLine label={tr.download.cliRun} command={RUN_CMD} tr={tr} />
                <p className="text-xs text-muted-foreground">
                  {tr.download.requirements}: {tr.download.requirementsList}
                </p>
              </CardContent>
            </Card>
          </Reveal>

          {/* Web Demo */}
          <Reveal delay={0.1} className="lg:col-span-2">
            <Card>
              <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Play className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold">{tr.download.webDemo}</h2>
                    <p className="text-sm text-muted-foreground">{tr.download.webDemoDesc}</p>
                  </div>
                </div>
                <Button variant="outline" asChild className="shrink-0">
                  <Link href="/demo">{tr.download.webDemoBtn}</Link>
                </Button>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

function CommandLine({
  label,
  command,
  tr,
}: {
  label: string;
  command: string;
  tr: ReturnType<typeof t>;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 overflow-x-auto rounded-md bg-muted px-3 py-2 font-mono text-xs whitespace-nowrap scrollbar-thin">
          {command}
        </code>
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopy}
          aria-label={copied ? tr.download.copied : tr.download.copy}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
