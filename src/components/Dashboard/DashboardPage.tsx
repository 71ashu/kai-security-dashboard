// src/components/Dashboard/DashboardPage.tsx
import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ErrorBoundary } from '../ErrorBoundary';
import { AppHeader } from '../Layout';
import { MetricsSummary } from './MetricsSummary';
import { RiskFactorChart, SeverityChart, TrendChart } from '../Charts';
import { FilterBar } from '../FilterBar';
import { VulnerabilityTable } from '../VulnerabilityTable';
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

      <AppHeader
        subtitle="Vulnerability Dashboard"
        actions={
          <>
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
          </>
        }
      />

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
