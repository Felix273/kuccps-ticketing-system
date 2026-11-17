import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTicketTrendData, countTicketsByStatus } from './dashboardMetrics.js';

test('trend data counts creation, resolution, and closure on their respective dates', () => {
  const today = new Date(2026, 10, 14, 12);
  const tickets = [
    {
      createdAt: new Date(2026, 10, 8, 9),
      resolvedAt: new Date(2026, 10, 13, 14),
      closedAt: new Date(2026, 10, 14, 10)
    },
    {
      createdAt: new Date(2026, 10, 14, 8),
      resolvedAt: null,
      closedAt: null
    }
  ];

  const trend = buildTicketTrendData(tickets, today);

  assert.equal(trend.length, 7);
  assert.deepEqual(trend.map(({ created, resolved, closed }) => ({ created, resolved, closed })), [
    { created: 1, resolved: 0, closed: 0 },
    { created: 0, resolved: 0, closed: 0 },
    { created: 0, resolved: 0, closed: 0 },
    { created: 0, resolved: 0, closed: 0 },
    { created: 0, resolved: 0, closed: 0 },
    { created: 0, resolved: 1, closed: 0 },
    { created: 1, resolved: 0, closed: 1 }
  ]);
});

test('a resolved ticket that is later closed remains a resolution event and moves to closed in the current-state summary', () => {
  const ticket = {
    status: 'Closed',
    createdAt: new Date(2026, 10, 10, 9),
    resolvedAt: new Date(2026, 10, 12, 14),
    closedAt: new Date(2026, 10, 14, 10)
  };
  const trend = buildTicketTrendData([ticket], new Date(2026, 10, 14, 12));
  const statusCounts = countTicketsByStatus([ticket]);

  assert.equal(trend[4].resolved, 1);
  assert.equal(trend[6].closed, 1);
  assert.equal(statusCounts.Resolved, 0);
  assert.equal(statusCounts.Closed, 1);
  assert.equal(Object.values(statusCounts).reduce((total, count) => total + count, 0), 1);
});
