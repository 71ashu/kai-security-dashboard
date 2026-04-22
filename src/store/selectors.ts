// src/store/selectors.ts
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './index.ts';
import type { Vulnerability } from '../types';

const selectComparisonIds = (state: RootState) => state.comparison.ids;

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  unknown: 4,
};

function compareVulnRows(
  a: Vulnerability,
  b: Vulnerability,
  sortField: keyof Vulnerability,
  sortDirection: 'asc' | 'desc'
): number {
  let cmp = 0;
  switch (sortField) {
    case 'cvss':
      cmp = (a.cvss ?? 0) - (b.cvss ?? 0);
      break;
    case 'severity':
      cmp =
        (SEVERITY_ORDER[a.severity ?? 'unknown'] ?? 99) -
        (SEVERITY_ORDER[b.severity ?? 'unknown'] ?? 99);
      break;
    case 'published':
      cmp = (a.published ?? '').localeCompare(b.published ?? '');
      break;
    default: {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal ?? '').localeCompare(String(bVal ?? ''));
      }
    }
  }
  return sortDirection === 'asc' ? cmp : -cmp;
}

/** Shared by the sorted selector and CSV export. */
export function sortVulnerabilities(
  data: readonly Vulnerability[],
  sortField: keyof Vulnerability,
  sortDirection: 'asc' | 'desc'
): Vulnerability[] {
  const out = data.slice();
  out.sort((a, b) => compareVulnRows(a, b, sortField, sortDirection));
  return out;
}

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

// Display labels for kaiStatus raw values (mirrors VulnerabilityField rendering)
const KAI_STATUS_LABELS: Record<string, string> = {
  'invalid - norisk': 'manual clear',
  'ai-invalid-norisk': 'ai clear',
};

// Step 3: apply search query
const selectSearchFiltered = createSelector(
  selectSeverityFiltered,
  selectSearchQuery,
  (data, searchQuery) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return data;
    return data.filter((v) => {
      const kaiLabel = v.kaiStatus ? (KAI_STATUS_LABELS[v.kaiStatus] ?? v.kaiStatus.toLowerCase()) : '';
      const cvssStr = v.cvss != null ? v.cvss.toFixed(1) : '';
      return (
        v.cve.toLowerCase().includes(query) ||
        v.packageName.toLowerCase().includes(query) ||
        v.description.toLowerCase().includes(query) ||
        v.groupName.toLowerCase().includes(query) ||
        v.repoName.toLowerCase().includes(query) ||
        kaiLabel.includes(query) ||
        (v.kaiStatus?.toLowerCase() ?? '').includes(query) ||
        (v.status?.toLowerCase() ?? '').includes(query) ||
        cvssStr.includes(query)
      );
    });
  }
);

/** Filtered rows in ingestion order (no sort). Use for counts and aggregations. */
export const selectFilteredList = selectSearchFiltered;

// Sorted list for the table only — charts use `selectFilteredList` via shared aggregations.
export const selectFilteredVulnerabilities = createSelector(
  selectFilteredList,
  selectSortField,
  selectSortDirection,
  (data, sortField, sortDirection) =>
    sortVulnerabilities(data, sortField, sortDirection)
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

// One pass over filtered rows for all three charts (avoids triple iteration + sort).
const selectChartAggregations = createSelector(selectFilteredList, (data) => {
  const severityCounts: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    unknown: 0,
  };
  const riskCounts: Record<string, number> = {};
  const monthCounts: Record<string, number> = {};

  for (const v of data) {
    const key = v.severity ?? 'unknown';
    severityCounts[key] = (severityCounts[key] ?? 0) + 1;

    for (const rf of v.riskFactorList) {
      riskCounts[rf] = (riskCounts[rf] ?? 0) + 1;
    }

    const month = v.published?.slice(0, 7);
    if (month && month !== '0001-01') {
      monthCounts[month] = (monthCounts[month] ?? 0) + 1;
    }
  }

  const severityDistribution = Object.entries(severityCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const riskFactorFrequency = Object.entries(riskCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const monthlyTrend = Object.entries(monthCounts)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return { severityDistribution, riskFactorFrequency, monthlyTrend };
});

export const selectSeverityDistribution = createSelector(
  selectChartAggregations,
  (agg) => agg.severityDistribution
);

export const selectRiskFactorFrequency = createSelector(
  selectChartAggregations,
  (agg) => agg.riskFactorFrequency
);

export const selectMonthlyTrend = createSelector(
  selectChartAggregations,
  (agg) => agg.monthlyTrend
);

// Total count after all filters -- for the metrics summary
export const selectFilteredCount = createSelector(
  selectFilteredList,
  (data) => data.length
);

/** Resolve compare selection to full vulnerability rows, preserving selection order. */
export const selectCompareVulnerabilities = createSelector(
  selectAllVulnerabilities,
  selectComparisonIds,
  (data, ids) => {
    const map = new Map(data.map((v) => [v.id, v]));
    return ids.map((id) => map.get(id)).filter((v): v is Vulnerability => v != null);
  }
);