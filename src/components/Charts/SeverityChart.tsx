// src/components/Charts/SeverityChart.tsx
import { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAppSelector } from '../../store/hooks';
import { selectSeverityDistribution } from '../../store/selectors';

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
  unknown: '#6b7280',
};

/** Darker fills on hover (aligned with RiskFactorChart bar tiers) */
const SEVERITY_COLORS_HOVER: Record<string, string> = {
  critical: '#b91c1c',
  high: '#c2410c',
  medium: '#a16207',
  low: '#15803d',
  unknown: '#4b5563',
};

function sectorFill(name: string, isHovered: boolean): string {
  const key = name as keyof typeof SEVERITY_COLORS;
  const base = SEVERITY_COLORS[key] ?? '#6b7280';
  if (!isHovered) return base;
  return SEVERITY_COLORS_HOVER[key] ?? '#4b5563';
}

export function SeverityChart() {
  const data = useAppSelector(selectSeverityDistribution);
  const filtered = data.filter((d) => d.value > 0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">
        Severity Distribution
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={filtered}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            stroke="#ffffff"
            strokeWidth={1}
            rootTabIndex={-1}
            onMouseEnter={(_entry, index) => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {filtered.map((entry, i) => (
              <Cell
                key={entry.name}
                fill={sectorFill(String(entry.name), hoveredIndex === i)}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#111827',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#f9fafb',
            }}
            formatter={(value, name) => [
              Number(value ?? 0).toLocaleString(),
              String(name ?? '').charAt(0).toUpperCase() + String(name ?? '').slice(1),
            ]}
          />
          <Legend
            formatter={(value) => (
              <span style={{ color: '#9ca3af', fontSize: 12 }}>
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
