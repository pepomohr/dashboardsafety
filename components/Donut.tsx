'use client'

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { COLORS } from '@/lib/theme'

export const CAT_COLORS = [COLORS.green, COLORS.warn, COLORS.danger, COLORS.grayMid, COLORS.greenDark, '#7E57C2', '#1E9BD7']

export default function Donut({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={40} outerRadius={64} paddingAngle={3}>
            {data.map((e, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v: any) => `${v}`} contentStyle={{ borderRadius: 12, border: '1px solid #eee', fontSize: 13 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1 mt-1">
        {data.map((e, i) => (
          <div key={e.label} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 min-w-0" style={{ color: COLORS.grayDark }}>
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }} />
              <span className="truncate">{e.label}</span>
            </span>
            <span className="font-bold flex-shrink-0 ml-2" style={{ color: COLORS.grayDark }}>{e.value}{total ? ` · ${Math.round((e.value / total) * 100)}%` : ''}</span>
          </div>
        ))}
      </div>
    </>
  )
}
