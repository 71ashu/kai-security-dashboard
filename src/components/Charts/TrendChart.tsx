// src/components/Charts/TrendChart.tsx
import {
    AreaChart, Area, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid
  } from 'recharts';
  import { useAppSelector } from '../../store/hooks';
  import { selectMonthlyTrend } from '../../store/selectors';
  
  export function TrendChart() {
    const data = useAppSelector(selectMonthlyTrend);
  
    // Sample every 3 months to keep the chart readable
    const sampled = data.filter((_, i) => i % 3 === 0);
  
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">
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
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
            dataKey="month"
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            tickFormatter={(v: string) => v.slice(0, 4)} // show year only
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#f9fafb',
              }}
              formatter={(value) => [Number(value).toLocaleString(), 'CVEs']}
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