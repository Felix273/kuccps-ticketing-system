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
  Smile,
  PieChart as PieIcon,
  Table as TableIcon,
  ChevronRight,
  Activity
} from 'lucide-react';
import { TicketTrendsChart } from './charts/TicketTrendsChart';
import { TopCategoriesChart } from './TopCategoriesChart';
import { operationsService } from '../../services/operationsService';
import { ticketService } from '../../services/ticketService';
import { CustomerFeedbackPanel } from './CustomerFeedbackPanel';

const DONUT_COLORS = {
  Open: '#2563eb',
  'InProgress': '#f59e0b',
  'OnHold': '#f97316',
  Resolved: '#059669',
  Closed: '#71717a'
};
const ACTIVE_TICKET_STATUSES = new Set(['Open', 'InProgress', 'OnHold']);

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

const EMPTY_OVERVIEW = {
  total: 0,
  active: 0,
  withSla: 0,
  withCsat: 0,
  byStatus: { Open: 0, InProgress: 0, OnHold: 0, Resolved: 0, Closed: 0 },
  trendData: [],
  departments: [],
  priorityWatchlist: [],
  staffLeaderboard: []
};

// All figures are aggregated by the API (/tickets/overview and /operations/dashboard),
// so the dashboard never downloads the full ticket list.
export const DashboardView = ({ refreshKey = 0, onViewTickets }) => {
  const [operationsAnalytics, setOperationsAnalytics] = useState(null);
  const [overviewState, setOverviewState] = useState({ key: null, data: EMPTY_OVERVIEW, error: null });

  useEffect(() => {
    let active = true;
    ticketService.getOverview()
      .then(response => {
        if (!active) return;
        if (response.success) setOverviewState({ key: refreshKey, data: response.overview, error: null });
        else setOverviewState(previous => ({ ...previous, key: refreshKey, error: response.message }));
      })
      .catch(err => {
        if (active) setOverviewState(previous => ({ ...previous, key: refreshKey, error: err.message }));
      });
    operationsService.getDashboardAnalytics()
      .then(response => { if (active && response.success) setOperationsAnalytics(response.analytics); })
      .catch(err => console.warn('Operations analytics unavailable:', err.message));
    return () => { active = false; };
  }, [refreshKey]);

  const overview = overviewState.data;
  const isLoading = overviewState.key === null;

  const analytics = useMemo(() => ({
    trendData: overview.trendData,
    statusPieData: Object.entries(overview.byStatus)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0),
    categoryData: operationsAnalytics?.categoryIssues || [],
    deptTable: overview.departments,
    priorityWatchlist: overview.priorityWatchlist,
    staffLeaderboard: overview.staffLeaderboard
  }), [overview, operationsAnalytics]);

  const totalTickets = overview.total;
  const activeTickets = overview.active;
  const resolvedTickets = overview.byStatus.Resolved;
  const slaTicketCount = overview.withSla;
  const slaRate = operationsAnalytics?.slaCompliance;
  const csatRate = operationsAnalytics?.csatSatisfactionRate;
  const csatScore = operationsAnalytics?.csatScore;
  const csatResponses = operationsAnalytics?.csatResponses || 0;
  const targetAttainment = operationsAnalytics?.slaTargetAttainment;
  const targetSummaries = ['response', 'resolution'].flatMap(type =>
    (targetAttainment?.[type] || []).map(target =>
      `${type} ${target.actualPercent}% / ${target.targetPercent}% target`
    )
  );
  // Click-throughs open the ticket list with server-side filter criteria.
  const selectTickets = (label, params = {}) => {
    onViewTickets?.({ label, params });
  };
  const selectStatus = status => {
    if (!status) return;
    selectTickets(`${status} tickets`, { status: [status] });
  };

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
      <div className="border border-zinc-200 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200">
        
        {/* Card 1: Total Volume Sparkline */}
        <button
          type="button"
          onClick={() => selectTickets('All tickets')}
          aria-label={`View all ${totalTickets} tickets`}
          className="group cursor-pointer p-4 flex flex-col justify-between text-left hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#990024]"
        >
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
              Tickets across all current states
            </p>
            <p className="mt-2 text-[10px] font-mono text-[#990024] group-hover:underline">View tickets</p>
          </div>

          {/* Graphical Mini Sparkline */}
          <div className="h-10 mt-3 -mx-2">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 400, height: 40 }}>
              <AreaChart data={analytics.trendData}>
                <Area type="monotone" dataKey="created" stroke="#990024" strokeWidth={1.5} fill="#990024" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </button>

        {/* Card 2: Active Queue Sparkline */}
        <button
          type="button"
          onClick={() => selectTickets('Active tickets', { status: [...ACTIVE_TICKET_STATUSES] })}
          aria-label={`View ${activeTickets} active tickets`}
          className="group cursor-pointer p-4 flex flex-col justify-between text-left hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#990024]"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-zinc-500 font-semibold">
              Active Queue
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
          <p className="mt-3 font-mono text-[10px] text-zinc-400">Open · In Progress · On Hold</p>
          <p className="mt-2 text-[10px] font-mono text-[#990024] group-hover:underline">View tickets</p>
        </button>

        {/* Card 3: Resolved Telemetry Sparkline */}
        <button
          type="button"
          onClick={() => selectStatus('Resolved')}
          aria-label={`View ${resolvedTickets} currently resolved tickets`}
          className="group cursor-pointer p-4 flex flex-col justify-between text-left hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#990024]"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-zinc-500 font-semibold">
              Currently Resolved
            </span>
            <span className="font-mono text-[10px] text-zinc-400">#03</span>
          </div>

          <div className="space-y-0.5">
            <div className="font-mono text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
              {resolvedTickets}
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              Currently in Resolved state
            </p>
          </div>

          <p className="mt-3 font-mono text-[10px] text-zinc-400">Closed tickets move to the Closed state</p>
          <p className="mt-2 text-[10px] font-mono text-[#990024] group-hover:underline">View tickets</p>
        </button>

        {/* Customer Satisfaction */}
        <button
          type="button"
          onClick={() => selectTickets('Tickets with customer feedback', { hasCsat: 'true' })}
          disabled={false}
          aria-label={`Customer satisfaction ${csatRate == null ? 'unavailable' : `${csatRate}%`}, ${csatResponses} responses`}
          className="group cursor-pointer p-4 flex flex-col justify-between text-left hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#990024] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-zinc-500 font-semibold">
              Customer Satisfaction
            </span>
            <Smile className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          </div>
          <div>
            <div className="font-mono text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
              {csatRate == null ? '—' : `${csatRate}%`}
            </div>
            <p className="mt-1 text-[11px] text-zinc-500 font-mono">
              {csatResponses
                ? `${csatResponses} responses · average ${csatScore}/5`
                : 'No feedback responses yet'}
            </p>
            <p className="mt-2 text-[10px] text-zinc-400 font-mono">Satisfied = ratings 4–5</p>
            <p className="mt-2 text-[10px] font-mono text-[#990024] group-hover:underline">View feedback tickets</p>
          </div>
        </button>

        {/* Card 4: SLA Compliance Telemetry */}
        <button
          type="button"
          onClick={() => selectTickets('Tickets with SLA targets', { hasSla: 'true' })}
          aria-label={`View ${slaTicketCount} tickets with SLA targets`}
          className="group cursor-pointer p-4 flex flex-col justify-between text-left hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#990024]"
        >
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

          <p className="mt-2 text-[10px] font-mono text-[#990024] group-hover:underline">View tickets</p>
        </button>

      </div>

      {/* 2. GRAPHICAL TELEMETRY + PIE/DONUT CHART SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Main Area Stream Graph (8 cols) */}
        <div className="lg:col-span-8 border border-zinc-200 bg-white flex flex-col justify-between">
          <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] font-semibold text-zinc-900 block">
                Ticket Lifecycle Events
              </span>
              <span className="text-xs text-zinc-400">Daily ticket creation, resolution, and closure events over the last 7 days</span>
              <span className="mt-1 block text-[10px] text-zinc-400">Closing a ticket adds a closure event; its earlier resolution event stays on its original date.</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="flex items-center gap-1.5 text-zinc-600">
                <span className="w-2 h-2 bg-[#990024]"></span> Created
              </span>
              <span className="flex items-center gap-1.5 text-zinc-600">
                <span className="w-2 h-2 bg-emerald-500"></span> Resolved
              </span>
              <span className="flex items-center gap-1.5 text-zinc-600">
                <span className="w-2 h-2 bg-zinc-500"></span> Closed
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
            <div>
              <div className="flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-zinc-500" />
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] font-semibold text-zinc-900">
                  Status Breakdown
                </span>
              </div>
              <span className="pl-6 text-[10px] text-zinc-400">Current snapshot; each ticket has one state</span>
            </div>
            <span className="font-mono text-[10px] text-zinc-400">CURRENT_STATE</span>
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
                    onClick={(_, index) => selectStatus(analytics.statusPieData[index]?.name)}
                    cursor="pointer"
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
                <button
                  key={item.name}
                  type="button"
                  onClick={() => selectStatus(item.name)}
                  aria-label={`View ${item.value} ${item.name} tickets`}
                  className="w-full py-1.5 flex items-center justify-between text-left hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#990024]"
                >
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
                </button>
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
                        ['Critical', 'VeryHigh'].includes(ticket.priority) 
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

      <CustomerFeedbackPanel
        refreshKey={refreshKey}
        onOpenTicket={item => selectTickets(`Ticket ${item.ticketNumber}`, { q: item.ticketNumber })}
      />
    </div>
  );
};
