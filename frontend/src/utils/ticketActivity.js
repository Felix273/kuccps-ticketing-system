// Turns TicketHistory rows from the API into readable activity-log entries.

const STATUS_LABELS = {
  Open: 'Open',
  InProgress: 'In Progress',
  OnHold: 'On Hold',
  Resolved: 'Resolved',
  Closed: 'Closed'
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function statusLabel(entry) {
  const { oldValue, newValue } = entry;
  if (newValue === 'OnHold') return { tone: 'amber', title: 'Placed on hold' };
  if (newValue === 'Reopened') return { tone: 'blue', title: 'Reopened' };
  if (newValue === 'Resumed' || (oldValue === 'OnHold' && newValue !== 'OnHold')) return { tone: 'blue', title: 'Resumed from hold' };
  if (newValue === 'Resolved') return { tone: 'emerald', title: 'Resolved' };
  if (newValue === 'Closed') return { tone: 'zinc', title: 'Closed' };
  if (newValue === 'InProgress') return { tone: 'blue', title: 'Investigation started' };
  if (newValue === 'Open') return { tone: 'blue', title: 'Returned to Open' };
  return { tone: 'zinc', title: `Status: ${STATUS_LABELS[oldValue] || oldValue} → ${STATUS_LABELS[newValue] || newValue}` };
}

export function describeActivity(entry) {
  const value = entry.newValue || '';
  switch (entry.field) {
    case 'created':
      return { tone: 'blue', title: 'Ticket created' };
    case 'claimed':
      return { tone: 'blue', title: `Claimed by ${value}` };
    case 'assignedTo':
      if (!value || value === 'Unassigned') return { tone: 'zinc', title: 'Unassigned' };
      return { tone: 'blue', title: `${entry.note === 'Reassigned' ? 'Reassigned' : 'Assigned'} to ${UUID.test(value) ? 'an officer' : value}` };
    case 'status':
      return statusLabel(entry);
    case 'escalation':
      return { tone: 'rose', title: UUID.test(value) ? 'Escalated' : value.replace(/^(vertical|horizontal):/i, 'Escalated to ') };
    case 'sla_warning':
      return { tone: 'amber', title: `SLA warning — ${value}` };
    case 'sla_breach':
      return { tone: 'rose', title: value || 'SLA exceeded — escalated' };
    case 'priority':
      return { tone: 'zinc', title: `Priority ${entry.oldValue} → ${value}` };
    case 'category':
      return { tone: 'zinc', title: `Category ${entry.oldValue} → ${value}` };
    case 'department':
      return { tone: 'zinc', title: `Routed to ${UUID.test(value) ? 'another directorate' : value}` };
    case 'attachment':
      return { tone: 'zinc', title: `Attachment added: ${value}` };
    case 'csat':
      return { tone: 'emerald', title: value === 'Comment added' ? 'Customer added a feedback comment' : `Customer rating ${value}` };
    default:
      return { tone: 'zinc', title: `${entry.field}: ${value}` };
  }
}

export function buildActivityTimeline(history = []) {
  return [...history]
    .sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt))
    .map(entry => ({
      id: entry.id,
      timestamp: entry.createdAt,
      actor: entry.changedByName || (UUID.test(entry.changedBy || '') ? 'ICT officer' : entry.changedBy) || 'System',
      note: entry.note && entry.note !== 'Reassigned' ? entry.note : null,
      ...describeActivity(entry)
    }));
}
