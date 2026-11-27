// CSV export of tickets. Ticket text comes from requesters, so every cell is quoted and
// values that a spreadsheet would treat as a formula (=, +, -, @, tab, CR) are prefixed
// with an apostrophe to prevent CSV/formula injection when opened in Excel.
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function csvCell(value) {
  let text = value === null || value === undefined ? '' : String(value);
  if (FORMULA_PREFIX.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : 'N/A';
}

export function ticketsToCsv(tickets) {
  const headers = [
    'Ticket Number',
    'Subject',
    'Status',
    'Priority',
    'Category',
    'Requester Email',
    'Claimed By',
    'Department',
    'Created Date',
    'Updated Date',
    'Resolved Date'
  ];

  const rows = tickets.map(ticket => [
    ticket.ticketNumber,
    ticket.subject,
    ticket.status,
    ticket.priority,
    ticket.category,
    ticket.requesterEmail,
    ticket.assignedTo?.name || 'Unclaimed',
    ticket.department?.name || ticket.assignedTo?.department?.name || 'N/A',
    formatDate(ticket.createdAt),
    formatDate(ticket.updatedAt),
    formatDate(ticket.resolvedAt)
  ]);

  return [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
}

export const exportToCSV = (tickets, filename = 'tickets.csv') => {
  if (!tickets || tickets.length === 0) {
    alert('No tickets to export');
    return;
  }

  // Leading BOM so Excel reads UTF-8 (names, accents) correctly.
  const blob = new Blob(['﻿', ticketsToCsv(tickets)], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Excel opens the CSV directly; it is saved with a .csv extension so Excel does not
// warn about a mismatched file format.
export const exportToExcel = (tickets, filename = 'tickets.xlsx') => {
  exportToCSV(tickets, filename.replace(/\.xlsx$/i, '.csv'));
};
