import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { LocaleProvider } from '@/hooks/use-locale';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'Metarr - Media File Renamer',
  description:
    '智能媒体文件重命名工具，自动解析影视文件名，匹配 TMDB 信息，一键重命名为 Jellyfin 兼容格式。',
  openGraph: {
    title: 'Metarr - Media File Renamer',
    description:
      '智能媒体文件重命名工具，自动解析影视文件名，匹配 TMDB 信息，一键重命名为 Jellyfin 兼容格式。',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen">
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
