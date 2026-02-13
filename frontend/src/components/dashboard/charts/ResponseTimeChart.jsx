import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const ResponseTimeChart = ({ data }) => (
  <div className="bg-white rounded-xl shadow-lg p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-6">Average Response Time</h3>
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
        <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }} 
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="avgResponseTime" 
          stroke="#911414" 
          strokeWidth={2}
          name="Avg Response (hrs)"
          dot={{ fill: '#911414', r: 4 }}
        />
        <Line 
          type="monotone" 
          dataKey="target" 
          stroke="#94a3b8" 
          strokeWidth={2}
          strokeDasharray="5 5"
          name="Target (24hrs)"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);
