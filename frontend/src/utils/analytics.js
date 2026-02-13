// src/utils/analytics.js
import { DEPARTMENTS, ISSUE_CATEGORIES, TICKET_STATUS, PRIORITY_LEVELS } from './constants';

export const calculateAnalytics = (tickets) => {
  const departmentStats = DEPARTMENTS.map(dept => ({
    name: dept.length > 15 ? dept.substring(0, 12) + '...' : dept,
    tickets: tickets.filter(t => t.department?.name === dept).length
  })).sort((a, b) => b.tickets - a.tickets);

  const categoryStats = ISSUE_CATEGORIES.map(cat => ({
    name: cat.replace(' Issues', '').replace(' & ', '/'),
    count: tickets.filter(t => t.category === cat).length
  })).sort((a, b) => b.count - a.count).slice(0, 6);

  const statusStats = TICKET_STATUS.map(status => ({
    name: status,
    value: tickets.filter(t => t.status === status).length
  }));

  const priorityStats = PRIORITY_LEVELS.map(priority => ({
    name: priority,
    count: tickets.filter(t => t.priority === priority).length
  }));

  const trendData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayTickets = tickets.filter(t => {
      const ticketDate = new Date(t.createdAt);
      return ticketDate.toDateString() === date.toDateString();
    });
    trendData.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      tickets: dayTickets.length,
      resolved: dayTickets.filter(t => t.status === 'Resolved').length
    });
  }

  const avgResponseTime = tickets.filter(t => t.responseTime).reduce((acc, t) => acc + t.responseTime, 0) / tickets.filter(t => t.responseTime).length || 0;
  const avgResolutionTime = tickets.filter(t => t.resolutionTime).reduce((acc, t) => acc + t.resolutionTime, 0) / tickets.filter(t => t.resolutionTime).length || 0;

  return {
    departmentStats,
    categoryStats,
    statusStats,
    priorityStats,
    trendData,
    avgResponseTime: avgResponseTime.toFixed(1),
    avgResolutionTime: avgResolutionTime.toFixed(1),
    totalTickets: tickets.length,
    openTickets: tickets.filter(t => t.status === 'Open').length,
    inProgressTickets: tickets.filter(t => t.status === 'In Progress').length,
    resolvedTickets: tickets.filter(t => t.status === 'Resolved').length,
    criticalTickets: tickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved').length
  };
};