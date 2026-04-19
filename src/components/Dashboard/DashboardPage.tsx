// src/components/Dashboard/DashboardPage.tsx
import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ErrorBoundary } from '../ErrorBoundary';
import { MetricsSummary } from './MetricsSummary';
import { RiskFactorChart, SeverityChart, TrendChart } from '../Charts';
import { FilterBar } from '../FilterBar';
import { VulnerabilityTable } from '../VulnerabilityTable';
import { PreferencesMenu } from '../PreferencesMenu';
import { useAppSelector } from '../../store/hooks';
import { selectFilteredList, sortVulnerabilities } from '../../store/selectors';
import { downloadVulnerabilitiesCsv } from '../../utils/export';

export function DashboardPage() {
  const filteredList = useAppSelector(selectFilteredList);
  const sortField = useAppSelector((s) => s.vulnerabilities.filters.sortField);
  const sortDirection = useAppSelector((s) => s.vulnerabilities.filters.sortDirection);
  const compareCount = useAppSelector((s) => s.comparison.ids.length);

  const handleExportCsv = useCallback(() => {
    downloadVulnerabilitiesCsv(
      sortVulnerabilities(filteredList, sortField, sortDirection)
    );
  }, [filteredList, sortField, sortDirection]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <header className="max-w-screen-2xl mx-auto w-full border-b border-gray-800 px-8 py-4 flex items-center justify-between sticky top-0 bg-gray-950 z-10">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-tight">
            KAI <span className="text-red-500">Security</span>
          </span>
          <span className="text-gray-600 text-sm">|</span>
          <span className="text-gray-400 text-sm">Vulnerability Dashboard</span>
        </div>
        <div className="flex items-center gap-2">
          <PreferencesMenu />
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-700
                       bg-gray-800/80 text-gray-200 hover:bg-gray-800 transition-colors"
          >
            Export CSV
          </button>
          {compareCount >= 2 && (
            <Link
              to="/compare"
              className="px-3 py-1.5 rounded-lg text-sm font-medium border border-amber-500/40
                         bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 transition-colors"
            >
              Compare ({compareCount})
            </Link>
          )}
        </div>
      </header>

      {/* Main content */}
      <ErrorBoundary>
        <main className="px-8 py-6 space-y-6 max-w-screen-2xl mx-auto">

          <MetricsSummary />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <SeverityChart />
            <RiskFactorChart />
            <TrendChart />
          </div>

          <FilterBar />

          <VulnerabilityTable />

        </main>
      </ErrorBoundary>

    </div>
  );
}
