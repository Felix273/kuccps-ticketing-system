import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

const getPerformanceColor = (rate) => {
  if (rate >= 80) return '#10b981'; // Green
  if (rate >= 60) return '#f59e0b'; // Yellow
  return '#ef4444'; // Red
};

export const DepartmentPerformanceChart = ({ data }) => (
  <div className="bg-white rounded-xl shadow-lg p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-6">Department Resolution Rate</h3>
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="department" 
          angle={-45} 
          textAnchor="end" 
          height={100} 
          stroke="#6b7280" 
          style={{ fontSize: '11px' }} 
        />
        <YAxis 
          stroke="#6b7280" 
          style={{ fontSize: '12px' }}
          label={{ value: 'Resolution %', angle: -90, position: 'insideLeft' }}
          domain={[0, 100]}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}
          formatter={(value) => `${value}%`}
        />
        <Bar dataKey="resolutionRate" name="Resolution Rate" radius={[8, 8, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getPerformanceColor(entry.resolutionRate)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);
