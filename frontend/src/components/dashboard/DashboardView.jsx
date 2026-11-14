import React, { useEffect, useMemo, useState } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';
import { 
  Ticket, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  ShieldCheck, 
  Users, 
  RefreshCw,
  Building2,
  PieChart as PieIcon,
  Table as TableIcon,
  ChevronRight,
  Activity
} from 'lucide-react';
import { TicketTrendsChart } from './charts/TicketTrendsChart';
import { TopCategoriesChart } from './TopCategoriesChart';
import { operationsService } from '../../services/operationsService';

const DONUT_COLORS = {
  Open: '#2563eb',
  'In Progress': '#f59e0b',
  'On Hold': '#f97316',
  Resolved: '#059669',
  Closed: '#71717a'
};

const StatusPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  const { name, value, color } = payload[0];

  return (
    <div className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-[11px] text-white shadow-lg">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        <span>{name}</span>
        <span className="font-semibold tabular-nums">{value}</span>
      </div>
    </div>
  );
};

export const DashboardView = ({ tickets = [], isLoading = false }) => {
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
    // 1. 7-Day Trend Data (Used for Main Chart & Mini Sparklines)
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
        active: dayTickets.filter(t => ['Open', 'In Progress', 'On Hold'].includes(t.status)).length,
        resolved: dayTickets.filter(t => t.status === 'Resolved').length
      });
    }

    // 2. Pie Chart Status Distribution Data
    const openCount = tickets.filter(t => t.status === 'Open').length;
    const inProgressCount = tickets.filter(t => t.status === 'In Progress').length;
    const onHoldCount = tickets.filter(t => t.status === 'On Hold').length;
    const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;
    const closedCount = tickets.filter(t => t.status === 'Closed').length;

    const statusPieData = [
      { name: 'Open', value: openCount },
      { name: 'In Progress', value: inProgressCount },
      { name: 'On Hold', value: onHoldCount },
      { name: 'Resolved', value: resolvedCount },
      { name: 'Closed', value: closedCount }
    ].filter(item => item.value > 0);

    const categoryData = operationsAnalytics?.categoryIssues || [];

    // 3. Tabular: Directorate SLA Performance Table Data
    const deptStats = {};
    tickets.forEach(t => {
      const deptName = t.assignedTo?.department?.name || t.department?.name || 'Unassigned';
      if (!deptStats[deptName]) {
        deptStats[deptName] = { name: deptName, open: 0, resolved: 0, total: 0 };
      }
      deptStats[deptName].total++;
      if (t.status === 'Resolved' || t.status === 'Closed') deptStats[deptName].resolved++;
      else deptStats[deptName].open++;
    });

    const deptTable = Object.values(deptStats)
      .filter(d => d.name !== 'Unassigned')
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
      .map(d => ({
        ...d,
        rate: d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0
      }));

    // 4. Tabular: Priority Watchlist Table Data
    const priorityWatchlist = tickets
      .filter(t => t.status !== 'Resolved' && t.status !== 'Closed')
      .sort((a, b) =>
        Number(['Critical', 'Very High'].includes(b.priority)) -
        Number(['Critical', 'Very High'].includes(a.priority))
      )
      .slice(0, 5);

    // 5. Tabular: Staff Workload Leaderboard Data
    const userWorkload = {};
    tickets.forEach(t => {
      if (t.assignedTo) {
        const name = t.assignedTo.name;
        if (!userWorkload[name]) {
          userWorkload[name] = { name, open: 0, resolved: 0, total: 0 };
        }
        userWorkload[name].total++;
        if (t.status === 'Resolved' || t.status === 'Closed') userWorkload[name].resolved++;
        else userWorkload[name].open++;
      }
    });

    const staffLeaderboard = Object.values(userWorkload)
      .sort((a, b) => b.resolved - a.resolved)
      .slice(0, 5)
      .map(u => ({
        ...u,
        rate: u.total > 0 ? Math.round((u.resolved / u.total) * 100) : 0
      }));

    return {
      trendData,
      statusPieData,
      categoryData,
      deptTable,
      priorityWatchlist,
      staffLeaderboard
    };
  }, [tickets, operationsAnalytics]);

  const totalTickets = tickets.length;
  const activeTickets = tickets.filter(t => ['Open', 'In Progress', 'On Hold'].includes(t.status)).length;
  const resolvedTickets = tickets.filter(t => t.status === 'Resolved').length;
  const slaRate = operationsAnalytics?.slaCompliance;
  const targetAttainment = operationsAnalytics?.slaTargetAttainment;
  const targetSummaries = ['response', 'resolution'].flatMap(type =>
    (targetAttainment?.[type] || []).map(target =>
      `${type} ${target.actualPercent}% / ${target.targetPercent}% target`
    )
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="flex items-center gap-2 font-mono text-xs text-zinc-500">
          <RefreshCw className="w-4 h-4 animate-spin text-[#990024]" />
          <span>SYNCING_DATA_TELEMETRY...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 1. GRAPHICAL SPARKLINE KPI CARDS */}
      <div className="border border-zinc-200 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200">
        
        {/* Card 1: Total Volume Sparkline */}
        <div className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-zinc-500 font-semibold">
              Total Inflow
            </span>
            <span className="font-mono text-[10px] text-zinc-400">#01</span>
          </div>

          <div className="space-y-0.5">
            <div className="font-mono text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
              {totalTickets}
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              <span className="text-emerald-600 font-semibold">+12%</span> 7-day movement
            </p>
          </div>

          {/* Graphical Mini Sparkline */}
          <div className="h-10 mt-3 -mx-2">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 400, height: 40 }}>
              <AreaChart data={analytics.trendData}>
                <Area type="monotone" dataKey="tickets" stroke="#990024" strokeWidth={1.5} fill="#990024" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Active Queue Sparkline */}
        <div className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-zinc-500 font-semibold">
              Active In Progress
            </span>
            <span className="font-mono text-[10px] text-zinc-400">#02</span>
          </div>

          <div className="space-y-0.5">
            <div className="font-mono text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
              {activeTickets}
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              Requires support action
            </p>
          </div>

          {/* Graphical Mini Sparkline */}
          <div className="h-10 mt-3 -mx-2">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 400, height: 40 }}>
              <AreaChart data={analytics.trendData}>
                <Area type="monotone" dataKey="active" stroke="#f59e0b" strokeWidth={1.5} fill="#f59e0b" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 3: Resolved Telemetry Sparkline */}
        <div className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-zinc-500 font-semibold">
              Resolved Volume
            </span>
            <span className="font-mono text-[10px] text-zinc-400">#03</span>
          </div>

          <div className="space-y-0.5">
            <div className="font-mono text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
              {resolvedTickets}
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              <span className="text-emerald-600 font-semibold">+8%</span> closure velocity
            </p>
          </div>

          {/* Graphical Mini Sparkline */}
          <div className="h-10 mt-3 -mx-2">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 400, height: 40 }}>
              <AreaChart data={analytics.trendData}>
                <Area type="monotone" dataKey="resolved" stroke="#059669" strokeWidth={1.5} fill="#059669" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 4: SLA Compliance Telemetry */}
        <div className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-zinc-500 font-semibold">
              SLA Health Rate
            </span>
            <span className="font-mono text-[10px] text-zinc-400">#04</span>
          </div>

          <div className="space-y-0.5">
            <div className="font-mono text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
              {slaRate == null ? '—' : slaRate}<span className="text-lg font-normal text-zinc-400">{slaRate == null ? '' : '%'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>
                {slaRate == null
                  ? 'SLA data unavailable'
                  : targetSummaries.length
                    ? targetSummaries.join(' · ')
                    : 'Deadline-based SLA compliance'}
              </span>
            </div>
          </div>

          {/* Graphical Mini Sparkline */}
          <div className="h-10 mt-3 -mx-2">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 400, height: 40 }}>
              <AreaChart data={analytics.trendData}>
                <Area type="monotone" dataKey="resolved" stroke="#2563eb" strokeWidth={1.5} fill="#2563eb" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 2. GRAPHICAL TELEMETRY + PIE/DONUT CHART SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Main Area Stream Graph (8 cols) */}
        <div className="lg:col-span-8 border border-zinc-200 bg-white flex flex-col justify-between">
          <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] font-semibold text-zinc-900 block">
                Continuous Telemetry Stream
              </span>
              <span className="text-xs text-zinc-400">7-day resolution & influx volume</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="flex items-center gap-1.5 text-zinc-600">
                <span className="w-2 h-2 bg-[#990024]"></span> New
              </span>
              <span className="flex items-center gap-1.5 text-zinc-600">
                <span className="w-2 h-2 bg-emerald-500"></span> Resolved
              </span>
            </div>
          </div>

          <div className="p-4">
            <TicketTrendsChart data={analytics.trendData} />
          </div>
        </div>

        {/* PIE / DONUT CHART: Ticket Lifecycle Distribution (4 cols) */}
        <div className="lg:col-span-4 border border-zinc-200 bg-white flex flex-col justify-between">
          <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-zinc-500" />
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] font-semibold text-zinc-900">
                Status Breakdown
              </span>
            </div>
            <span className="font-mono text-[10px] text-zinc-400">LIFECYCLE</span>
          </div>

          {/* Donut Chart with Centered Total */}
          <div className="relative py-2 flex items-center justify-center">
            <div className="w-full h-48">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 400, height: 192 }}>
                <PieChart>
                  <Pie
                    data={analytics.statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {analytics.statusPieData.map(item => (
                      <Cell key={item.name} fill={DONUT_COLORS[item.name] || '#a1a1aa'} />
                    ))}
                  </Pie>
                  <Tooltip content={<StatusPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Centered Value */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-mono text-xl font-bold text-zinc-900">{totalTickets}</span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">Total</span>
            </div>
          </div>

          {/* Tabular Donut Legend */}
          <div className="p-4 border-t border-zinc-100 divide-y divide-zinc-100 font-mono text-xs">
            {analytics.statusPieData.map(item => {
              const pct = totalTickets > 0 ? Math.round((item.value / totalTickets) * 100) : 0;
              return (
                <div key={item.name} className="py-1.5 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2 h-2 rounded-xs" 
                      style={{ backgroundColor: DONUT_COLORS[item.name] || '#a1a1aa' }} 
                    />
                    <span className="text-zinc-600">{item.name}</span>
                  </div>
                  <span className="font-semibold text-zinc-900 tabular-nums">
                    {item.value} <span className="text-zinc-400 font-normal">({pct}%)</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      <TopCategoriesChart data={analytics.categoryData} />

      {/* 3. TABULAR DATA FORMS (Directorate Performance & Priority Watchlist) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Directorate Performance Table (7 cols) */}
        <div className="lg:col-span-7 border border-zinc-200 bg-white">
          <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-zinc-500" />
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] font-semibold text-zinc-900">
                Directorate Performance Table
              </span>
            </div>
            <span className="font-mono text-[10px] text-zinc-400">SLA_THROUGHPUT</span>
          </div>

          {/* Tabular Form */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 uppercase text-[10px]">
                  <th className="py-2.5 px-4 font-semibold">Directorate</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Open</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Completed</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Total</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Completion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {analytics.deptTable.map(dept => (
                  <tr key={dept.name} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-zinc-800 whitespace-nowrap">
                      {dept.name}
                    </td>
                    <td className="py-3 px-3 text-center text-zinc-600 tabular-nums">
                      {dept.open}
                    </td>
                    <td className="py-3 px-3 text-center text-emerald-700 font-semibold tabular-nums">
                      {dept.resolved}
                    </td>
                    <td className="py-3 px-3 text-center text-zinc-900 font-bold tabular-nums">
                      {dept.total}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#990024]" 
                            style={{ width: `${dept.rate}%` }} 
                          />
                        </div>
                        <span className="w-8 text-right font-bold text-zinc-900 tabular-nums">
                          {dept.rate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Priority Queue Watchlist Table (5 cols) */}
        <div className="lg:col-span-5 border border-zinc-200 bg-white">
          <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] font-semibold text-zinc-900">
                Priority Watchlist Table
              </span>
            </div>
            <span className="font-mono text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 border border-rose-200">
              URGENT
            </span>
          </div>

          {/* Tabular Form */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 uppercase text-[10px]">
                  <th className="py-2.5 px-3 font-semibold">ID</th>
                  <th className="py-2.5 px-3 font-semibold">Subject</th>
                  <th className="py-2.5 px-3 font-semibold">Priority</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {analytics.priorityWatchlist.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-[#990024] whitespace-nowrap">
                      {ticket.ticketNumber}
                    </td>
                    <td className="py-2.5 px-3 max-w-[140px] truncate font-sans text-zinc-800">
                      {ticket.subject}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`text-[9px] uppercase font-bold px-1 py-0.2 border ${
                        ticket.priority === 'Critical' 
                          ? 'bg-rose-50 text-rose-700 border-rose-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-400 whitespace-nowrap text-[10px]">
                      {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* 4. TABULAR STAFF RESOLUTION LEADERBOARD */}
      {analytics.staffLeaderboard.length > 0 && (
        <div className="border border-zinc-200 bg-white">
          <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-500" />
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] font-semibold text-zinc-900">
                Staff Workload & Completion Leaderboard Table
              </span>
            </div>
            <span className="font-mono text-[10px] text-zinc-400">ICT_PERSONNEL</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 uppercase text-[10px]">
                  <th className="py-2.5 px-4 font-semibold">Specialist</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Active Queue</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Completed</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Total Claimed</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Success Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {analytics.staffLeaderboard.map((staff) => (
                  <tr key={staff.name} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-zinc-900 whitespace-nowrap flex items-center gap-2 font-sans">
                      <span className="w-5 h-5 rounded-full bg-zinc-100 text-[#990024] font-bold text-[9px] flex items-center justify-center font-mono">
                        {staff.name.substring(0, 2).toUpperCase()}
                      </span>
                      {staff.name}
                    </td>
                    <td className="py-3 px-4 text-center text-amber-700 font-semibold tabular-nums">
                      {staff.open}
                    </td>
                    <td className="py-3 px-4 text-center text-emerald-700 font-semibold tabular-nums">
                      {staff.resolved}
                    </td>
                    <td className="py-3 px-4 text-center text-zinc-800 font-bold tabular-nums">
                      {staff.total}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-900 font-bold tabular-nums text-[11px]">
                        {staff.rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
