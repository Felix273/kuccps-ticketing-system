import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Smile, AlertTriangle } from 'lucide-react';
import { operationsService } from '../../services/operationsService';

// Customer-feedback reporting for officers and management (GET /operations/csat-report):
// weekly trend, response rate, ratings per officer and category, and low ratings to follow up.
export const CustomerFeedbackPanel = ({ refreshKey = 0, onOpenTicket }) => {
  const [state, setState] = useState({ report: null, error: null });

  useEffect(() => {
    let active = true;
    operationsService.getCsatReport()
      .then(response => { if (active) setState({ report: response.success ? response.report : null, error: response.success ? null : response.message }); })
      .catch(error => { if (active) setState({ report: null, error: error.message }); });
    return () => { active = false; };
  }, [refreshKey]);

  const { report, error } = state;
  if (error) return <p className="font-mono text-xs text-rose-700">Feedback report unavailable: {error}</p>;
  if (!report) return null;

  const trend = report.trend.map(week => ({
    ...week,
    label: new Date(`${week.week}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }));

  return (
    <section className="border border-zinc-200 bg-white" aria-labelledby="customer-feedback-heading">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-4 py-3">
        <h2 id="customer-feedback-heading" className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.1em] text-zinc-700">
          <Smile className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          Customer Feedback
        </h2>
        <p className="font-mono text-[11px] text-zinc-500">
          Response rate (90 days):{' '}
          <strong className="text-zinc-900">
            {report.responseRate.percent == null ? '—' : `${report.responseRate.percent}%`}
          </strong>{' '}
          ({report.responseRate.ratedTickets} of {report.responseRate.closedTickets} closed tickets rated)
        </p>
      </div>

      <div className="grid grid-cols-1 gap-0 divide-y divide-zinc-200 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        <div className="p-4">
          <h3 className="mb-2 font-mono text-[11px] font-semibold uppercase text-zinc-500">Average rating by week</h3>
          {trend.length ? (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend}>
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} width={20} />
                  <Tooltip formatter={(value, name) => [name === 'average' ? `${value}/5` : value, name === 'average' ? 'Average' : 'Responses']} />
                  <Bar dataKey="average" fill="#059669" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="font-mono text-xs text-zinc-400">No ratings in the last 12 weeks.</p>
          )}
        </div>

        <div className="p-4">
          <h3 className="mb-2 font-mono text-[11px] font-semibold uppercase text-zinc-500">By officer</h3>
          {report.byOfficer.length ? (
            <table className="w-full text-left text-xs">
              <thead className="font-mono text-[10px] uppercase text-zinc-400">
                <tr><th className="py-1 font-semibold">Officer</th><th className="py-1 font-semibold text-right">Avg</th><th className="py-1 font-semibold text-right">Ratings</th><th className="py-1 font-semibold text-right">≤ 2★</th></tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {report.byOfficer.map(row => (
                  <tr key={row.officer}>
                    <td className="py-1.5 text-zinc-800">{row.officer}</td>
                    <td className="py-1.5 text-right font-mono tabular-nums">{row.average}</td>
                    <td className="py-1.5 text-right font-mono tabular-nums text-zinc-500">{row.responses}</td>
                    <td className={`py-1.5 text-right font-mono tabular-nums ${row.lowRatings ? 'font-bold text-rose-700' : 'text-zinc-400'}`}>{row.lowRatings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="font-mono text-xs text-zinc-400">No ratings yet.</p>
          )}
          {report.byCategory.length > 0 && (
            <p className="mt-3 font-mono text-[10px] text-zinc-500">
              By category: {report.byCategory.map(row => `${row.category} ${row.average} (${row.responses})`).join(' · ')}
            </p>
          )}
        </div>

        <div className="p-4">
          <h3 className="mb-2 flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase text-zinc-500">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
            Low ratings to follow up
          </h3>
          {report.lowRatings.length ? (
            <ul className="space-y-2">
              {report.lowRatings.slice(0, 6).map(item => (
                <li key={`${item.ticketId}-${item.createdAt}`} className="rounded border border-rose-100 bg-rose-50/40 p-2 text-xs">
                  <button
                    type="button"
                    onClick={() => onOpenTicket?.(item)}
                    className="font-mono font-semibold text-[#990024] hover:underline"
                  >
                    #{item.ticketNumber}
                  </button>
                  <span className="ml-1 font-mono text-rose-700">{item.rating}★</span>
                  <span className="ml-1 text-zinc-500">· {item.officer}</span>
                  <p className="truncate text-zinc-700">{item.subject}</p>
                  {item.comment && <p className="mt-0.5 italic text-zinc-600">“{item.comment}”</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-mono text-xs text-zinc-400">No ratings of 2 stars or below.</p>
          )}
        </div>
      </div>
    </section>
  );
};
