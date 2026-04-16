import { useState, useEffect } from 'react';
import type { Vulnerability } from '../types/vulnerability';

const STORAGE_KEY = 'kai-dashboard-prefs';

export const ALL_COLUMNS: Array<keyof Vulnerability> = [
  'cve', 'severity', 'cvss', 'packageName', 'groupName', 'published', 'kaiStatus', 'status',
];

export const COLUMN_LABELS: Partial<Record<keyof Vulnerability, string>> = {
  cve:         'CVE ID',
  severity:    'Severity',
  cvss:        'CVSS',
  packageName: 'Package',
  groupName:   'Group',
  published:   'Published',
  kaiStatus:   'KAI Status',
  status:      'Fix Status',
};

export interface Preferences {
  visibleColumns: Array<keyof Vulnerability>;
  defaultSortField: keyof Vulnerability;
  defaultSortDirection: 'asc' | 'desc';
}

const DEFAULT_PREFS: Preferences = {
  visibleColumns: [...ALL_COLUMNS],
  defaultSortField: 'published',
  defaultSortDirection: 'desc',
};

function loadPrefs(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(loadPrefs);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const toggleColumn = (col: keyof Vulnerability) => {
    setPrefs((p) => {
      const isVisible = p.visibleColumns.includes(col);
      // Always keep at least 2 columns visible
      if (isVisible && p.visibleColumns.length <= 2) return p;
      return {
        ...p,
        visibleColumns: isVisible
          ? p.visibleColumns.filter((c) => c !== col)
          : [...ALL_COLUMNS.filter((c) => p.visibleColumns.includes(c) || c === col)],
      };
    });
  };

  const setDefaultSort = (field: keyof Vulnerability, direction: 'asc' | 'desc') => {
    setPrefs((p) => ({ ...p, defaultSortField: field, defaultSortDirection: direction }));
  };

  const resetPrefs = () => setPrefs(DEFAULT_PREFS);

  return { prefs, toggleColumn, setDefaultSort, resetPrefs };
}
