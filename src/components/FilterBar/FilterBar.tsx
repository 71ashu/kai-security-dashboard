// src/components/FilterBar/FilterBar.tsx
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
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
import { buildSearchSuggestions } from '../../utils/searchSuggestions';
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

const KIND_LABEL: Record<string, string> = {
  cve: 'CVE',
  package: 'Package',
  group: 'Group',
  repo: 'Repository',
};

export function FilterBar() {
  const dispatch = useAppDispatch();
  const filterMode = useAppSelector((s) => s.vulnerabilities.filters.filterMode);
  const severityFilter = useAppSelector((s) => s.vulnerabilities.filters.severityFilter);
  const searchQuery = useAppSelector((s) => s.vulnerabilities.filters.searchQuery);
  const allVulnerabilities = useAppSelector((s) => s.vulnerabilities.data);
  const filteredCount = useAppSelector(selectFilteredCount);
  const { analysisCount, aiAnalysisCount, bothCount } = useAppSelector(selectFilterImpact);

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const listboxId = useId();
  const blurCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    return () => {
      if (blurCloseTimerRef.current) clearTimeout(blurCloseTimerRef.current);
    };
  }, []);

  const deferredSearch = useDeferredValue(localSearch);

  const suggestions = useMemo(
    () => buildSearchSuggestions(allVulnerabilities, deferredSearch),
    [allVulnerabilities, deferredSearch]
  );

  useEffect(() => {
    setHighlightIndex(-1);
  }, [deferredSearch, suggestions.length]);

  const dispatchSearch = useCallback(
    (val: string) => {
      dispatch(searchQuerySet(val));
    },
    [dispatch]
  );

  const handleSearchInputChange = useCallback((val: string) => {
    setLocalSearch(val);
  }, []);

  const submitSearch = useCallback(() => {
    dispatchSearch(localSearch);
  }, [dispatchSearch, localSearch]);

  const applySuggestion = useCallback(
    (text: string) => {
      setLocalSearch(text);
      dispatchSearch(text);
      setSuggestionsOpen(false);
      setHighlightIndex(-1);
    },
    [dispatchSearch]
  );

  const cancelBlurClose = useCallback(() => {
    if (blurCloseTimerRef.current) {
      clearTimeout(blurCloseTimerRef.current);
      blurCloseTimerRef.current = null;
    }
  }, []);

  const scheduleBlurClose = useCallback(() => {
    cancelBlurClose();
    blurCloseTimerRef.current = setTimeout(() => {
      setSuggestionsOpen(false);
      setHighlightIndex(-1);
    }, 120);
  }, [cancelBlurClose]);

  const onSearchKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        if (suggestions.length > 0 && highlightIndex >= 0 && suggestions[highlightIndex]) {
          e.preventDefault();
          applySuggestion(suggestions[highlightIndex].primary);
          return;
        }
        e.preventDefault();
        dispatchSearch(localSearch);
        setSuggestionsOpen(false);
        setHighlightIndex(-1);
        return;
      }

      if (e.key === 'Escape') {
        if (suggestionsOpen) {
          e.preventDefault();
          setSuggestionsOpen(false);
          setHighlightIndex(-1);
        }
        return;
      }

      if (!suggestions.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggestionsOpen(true);
        setHighlightIndex((i) => {
          if (i < suggestions.length - 1) return i + 1;
          return i;
        });
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggestionsOpen(true);
        setHighlightIndex((i) => (i > 0 ? i - 1 : -1));
      }
    },
    [suggestions, highlightIndex, applySuggestion, suggestionsOpen, dispatchSearch, localSearch]
  );

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

  const showSuggestionsPanel =
    suggestionsOpen && suggestions.length > 0 && allVulnerabilities.length > 0;

  useLayoutEffect(() => {
    if (!showSuggestionsPanel || highlightIndex < 0) return;
    const el = document.getElementById(`${listboxId}-opt-${highlightIndex}`);
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [showSuggestionsPanel, highlightIndex, listboxId]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 dark:bg-gray-900 dark:border-gray-800">

      {/* Top row: search + reset */}
      <div className="flex items-center gap-3">
        <div className="flex items-stretch gap-2 flex-1 min-w-0">
          <div className="relative flex-1 min-w-0">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none z-10"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={showSuggestionsPanel}
              aria-controls={showSuggestionsPanel ? listboxId : undefined}
              aria-activedescendant={
                showSuggestionsPanel && highlightIndex >= 0
                  ? `${listboxId}-opt-${highlightIndex}`
                  : undefined
              }
              value={localSearch}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              onKeyDown={onSearchKeyDown}
              onFocus={() => {
                cancelBlurClose();
                setSuggestionsOpen(true);
              }}
              onBlur={scheduleBlurClose}
              placeholder="Search by CVE ID, package, description..."
              autoComplete="off"
              className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-4 py-2.5
                         text-sm text-gray-900 placeholder-gray-500
                         focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                         dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:placeholder-gray-500"
            />
            {showSuggestionsPanel && (
              <ul
                id={listboxId}
                role="listbox"
                className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg
                           dark:border-gray-700 dark:bg-gray-900"
              >
                {suggestions.map((s, index) => (
                  <li
                    key={s.id}
                    id={`${listboxId}-opt-${index}`}
                    role="option"
                    aria-selected={highlightIndex === index}
                    className={`flex items-start gap-2 px-3 py-2 text-sm cursor-pointer
                      ${highlightIndex === index
                        ? 'bg-blue-50 dark:bg-blue-950/50'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/80'
                      }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      cancelBlurClose();
                      applySuggestion(s.primary);
                    }}
                    onMouseEnter={() => setHighlightIndex(index)}
                  >
                    <span
                      className="shrink-0 mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide
                                 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    >
                      {KIND_LABEL[s.kind] ?? s.kind}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="font-mono text-gray-900 dark:text-gray-100 break-all">
                        {s.primary}
                      </span>
                      {s.secondary && (
                        <span className="block text-xs text-gray-500 dark:text-gray-500 truncate">
                          {s.secondary}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            onClick={submitSearch}
            className="shrink-0 px-4 py-2.5 rounded-lg text-sm font-medium border border-blue-600
                       bg-blue-600 text-white hover:bg-blue-700 hover:border-blue-700
                       focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-white
                       dark:focus:ring-offset-gray-900 transition-colors"
            aria-label="Search vulnerabilities"
          >
            Search
          </button>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
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
              type="button"
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
            type="button"
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
            type="button"
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
