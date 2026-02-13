export const exportToCSV = (tickets, filename = 'tickets.csv') => {
  if (!tickets || tickets.length === 0) {
    alert('No tickets to export');
    return;
  }

  // Define headers
  const headers = [
    'Ticket Number',
    'Subject',
    'Status',
    'Priority',
    'Category',
    'Requester Email',
    'Assigned To',
    'Department',
    'Created Date',
    'Updated Date',
    'Resolved Date'
  ];

  // Map tickets to rows
  const rows = tickets.map(ticket => [
    ticket.ticketNumber,
    `"${ticket.subject.replace(/"/g, '""')}"`, // Escape quotes
    ticket.status,
    ticket.priority,
    ticket.category,
    ticket.requesterEmail,
    ticket.assignedTo?.name || 'Unassigned',
    ticket.department?.name || ticket.assignedTo?.department || 'N/A',
    new Date(ticket.createdAt).toLocaleString(),
    new Date(ticket.updatedAt).toLocaleString(),
    ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleString() : 'N/A'
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToExcel = (tickets, filename = 'tickets.xlsx') => {
  // For now, we'll export as CSV with .xlsx extension
  // In a real app, you'd use a library like xlsx or exceljs
  exportToCSV(tickets, filename);
  alert('Note: File is exported as CSV. For true Excel format, consider using the xlsx library.');
};
