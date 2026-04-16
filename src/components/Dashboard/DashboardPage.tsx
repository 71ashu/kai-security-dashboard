// src/components/Dashboard/DashboardPage.tsx
import { useState } from 'react';
import { MetricsSummary } from './MetricsSummary';
import { SeverityChart } from '../Charts/SeverityChart';
import { RiskFactorChart } from '../Charts/RiskFactorChart';
import { TrendChart } from '../Charts/TrendChart';
import { FilterBar } from '../FilterBar';
import { VulnerabilityTable } from '../VulnerabilityTable';
import type { Vulnerability } from '../../types/vulnerability';

export function DashboardPage() {
  const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(null);

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

      {/* Detail drawer -- step 8 will flesh this out */}
      {selectedVuln && (
        <div className="fixed inset-y-0 right-0 w-[480px] bg-gray-900 border-l border-gray-800
                        shadow-2xl z-20 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-blue-400 font-semibold">{selectedVuln.cve}</span>
            <button
              onClick={() => setSelectedVuln(null)}
              className="text-gray-500 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="text-sm text-gray-400 leading-relaxed">{selectedVuln.description}</div>
          <div className="text-xs text-gray-600">Full detail view coming in step 8</div>
        </div>
      )}

    </div>
  );
}