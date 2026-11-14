import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatCard = ({ icon: Icon, title, value, subtitle, trend, trendDirection = 'up' }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 hover:border-slate-300 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </div>

        <div className="flex items-center justify-between pt-1">
          {subtitle && (
            <p className="text-[11px] text-slate-400 font-medium">{subtitle}</p>
          )}

          {trend && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              trendDirection === 'down' 
                ? 'bg-rose-50 text-rose-700 border border-rose-200/60' 
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
            }`}>
              {trendDirection === 'down' ? (
                <TrendingDown className="w-3 h-3" />
              ) : (
                <TrendingUp className="w-3 h-3" />
              )}
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
