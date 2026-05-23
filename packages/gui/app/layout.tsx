import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '@/src/renderer/components/ui/tooltip';
import { Toaster } from '@/src/renderer/components/ui/sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'Metarr - Media Renamer',
  description: 'Rename media files to Jellyfin-compatible naming conventions',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen overflow-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={300}>
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
