import React, { useEffect, useRef, useState } from 'react';
import { 
  X, 
  Mail, 
  Calendar, 
  User, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Tag, 
  Building2, 
  MessageSquare, 
  Send, 
  Paperclip, 
  Check, 
  XCircle, 
  PlayCircle, 
  RotateCcw, 
  ChevronDown, 
  ChevronRight, 
  ShieldCheck, 
  Sparkles, 
  BookOpen, 
  ArrowUpRight 
} from 'lucide-react';
import { ticketService } from '../../services/ticketService';
import { normalizePriority } from '../../utils/constants';
import { knowledgeBaseService } from '../../services/knowledgeBaseService';

function formatSlaDeadline(value) {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: 'Africa/Nairobi',
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export const TicketDetailModal = ({ ticket, onClose, onUpdate, currentUser, users = [] }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [replyText, setReplyText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const fileInputRef = useRef(null);
  const [isSending, setIsSending] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showEscalation, setShowEscalation] = useState(false);
  const [escalationType, setEscalationType] = useState('horizontal');
  const [targetUserId, setTargetUserId] = useState('');
  const [escalationReason, setEscalationReason] = useState('');
  const [isEscalating, setIsEscalating] = useState(false);

  useEffect(() => {
    const loadSuggestions = async () => {
      setSuggestionsLoading(true);
      try {
        const response = await knowledgeBaseService.getTicketSuggestions(ticket.id);
        if (response.success) setSuggestions(response.suggestions);
      } catch (error) {
        console.warn('Could not load ticket suggestions:', error.message);
      } finally {
        setSuggestionsLoading(false);
      }
    };
    loadSuggestions();
  }, [ticket.id]);

  const handleStatusUpdate = async (newStatus) => {
    const confirmation = newStatus === 'On Hold'
      ? 'Put this ticket On Hold while waiting for a dependency or information?'
      : newStatus === 'Resolved'
        ? 'Mark this ticket Resolved? The requester will receive a satisfaction rating link.'
        : newStatus === 'Closed'
          ? 'Close this resolved ticket? It will move from Resolved to Closed.'
          : `Are you sure you want to update ticket status to ${newStatus}?`;
    if (!confirm(confirmation)) return;
    setIsUpdating(true);
    try {
      const result = newStatus === 'In Progress' && currentUser?.id
        ? await ticketService.startWorking(ticket.id, currentUser.id)
        : await ticketService.updateStatus(ticket.id, newStatus);
      if (result.success) {
        if (onUpdate) await onUpdate();
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

  const handleEscalate = async () => {
    if (!targetUserId) {
      alert('Please choose an officer to escalate to.');
      return;
    }
    setIsEscalating(true);
    try {
      const result = await ticketService.escalate(ticket.id, {
        targetUserId,
        escalationType,
        reason: escalationReason
      });
      if (result.success) {
        if (onUpdate) await onUpdate();
        onClose();
      } else {
        alert(result.message || 'Failed to escalate ticket');
      }
    } catch (error) {
      console.error('Escalation failed:', error);
      alert('Failed to escalate ticket');
    } finally {
      setIsEscalating(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setIsSending(true);
    try {
      const result = await ticketService.addComment(ticket.id, {
        content: replyText,
        isInternal
      });
      if (result.success) {
        setReplyText('');
        setIsInternal(false);
        if (onUpdate) await onUpdate();
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply');
    } finally {
      setIsSending(false);
    }
  };

  const handleAttachment = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const result = await ticketService.addAttachment(ticket.id, file);
      if (result.success) {
        if (onUpdate) await onUpdate();
      } else {
        alert(result.message || 'Failed to upload attachment');
      }
    } catch (error) {
      console.error('Attachment upload failed:', error);
      alert('Failed to upload attachment');
    } finally {
      event.target.value = '';
    }
  };

  const getStatusActions = () => {
    const actions = [];
    switch (ticket.status) {
      case 'Open':
        actions.push({
          label: 'Start Working',
          status: 'In Progress',
          icon: <PlayCircle className="w-3.5 h-3.5" />,
          isPrimary: false
        });
        actions.push({
          label: 'Put On Hold',
          status: 'On Hold',
          icon: <Clock className="w-3.5 h-3.5" />,
          isPrimary: false
        });
        actions.push({
          label: 'Resolve Ticket',
          status: 'Resolved',
          icon: <Check className="w-3.5 h-3.5" />,
          isPrimary: true
        });
        break;
      case 'In Progress':
        actions.push({
          label: 'Reopen',
          status: 'Open',
          icon: <RotateCcw className="w-3.5 h-3.5" />,
          isPrimary: false
        });
        actions.push({
          label: 'Put On Hold',
          status: 'On Hold',
          icon: <Clock className="w-3.5 h-3.5" />,
          isPrimary: false
        });
        actions.push({
          label: 'Resolve Ticket',
          status: 'Resolved',
          icon: <Check className="w-3.5 h-3.5" />,
          isPrimary: true
        });
        break;
      case 'On Hold':
        actions.push({
          label: 'Resume Work',
          status: 'In Progress',
          icon: <PlayCircle className="w-3.5 h-3.5" />,
          isPrimary: false
        });
        actions.push({
          label: 'Resolve Ticket',
          status: 'Resolved',
          icon: <Check className="w-3.5 h-3.5" />,
          isPrimary: true
        });
        break;
      case 'Resolved':
        actions.push({
          label: 'Reopen',
          status: 'Open',
          icon: <RotateCcw className="w-3.5 h-3.5" />,
          isPrimary: false
        });
        actions.push({
          label: 'Close Ticket',
          status: 'Closed',
          icon: <XCircle className="w-3.5 h-3.5" />,
          isPrimary: true
        });
        break;
      case 'Closed':
        actions.push({
          label: 'Reopen Ticket',
          status: 'Open',
          icon: <RotateCcw className="w-3.5 h-3.5" />,
          isPrimary: false
        });
        break;
      default:
        break;
    }
    return actions;
  };

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
      type: comment.isInternal ? 'internal' : comment.userId ? 'sent' : 'received',
      from: comment.user?.email || ticket.requesterEmail,
      fromName: comment.user?.name || ticket.requesterName || ticket.requesterEmail,
      content: comment.content,
      timestamp: comment.createdAt,
      isInitial: false,
      isInternal: comment.isInternal
    }))
  ];

  const statusActions = getStatusActions();
  const escalationTargets = users.filter(user =>
    user.role !== 'user' &&
    user.id !== currentUser?.id &&
    !['Resolved', 'Closed'].includes(ticket.status)
  );

  return (
    <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col font-sans">
        
        {/* 1. CRAFT HEADER (No Solid Red Canvas) */}
        <div className="p-5 sm:p-6 border-b border-zinc-200 bg-white">
          <div className="flex items-start justify-between gap-4 mb-2">
            
            {/* Breadcrumb + Status & Priority Dots */}
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-xs text-zinc-400">
                  Tickets / <strong className="text-zinc-900 font-bold">#{ticket.ticketNumber}</strong>
                </span>

                <div className="h-3 w-[1px] bg-zinc-200"></div>

                {/* Linear Status Indicator */}
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold px-2 py-0.5 rounded border border-zinc-200 bg-zinc-50 text-zinc-700">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    ticket.status === 'Resolved' ? 'bg-emerald-500' :
                    ticket.status === 'In Progress' ? 'bg-amber-500 animate-pulse' :
                    ticket.status === 'Open' ? 'bg-blue-500' :
                    ticket.status === 'On Hold' ? 'bg-orange-500' : 'bg-zinc-400'
                  }`}></span>
                  {ticket.status}
                </span>

                {/* Linear Priority Indicator */}
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold px-2 py-0.5 rounded border border-zinc-200 bg-zinc-50 text-zinc-700">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    ticket.priority === 'Critical' || ticket.priority === 'Very High' ? 'bg-rose-500 animate-pulse' :
                    ticket.priority === 'High' ? 'bg-amber-500' : 'bg-zinc-400'
                  }`}></span>
                  {normalizePriority(ticket.priority) || 'Normal'}
                </span>
              </div>

              {/* Ticket Subject */}
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 leading-snug truncate">
                {ticket.subject}
              </h2>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Precision Metadata Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 mt-3 border-t border-zinc-100 text-xs">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Requester</p>
              <p className="font-mono text-zinc-800 font-medium truncate mt-0.5">{ticket.requesterEmail}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Created Date</p>
              <p className="font-mono text-zinc-800 font-medium mt-0.5 tabular-nums">
                {new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Claimed By</p>
              <p className="font-mono text-zinc-800 font-medium truncate mt-0.5">
                {ticket.assignedTo?.name || 'Unassigned'}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Category</p>
              <p className="font-mono text-zinc-800 font-medium truncate mt-0.5">{ticket.category || 'General Support'}</p>
            </div>
          </div>
        </div>

        {/* 2. SEGMENTED TABS */}
        <div className="border-b border-zinc-200 bg-zinc-50/60 px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-3 font-mono text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'details'
                  ? 'border-[#990024] text-zinc-900'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Overview & Triage
            </button>
            <button
              onClick={() => setActiveTab('thread')}
              className={`py-3 font-mono text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'thread'
                  ? 'border-[#990024] text-zinc-900'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Thread</span>
              <span className="px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-700 text-[10px] tabular-nums font-bold">
                {emailThread.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-3 font-mono text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'activity'
                  ? 'border-[#990024] text-zinc-900'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Audit Trail
            </button>
          </div>
        </div>

        {/* 3. CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {activeTab === 'details' && (
            <div className="space-y-5">
              
              {/* Description Box */}
              <div className="bg-zinc-50/70 rounded-lg p-5 border border-zinc-200">
                <div className="flex items-center gap-2 mb-2 font-mono text-[11px] uppercase tracking-wider text-zinc-500 font-bold">
                  <MessageSquare className="w-3.5 h-3.5 text-[#990024]" />
                  <span>Requester Problem Statement</span>
                </div>
                <div className="text-zinc-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {ticket.description || 'No description provided.'}
                </div>
              </div>

              <section className={`rounded-lg border p-4 ${ticket.isOverdue ? 'border-rose-200 bg-rose-50/70' : 'border-zinc-200 bg-white'}`}>
                <h3 className="mb-3 flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-700">
                  <Clock className="h-3.5 w-3.5 text-[#990024]" />
                  SLA deadlines (Africa/Nairobi)
                </h3>
                <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                  {ticket.responseDueAt && (
                    <div>
                      <p className="text-zinc-500">First response due</p>
                      <p className="mt-1 font-semibold text-zinc-900">{formatSlaDeadline(ticket.responseDueAt)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-zinc-500">Resolution due</p>
                    <p className="mt-1 font-semibold text-zinc-900">
                      {ticket.slaDueAt
                        ? formatSlaDeadline(ticket.slaDueAt)
                        : ticket.category === 'Software Development'
                          ? 'Per approved specification (no numeric default)'
                          : 'No numeric SLA timeline configured for this category'}
                    </p>
                  </div>
                </div>
              </section>

              {/* Diagnostic AI Knowledge Suggestions */}
              <div className="bg-white rounded-lg p-5 border border-zinc-200 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Sparkles className="w-4 h-4 text-[#990024]" />
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-900">
                      Operational Triage & Knowledge Suggestions
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-400">TELEMETRY_ASSIST</span>
                </div>

                {suggestionsLoading ? (
                  <p className="font-mono text-xs text-zinc-400">Scanning knowledge articles and similar tickets...</p>
                ) : suggestions ? (
                  <div className="space-y-4">
                    <p className="text-xs text-zinc-600 font-sans leading-relaxed">
                      {suggestions.summary}
                    </p>

                    {/* Recommended Actions */}
                    <div>
                      <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-2">
                        Recommended Actions
                      </h4>
                      <div className="space-y-1.5 font-mono text-xs">
                        {suggestions.recommendedActions?.map((action, index) => (
                          <div key={index} className="flex items-start gap-2 text-zinc-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 3 Hairline Diagnostic Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-zinc-50/60 rounded border border-zinc-200 p-3 text-xs font-mono">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Missing Details</span>
                        {suggestions.missingInfo?.length > 0 ? (
                          <div className="space-y-1 text-zinc-700">
                            {suggestions.missingInfo.map(item => (
                              <p key={item}>• {item}</p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-zinc-500">Triage details look complete.</p>
                        )}
                      </div>

                      <div className="bg-zinc-50/60 rounded border border-zinc-200 p-3 text-xs font-mono">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Priority Assessment</span>
                        <p className="text-zinc-700">Current: <strong>{normalizePriority(ticket.priority)}</strong></p>
                        <p className="text-zinc-700">Suggested: <strong className="text-[#990024]">{normalizePriority(suggestions.priorityAssessment?.suggested || ticket.priority)}</strong></p>
                      </div>

                      <div className="bg-zinc-50/60 rounded border border-zinc-200 p-3 text-xs font-mono">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Similar Active Incidents</span>
                        {suggestions.similarTickets?.length > 0 ? (
                          <div className="space-y-1 text-zinc-700 truncate">
                            {suggestions.similarTickets.slice(0, 2).map(item => (
                              <p key={item.ticketNumber} className="truncate">#{item.ticketNumber}: {item.subject}</p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-zinc-500">No duplicate incidents detected.</p>
                        )}
                      </div>
                    </div>

                    {/* Related Knowledge Articles */}
                    {suggestions.articles?.length > 0 && (
                      <div>
                        <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-2">
                          Referenced SOPs & Procedures
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {suggestions.articles.map(article => (
                            <div key={article.id} className="p-2.5 rounded border border-zinc-200 bg-zinc-50/60 text-xs">
                              <p className="font-bold text-zinc-900">{article.title}</p>
                              <p className="text-zinc-500 line-clamp-2 mt-0.5">{article.excerpt}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="font-mono text-xs text-zinc-400">No automated suggestions triggered for this category.</p>
                )}
              </div>

              {/* Escalation & Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Officer Escalation */}
                <div className="p-4 rounded-lg border border-zinc-200 bg-white">
                  <div className="flex items-center gap-2 mb-2 font-mono text-[11px] font-bold uppercase text-zinc-700">
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#990024]" />
                    <span>Officer Escalation</span>
                  </div>

                  {!showEscalation ? (
                    <button
                      onClick={() => setShowEscalation(true)}
                      disabled={['Resolved', 'Closed'].includes(ticket.status)}
                      className="px-3 py-1.5 text-xs font-mono font-semibold border border-zinc-200 rounded hover:bg-zinc-50 text-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Escalate Ticket To Officer
                    </button>
                  ) : (
                    <div className="space-y-2 text-xs font-mono">
                      <select
                        value={escalationType}
                        onChange={(e) => setEscalationType(e.target.value)}
                        className="w-full px-2 py-1 bg-zinc-50 border border-zinc-200 rounded"
                      >
                        <option value="horizontal">Horizontal (Peer Officer)</option>
                        <option value="vertical">Vertical (Senior Lead)</option>
                      </select>

                      <select
                        value={targetUserId}
                        onChange={(e) => setTargetUserId(e.target.value)}
                        className="w-full px-2 py-1 bg-zinc-50 border border-zinc-200 rounded"
                      >
                        <option value="">Select target officer</option>
                        {escalationTargets.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.department?.name || 'Staff'})
                          </option>
                        ))}
                      </select>

                      <textarea
                        value={escalationReason}
                        onChange={(e) => setEscalationReason(e.target.value)}
                        rows={2}
                        placeholder="Reason for escalation..."
                        className="w-full px-2 py-1 bg-zinc-50 border border-zinc-200 rounded font-sans"
                      />

                      <div className="flex gap-2">
                        <button
                          onClick={handleEscalate}
                          disabled={isEscalating || !targetUserId}
                          className="px-3 py-1 bg-[#990024] text-white rounded text-xs font-semibold"
                        >
                          {isEscalating ? 'Escalating...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setShowEscalation(false)}
                          className="px-3 py-1 border border-zinc-200 rounded text-xs text-zinc-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Directorate & Email Context */}
                <div className="p-4 rounded-lg border border-zinc-200 bg-white space-y-2 text-xs font-mono">
                  <div className="flex items-center gap-2 font-bold uppercase text-zinc-700 mb-1">
                    <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Routing Context</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Department:</span>
                    <span className="font-semibold text-zinc-800">{ticket.department?.name || 'Unassigned'}</span>
                  </div>
                  {ticket.emailMessageId && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Intake Source:</span>
                      <span className="text-blue-700 font-semibold">Inbound SMTP</span>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {activeTab === 'thread' && (
            <div className="space-y-4">
              <div className="space-y-3">
                {emailThread.map((email) => (
                  <div
                    key={email.id}
                    className={`rounded-lg p-4 border text-xs font-sans ${
                      email.type === 'internal'
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-white border-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100">
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-zinc-900">{email.fromName || email.from}</span>
                        {email.isInternal && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[10px] font-bold">
                            INTERNAL NOTE
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-zinc-400">
                        {new Date(email.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-zinc-800 whitespace-pre-wrap leading-relaxed">
                      {email.content}
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply / Internal Note Input */}
              {ticket.status !== 'Closed' && (
                <div className="p-4 rounded-lg border border-zinc-200 bg-zinc-50/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-zinc-700 uppercase">
                      {isInternal ? 'New Internal Agent Note' : 'Public Email Response'}
                    </span>
                    <label className="flex items-center gap-1.5 font-mono text-xs text-zinc-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="rounded border-zinc-300 text-[#990024] focus:ring-0"
                      />
                      <span>Mark as internal note</span>
                    </label>
                  </div>

                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={isInternal ? 'Private note visible only to support agents...' : 'Type response to send to requester via email...'}
                    rows={3}
                    className="w-full p-2.5 bg-white border border-zinc-200 rounded text-xs focus:outline-none focus:border-[#990024]"
                  />

                  <div className="flex justify-between items-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleAttachment}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 text-xs font-mono border border-zinc-200 rounded hover:bg-white text-zinc-600 flex items-center gap-1 cursor-pointer"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Attach</span>
                    </button>

                    <button
                      onClick={handleSendReply}
                      disabled={!replyText.trim() || isSending}
                      className="px-3.5 py-1.5 bg-[#990024] hover:bg-[#80001e] text-white text-xs font-mono font-semibold rounded shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      <span>{isSending ? 'Sending...' : isInternal ? 'Save Note' : 'Send Update'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-3 font-mono text-xs">
              {[
                { action: 'Ticket Created', timestamp: ticket.createdAt },
                ...(ticket.assignedTo ? [{ action: `Claimed by ${ticket.assignedTo.name}`, timestamp: ticket.updatedAt }] : []),
                ...(ticket.resolvedAt ? [{ action: 'Ticket Resolved', timestamp: ticket.resolvedAt }] : [])
              ].map((activity, idx) => (
                <div key={idx} className="p-3 rounded border border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
                  <span className="font-semibold text-zinc-800">{activity.action}</span>
                  <span className="text-zinc-400 text-[11px] tabular-nums">{new Date(activity.timestamp).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* 4. REFINED FOOTER ACTIONS */}
        <div className="border-t border-zinc-200 bg-zinc-50/80 p-3.5 px-6 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-mono font-semibold rounded transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {statusActions.map((action) => (
              <button
                key={action.status}
                onClick={() => handleStatusUpdate(action.status)}
                disabled={isUpdating}
                className={`px-3.5 py-1.5 text-xs font-mono font-semibold rounded transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 ${
                  action.isPrimary
                    ? 'bg-[#990024] hover:bg-[#80001e] text-white'
                    : 'bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800'
                }`}
              >
                {action.icon}
                <span>{isUpdating ? 'Updating...' : action.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
