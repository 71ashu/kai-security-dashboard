import { useState, useEffect, useRef } from 'react';
import { MetricsSummary } from './MetricsSummary';
import { SeverityChart } from '../Charts/SeverityChart';
import { RiskFactorChart } from '../Charts/RiskFactorChart';
import { TrendChart } from '../Charts/TrendChart';
import { FilterBar } from '../FilterBar';
import { VulnerabilityTable } from '../VulnerabilityTable';
import { DetailDrawer } from '../DetailDrawer';
import { ComparisonView } from '../ComparisonView';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { sortChanged } from '../../store/vulnerabilitiesSlice';
import { selectFilteredVulnerabilities } from '../../store/selectors';
import { exportToCSV } from '../../utils/export';
import { usePreferences, ALL_COLUMNS, COLUMN_LABELS } from '../../hooks/usePreferences';
import type { Vulnerability } from '../../types/vulnerability';

export function DashboardPage() {
  const dispatch = useAppDispatch();
  const filteredData = useAppSelector(selectFilteredVulnerabilities);

  const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(null);
  const [compareList, setCompareList] = useState<Vulnerability[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const columnsMenuRef = useRef<HTMLDivElement>(null);

  const { prefs, toggleColumn, setDefaultSort } = usePreferences();

  // Apply saved default sort on first mount
  useEffect(() => {
    dispatch(sortChanged({
      field: prefs.defaultSortField,
      direction: prefs.defaultSortDirection,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close columns dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (columnsMenuRef.current && !columnsMenuRef.current.contains(e.target as Node)) {
        setShowColumnsMenu(false);
      }
    }
    if (showColumnsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColumnsMenu]);

  const handleCompare = (vuln: Vulnerability) => {
    setCompareList((prev) => {
      if (prev.some((v) => v.id === vuln.id) || prev.length >= 4) return prev;
      return [...prev, vuln];
    });
  };

  const handleRemoveFromCompare = (id: string) => {
    setCompareList((prev) => {
      const next = prev.filter((v) => v.id !== id);
      if (next.length === 0) setShowCompare(false);
      return next;
    });
  };

  const handleExport = () => {
    exportToCSV(filteredData);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <header className="border-b border-gray-800 px-8 py-4 flex items-center justify-between sticky top-0 bg-gray-950 z-10">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-tight">
            KAI <span className="text-red-500">Security</span>
          </span>
          <span className="text-gray-600 text-sm">|</span>
          <span className="text-gray-400 text-sm">Vulnerability Dashboard</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Column visibility toggle */}
          <div className="relative" ref={columnsMenuRef}>
            <button
              onClick={() => setShowColumnsMenu((v) => !v)}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400
                         hover:border-gray-500 hover:text-white transition-colors"
            >
              Columns
            </button>
            {showColumnsMenu && (
              <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-3 z-20 w-52 space-y-1">
                <div className="text-xs text-gray-500 uppercase tracking-wider pb-2 border-b border-gray-800">
                  Visible Columns
                </div>
                {ALL_COLUMNS.map((col) => {
                  const isVisible = prefs.visibleColumns.includes(col);
                  return (
                    <label
                      key={col}
                      className="flex items-center gap-2.5 py-1 cursor-pointer hover:text-white text-gray-300 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => toggleColumn(col)}
                        className="accent-red-500"
                      />
                      {COLUMN_LABELS[col]}
                    </label>
                  );
                })}
                <div className="text-xs text-gray-600 pt-2 border-t border-gray-800">
                  Minimum 2 columns required
                </div>
                <div className="pt-1 space-y-1 border-t border-gray-800 mt-2">
                  <div className="text-xs text-gray-500 uppercase tracking-wider py-1">Default Sort</div>
                  <select
                    value={`${prefs.defaultSortField}:${prefs.defaultSortDirection}`}
                    onChange={(e) => {
                      const [field, dir] = e.target.value.split(':') as [keyof Vulnerability, 'asc' | 'desc'];
                      setDefaultSort(field, dir);
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded text-xs text-gray-300 px-2 py-1"
                  >
                    <option value="published:desc">Published ↓ (newest)</option>
                    <option value="published:asc">Published ↑ (oldest)</option>
                    <option value="cvss:desc">CVSS ↓ (highest)</option>
                    <option value="cvss:asc">CVSS ↑ (lowest)</option>
                    <option value="severity:desc">Severity ↓</option>
                    <option value="cve:asc">CVE ID ↑</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExport}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400
                       hover:border-gray-500 hover:text-white transition-colors"
          >
            Export CSV
          </button>

          {/* Compare button — only shown when something is in the list */}
          {compareList.length > 0 && (
            <button
              onClick={() => setShowCompare(true)}
              className="text-xs px-3 py-1.5 rounded-lg border border-blue-500/40 text-blue-400
                         bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
            >
              Compare ({compareList.length})
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="px-8 py-6 space-y-6 max-w-screen-2xl mx-auto">

        <MetricsSummary />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SeverityChart />
          <RiskFactorChart />
          <TrendChart />
        </div>

        <FilterBar />

        <VulnerabilityTable
          onSelectVuln={setSelectedVuln}
          visibleColumns={prefs.visibleColumns}
        />

      </main>

      {/* Detail drawer */}
      <DetailDrawer
        vuln={selectedVuln}
        onClose={() => setSelectedVuln(null)}
        onCompare={handleCompare}
        compareList={compareList}
      />

      {/* Comparison modal */}
      {showCompare && compareList.length > 0 && (
        <ComparisonView
          compareList={compareList}
          onRemove={handleRemoveFromCompare}
          onClose={() => setShowCompare(false)}
        />
      )}

    </div>
  );
}
