import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { LocaleProvider } from '@/hooks/use-locale';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import './globals.css';

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

const description =
  '智能媒体文件整理工具：自动解析影视文件名、匹配 TMDB、下载多语言字幕、刮削海报与 NFO，一键重命名为 Jellyfin / Emby / Plex / Kodi 兼容的媒体库结构。';

export const metadata: Metadata = {
  metadataBase: new URL('https://metarr.pages.dev'),
  title: {
    default: 'Metarr — 智能媒体库整理工具',
    template: '%s · Metarr',
  },
  description,
  openGraph: {
    title: 'Metarr — 智能媒体库整理工具',
    description,
    type: 'website',
    url: 'https://metarr.pages.dev',
    siteName: 'Metarr',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Metarr — 智能媒体库整理工具',
    description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LocaleProvider>
            <div className="relative flex min-h-screen flex-col">
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <SiteFooter />
            </div>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
