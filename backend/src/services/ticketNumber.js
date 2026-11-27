// Ticket numbers look like PREFIX-YYYYMMDD-NNNN, dated in the organisation's timezone.
// The sequence is derived from the highest existing number for the day and creation is
// retried on a unique-constraint collision, so concurrent intake cannot produce duplicates.

const prisma = require('../lib/prisma');

const TICKET_TIMEZONE = process.env.TICKET_TIMEZONE || 'Africa/Nairobi';
const MAX_ATTEMPTS = 5;

function formatTicketDate(date = new Date(), timeZone = TICKET_TIMEZONE) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(date)
      .map(part => [part.type, part.value])
  );
  return `${parts.year}${parts.month}${parts.day}`;
}

function sanitizePrefix(prefix) {
  const cleaned = String(prefix || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
  return cleaned || 'TICK';
}

async function nextTicketNumber(client = prisma, { prefix, date = new Date() } = {}) {
  let resolvedPrefix = prefix;
  if (!resolvedPrefix) {
    const settings = await client.systemSettings.findFirst({ select: { ticketNumberPrefix: true } });
    resolvedPrefix = settings?.ticketNumberPrefix;
  }
  const base = `${sanitizePrefix(resolvedPrefix)}-${formatTicketDate(date)}-`;
  const latest = await client.ticket.findFirst({
    where: { ticketNumber: { startsWith: base } },
    orderBy: { ticketNumber: 'desc' },
    select: { ticketNumber: true }
  });
  const lastSequence = latest ? parseInt(latest.ticketNumber.slice(base.length), 10) || 0 : 0;
  return `${base}${String(lastSequence + 1).padStart(4, '0')}`;
}

function isTicketNumberCollision(error) {
  const target = error?.meta?.target;
  return error?.code === 'P2002' &&
    (Array.isArray(target) ? target.includes('ticketNumber') : String(target || '').includes('ticketNumber'));
}

/**
 * Creates a ticket, assigning a ticket number and retrying if another request took it first.
 * @param {(ticketNumber: string) => Promise<any>} createWithNumber
 */
async function createTicketWithNumber(createWithNumber, client = prisma) {
  let lastError;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const ticketNumber = await nextTicketNumber(client);
    try {
      return await createWithNumber(ticketNumber);
    } catch (error) {
      if (!isTicketNumberCollision(error)) throw error;
      lastError = error;
    }
  }
  throw lastError;
}

module.exports = {
  createTicketWithNumber,
  formatTicketDate,
  nextTicketNumber,
  sanitizePrefix
};
