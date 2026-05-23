import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Metarr - Media Renamer',
  description: 'Rename media files to Jellyfin-compatible naming conventions',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        {children}
      </body>
    </html>
  );
}
