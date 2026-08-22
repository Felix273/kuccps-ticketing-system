import React from 'react';
import { TrendingUp } from 'lucide-react';

export const StatCard = ({ icon, title, value, color, bgColor, subtitle, trend, onClick }) => {
  const IconComponent = icon;
  return (
    <div
      onClick={onClick}
      className={`${bgColor} rounded-xl shadow-md border border-gray-100 p-6 transform transition-all duration-200 ${onClick ? 'cursor-pointer hover:scale-105 hover:shadow-xl hover:border-[#911414]' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <IconComponent className={`w-5 h-5 ${color}`} />
            <p className="text-sm font-semibold text-gray-600">{title}</p>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 font-medium mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-600 font-semibold">{trend}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
