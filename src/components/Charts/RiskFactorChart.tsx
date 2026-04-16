// src/components/Charts/RiskFactorChart.tsx
import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, Cell
  } from 'recharts';
  import { useAppSelector } from '../../store/hooks';
  import { selectRiskFactorFrequency } from '../../store/selectors';
  
  export function RiskFactorChart() {
    const data = useAppSelector(selectRiskFactorFrequency);
  
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">
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
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={160}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
                contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #4b5563',
                    borderRadius: '8px',
                    color: '#f9fafb',
                    fontSize: '13px',
                }}
                labelStyle={{ color: '#f9fafb', fontWeight: 600, marginBottom: 4 }}
                itemStyle={{ color: '#f9fafb' }}
                formatter={(value) => [Number(value).toLocaleString(), 'CVEs']}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={i === 0 ? '#ef4444' : i < 3 ? '#f97316' : '#3b82f6'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }