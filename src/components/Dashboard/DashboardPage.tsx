// src/components/Dashboard/DashboardPage.tsx
import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ErrorBoundary } from '../ErrorBoundary';
import { MetricsSummary } from './MetricsSummary';
import { RiskFactorChart, SeverityChart, TrendChart } from '../Charts';
import { FilterBar } from '../FilterBar';
import { VulnerabilityTable } from '../VulnerabilityTable';
import { PreferencesMenu } from '../PreferencesMenu';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle';
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
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">

      {/* Header */}
      <header className="max-w-screen-2xl mx-auto w-full border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 dark:border-gray-800 dark:bg-gray-950/95">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-tight">
            KAI <span className="text-red-600 dark:text-red-500">Security</span>
          </span>
          <span className="text-gray-400 text-sm dark:text-gray-600">|</span>
          <span className="text-gray-600 text-sm dark:text-gray-400">Vulnerability Dashboard</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <PreferencesMenu />
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300
                       bg-gray-100/90 text-gray-800 hover:bg-gray-200 transition-colors
                       dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Export CSV
          </button>
          {compareCount >= 2 && (
            <Link
              to="/compare"
              className="px-3 py-1.5 rounded-lg text-sm font-medium border border-amber-600/35
                         bg-amber-500/15 text-amber-900 hover:bg-amber-500/25 transition-colors
                         dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/20"
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
