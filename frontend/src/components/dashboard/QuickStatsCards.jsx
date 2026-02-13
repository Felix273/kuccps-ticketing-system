import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Clock, CheckCircle, AlertCircle, Zap, Target } from 'lucide-react';

export const QuickStatsCards = ({ tickets = [] }) => {
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Today's tickets
    const todayTickets = tickets.filter(t => new Date(t.createdAt) >= today);
    const todayResolved = tickets.filter(t => {
      const resolvedDate = t.resolvedAt ? new Date(t.resolvedAt) : null;
      return resolvedDate && resolvedDate >= today;
    });
    
    // Currently open critical
    const criticalTickets = tickets.filter(t => 
      t.priority === 'Critical' && t.status !== 'Resolved' && t.status !== 'Closed'
    );
    const criticalOpen = criticalTickets.length;
    
    // Find oldest critical ticket (in days)
    let oldestCriticalDays = 0;
    if (criticalTickets.length > 0) {
      const oldest = criticalTickets.reduce((oldest, ticket) => {
        return new Date(ticket.createdAt) < new Date(oldest.createdAt) ? ticket : oldest;
      });
      oldestCriticalDays = Math.floor((now - new Date(oldest.createdAt)) / (1000 * 60 * 60 * 24));
    }
    
    // Average response time (in hours)
    const ticketsWithResponses = tickets.filter(t => t.responseTime);
    const avgResponseTime = ticketsWithResponses.length > 0
      ? Math.round(ticketsWithResponses.reduce((sum, t) => sum + (t.responseTime || 0), 0) / ticketsWithResponses.length / 60)
      : 0;
    
    // SLA Compliance calculation
    // SLA: Respond within 4 hours, Resolve within 24 hours
    const SLA_RESPONSE_HOURS = 4;
    const SLA_RESOLUTION_HOURS = 24;
    
    const ticketsInSLA = tickets.filter(t => {
      if (t.status === 'Resolved' || t.status === 'Closed') {
        // Check resolution time
        const resolutionTime = t.resolutionTime || 0;
        return resolutionTime <= SLA_RESOLUTION_HOURS * 60; // Convert to minutes
      } else {
        // Check response time for open tickets
        const responseTime = t.responseTime || 0;
        return responseTime <= SLA_RESPONSE_HOURS * 60;
      }
    }).length;
    
    const slaCompliance = tickets.length > 0 
      ? Math.round((ticketsInSLA / tickets.length) * 100) 
      : 100;
    
    // Yesterday's stats
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayTickets = tickets.filter(t => {
      const created = new Date(t.createdAt);
      return created >= yesterday && created < today;
    });
    
    const newTicketsTrend = todayTickets.length - yesterdayTickets.length;
    
    return {
      todayNew: todayTickets.length,
      todayResolved: todayResolved.length,
      criticalOpen,
      oldestCriticalDays,
      avgResponseTime,
      slaCompliance,
      newTicketsTrend
    };
  }, [tickets]);

  const cards = [
    {
      title: "Today's New Tickets",
      value: stats.todayNew,
      icon: Zap,
      color: 'from-blue-500 to-blue-600',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-700',
      trend: stats.newTicketsTrend,
      trendLabel: `${stats.newTicketsTrend >= 0 ? '+' : ''}${stats.newTicketsTrend} vs yesterday`
    },
    {
      title: "Resolved Today",
      value: stats.todayResolved,
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      bgLight: 'bg-green-50',
      textColor: 'text-green-700',
      subtitle: 'tickets closed'
    },
    {
      title: "Critical Open",
      value: stats.criticalOpen,
      icon: AlertCircle,
      color: 'from-red-500 to-red-600',
      bgLight: 'bg-red-50',
      textColor: 'text-red-700',
      subtitle: stats.oldestCriticalDays > 0 ? `Oldest: ${stats.oldestCriticalDays}d ago` : 'needs attention',
      isAlert: stats.criticalOpen > 0
    },
    {
      title: "Avg Response Time",
      value: stats.avgResponseTime > 0 ? `${stats.avgResponseTime}h` : 'N/A',
      icon: Clock,
      color: 'from-purple-500 to-purple-600',
      bgLight: 'bg-purple-50',
      textColor: 'text-purple-700',
      subtitle: 'average response'
    },
    {
      title: "SLA Compliance",
      value: `${stats.slaCompliance}%`,
      icon: Target,
      color: stats.slaCompliance >= 90 ? 'from-green-500 to-emerald-600' : 
             stats.slaCompliance >= 75 ? 'from-yellow-500 to-orange-600' : 
             'from-red-500 to-red-600',
      bgLight: stats.slaCompliance >= 90 ? 'bg-green-50' : 
               stats.slaCompliance >= 75 ? 'bg-yellow-50' : 
               'bg-red-50',
      textColor: stats.slaCompliance >= 90 ? 'text-green-700' : 
                 stats.slaCompliance >= 75 ? 'text-yellow-700' : 
                 'text-red-700',
      subtitle: stats.slaCompliance >= 90 ? 'excellent!' : 
                stats.slaCompliance >= 75 ? 'needs improvement' : 
                'critical!',
      isAlert: stats.slaCompliance < 75
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`${card.bgLight} rounded-xl p-6 border-2 ${
            card.isAlert ? 'border-red-300 animate-pulse' : 'border-gray-200'
          } hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} shadow-lg`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
            {card.trend !== undefined && (
              <div className="flex items-center gap-1 text-xs font-semibold">
                {card.trend > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : card.trend < 0 ? (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                ) : null}
                <span className={card.trend > 0 ? 'text-green-600' : card.trend < 0 ? 'text-red-600' : 'text-gray-600'}>
                  {card.trend > 0 ? `+${card.trend}` : card.trend}
                </span>
              </div>
            )}
          </div>
          
          <div>
            <p className="text-sm font-semibold text-gray-600 mb-2">{card.title}</p>
            <p className={`text-4xl font-bold ${card.textColor} mb-1`}>
              {card.value}
            </p>
            {card.subtitle && (
              <p className="text-xs text-gray-500">{card.subtitle}</p>
            )}
            {card.trendLabel && (
              <p className="text-xs text-gray-500 mt-2">{card.trendLabel}</p>
            )}
          </div>
          
          {card.isAlert && (
            <div className="mt-3 pt-3 border-t border-red-200">
              <p className="text-xs font-semibold text-red-700">
                ⚠️ Requires immediate attention
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
