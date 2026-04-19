// src/components/Dashboard/MetricsSummary.tsx
import { useAppSelector } from '../../store/hooks';
import { selectFilterImpact, selectFilteredCount } from '../../store/selectors';

const TOTAL = 236656;

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

function MetricCard({ label, value, sub, accent }: MetricCardProps) {
  return (
    <div className={`rounded-xl p-5 flex flex-col gap-1 border ${
      accent
        ? 'bg-red-50 border-red-200/80 dark:bg-red-950/40 dark:border-red-800/50'
        : 'bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-800'
    }`}>
      <span className="text-xs text-gray-500 uppercase tracking-widest">{label}</span>
      <span className={`text-3xl font-bold tabular-nums ${accent ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  );
}

export function MetricsSummary() {
  const filteredCount = useAppSelector(selectFilteredCount);
  const { analysisCount, aiAnalysisCount } = useAppSelector(selectFilterImpact);
  const removedCount = TOTAL - filteredCount;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="Total CVEs"
        value={TOTAL}
        sub="in dataset"
      />
      <MetricCard
        label="Visible After Filters"
        value={filteredCount}
        sub={removedCount > 0 ? `${removedCount.toLocaleString()} removed` : 'no filters active'}
        accent={removedCount > 0}
      />
      <MetricCard
        label="Manual Analysis"
        value={analysisCount}
        sub="marked invalid - norisk"
      />
      <MetricCard
        label="AI Analysis"
        value={aiAnalysisCount}
        sub="marked ai-invalid-norisk"
      />
    </div>
  );
}