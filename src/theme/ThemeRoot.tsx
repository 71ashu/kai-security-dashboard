import { useLayoutEffect, type ReactNode } from 'react';
import { useEffectiveThemeIsDark } from './useEffectiveThemeIsDark';

export function ThemeRoot({ children }: { children: ReactNode }) {
  const isDark = useEffectiveThemeIsDark();
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }, [isDark]);
  return children;
}
