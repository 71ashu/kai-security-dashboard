// src/components/Dashboard/DashboardPage.tsx
import { useCallback, useState } from 'react';
import { MetricsSummary } from './MetricsSummary';
import { SeverityChart } from '../Charts/SeverityChart';
import { RiskFactorChart } from '../Charts/RiskFactorChart';
import { TrendChart } from '../Charts/TrendChart';
import { FilterBar } from '../FilterBar';
import { VulnerabilityTable } from '../VulnerabilityTable';
import { DetailDrawer } from '../DetailDrawer';
import { ComparisonView } from '../ComparisonView';
import { PreferencesMenu } from '../PreferencesMenu';
import { useAppSelector } from '../../store/hooks';
import { selectFilteredVulnerabilities } from '../../store/selectors';
import { downloadVulnerabilitiesCsv } from '../../utils/export';
import type { Vulnerability } from '../../types/vulnerability';

export function DashboardPage() {
  const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(null);
  const [comparisonList, setComparisonList] = useState<Vulnerability[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  const filteredVulnerabilities = useAppSelector(selectFilteredVulnerabilities);

  const addToCompare = useCallback((v: Vulnerability) => {
    setComparisonList((prev) => {
      if (prev.some((x) => x.id === v.id)) return prev;
      return [...prev, v];
    });
  }, []);

  const handleExportCsv = useCallback(() => {
    downloadVulnerabilitiesCsv(filteredVulnerabilities);
  }, [filteredVulnerabilities]);

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
          <PreferencesMenu />
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-700
                       bg-gray-800/80 text-gray-200 hover:bg-gray-800 transition-colors"
          >
            Export CSV
          </button>
          {comparisonList.length > 0 && (
            <button
              type="button"
              onClick={() => setCompareModalOpen(true)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border border-amber-500/40
                         bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 transition-colors"
            >
              Compare ({comparisonList.length})
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

        <VulnerabilityTable onSelectVuln={setSelectedVuln} />

      </main>

      {selectedVuln && (
        <DetailDrawer
          vuln={selectedVuln}
          onClose={() => setSelectedVuln(null)}
          onAddToCompare={() => addToCompare(selectedVuln)}
          isInCompareList={comparisonList.some((v) => v.id === selectedVuln.id)}
        />
      )}

      <ComparisonView
        open={compareModalOpen}
        items={comparisonList}
        onClose={() => setCompareModalOpen(false)}
      />

    </div>
  );
}
