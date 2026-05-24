'use client';

import { useState } from 'react';
import { useLocale } from '@/hooks/use-locale';
import { t } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, Terminal, Play, Copy, Check } from 'lucide-react';
import Link from 'next/link';

export default function DownloadPage() {
  const { locale } = useLocale();
  const tr = t(locale);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('npm install -g @metarr/cli');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="container mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-12 text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">{tr.download.title}</h1>
        <p className="text-muted-foreground">{tr.download.subtitle}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Desktop App */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Monitor className="h-8 w-8 text-primary" />
              <CardTitle>{tr.download.desktop}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{tr.download.desktopDesc}</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{tr.download.windows}</Badge>
              <Badge variant="secondary">{tr.download.macOS}</Badge>
              <Badge variant="secondary">{tr.download.linux}</Badge>
            </div>
            <a href="https://github.com/hatlonely/metarr/releases" target="_blank" rel="noopener noreferrer">
              <Button className="w-full">{tr.download.downloadFromGithub}</Button>
            </a>
          </CardContent>
        </Card>

        {/* CLI Tool */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Terminal className="h-8 w-8 text-primary" />
              <CardTitle>{tr.download.cli}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{tr.download.cliDesc}</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-sm">
                npm install -g @metarr/cli
              </code>
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{tr.download.requirements}: {tr.download.requirementsList}</p>
          </CardContent>
        </Card>

        {/* Web Demo */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Play className="h-8 w-8 text-primary" />
              <CardTitle>{tr.download.webDemo}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{tr.download.webDemoDesc}</p>
            </div>
            <Link href="/demo">
              <Button>{tr.download.webDemoBtn}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
