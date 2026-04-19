// src/components/FilterBar/FilterBar.tsx
import { useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  filterModeSet,
  searchQuerySet,
  severityFilterSet,
  filtersReset,
} from '../../store/vulnerabilitiesSlice';
import {
  selectFilterImpact,
  selectFilteredCount,
} from '../../store/selectors';
import type { Severity } from '../../types/vulnerability';

const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low'];

const SEVERITY_COLORS: Record<Severity, string> = {
  critical:
    'bg-red-500/15 text-red-700 border-red-500/35 hover:bg-red-500/25 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/40 dark:hover:bg-red-500/30',
  high:
    'bg-orange-500/15 text-orange-800 border-orange-500/35 hover:bg-orange-500/25 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/40 dark:hover:bg-orange-500/30',
  medium:
    'bg-yellow-500/15 text-yellow-800 border-yellow-500/40 hover:bg-yellow-500/25 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/40 dark:hover:bg-yellow-500/30',
  low:
    'bg-green-500/15 text-green-800 border-green-500/35 hover:bg-green-500/25 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/40 dark:hover:bg-green-500/30',
  unknown:
    'bg-gray-500/15 text-gray-700 border-gray-400/50 hover:bg-gray-500/25 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/40 dark:hover:bg-gray-500/30',
};

export function FilterBar() {
  const dispatch = useAppDispatch();
  const filterMode = useAppSelector((s) => s.vulnerabilities.filters.filterMode);
  const severityFilter = useAppSelector((s) => s.vulnerabilities.filters.severityFilter);
  const searchQuery = useAppSelector((s) => s.vulnerabilities.filters.searchQuery);
  const filteredCount = useAppSelector(selectFilteredCount);
  const { analysisCount, aiAnalysisCount, bothCount } = useAppSelector(selectFilterImpact);

  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Debounce search dispatch
  const handleSearch = useCallback((val: string) => {
    setLocalSearch(val);
    clearTimeout((window as any).__searchTimer);
    (window as any).__searchTimer = setTimeout(() => {
      dispatch(searchQuerySet(val));
    }, 300);
  }, [dispatch]);

  const toggleSeverity = (sev: Severity) => {
    if (severityFilter.includes(sev)) {
      dispatch(severityFilterSet(severityFilter.filter((s) => s !== sev)));
    } else {
      dispatch(severityFilterSet([...severityFilter, sev]));
    }
  };

  const isAnalysisActive = filterMode === 'analysis' || filterMode === 'both';
  const isAiAnalysisActive = filterMode === 'ai-analysis' || filterMode === 'both';
  const hasActiveFilters =
    filterMode !== 'none' || severityFilter.length > 0 || searchQuery !== '';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 dark:bg-gray-900 dark:border-gray-800">

      {/* Top row: search + reset */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by CVE ID, package, description..."
            className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-4 py-2.5
                       text-sm text-gray-900 placeholder-gray-500
                       focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                       dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:placeholder-gray-500"
          />
        </div>
        {hasActiveFilters && (
          <button
            onClick={() => {
              dispatch(filtersReset());
              setLocalSearch('');
            }}
            className="px-3 py-2.5 text-xs text-gray-600 border border-gray-300
                       rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors
                       dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Second row: severity toggles + analysis buttons + count */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Severity filters */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Severity:</span>
          {SEVERITIES.map((sev) => (
            <button
              key={sev}
              onClick={() => toggleSeverity(sev)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-all
                ${SEVERITY_COLORS[sev]}
                ${severityFilter.includes(sev)
                  ? 'ring-2 ring-offset-1 ring-offset-white ring-current scale-105 dark:ring-offset-gray-900'
                  : 'opacity-70'
                }`}
            >
              {sev.charAt(0).toUpperCase() + sev.slice(1)}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-gray-300 dark:bg-gray-700" />

        {/* Analysis buttons -- the core Kai feature */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 uppercase tracking-wider">KAI:</span>

          {/* Analysis button */}
          <button
            onClick={() => dispatch(filterModeSet('analysis'))}
            className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg
                        border text-sm font-medium transition-all duration-200
              ${isAnalysisActive
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/25 dark:shadow-blue-900/40'
                : 'bg-gray-100 border-gray-300 text-gray-800 hover:border-blue-500/50 hover:text-blue-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:text-blue-300'
              }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Analysis
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-mono
              ${isAnalysisActive
                ? 'bg-blue-500/40 text-blue-100'
                : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}>
              -{analysisCount.toLocaleString()}
            </span>
          </button>

          {/* AI Analysis button */}
          <button
            onClick={() => dispatch(filterModeSet('ai-analysis'))}
            className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg
                        border text-sm font-medium transition-all duration-200
              ${isAiAnalysisActive
                ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/25 dark:shadow-purple-900/40'
                : 'bg-gray-100 border-gray-300 text-gray-800 hover:border-purple-500/50 hover:text-purple-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:text-purple-300'
              }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI Analysis
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-mono
              ${isAiAnalysisActive
                ? 'bg-purple-500/40 text-purple-100'
                : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}>
              -{aiAnalysisCount.toLocaleString()}
            </span>
          </button>

          {/* Combined impact indicator -- shows when both are active */}
          {filterMode === 'both' && (
            <span className="text-xs text-gray-700 bg-gray-100 border border-gray-300
                             px-2 py-1 rounded-lg font-mono dark:text-gray-400 dark:bg-gray-800 dark:border-gray-700">
              combined: -{bothCount.toLocaleString()}
            </span>
          )}
        </div>

        {/* Result count */}
        <div className="ml-auto text-sm text-gray-600 dark:text-gray-400">
          <span className="text-gray-900 font-semibold tabular-nums dark:text-white">
            {filteredCount.toLocaleString()}
          </span>
          {' '}vulnerabilities
        </div>

      </div>
    </div>
  );
}