// src/store/preferencesSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import type { Middleware, PayloadAction } from '@reduxjs/toolkit';
import type { Vulnerability } from '../types/vulnerability';
import { sortChanged } from './vulnerabilitiesSlice';

const STORAGE_KEY = 'kai-security-dashboard-preferences';

export type DensityMode = 'comfortable' | 'compact';

export const TABLE_COLUMNS_META = [
  { key: 'cve' as const, label: 'CVE ID', width: 176, sortable: true },
  { key: 'severity' as const, label: 'Severity', width: 112, sortable: true },
  { key: 'cvss' as const, label: 'CVSS', width: 80, sortable: true },
  { key: 'packageName' as const, label: 'Package', width: 192, sortable: true },
  { key: 'groupName' as const, label: 'Group', width: 176, sortable: true },
  { key: 'published' as const, label: 'Published', width: 128, sortable: true },
  { key: 'kaiStatus' as const, label: 'KAI Status', width: 160, sortable: false },
  { key: 'status' as const, label: 'Fix Status', width: 200, sortable: false },
] as const;

export type TableColumnKey = (typeof TABLE_COLUMNS_META)[number]['key'];

const ORDERED_KEYS: TableColumnKey[] = TABLE_COLUMNS_META.map((c) => c.key);

const isTableColumnKey = (k: string): k is TableColumnKey =>
  ORDERED_KEYS.includes(k as TableColumnKey);

export interface PreferencesState {
  visibleColumns: TableColumnKey[];
  defaultSortField: keyof Vulnerability;
  defaultSortDirection: 'asc' | 'desc';
  densityMode: DensityMode;
}

export const DEFAULT_PREFERENCES: PreferencesState = {
  visibleColumns: [...ORDERED_KEYS],
  defaultSortField: 'published',
  defaultSortDirection: 'desc',
  densityMode: 'comfortable',
};

function normalizeVisibleColumns(raw: unknown): TableColumnKey[] {
  if (!Array.isArray(raw)) return [...ORDERED_KEYS];
  const set = new Set<TableColumnKey>();
  for (const item of raw) {
    if (typeof item === 'string' && isTableColumnKey(item)) set.add(item);
  }
  if (set.size === 0) return [...ORDERED_KEYS];
  return ORDERED_KEYS.filter((k) => set.has(k));
}

export function loadPersistedPreferences(): PreferencesState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES, visibleColumns: [...ORDERED_KEYS] };
    const parsed = JSON.parse(raw) as Partial<PreferencesState>;
    const visibleColumns = normalizeVisibleColumns(parsed.visibleColumns);
    let defaultSortField: keyof Vulnerability = DEFAULT_PREFERENCES.defaultSortField;
    if (typeof parsed.defaultSortField === 'string' && isTableColumnKey(parsed.defaultSortField)) {
      defaultSortField = parsed.defaultSortField;
    }
    let defaultSortDirection: 'asc' | 'desc' = DEFAULT_PREFERENCES.defaultSortDirection;
    if (parsed.defaultSortDirection === 'asc' || parsed.defaultSortDirection === 'desc') {
      defaultSortDirection = parsed.defaultSortDirection;
    }
    let densityMode: DensityMode = DEFAULT_PREFERENCES.densityMode;
    if (parsed.densityMode === 'comfortable' || parsed.densityMode === 'compact') {
      densityMode = parsed.densityMode;
    }
    return {
      visibleColumns,
      defaultSortField,
      defaultSortDirection,
      densityMode,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES, visibleColumns: [...ORDERED_KEYS] };
  }
}

export function persistPreferences(state: PreferencesState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / private mode */
  }
}

const initialState: PreferencesState = loadPersistedPreferences();

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    columnVisibilityToggled(state, action: PayloadAction<TableColumnKey>) {
      const key = action.payload;
      const set = new Set(state.visibleColumns);
      if (set.has(key)) {
        if (set.size <= 1) return;
        set.delete(key);
      } else {
        set.add(key);
      }
      state.visibleColumns = ORDERED_KEYS.filter((k) => set.has(k));
    },
    densityModeSet(state, action: PayloadAction<DensityMode>) {
      state.densityMode = action.payload;
    },
    sortPreferencesSynced(
      state,
      action: PayloadAction<{ field: keyof Vulnerability; direction: 'asc' | 'desc' }>
    ) {
      state.defaultSortField = action.payload.field;
      state.defaultSortDirection = action.payload.direction;
    },
    preferencesResetToDefaults(state) {
      state.visibleColumns = [...DEFAULT_PREFERENCES.visibleColumns];
      state.defaultSortField = DEFAULT_PREFERENCES.defaultSortField;
      state.defaultSortDirection = DEFAULT_PREFERENCES.defaultSortDirection;
      state.densityMode = DEFAULT_PREFERENCES.densityMode;
    },
  },
});

export const {
  columnVisibilityToggled,
  densityModeSet,
  sortPreferencesSynced,
  preferencesResetToDefaults,
} = preferencesSlice.actions;

export default preferencesSlice.reducer;

export function createPreferencesPersistMiddleware(): Middleware {
  return (store) => (next) => (action) => {
    const result = next(action);
    if (preferencesSlice.actions.columnVisibilityToggled.match(action)
      || preferencesSlice.actions.densityModeSet.match(action)
      || preferencesSlice.actions.sortPreferencesSynced.match(action)
      || preferencesSlice.actions.preferencesResetToDefaults.match(action)) {
      persistPreferences(store.getState().preferences);
    }
    return result;
  };
}

export function createSortSyncMiddleware(): Middleware {
  return (store) => (next) => (action) => {
    const result = next(action);
    if (sortChanged.match(action)) {
      store.dispatch(
        sortPreferencesSynced({
          field: action.payload.field,
          direction: action.payload.direction,
        })
      );
    }
    return result;
  };
}
