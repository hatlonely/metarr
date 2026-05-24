'use client';

import { useTheme } from 'next-themes';

export function useAppTheme() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    if (resolvedTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  return { theme, resolvedTheme, setTheme, toggleTheme };
}
