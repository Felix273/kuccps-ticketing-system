import React, { useState } from 'react';
import { X, Mail, Calendar, User, Clock, AlertCircle, CheckCircle, Tag, Building2, MessageSquare, Send, Paperclip, Check, XCircle, PlayCircle, RotateCcw } from 'lucide-react';
import { ticketService } from '../../services/ticketService';

export const TicketDetailModal = ({ ticket, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const getPriorityColor = (priority) => {
    const colors = {
      Low: 'bg-green-100 text-green-700 border-green-300',
      Medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      High: 'bg-orange-100 text-orange-700 border-orange-300',
      Critical: 'bg-red-100 text-red-700 border-red-300'
    };
    return colors[priority] || colors.Medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      Open: 'bg-blue-100 text-blue-700 border-blue-300',
      'In Progress': 'bg-purple-100 text-purple-700 border-purple-300',
      Resolved: 'bg-green-100 text-green-700 border-green-300',
      Closed: 'bg-gray-100 text-gray-700 border-gray-300'
    };
    return colors[status] || colors.Open;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Open': return <AlertCircle className="w-5 h-5" />;
      case 'In Progress': return <Clock className="w-5 h-5" />;
      case 'Resolved':
      case 'Closed': return <CheckCircle className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!confirm(`Are you sure you want to change status to "${newStatus}"?`)) {
      return;
    }

    setIsUpdating(true);
    try {
      const result = await ticketService.updateStatus(ticket.id, newStatus);
      if (result.success) {
        alert(`Ticket status updated to ${newStatus}`);
        if (onUpdate) {
          await onUpdate();
        }
        onClose();
      } else {
        alert(result.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update ticket status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    
    setIsSending(true);
    try {
      const result = await ticketService.addComment(ticket.id, {
        content: replyText,
        userId: null // Will be set by backend from auth token
      });
      
      if (result.success) {
        setReplyText('');
        alert('Reply sent successfully');
        if (onUpdate) {
          await onUpdate();
        }
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply');
    } finally {
      setIsSending(false);
    }
  };

  // Status action buttons based on current status
  const getStatusActions = () => {
    const actions = [];
    
    switch (ticket.status) {
      case 'Open':
        actions.push({
          label: 'Start Working',
          status: 'In Progress',
          icon: <PlayCircle className="w-4 h-4" />,
          color: 'bg-purple-600 hover:bg-purple-700'
        });
        actions.push({
          label: 'Resolve',
          status: 'Resolved',
          icon: <Check className="w-4 h-4" />,
          color: 'bg-green-600 hover:bg-green-700'
        });
        break;
        
      case 'In Progress':
        actions.push({
          label: 'Resolve Ticket',
          status: 'Resolved',
          icon: <Check className="w-4 h-4" />,
          color: 'bg-green-600 hover:bg-green-700'
        });
        actions.push({
          label: 'Reopen',
          status: 'Open',
          icon: <RotateCcw className="w-4 h-4" />,
          color: 'bg-blue-600 hover:bg-blue-700'
        });
        break;
        
      case 'Resolved':
        actions.push({
          label: 'Close Ticket',
          status: 'Closed',
          icon: <XCircle className="w-4 h-4" />,
          color: 'bg-gray-600 hover:bg-gray-700'
        });
        actions.push({
          label: 'Reopen',
          status: 'Open',
          icon: <RotateCcw className="w-4 h-4" />,
          color: 'bg-blue-600 hover:bg-blue-700'
        });
        break;
        
      case 'Closed':
        actions.push({
          label: 'Reopen Ticket',
          status: 'Open',
          icon: <RotateCcw className="w-4 h-4" />,
          color: 'bg-blue-600 hover:bg-blue-700'
        });
        break;
    }
    
    return actions;
  };

  // Mock email thread - in production this would come from backend
  const emailThread = [
    {
      id: 1,
      type: 'received',
      from: ticket.requesterEmail,
      subject: ticket.subject,
      content: ticket.description,
      timestamp: ticket.createdAt,
      isInitial: true
    },
    ...(ticket.comments || []).map((comment, idx) => ({
      id: idx + 2,
      type: comment.userId ? 'sent' : 'received',
      from: comment.userId ? ticket.assignedTo?.email : ticket.requesterEmail,
      fromName: comment.userId ? ticket.assignedTo?.name : ticket.requesterName || ticket.requesterEmail,
      content: comment.content,
      timestamp: comment.createdAt,
      isInitial: false
    }))
  ];

  const statusActions = getStatusActions();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#911414] to-[#d20001] text-white p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="text-sm font-mono bg-white/20 px-3 py-1 rounded">
                  {ticket.ticketNumber}
                </span>
                <span className={`px-3 py-1 rounded-lg border-2 font-medium text-sm flex items-center gap-2 ${getPriorityColor(ticket.priority)}`}>
                  <AlertCircle className="w-4 h-4" />
                  {ticket.priority}
                </span>
                <span className={`px-3 py-1 rounded-lg border-2 font-medium text-sm flex items-center gap-2 ${getStatusColor(ticket.status)}`}>
                  {getStatusIcon(ticket.status)}
                  {ticket.status}
                </span>
              </div>
              <h2 className="text-2xl font-bold">{ticket.subject}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors ml-4"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-white/80" />
              <div>
                <p className="text-white/70 text-xs">From</p>
                <p className="font-medium truncate">{ticket.requesterEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-white/80" />
              <div>
                <p className="text-white/70 text-xs">Created</p>
                <p className="font-medium">{new Date(ticket.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-white/80" />
              <div>
                <p className="text-white/70 text-xs">Assigned To</p>
                <p className="font-medium truncate">{ticket.assignedTo?.name || 'Unassigned'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-white/80" />
              <div>
                <p className="text-white/70 text-xs">Category</p>
                <p className="font-medium">{ticket.category}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50 px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-[#911414] text-[#911414]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('thread')}
              className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'thread'
                  ? 'border-[#911414] text-[#911414]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Mail className="w-4 h-4" />
              Email Thread ({emailThread.length})
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'activity'
                  ? 'border-[#911414] text-[#911414]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Activity Log
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Description */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#911414]" />
                  Description
                </h3>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
                </div>
              </div>

              {/* Additional Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Requester Info */}
                <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#911414]" />
                    Requester Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium text-gray-900">{ticket.requesterEmail}</span>
                    </div>
                    {ticket.requesterName && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium text-gray-900">{ticket.requesterName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Assignment Info */}
                <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#911414]" />
                    Assignment Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Assigned To:</span>
                      <span className="font-medium text-gray-900">
                        {ticket.assignedTo?.name || 'Unassigned'}
                      </span>
                    </div>
                    {ticket.department && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Department:</span>
                        <span className="font-medium text-gray-900">{ticket.department.name}</span>
                      </div>
                    )}
                    {ticket.assignedTo?.department && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Staff Department:</span>
                        <span className="font-medium text-gray-900">{ticket.assignedTo.department}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timestamps */}
                <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#911414]" />
                    Timeline
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(ticket.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(ticket.updatedAt).toLocaleString()}
                      </span>
                    </div>
                    {ticket.resolvedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Resolved:</span>
                        <span className="font-medium text-green-600">
                          {new Date(ticket.resolvedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email Info */}
                {ticket.emailMessageId && (
                  <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      Email Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-blue-800">Created from email</span>
                      </div>
                      <p className="text-xs text-blue-600 font-mono break-all">
                        {ticket.emailMessageId}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'thread' && (
            <div className="space-y-4">
              {/* Email Thread */}
              <div className="space-y-4">
                {emailThread.map((email) => (
                  <div
                    key={email.id}
                    className={`rounded-xl p-6 border-2 ${
                      email.type === 'received'
                        ? 'bg-white border-gray-200 ml-0 mr-12'
                        : 'bg-blue-50 border-blue-200 ml-12 mr-0'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          email.type === 'received'
                            ? 'bg-gradient-to-br from-gray-400 to-gray-600'
                            : 'bg-gradient-to-br from-[#911414] to-[#d20001]'
                        }`}>
                          <Mail className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {email.fromName || email.from}
                          </p>
                          <p className="text-sm text-gray-600">{email.from}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {new Date(email.timestamp).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(email.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    {email.isInitial && (
                      <div className="mb-3 pb-3 border-b border-gray-200">
                        <p className="font-semibold text-gray-900">{email.subject}</p>
                      </div>
                    )}

                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap">{email.content}</p>
                    </div>

                    {email.isInitial && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Initial Request
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              {ticket.status !== 'Closed' && (
                <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 sticky bottom-0">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Send className="w-5 h-5 text-[#911414]" />
                    Reply to {ticket.requesterEmail}
                  </h4>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply here..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent resize-none"
                    rows={4}
                  />
                  <div className="flex justify-between items-center mt-3">
                    <button className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition-colors">
                      <Paperclip className="w-4 h-4" />
                      Attach Files
                    </button>
                    <button
                      onClick={handleSendReply}
                      disabled={!replyText.trim() || isSending}
                      className="px-6 py-2 bg-gradient-to-r from-[#911414] to-[#d20001] text-white rounded-lg hover:from-[#ac0807] hover:to-[#911414] font-medium transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {isSending ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-3">
              {/* Activity Timeline */}
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                {[
                  {
                    action: 'Ticket Created',
                    timestamp: ticket.createdAt,
                    icon: <AlertCircle className="w-4 h-4" />,
                    color: 'bg-blue-100 text-blue-600'
                  },
                  ...(ticket.assignedTo ? [{
                    action: `Assigned to ${ticket.assignedTo.name}`,
                    timestamp: ticket.updatedAt,
                    icon: <User className="w-4 h-4" />,
                    color: 'bg-purple-100 text-purple-600'
                  }] : []),
                  ...(ticket.resolvedAt ? [{
                    action: 'Ticket Resolved',
                    timestamp: ticket.resolvedAt,
                    icon: <CheckCircle className="w-4 h-4" />,
                    color: 'bg-green-100 text-green-600'
                  }] : [])
                ].map((activity, index) => (
                  <div key={index} className="relative flex gap-4 pb-6">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${activity.color}`}>
                      {activity.icon}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="font-semibold text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 bg-gray-50 p-4 flex flex-wrap justify-between items-center gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium transition-colors"
          >
            Close
          </button>
          
          <div className="flex flex-wrap gap-2">
            {statusActions.map((action) => (
              <button
                key={action.status}
                onClick={() => handleStatusUpdate(action.status)}
                disabled={isUpdating}
                className={`px-6 py-2 ${action.color} text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              >
                {action.icon}
                {isUpdating ? 'Updating...' : action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
