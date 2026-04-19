// src/components/PreferencesMenu/PreferencesMenu.tsx
import { useEffect, useRef, useState } from 'react';
import { Monitor, Moon, Settings, Sun } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  TABLE_COLUMNS_META,
  columnVisibilityToggled,
  densityModeSet,
  themeSet,
  preferencesResetToDefaults,
  DEFAULT_PREFERENCES,
} from '../../store/preferencesSlice';
import { sortChanged } from '../../store/vulnerabilitiesSlice';

export function PreferencesMenu() {
  const dispatch = useAppDispatch();
  const visibleColumns = useAppSelector((s) => s.preferences.visibleColumns);
  const densityMode = useAppSelector((s) => s.preferences.densityMode);
  const theme = useAppSelector((s) => s.preferences.theme);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const visibleSet = new Set(visibleColumns);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const handleReset = () => {
    dispatch(preferencesResetToDefaults());
    dispatch(
      sortChanged({
        field: DEFAULT_PREFERENCES.defaultSortField,
        direction: DEFAULT_PREFERENCES.defaultSortDirection,
      })
    );
    setOpen(false);
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className="p-2 rounded-lg border border-gray-300 bg-gray-100/90 text-gray-700
                   hover:bg-gray-200 hover:text-gray-900 transition-colors
                   dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
        title="Preferences"
      >
        <Settings className="w-4 h-4" strokeWidth={2} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-72 rounded-xl border border-gray-200 bg-white
                     shadow-xl shadow-gray-900/10 z-50 py-3 px-3 text-sm
                     dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/40"
        >
          <div className="text-xs text-gray-500 uppercase tracking-wider px-1 mb-2">Appearance</div>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-4 dark:border-gray-800">
            {(
              [
                { id: 'light' as const, label: 'Light', Icon: Sun },
                { id: 'dark' as const, label: 'Dark', Icon: Moon },
                { id: 'system' as const, label: 'System', Icon: Monitor },
              ] as const
            ).map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => dispatch(themeSet(id))}
                title={label}
                className={`flex-1 flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors border-r border-gray-200 last:border-r-0 dark:border-gray-800
                  ${theme === id
                    ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                    : 'bg-white/80 text-gray-500 hover:text-gray-800 dark:bg-gray-900/80 dark:text-gray-500 dark:hover:text-gray-300'
                  }`}
              >
                <Icon className="w-4 h-4" strokeWidth={2} />
                {label}
              </button>
            ))}
          </div>

          <div className="text-xs text-gray-500 uppercase tracking-wider px-1 mb-2">Columns</div>
          <ul className="space-y-1 max-h-48 overflow-y-auto mb-4 pr-1">
            {TABLE_COLUMNS_META.map((col) => {
              const checked = visibleSet.has(col.key);
              const onlyOne = visibleColumns.length <= 1 && checked;
              return (
                <li key={col.key}>
                  <label
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer
                      hover:bg-gray-100/90 dark:hover:bg-gray-800/80 ${onlyOne ? 'opacity-60' : ''}`}
                  >
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 bg-white text-blue-600
                                 focus:ring-blue-500/30 focus:ring-offset-0 focus:ring-2
                                 dark:border-gray-600 dark:bg-gray-800 dark:text-blue-500"
                      checked={checked}
                      disabled={onlyOne}
                      onChange={() => dispatch(columnVisibilityToggled(col.key))}
                    />
                    <span className="text-gray-800 dark:text-gray-200">{col.label}</span>
                  </label>
                </li>
              );
            })}
          </ul>

          <div className="text-xs text-gray-500 uppercase tracking-wider px-1 mb-2">Row density</div>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-4 dark:border-gray-800">
            <button
              type="button"
              onClick={() => dispatch(densityModeSet('comfortable'))}
              className={`flex-1 py-2 text-xs font-medium transition-colors
                ${densityMode === 'comfortable'
                  ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                  : 'bg-white/80 text-gray-500 hover:text-gray-800 dark:bg-gray-900/80 dark:text-gray-500 dark:hover:text-gray-300'}`}
            >
              Comfortable
            </button>
            <button
              type="button"
              onClick={() => dispatch(densityModeSet('compact'))}
              className={`flex-1 py-2 text-xs font-medium transition-colors border-l border-gray-200 dark:border-gray-800
                ${densityMode === 'compact'
                  ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                  : 'bg-white/80 text-gray-500 hover:text-gray-800 dark:bg-gray-900/80 dark:text-gray-500 dark:hover:text-gray-300'}`}
            >
              Compact
            </button>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="w-full py-2 rounded-lg text-xs font-medium border border-gray-300
                       text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors
                       dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800/80 dark:hover:text-gray-200"
          >
            Reset to defaults
          </button>
        </div>
      )}
    </div>
  );
}
