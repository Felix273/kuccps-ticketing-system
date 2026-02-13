import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

const COLORS = ['#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0284c7', '#7c3aed', '#db2777', '#64748b'];

export const TopCategoriesChart = ({ statistics }) => {
  if (!statistics?.topCategories || statistics.topCategories.length === 0) {
    return null;
  }

  const topCategories = [...statistics.topCategories].sort((a, b) => b.count - a.count);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-[#911414]" />
        Top Issue Categories
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Chart */}
        <div className="pb-4">
          <h4 className="text-sm font-semibold text-gray-600 mb-4">By Volume</h4>
          <ResponsiveContainer width="100%" height={450}>
            <BarChart data={topCategories} margin={{ top: 5, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fontSize: 11 }}
                interval={0}
              />
              <YAxis />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '2px solid #911414',
                  borderRadius: '8px',
                  padding: '8px'
                }}
                formatter={(value, name, props) => [
                  `${value} tickets (${props.payload.percentage}%)`,
                  'Count'
                ]}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {topCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="pb-4">
          <h4 className="text-sm font-semibold text-gray-600 mb-4">By Percentage</h4>
          <ResponsiveContainer width="100%" height={450}>
            <PieChart margin={{ top: 0, right: 0, bottom: 40, left: 0 }}>
              <Pie
                data={topCategories}
                cx="50%"
                cy="45%"
                labelLine={false}
                label={({ percentage }) => percentage > 5 ? `${percentage}%` : ''}
                outerRadius={110}
                fill="#8884d8"
                dataKey="count"
              >
                {topCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name, props) => [
                  `${value} tickets (${props.payload.percentage}%)`,
                  props.payload.name
                ]}
              />
              <Legend 
                verticalAlign="bottom"
                height={80}
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value, entry) => {
                  const name = entry.payload.name;
                  const shortName = name.length > 20 ? name.substring(0, 18) + '...' : name;
                  return `${shortName}: ${entry.payload.count}`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
