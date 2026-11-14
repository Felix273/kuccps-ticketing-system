import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { TrendingUp } from 'lucide-react';

const COLORS = ['#e11d48', '#f97316', '#d99000', '#16a34a', '#0284c7', '#7c3aed', '#db2777', '#64748b'];

const CategoryTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  const { name, count, percentage, fill } = payload[0].payload;

  return (
    <div className="rounded-lg border border-[#990024] bg-white px-3 py-2.5 text-sm text-slate-900 shadow-lg">
      <p className="font-semibold">{name}</p>
      <p className="mt-1 text-slate-600">
        Count: <span className="font-semibold text-slate-900">{count}</span> tickets ({percentage}%)
      </p>
      <span className="mt-2 block h-1 rounded-full" style={{ backgroundColor: fill }} />
    </div>
  );
};

export const TopCategoriesChart = ({ data = [] }) => (
  <section className="border border-zinc-200 bg-white">
    <div className="flex flex-col gap-1 border-b border-zinc-200 px-4 py-3 sm:px-5">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-[#990024]" />
        <h2 className="text-base font-bold tracking-tight text-zinc-900">Category Issues</h2>
      </div>
      <p className="text-xs text-zinc-500">By Volume</p>
    </div>

    {data.length ? (
      <div className="h-[21rem] w-full p-3 sm:p-5">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 400, height: 296 }}>
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 82 }}>
            <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" vertical={true} />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              tick={{ fill: '#71717a', fontSize: 10 }}
              axisLine={{ stroke: '#a1a1aa' }}
              tickLine={{ stroke: '#a1a1aa' }}
            />
            <YAxis
              allowDecimals={false}
              width={32}
              tick={{ fill: '#71717a', fontSize: 11 }}
              axisLine={{ stroke: '#a1a1aa' }}
              tickLine={{ stroke: '#a1a1aa' }}
            />
            <Tooltip content={<CategoryTooltip />} cursor={{ fill: '#f4f4f5' }} />
            <Bar dataKey="count" radius={[7, 7, 0, 0]} maxBarSize={76}>
              {data.map((item, index) => (
                <Cell key={item.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    ) : (
      <div className="flex h-48 items-center justify-center px-4 text-sm text-zinc-500">
        No category ticket data available yet.
      </div>
    )}
  </section>
);
