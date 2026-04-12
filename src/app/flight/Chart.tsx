'use client'

import { LineChart, Line, Tooltip, ResponsiveContainer, XAxis, YAxis, ReferenceLine } from 'recharts'

export default function Chart({ chartData, currentPrice, tPrice }: { chartData: any[], currentPrice?: number, tPrice: (val: number) => string }) {


  return (
    <div className="h-[220px] w-full mt-2 relative">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
          <YAxis tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} width={40} />
          <Tooltip 
             contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} 
             labelStyle={{ color: '#6b7280', marginBottom: '4px' }}
          />
          {currentPrice && currentPrice > 0 && (
              <ReferenceLine y={currentPrice} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: `Current ${tPrice(currentPrice)}`, position: 'top', fill: '#f59e0b', fontSize: 12, fontWeight: 'bold' }} />
          )}
          <Line type="monotone" dataKey="price" stroke="#4F46E5" strokeWidth={3} dot={{ r: 3, fill: '#4F46E5' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
