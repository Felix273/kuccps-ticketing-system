import React from 'react';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const TicketTrendsChart = ({ data }) => (
  <div className="bg-white rounded-xl shadow-lg p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-6">Ticket Trends (Last 7 Days)</h3>
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#911414" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#911414" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
        <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }} 
        />
        <Legend wrapperStyle={{ fontSize: '14px' }} />
        <Area 
          type="monotone" 
          dataKey="tickets" 
          stroke="#911414" 
          strokeWidth={2} 
          fillOpacity={1} 
          fill="url(#colorTickets)" 
          name="New Tickets" 
        />
        <Area 
          type="monotone" 
          dataKey="resolved" 
          stroke="#10b981" 
          strokeWidth={2} 
          fillOpacity={1} 
          fill="url(#colorResolved)" 
          name="Resolved" 
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);
