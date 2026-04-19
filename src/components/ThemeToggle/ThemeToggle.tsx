import { Moon, Sun } from 'lucide-react';
import { useAppDispatch } from '../../store/hooks';
import { themeSet } from '../../store/preferencesSlice';
import { useEffectiveThemeIsDark } from '../../theme/useEffectiveThemeIsDark';

export function ThemeToggle() {
  const dispatch = useAppDispatch();
  const isDark = useEffectiveThemeIsDark();

  return (
    <button
      type="button"
      onClick={() => dispatch(themeSet(isDark ? 'light' : 'dark'))}
      className="p-2 rounded-lg border border-gray-300 bg-gray-100/90 text-gray-700
                 hover:bg-gray-200 hover:text-gray-900 transition-colors
                 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-300
                 dark:hover:bg-gray-800 dark:hover:text-white"
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? <Sun className="w-4 h-4" strokeWidth={2} /> : <Moon className="w-4 h-4" strokeWidth={2} />}
    </button>
  );
}
