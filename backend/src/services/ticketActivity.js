// Single place for writing the ticket activity log (TicketHistory).
// Every lifecycle event is stored with who did it (id + readable name), when, and an optional note.

const prisma = require('../lib/prisma');

const EVENTS = {
  created: 'created',
  claimed: 'claimed',
  assigned: 'assignedTo',
  status: 'status',
  priority: 'priority',
  category: 'category',
  department: 'department',
  escalation: 'escalation',
  slaWarning: 'sla_warning',
  slaBreach: 'sla_breach',
  attachment: 'attachment',
  csat: 'csat',
  emailReply: 'email_reply',
  resolution: 'resolution'
};

function actorFields(actor) {
  if (!actor) return { changedBy: 'system', changedByName: 'System' };
  if (typeof actor === 'string') return { changedBy: actor, changedByName: actor };
  return { changedBy: actor.id || actor.email || 'system', changedByName: actor.name || actor.email || actor.username || 'System' };
}

async function recordTicketEvent(client, { ticketId, field, oldValue = '', newValue = '', actor, note }) {
  return (client || prisma).ticketHistory.create({
    data: {
      ticketId,
      field,
      oldValue: oldValue == null ? '' : String(oldValue),
      newValue: newValue == null ? '' : String(newValue),
      note: note || null,
      ...actorFields(actor)
    }
  });
}

module.exports = { EVENTS, recordTicketEvent };
