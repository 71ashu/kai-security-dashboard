// src/store/vulnerabilitiesSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Vulnerability, FilterState, FilterMode, Severity } from '../types';
import { DATASET_VULN_TOTAL } from '../constants';

interface VulnerabilitiesState {
  data: Vulnerability[];
  totalLoaded: number;
  isLoading: boolean;
  loadingProgress: number;
  downloadProgress: number;
  error: string | null;
  filters: FilterState;
}

const initialFilterState: FilterState = {
  filterMode: 'none',
  searchQuery: '',
  severityFilter: [],
  sortField: 'published',
  sortDirection: 'desc',
};

export const vulnerabilitiesInitialState: VulnerabilitiesState = {
  data: [],
  totalLoaded: 0,
  isLoading: false,
  loadingProgress: 0,
  downloadProgress: 0,
  error: null,
  filters: initialFilterState,
};

const vulnerabilitiesSlice = createSlice({
  name: 'vulnerabilities',
  initialState: vulnerabilitiesInitialState,
  reducers: {
    loadingStarted(state) {
      state.isLoading = true;
      state.error = null;
      state.data = [];
      state.totalLoaded = 0;
      state.loadingProgress = 0;
      state.downloadProgress = 0;
    },
    downloadProgressUpdated(state, action: PayloadAction<number>) {
      state.downloadProgress = action.payload;
    },
    batchReceived(state, action: PayloadAction<Vulnerability[]>) {
      state.data.push(...action.payload);
    },
    progressUpdated(state, action: PayloadAction<number>) {
      state.totalLoaded = action.payload;
      state.loadingProgress = Math.min(
        Math.round((action.payload / DATASET_VULN_TOTAL) * 100),
        99
      );
    },
    loadingCompleted(state, action: PayloadAction<number>) {
      state.isLoading = false;
      state.totalLoaded = action.payload;
      state.loadingProgress = 100;
    },
    loadingFailed(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },
    filterModeSet(state, action: PayloadAction<FilterMode>) {
      // Toggle behavior: clicking an active filter turns it off
      if (state.filters.filterMode === action.payload) {
        state.filters.filterMode = 'none';
        return;
      }
      // If one filter is active and you click the other, combine to 'both'
      if (
        (state.filters.filterMode === 'analysis' && action.payload === 'ai-analysis') ||
        (state.filters.filterMode === 'ai-analysis' && action.payload === 'analysis')
      ) {
        state.filters.filterMode = 'both';
        return;
      }
      state.filters.filterMode = action.payload;
    },
    searchQuerySet(state, action: PayloadAction<string>) {
      state.filters.searchQuery = action.payload;
    },
    severityFilterSet(state, action: PayloadAction<Severity[]>) {
      state.filters.severityFilter = action.payload;
    },
    sortChanged(
      state,
      action: PayloadAction<{ field: keyof Vulnerability; direction: 'asc' | 'desc' }>
    ) {
      state.filters.sortField = action.payload.field;
      state.filters.sortDirection = action.payload.direction;
    },
    filtersReset(state) {
      state.filters = initialFilterState;
    },
  },
});

export const {
  loadingStarted,
  batchReceived,
  progressUpdated,
  downloadProgressUpdated,
  loadingCompleted,
  loadingFailed,
  filterModeSet,
  searchQuerySet,
  severityFilterSet,
  sortChanged,
  filtersReset,
} = vulnerabilitiesSlice.actions;

export default vulnerabilitiesSlice.reducer;