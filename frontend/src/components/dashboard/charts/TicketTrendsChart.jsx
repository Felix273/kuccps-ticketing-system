import React from 'react';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white rounded-lg px-3 py-2 text-xs shadow-xl border border-slate-800 space-y-1">
        <p className="font-semibold text-slate-300">{label}</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#990024]"></span>
          <span className="text-slate-200">New Tickets:</span>
          <span className="font-bold text-white">{payload[0]?.value}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="text-slate-200">Resolved:</span>
          <span className="font-bold text-white">{payload[1]?.value}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const TicketTrendsChart = ({ data }) => (
  <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 flex flex-col justify-between h-full">
    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
          Ticket Volume & Resolution Trends
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Daily influx vs. resolved support requests over the last 7 days
        </p>
      </div>

      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#990024]"></span>
          <span className="font-medium text-slate-600">New Tickets</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
          <span className="font-medium text-slate-600">Resolved</span>
        </div>
      </div>
    </div>

    {/* Chart */}
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 400, height: 288 }}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="bklitCrimson" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#990024" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="#990024" stopOpacity={0.01}/>
            </linearGradient>
            <linearGradient id="bklitEmerald" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#94a3b8" 
            tickLine={false} 
            axisLine={false}
            style={{ fontSize: '11px', fontWeight: 500 }} 
          />
          <YAxis 
            stroke="#94a3b8" 
            tickLine={false} 
            axisLine={false}
            style={{ fontSize: '11px', fontWeight: 500 }} 
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="tickets" 
            stroke="#990024" 
            strokeWidth={2.5} 
            fillOpacity={1} 
            fill="url(#bklitCrimson)" 
          />
          <Area 
            type="monotone" 
            dataKey="resolved" 
            stroke="#10b981" 
            strokeWidth={2} 
            fillOpacity={1} 
            fill="url(#bklitEmerald)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);
