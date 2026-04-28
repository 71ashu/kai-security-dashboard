import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useAppSelector } from '../../store/hooks';
import { selectAnalysisBreakdown } from '../../store/selectors';
import {
  useEffectiveThemeIsDark,
  chartTooltipContentStyle,
  chartLegendTextColor,
} from '../../theme';

export function AnalysisBreakdownChart() {
  const data   = useAppSelector(selectAnalysisBreakdown);
  const isDark = useEffectiveThemeIsDark();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3 dark:bg-gray-900 dark:border-gray-800">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-widest dark:text-gray-300">
        Analysis Breakdown
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            stroke={isDark ? '#ffffff' : '#f3f4f6'}
            strokeWidth={1}
            rootTabIndex={-1}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={chartTooltipContentStyle(isDark)}
            formatter={(value, name) => [
              Number(value ?? 0).toLocaleString(),
              String(name),
            ]}
          />
          <Legend
            formatter={(value) => (
              <span style={{ color: chartLegendTextColor(isDark), fontSize: 12 }}>
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
