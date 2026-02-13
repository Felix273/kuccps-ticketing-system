import React, { useMemo } from 'react';
import { Mail, AlertCircle, Clock, CheckCircle, RefreshCw, Users, TrendingUp } from 'lucide-react';
import { StatCard } from '../layout/StatCard';
import { QuickStatsCards } from './QuickStatsCards';
import { TopCategoriesChart } from './TopCategoriesChart';
import { TicketTrendsChart } from './charts/TicketTrendsChart';
import { StatusPieChart } from './charts/StatusPieChart';
import { PriorityChart } from './charts/PriorityChart';
import { ResponseTimeChart } from './charts/ResponseTimeChart';
import { VolumeByHourChart } from './charts/VolumeByHourChart';
import { ResolutionRateChart } from './charts/ResolutionRateChart';
import { TopRequestersChart } from './charts/TopRequestersChart';
import { AssignmentChart } from './charts/AssignmentChart';
import { UserWorkloadChart } from './charts/UserWorkloadChart';
import { DepartmentPerformanceChart } from './charts/DepartmentPerformanceChart';
import { ActiveVsResolvedChart } from './charts/ActiveVsResolvedChart';
import { DepartmentTicketChart } from './charts/DepartmentTicketChart';
import { ISSUE_CATEGORIES } from '../../utils/constants';

export const DashboardView = ({ tickets = [], statistics = {}, isLoading = false, error }) => {
  const analytics = useMemo(() => {
    // Category stats
    const categoryStats = ISSUE_CATEGORIES.map(cat => ({
      name: cat.replace(' Issues', '').replace(' & ', '/'),
      count: tickets.filter(t => t.category === cat).length
    }))
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

    // Status stats
    const statusStats = [
      { name: 'Open', value: tickets.filter(t => t.status === 'Open').length },
      { name: 'In Progress', value: tickets.filter(t => t.status === 'In Progress').length },
      { name: 'Resolved', value: tickets.filter(t => t.status === 'Resolved').length }
    ].filter(s => s.value > 0);

    // Priority stats
    const priorityStats = [
      { name: 'Low', value: tickets.filter(t => t.priority === 'Low').length },
      { name: 'Medium', value: tickets.filter(t => t.priority === 'Medium').length },
      { name: 'High', value: tickets.filter(t => t.priority === 'High').length },
      { name: 'Critical', value: tickets.filter(t => t.priority === 'Critical').length }
    ].filter(p => p.value > 0);

    // Active vs Resolved
    const activeVsResolved = [
      { name: 'Open', value: tickets.filter(t => t.status === 'Open').length },
      { name: 'In Progress', value: tickets.filter(t => t.status === 'In Progress').length },
      { name: 'Resolved', value: tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length }
    ].filter(s => s.value > 0);

    // User Workload - tickets assigned to each user
    const userWorkload = {};
    tickets.forEach(t => {
      if (t.assignedTo) {
        const userName = t.assignedTo.name;
        if (!userWorkload[userName]) {
          userWorkload[userName] = { name: userName, open: 0, inProgress: 0, resolved: 0, total: 0 };
        }
        userWorkload[userName].total++;
        if (t.status === 'Open') userWorkload[userName].open++;
        else if (t.status === 'In Progress') userWorkload[userName].inProgress++;
        else if (t.status === 'Resolved' || t.status === 'Closed') userWorkload[userName].resolved++;
      }
    });

    const userWorkloadData = Object.values(userWorkload)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Top Performers - users who resolved the most tickets
    const topPerformers = Object.values(userWorkload)
      .filter(u => u.resolved > 0)
      .sort((a, b) => b.resolved - a.resolved)
      .slice(0, 10);

    // Department Performance
    const departmentStats = {};
    tickets.forEach(t => {
      const deptName = t.assignedTo?.department || t.department?.name || 'Unassigned';
      if (!departmentStats[deptName]) {
        departmentStats[deptName] = { 
          department: deptName, 
          open: 0, 
          inProgress: 0, 
          resolved: 0, 
          total: 0 
        };
      }
      departmentStats[deptName].total++;
      if (t.status === 'Open') departmentStats[deptName].open++;
      else if (t.status === 'In Progress') departmentStats[deptName].inProgress++;
      else if (t.status === 'Resolved' || t.status === 'Closed') departmentStats[deptName].resolved++;
    });

    const departmentTicketData = Object.values(departmentStats)
      .filter(d => d.department !== 'Unassigned')
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
      .map(d => ({
        name: d.department.length > 12 ? d.department.substring(0, 10) + '...' : d.department,
        open: d.open,
        inProgress: d.inProgress,
        resolved: d.resolved
      }));

    const departmentPerformance = Object.values(departmentStats)
      .filter(d => d.department !== 'Unassigned' && d.total > 0)
      .map(d => ({
        department: d.department.length > 12 ? d.department.substring(0, 10) + '...' : d.department,
        resolutionRate: d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0,
        total: d.total
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    // Email domain stats
    const domainStats = {};
    tickets.forEach(t => {
      const email = t.requesterEmail || '';
      const domain = email.split('@')[1] || 'unknown';
      domainStats[domain] = (domainStats[domain] || 0) + 1;
    });
    const emailDomainData = Object.entries(domainStats)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Top requesters
    const requesterStats = {};
    tickets.forEach(t => {
      const email = t.requesterEmail || 'Unknown';
      requesterStats[email] = (requesterStats[email] || 0) + 1;
    });
    const topRequesters = Object.entries(requesterStats)
      .map(([email, count]) => ({ email, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Assignment status
    const assignedCount = tickets.filter(t => t.assignedToId !== null).length;
    const unassignedCount = tickets.filter(t => t.assignedToId === null).length;
    const assignmentData = [
      { name: 'Unassigned', value: unassignedCount },
      { name: 'Assigned', value: assignedCount }
    ].filter(a => a.value > 0);

    // Trend data for last 7 days
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

    // Response time data (mock for now)
    const responseTimeData = trendData.map(d => ({
      date: d.date,
      avgResponseTime: Math.floor(Math.random() * 20) + 5,
      target: 24
    }));

    // Volume by hour
    const volumeByHour = Array.from({ length: 24 }, (_, i) => {
      const hour = i.toString().padStart(2, '0') + ':00';
      const count = tickets.filter(t => {
        const ticketHour = new Date(t.createdAt).getHours();
        return ticketHour === i;
      }).length;
      return { hour, count };
    }).filter(h => h.count > 0);

    // Resolution rate trend
    const resolutionRate = trendData.map(d => ({
      date: d.date,
      rate: d.tickets > 0 ? Math.round((d.resolved / d.tickets) * 100) : 0
    }));

    return { 
      categoryStats,
      statusStats, 
      priorityStats,
      activeVsResolved,
      userWorkloadData,
      topPerformers,
      departmentTicketData,
      departmentPerformance,
      emailDomainData,
      topRequesters,
      assignmentData,
      trendData,
      responseTimeData,
      volumeByHour,
      resolutionRate
    };
  }, [tickets]);

  const stats = statistics || {
    totalTickets: tickets.length,
    openTickets: tickets.filter(t => t.status === 'Open').length,
    inProgressTickets: tickets.filter(t => t.status === 'In Progress').length,
    resolvedTickets: tickets.filter(t => t.status === 'Resolved').length,
    criticalTickets: tickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved').length,
    assignedTickets: tickets.filter(t => t.assignedToId !== null).length,
  };

  const assignmentRate = stats.totalTickets > 0 
    ? Math.round((stats.assignedTickets / stats.totalTickets) * 100) 
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-12 h-12 text-[#911414] animate-spin" />
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center gap-4 py-8">
          <AlertCircle className="w-16 h-16 text-red-500" />
          <h3 className="text-xl font-semibold text-gray-900">Error Loading Dashboard</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <QuickStatsCards tickets={tickets} />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          icon={Mail}
          title="Total Tickets"
          value={stats.totalTickets || 0}
          color="text-[#911414]"
          bgColor="bg-white"
          trend="+12% from last month"
        />
        <StatCard
          icon={AlertCircle}
          title="Open Tickets"
          value={stats.openTickets || 0}
          color="text-orange-600"
          bgColor="bg-white"
          subtitle={`${stats.criticalTickets || 0} critical`}
        />
        <StatCard
          icon={Clock}
          title="In Progress"
          value={stats.inProgressTickets || 0}
          color="text-purple-600"
          bgColor="bg-white"
        />
        <StatCard
          icon={CheckCircle}
          title="Resolved"
          value={stats.resolvedTickets || 0}
          color="text-emerald-600"
          bgColor="bg-white"
          trend="+8% this week"
        />
        <StatCard
          icon={Users}
          title="Assigned"
          value={`${assignmentRate}%`}
          color="text-blue-600"
          bgColor="bg-white"
          subtitle={`${stats.assignedTickets} tickets`}
        />
      </div>

      {/* Main Trend Chart */}
      <TicketTrendsChart data={analytics.trendData} />

      {/* Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ActiveVsResolvedChart data={analytics.activeVsResolved} />
        <PriorityChart data={analytics.priorityStats} />
        <AssignmentChart data={analytics.assignmentData} />
      </div>

      {/* Department Analytics */}
      {analytics.departmentTicketData.length > 0 && (
        <>
          <div className="bg-gradient-to-r from-[#911414] to-[#d20001] text-white rounded-xl p-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Department Analytics
            </h2>
            <p className="text-white/80 mt-1">Performance metrics across departments</p>
          </div>

          <div className="w-full">
            <DepartmentTicketChart data={analytics.departmentTicketData} />
            <DepartmentPerformanceChart data={analytics.departmentPerformance} />
          </div>
        </>
      )}

      {/* Staff Performance */}
      {analytics.userWorkloadData.length > 0 && (
        <>
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6" />
              Staff Performance & Workload
            </h2>
            <p className="text-white/80 mt-1">Individual staff metrics and productivity</p>
          </div>

          <div className="w-full">
            <UserWorkloadChart data={analytics.userWorkloadData} />
          </div>
        </>
      )}

      {/* Category Analysis */}
      {analytics.categoryStats.length > 0 && (
        <div className="w-full">
          <TopCategoriesChart statistics={statistics} />
        </div>
      )}

      {/* Top Requesters */}
      {analytics.topRequesters.length > 0 && (
        <TopRequestersChart data={analytics.topRequesters} />
      )}

      {/* Performance Metrics */}
      <div className="w-full">
        <ResponseTimeChart data={analytics.responseTimeData} />
        <ResolutionRateChart data={analytics.resolutionRate} />
      </div>

      {/* Volume by Hour */}
      {analytics.volumeByHour.length > 0 && (
        <VolumeByHourChart data={analytics.volumeByHour} />
      )}
    </div>
  );
};
