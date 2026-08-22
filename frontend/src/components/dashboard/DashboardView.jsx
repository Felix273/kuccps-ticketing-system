import React, { useEffect, useMemo, useState } from 'react';
import { Mail, AlertCircle, Clock, CheckCircle, RefreshCw, Users, TrendingUp, ShieldCheck, Star } from 'lucide-react';
import { StatCard } from '../layout/StatCard';
import { QuickStatsCards } from './QuickStatsCards';
import { TopCategoriesChart } from './TopCategoriesChart';
import { TicketTrendsChart } from './charts/TicketTrendsChart';
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
import { operationsService } from '../../services/operationsService';

export const DashboardView = ({ tickets = [], statistics = {}, isLoading = false, error, onNavigateToTickets }) => {
  const [operationsAnalytics, setOperationsAnalytics] = useState(null);

  useEffect(() => {
    const loadOperationsAnalytics = async () => {
      try {
        const response = await operationsService.getDashboardAnalytics();
        if (response.success) setOperationsAnalytics(response.analytics);
      } catch (err) {
        console.warn('Operations analytics unavailable:', err.message);
      }
    };
    loadOperationsAnalytics();
  }, [tickets.length]);

  const analytics = useMemo(() => {
    const categoryTotal = tickets.length || 0;
    const categoryStats = ISSUE_CATEGORIES.map(cat => {
      const count = tickets.filter(t => t.category === cat).length;
      return {
        name: cat,
        count,
        percentage: categoryTotal > 0 ? Math.round((count / categoryTotal) * 100) : 0
      };
    })
      .filter(c => c.count > 0)
      .sort((a, b) => b.count - a.count);

    const statusStats = [
      { name: 'Open', value: tickets.filter(t => t.status === 'Open').length },
      { name: 'In Progress', value: tickets.filter(t => t.status === 'In Progress').length },
      { name: 'Resolved', value: tickets.filter(t => t.status === 'Resolved').length }
    ].filter(s => s.value > 0);

    const priorityStats = [
      { name: 'Low', value: tickets.filter(t => t.priority === 'Low').length },
      { name: 'Medium', value: tickets.filter(t => t.priority === 'Medium').length },
      { name: 'High', value: tickets.filter(t => t.priority === 'High').length },
      { name: 'Critical', value: tickets.filter(t => t.priority === 'Critical').length }
    ].filter(p => p.value > 0);

    const activeVsResolved = [
      { name: 'Open', value: tickets.filter(t => t.status === 'Open').length },
      { name: 'In Progress', value: tickets.filter(t => t.status === 'In Progress').length },
      { name: 'Resolved', value: tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length }
    ].filter(s => s.value > 0);

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

    const departmentStats = {};
    tickets.forEach(t => {
      const deptName = t.assignedTo?.department?.name || t.department?.name || 'Unclaimed';
      if (!departmentStats[deptName]) {
        departmentStats[deptName] = { department: deptName, open: 0, inProgress: 0, resolved: 0, total: 0 };
      }
      departmentStats[deptName].total++;
      if (t.status === 'Open') departmentStats[deptName].open++;
      else if (t.status === 'In Progress') departmentStats[deptName].inProgress++;
      else if (t.status === 'Resolved' || t.status === 'Closed') departmentStats[deptName].resolved++;
    });

    const departmentTicketData = Object.values(departmentStats)
      .filter(d => d.department !== 'Unclaimed')
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
      .map(d => ({
        name: d.department.length > 12 ? d.department.substring(0, 10) + '...' : d.department,
        open: d.open,
        inProgress: d.inProgress,
        resolved: d.resolved
      }));

    const departmentPerformance = Object.values(departmentStats)
      .filter(d => d.department !== 'Unclaimed' && d.total > 0)
      .map(d => ({
        department: d.department.length > 12 ? d.department.substring(0, 10) + '...' : d.department,
        resolutionRate: d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0,
        total: d.total
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    const requesterStats = {};
    tickets.forEach(t => {
      const email = t.requesterEmail || 'Unknown';
      requesterStats[email] = (requesterStats[email] || 0) + 1;
    });
    const topRequesters = Object.entries(requesterStats)
      .map(([email, count]) => ({ email, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const assignedCount = tickets.filter(t => t.assignedToId !== null).length;
    const unassignedCount = tickets.filter(t => t.assignedToId === null).length;
    const assignmentData = [
      { name: 'Unclaimed', value: unassignedCount },
      { name: 'Claimed', value: assignedCount }
    ].filter(a => a.value > 0);

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
        resolved: dayTickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length
      });
    }

    const responseTimeData = trendData.map(d => {
      const dayTicketsWithResponse = tickets.filter(t => {
        const ticketDate = new Date(t.createdAt);
        return ticketDate.toDateString() === d.date && t.responseTime != null;
      });
      const avgResponseTime = dayTicketsWithResponse.length > 0
        ? Math.round(dayTicketsWithResponse.reduce((acc, t) => acc + t.responseTime, 0) / dayTicketsWithResponse.length)
        : 0;
      return { date: d.date, avgResponseTime, target: 24 };
    });

    const volumeByHour = Array.from({ length: 24 }, (_, i) => {
      const hour = i.toString().padStart(2, '0') + ':00';
      const count = tickets.filter(t => {
        const ticketHour = new Date(t.createdAt).getHours();
        return ticketHour === i;
      }).length;
      return { hour, count };
    }).filter(h => h.count > 0);

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
      departmentTicketData,
      departmentPerformance,
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
    resolvedTickets: tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length,
    criticalTickets: tickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved' && t.status !== 'Closed').length,
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
          <p className="text-gray-600 font-medium">Loading executive dashboard analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 border border-red-200">
        <div className="flex flex-col items-center gap-4 py-8">
          <AlertCircle className="w-16 h-16 text-red-500" />
          <h3 className="text-xl font-bold text-gray-900">Error Loading Dashboard</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <QuickStatsCards tickets={tickets} />

      {/* Clickable Statistics KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <StatCard
          icon={Mail}
          title="Total Tickets"
          value={stats.totalTickets || 0}
          color="text-[#911414]"
          bgColor="bg-white"
          subtitle="Click to view all"
          onClick={() => onNavigateToTickets && onNavigateToTickets('all')}
        />
        <StatCard
          icon={AlertCircle}
          title="Open Tickets"
          value={stats.openTickets || 0}
          color="text-amber-600"
          bgColor="bg-white"
          subtitle={`${stats.criticalTickets || 0} critical priority`}
          onClick={() => onNavigateToTickets && onNavigateToTickets('Open')}
        />
        <StatCard
          icon={Clock}
          title="In Progress"
          value={stats.inProgressTickets || 0}
          color="text-purple-600"
          bgColor="bg-white"
          subtitle="Actively assigned"
          onClick={() => onNavigateToTickets && onNavigateToTickets('In Progress')}
        />
        <StatCard
          icon={AlertCircle}
          title="Overdue Tickets"
          value={stats.overdueTickets || 0}
          color="text-red-600"
          bgColor="bg-white"
          subtitle="Service Charter risk"
          onClick={() => onNavigateToTickets && onNavigateToTickets('Overdue')}
        />
        <StatCard
          icon={CheckCircle}
          title="Resolved Tickets"
          value={stats.resolvedTickets || 0}
          color="text-emerald-600"
          bgColor="bg-white"
          subtitle="Click to view fixes"
          onClick={() => onNavigateToTickets && onNavigateToTickets('Resolved')}
        />
        <StatCard
          icon={Users}
          title="Claimed Rate"
          value={`${assignmentRate}%`}
          color="text-blue-600"
          bgColor="bg-white"
          subtitle={`${stats.assignedTickets} claimed`}
          onClick={() => onNavigateToTickets && onNavigateToTickets('Claimed')}
        />
      </div>

      {operationsAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={ShieldCheck}
            title="ICT Service Charter"
            value={`${operationsAnalytics.slaCompliance}%`}
            color="text-emerald-600"
            bgColor="bg-white"
            subtitle={`${operationsAnalytics.slaBreached} timeframe breaches`}
            onClick={() => onNavigateToTickets && onNavigateToTickets('Charter')}
          />
          <StatCard
            icon={Star}
            title="CSAT Satisfaction"
            value={operationsAnalytics.csatScore ? `${operationsAnalytics.csatScore} / 5` : 'N/A'}
            color="text-amber-600"
            bgColor="bg-white"
            subtitle={`${operationsAnalytics.csatResponses} customer ratings`}
          />
          <StatCard
            icon={CheckCircle}
            title="Closed Tickets"
            value={operationsAnalytics.closed || 0}
            color="text-gray-700"
            bgColor="bg-white"
            subtitle="Completed & archived"
            onClick={() => onNavigateToTickets && onNavigateToTickets('Closed')}
          />
        </div>
      )}

      {/* Main Volume & Trends */}
      <TicketTrendsChart data={analytics.trendData} />

      {/* Category Breakdown */}
      {analytics.categoryStats.length > 0 && (
        <TopCategoriesChart data={analytics.categoryStats} />
      )}

      {/* Status Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ActiveVsResolvedChart data={analytics.activeVsResolved} />
        <PriorityChart data={analytics.priorityStats} />
        <AssignmentChart data={analytics.assignmentData} />
      </div>

      {/* Directorate Analytics */}
      {analytics.departmentTicketData.length > 0 && (
        <>
          <div className="bg-gradient-to-r from-[#911414] to-[#d20001] text-white rounded-xl p-6 shadow-md">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Directorate & Department Analytics
            </h2>
            <p className="text-white/90 mt-1 text-sm font-medium">Service request volume and resolution performance by department</p>
          </div>

          <div className="w-full space-y-6">
            <DepartmentTicketChart data={analytics.departmentTicketData} />
            <DepartmentPerformanceChart data={analytics.departmentPerformance} />
          </div>
        </>
      )}

      {/* ICT Staff Workload */}
      {analytics.userWorkloadData.length > 0 && (
        <>
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-xl p-6 shadow-md">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6" />
              ICT Staff Workload & Performance
            </h2>
            <p className="text-white/90 mt-1 text-sm font-medium">Distribution of claimed, active, and resolved support tickets per officer</p>
          </div>

          <div className="w-full">
            <UserWorkloadChart data={analytics.userWorkloadData} />
          </div>
        </>
      )}

      {/* Top Requesters */}
      {analytics.topRequesters.length > 0 && (
        <TopRequestersChart data={analytics.topRequesters} />
      )}

      {/* Performance Trends */}
      <div className="w-full space-y-6">
        <ResponseTimeChart data={analytics.responseTimeData} />
        <ResolutionRateChart data={analytics.resolutionRate} />
      </div>

      {/* Hourly Volume */}
      {analytics.volumeByHour.length > 0 && (
        <VolumeByHourChart data={analytics.volumeByHour} />
      )}
    </div>
  );
};
