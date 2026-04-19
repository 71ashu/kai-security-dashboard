// src/components/Charts/TrendChart.tsx
import {
    AreaChart, Area, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid
  } from 'recharts';
  import { useAppSelector } from '../../store/hooks';
  import { selectMonthlyTrend } from '../../store/selectors';
  import { useEffectiveThemeIsDark } from '../../theme/useEffectiveThemeIsDark';
  import {
    chartAxisTickMuted,
    chartGridStroke,
    chartTooltipContentStyle,
  } from '../../theme/chartTheme';
  
  export function TrendChart() {
    const data = useAppSelector(selectMonthlyTrend);
    const isDark = useEffectiveThemeIsDark();
  
    // Sample every 3 months to keep the chart readable
    const sampled = data.filter((_, i) => i % 3 === 0);
  
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3 dark:bg-gray-900 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-widest dark:text-gray-300">
          Vulnerability Trend Over Time
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart
            data={sampled}
            margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
          >
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke(isDark)} />
            <XAxis
            dataKey="month"
            tick={{ fill: chartAxisTickMuted(isDark), fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            tickFormatter={(v: string) => v.slice(0, 4)} // show year only
            />
            <YAxis
              tick={{ fill: chartAxisTickMuted(isDark), fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={chartTooltipContentStyle(isDark)}
              formatter={(value) => [Number(value ?? 0).toLocaleString(), 'CVEs']}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#trendGradient)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }