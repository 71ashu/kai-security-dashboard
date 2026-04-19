// src/components/Charts/RiskFactorChart.tsx
import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useAppSelector } from '../../store/hooks';
import { selectRiskFactorFrequency } from '../../store/selectors';
import { useEffectiveThemeIsDark } from '../../theme/useEffectiveThemeIsDark';
import {
  chartAxisTickMuted,
  chartAxisTickSecondary,
  chartTooltipContentStyleAlt,
} from '../../theme/chartTheme';

/** Base / hover (darker) fills by bar rank */
function barFills(index: number, isHovered: boolean): string {
  if (index === 0) {
    return isHovered ? '#b91c1c' : '#ef4444';
  }
  if (index < 3) {
    return isHovered ? '#c2410c' : '#f97316';
  }
  return isHovered ? '#1d4ed8' : '#3b82f6';
}

export function RiskFactorChart() {
  const data = useAppSelector(selectRiskFactorFrequency);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const isDark = useEffectiveThemeIsDark();

  return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3 dark:bg-gray-900 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-widest dark:text-gray-300">
          Top Risk Factors
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
          >
            <XAxis
              type="number"
              tick={{ fill: chartAxisTickMuted(isDark), fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={160}
              tick={{ fill: chartAxisTickSecondary(isDark), fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
                cursor={false}
                contentStyle={chartTooltipContentStyleAlt(isDark)}
                labelStyle={{
                  color: isDark ? '#f9fafb' : '#111827',
                  fontWeight: 600,
                  marginBottom: 4,
                }}
                itemStyle={{ color: isDark ? '#f9fafb' : '#111827' }}
                formatter={(value) => [Number(value ?? 0).toLocaleString(), 'CVEs']}
            />
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              onMouseEnter={(_entry, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={barFills(i, hoveredIndex === i)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }