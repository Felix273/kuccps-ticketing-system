import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = {
  Open: '#3b82f6',
  'In Progress': '#8b5cf6',
  'On Hold': '#f97316',
  Resolved: '#10b981',
  Closed: '#71717a'
};

export const ActiveVsResolvedChart = ({ data }) => (
  <div className="bg-white rounded-xl shadow-lg p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-6">Ticket Distribution</h3>
    <ResponsiveContainer width="100%" height={280} initialDimension={{ width: 400, height: 280 }}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
          outerRadius={90}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map(entry => (
            <Cell key={entry.name} fill={COLORS[entry.name] || '#a1a1aa'} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }} 
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  </div>
);
