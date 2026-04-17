// src/store/selectors.ts
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './index.ts';

const selectAllVulnerabilities = (state: RootState) => state.vulnerabilities.data;

/** Field-level inputs so a new `filters` object (Immer) does not rerun unrelated steps. */
const selectFilterMode = (state: RootState) => state.vulnerabilities.filters.filterMode;
const selectSeverityFilter = (state: RootState) => state.vulnerabilities.filters.severityFilter;
const selectSearchQuery = (state: RootState) => state.vulnerabilities.filters.searchQuery;
const selectSortField = (state: RootState) => state.vulnerabilities.filters.sortField;
const selectSortDirection = (state: RootState) => state.vulnerabilities.filters.sortDirection;

// Which CVEs kaiStatus filtering removes
const KAI_STATUS_MAP = {
  analysis: 'invalid - norisk',
  'ai-analysis': 'ai-invalid-norisk',
} as const;

// Step 1: apply kaiStatus filter mode
const selectFilterModeFiltered = createSelector(
  selectAllVulnerabilities,
  selectFilterMode,
  (data, filterMode) => {
    if (filterMode === 'none') return data;

    const excluded = new Set<string>();
    if (filterMode === 'analysis' || filterMode === 'both') {
      excluded.add(KAI_STATUS_MAP['analysis']);
    }
    if (filterMode === 'ai-analysis' || filterMode === 'both') {
      excluded.add(KAI_STATUS_MAP['ai-analysis']);
    }

    return data.filter(
      (v) => !v.kaiStatus || !excluded.has(v.kaiStatus)
    );
  }
);

// Step 2: apply severity filter
const selectSeverityFiltered = createSelector(
  selectFilterModeFiltered,
  selectSeverityFilter,
  (data, severityFilter) => {
    if (severityFilter.length === 0) return data;
    const allowed = new Set(severityFilter);
    return data.filter((v) => allowed.has(v.severity));
  }
);

// Step 3: apply search query
const selectSearchFiltered = createSelector(
  selectSeverityFiltered,
  selectSearchQuery,
  (data, searchQuery) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return data;
    return data.filter(
      (v) =>
        v.cve.toLowerCase().includes(query) ||
        v.packageName.toLowerCase().includes(query) ||
        v.description.toLowerCase().includes(query) ||
        v.groupName.toLowerCase().includes(query) ||
        v.repoName.toLowerCase().includes(query)
    );
  }
);

// Step 4: apply sort
export const selectFilteredVulnerabilities = createSelector(
  selectSearchFiltered,
  selectSortField,
  selectSortDirection,
  (data, sortField, sortDirection) => {
    return [...data].sort((a, b) => {
      const aVal = a[sortField] ?? '';
      const bVal = b[sortField] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }
);

// Filter impact counts -- drives the visual on the Analysis buttons
export const selectFilterImpact = createSelector(
  selectAllVulnerabilities,
  (data) => {
    const analysisCount = data.filter(
      (v) => v.kaiStatus === 'invalid - norisk'
    ).length;
    const aiAnalysisCount = data.filter(
      (v) => v.kaiStatus === 'ai-invalid-norisk'
    ).length;
    const bothCount = data.filter(
      (v) => v.kaiStatus === 'invalid - norisk' || v.kaiStatus === 'ai-invalid-norisk'
    ).length;
    return { analysisCount, aiAnalysisCount, bothCount };
  }
);

// Severity distribution for the pie/bar chart
export const selectSeverityDistribution = createSelector(
  selectFilteredVulnerabilities,
  (data) => {
    const counts: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      unknown: 0,
    };
    for (const v of data) {
      const key = v.severity ?? 'unknown';
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }
);

// Risk factor frequency for the bar chart
export const selectRiskFactorFrequency = createSelector(
  selectFilteredVulnerabilities,
  (data) => {
    const counts: Record<string, number> = {};
    for (const v of data) {
      for (const rf of v.riskFactorList) {
        counts[rf] = (counts[rf] ?? 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }
);

// Monthly trend for the line chart
export const selectMonthlyTrend = createSelector(
  selectFilteredVulnerabilities,
  (data) => {
    const counts: Record<string, number> = {};
    for (const v of data) {
      const month = v.published?.slice(0, 7);
      if (month && month !== '0001-01') {
        counts[month] = (counts[month] ?? 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }
);

// Total count after all filters -- for the metrics summary
export const selectFilteredCount = createSelector(
  selectFilteredVulnerabilities,
  (data) => data.length
);