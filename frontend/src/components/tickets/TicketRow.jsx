// src/components/tickets/TicketRow.jsx
import React from 'react';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '../../utils/constants';

export const TicketRow = ({ ticket, onClick }) => {
  const pConfig = PRIORITY_CONFIG[ticket.priority] || { 
    bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' 
  };
  const sConfig = STATUS_CONFIG[ticket.status] || { 
    bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' 
  };

  return (
    <tr 
      className="border-b border-gray-100 hover:bg-red-50/30 cursor-pointer transition-colors duration-150" 
      onClick={() => onClick(ticket)}
    >
      <td className="px-6 py-4">
        <span className="text-sm font-semibold text-[#911414]">{ticket.ticketNumber}</span>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">{ticket.subject}</span>
          <span className="text-xs text-gray-500 mt-1">{ticket.requesterEmail}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-gray-700">{ticket.department?.name || 'N/A'}</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-gray-600">{ticket.category}</span>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${pConfig.bg} ${pConfig.text} ${pConfig.border}`}>
          {ticket.priority || 'N/A'}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${sConfig.bg} ${sConfig.text} ${sConfig.border}`}>
          {ticket.status || 'N/A'}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-gray-600">
          {new Date(ticket.createdAt).toLocaleDateString()}
        </span>
      </td>
    </tr>
  );
};
