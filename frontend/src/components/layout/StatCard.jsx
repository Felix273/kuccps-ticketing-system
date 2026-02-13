import React from 'react';
import { TrendingUp } from 'lucide-react';

export const StatCard = ({ icon: Icon, title, value, color, bgColor, subtitle, trend }) => (
  <div className={`${bgColor} rounded-xl shadow-lg p-6 transform transition-all duration-200 hover:scale-105 hover:shadow-xl`}>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`w-5 h-5 ${color}`} />
          <p className="text-sm font-medium text-gray-600">{title}</p>
        </div>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className="w-3 h-3 text-green-500" />
            <span className="text-xs text-green-600 font-medium">{trend}</span>
          </div>
        )}
      </div>
    </div>
  </div>
);
