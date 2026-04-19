import { useSyncExternalStore } from 'react';
import { useAppSelector } from '../store/hooks';

function subscribeSystemDark(callback: () => void) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}

function getSystemDarkSnapshot() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getSystemDarkServerSnapshot() {
  return false;
}

/** Resolves preferences + system appearance to whether the UI should use dark styles. */
export function useEffectiveThemeIsDark(): boolean {
  const theme = useAppSelector((s) => s.preferences.theme);
  const systemDark = useSyncExternalStore(
    subscribeSystemDark,
    getSystemDarkSnapshot,
    getSystemDarkServerSnapshot
  );
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return systemDark;
}
