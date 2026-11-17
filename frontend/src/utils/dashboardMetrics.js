export const TICKET_STATUSES = ['Open', 'InProgress', 'OnHold', 'Resolved', 'Closed'];

export function countTicketsByStatus(tickets = []) {
  const counts = Object.fromEntries(TICKET_STATUSES.map(status => [status, 0]));
  tickets.forEach(ticket => {
    if (Object.hasOwn(counts, ticket.status)) counts[ticket.status] += 1;
  });
  return counts;
}

export function buildTicketTrendData(tickets = [], now = new Date()) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + index);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      dayKey: date.toDateString(),
      created: 0,
      resolved: 0,
      closed: 0
    };
  });
  const daysByKey = new Map(days.map(day => [day.dayKey, day]));

  tickets.forEach(ticket => {
    for (const [field, metric] of [
      ['createdAt', 'created'],
      ['resolvedAt', 'resolved'],
      ['closedAt', 'closed']
    ]) {
      if (!ticket[field]) continue;
      const eventDate = new Date(ticket[field]);
      if (Number.isNaN(eventDate.getTime())) continue;
      const day = daysByKey.get(new Date(
        eventDate.getFullYear(),
        eventDate.getMonth(),
        eventDate.getDate()
      ).toDateString());
      if (day) day[metric] += 1;
    }
  });

  return days;
}
