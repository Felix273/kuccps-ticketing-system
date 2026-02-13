import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const UserWorkloadChart = ({ data }) => (
  <div className="bg-white rounded-xl shadow-lg p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-6">Staff Workload - Active Tickets</h3>
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} />
        <YAxis 
          dataKey="name" 
          type="category" 
          width={150} 
          stroke="#6b7280" 
          style={{ fontSize: '11px' }} 
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }} 
        />
        <Legend />
        <Bar dataKey="open" name="Open" fill="#f59e0b" radius={[0, 4, 4, 0]} stackId="a" />
        <Bar dataKey="inProgress" name="In Progress" fill="#8b5cf6" radius={[0, 4, 4, 0]} stackId="a" />
        <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[0, 4, 4, 0]} stackId="a" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);
