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
  PauseCircle,
  ChevronDown, 
  ChevronRight, 
  ShieldCheck, 
  Sparkles, 
  BookOpen, 
  ArrowUpRight 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ticketService } from '../../services/ticketService';
import { knowledgeBaseService } from '../../services/knowledgeBaseService';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { TicketActionDialog } from './TicketActionDialog';
import { buildActivityTimeline } from '../../utils/ticketActivity';
import { can } from '../../utils/permissions';

const ACTIVITY_TONES = {
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
  zinc: 'bg-zinc-400'
};

const STATUS_DISPLAY_NAMES = {
  Open: 'Open',
  InProgress: 'In Progress',
  OnHold: 'On Hold',
  Resolved: 'Resolved',
  Closed: 'Closed'
};

export const TicketDetailModal = ({ ticket: ticketSummary, onClose, onUpdate, currentUser, users = [] }) => {
  // The list only carries summary fields; load the full ticket (conversation,
  // attachments and activity log) and refresh it after every change.
  const [detail, setDetail] = useState(null);
  const [detailVersion, setDetailVersion] = useState(0);
  useEffect(() => {
    let active = true;
    ticketService.getById(ticketSummary.id)
      .then(response => { if (active && response.success) setDetail(response.ticket); })
      .catch(error => console.warn('Could not load ticket details:', error.message));
    return () => { active = false; };
  }, [ticketSummary.id, detailVersion]);
  const reloadDetail = () => setDetailVersion(version => version + 1);
  const ticket = detail || ticketSummary;
  const [actionDialog, setActionDialog] = useState(null); // 'resolve' | 'hold' | null
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

  // Custom Confirmation Dialog State
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState(null);

  // Escape closes the ticket window, unless a dialog inside it is open or a reply is being typed.
  useEffect(() => {
    const handleKeyDown = event => {
      if (event.key !== 'Escape') return;
      if (actionDialog || showEscalation || pendingStatusUpdate || replyText.trim()) return;
      onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actionDialog, showEscalation, pendingStatusUpdate, replyText, onClose]);

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

  const executeStatusUpdate = async (newStatus, details = null) => {
    setIsUpdating(true);
    try {
      const result = details
        ? await ticketService.update(ticket.id, details)
        : newStatus === 'InProgress' && currentUser?.id && !ticket.assignedToId
          ? await ticketService.startWorking(ticket.id, currentUser.id)
          : await ticketService.updateStatus(ticket.id, newStatus);

      if (result.success) {
        const label = newStatus === 'Resolved' ? 'Resolved and closed' : `Ticket status updated to ${STATUS_DISPLAY_NAMES[newStatus] || newStatus}`;
        toast.success(label);
        if (result.knowledgeDraft) toast.success(`Knowledge-base draft created: ${result.knowledgeDraft.title}`);
        setActionDialog(null);
        if (onUpdate) await onUpdate();
        onClose();
      } else {
        toast.error(result.message || 'Failed to update ticket status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update ticket status');
    } finally {
      setIsUpdating(false);
      setPendingStatusUpdate(null);
    }
  };

  const handleEscalate = async () => {
    if (!targetUserId) {
      toast.error('Please choose an officer to escalate to');
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
        toast.success('Ticket escalated successfully');
        if (onUpdate) await onUpdate();
        onClose();
      } else {
        toast.error(result.message || 'Failed to escalate ticket');
      }
    } catch (error) {
      console.error('Escalation failed:', error);
      toast.error('Failed to escalate ticket');
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
        toast.success(isInternal ? 'Internal note added' : 'Email update sent to requester');
        reloadDetail();
        if (onUpdate) await onUpdate();
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
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
        toast.success('Attachment uploaded successfully');
        reloadDetail();
        if (onUpdate) await onUpdate();
      } else {
        toast.error(result.message || 'Failed to upload attachment');
      }
    } catch (error) {
      console.error('Attachment upload failed:', error);
      toast.error('Failed to upload attachment');
    } finally {
      event.target.value = '';
    }
  };

  const getStatusActions = () => {
    const actions = [];
    const currentStatus = ticket.status;

    if (currentStatus === 'Open') {
      actions.push({
        label: 'Start Working',
        status: 'InProgress',
        dialogTitle: 'Start Working on Ticket?',
        dialogMessage: `Assign ticket #${ticket.ticketNumber} to yourself and transition status from Open to In Progress?`,
        icon: <PlayCircle className="w-3.5 h-3.5" />,
        dialogType: 'primary',
        isPrimary: false
      });
      actions.push({
        label: 'Put On Hold',
        status: 'OnHold',
        dialogTitle: 'Place Ticket On Hold?',
        dialogMessage: `Temporarily pause SLA resolution tracking for #${ticket.ticketNumber}?`,
        icon: <PauseCircle className="w-3.5 h-3.5" />,
        dialogType: 'warning',
        isPrimary: false
      });
      actions.push({
        label: 'Resolve & Close',
        status: 'Resolved',
        dialogTitle: 'Mark Ticket as Resolved?',
        dialogMessage: `Are you sure you want to resolve #${ticket.ticketNumber}? A resolution confirmation with CSAT feedback ratings will be emailed to ${ticket.requesterEmail}.`,
        icon: <Check className="w-3.5 h-3.5" />,
        dialogType: 'success',
        isPrimary: true
      });
    } else if (currentStatus === 'InProgress') {
      actions.push({
        label: 'Put On Hold',
        status: 'OnHold',
        dialogTitle: 'Place Ticket On Hold?',
        dialogMessage: `Temporarily pause SLA resolution tracking for #${ticket.ticketNumber}?`,
        icon: <PauseCircle className="w-3.5 h-3.5" />,
        dialogType: 'warning',
        isPrimary: false
      });
      actions.push({
        label: 'Reopen',
        status: 'Open',
        dialogTitle: 'Reopen Ticket?',
        dialogMessage: `Return ticket #${ticket.ticketNumber} back to Open status?`,
        icon: <RotateCcw className="w-3.5 h-3.5" />,
        dialogType: 'warning',
        isPrimary: false
      });
      actions.push({
        label: 'Resolve & Close',
        status: 'Resolved',
        dialogTitle: 'Mark Ticket as Resolved?',
        dialogMessage: `Are you sure you want to resolve #${ticket.ticketNumber}? An automated confirmation with 1-click CSAT satisfaction ratings will be sent to ${ticket.requesterEmail}.`,
        icon: <Check className="w-3.5 h-3.5" />,
        dialogType: 'success',
        isPrimary: true
      });
    } else if (currentStatus === 'OnHold') {
      actions.push({
        label: 'Resume Working',
        status: 'InProgress',
        dialogTitle: 'Resume Ticket Working?',
        dialogMessage: `Resume active troubleshooting on #${ticket.ticketNumber}?`,
        icon: <PlayCircle className="w-3.5 h-3.5" />,
        dialogType: 'primary',
        isPrimary: true
      });
      actions.push({
        label: 'Resolve & Close',
        status: 'Resolved',
        dialogTitle: 'Mark Ticket as Resolved?',
        dialogMessage: `Mark #${ticket.ticketNumber} as resolved and send CSAT notification?`,
        icon: <Check className="w-3.5 h-3.5" />,
        dialogType: 'success',
        isPrimary: false
      });
    } else if (currentStatus === 'Resolved') {
      actions.push({
        label: 'Reopen',
        status: 'Open',
        dialogTitle: 'Reopen Resolved Ticket?',
        dialogMessage: `Reopen ticket #${ticket.ticketNumber} and resume resolution tracking?`,
        icon: <RotateCcw className="w-3.5 h-3.5" />,
        dialogType: 'warning',
        isPrimary: false
      });
    } else if (currentStatus === 'Closed') {
      actions.push({
        label: 'Reopen Ticket',
        status: 'Open',
        dialogTitle: 'Reopen Closed Ticket?',
        dialogMessage: `Reopen archived ticket #${ticket.ticketNumber}?`,
        icon: <RotateCcw className="w-3.5 h-3.5" />,
        dialogType: 'warning',
        isPrimary: false
      });
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
  const activityTimeline = buildActivityTimeline(ticket.history || []);
  const escalationTargets = users.filter(user =>
    user.role !== 'user' &&
    user.id !== currentUser?.id &&
    !['Resolved', 'Closed'].includes(ticket.status)
  );

  return (
    <>
      <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
        <div className="bg-white rounded-xl border border-zinc-200 shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col font-sans">
          
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-zinc-200 bg-white">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs text-zinc-400">
                    Tickets / <strong className="text-zinc-900 font-bold">#{ticket.ticketNumber}</strong>
                  </span>

                  <div className="h-3 w-[1px] bg-zinc-200"></div>

                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold px-2 py-0.5 rounded border border-zinc-200 bg-zinc-50 text-zinc-700">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      ticket.status === 'Resolved' ? 'bg-emerald-500' :
                      ticket.status === 'OnHold' ? 'bg-purple-500' :
                      ticket.status === 'InProgress' ? 'bg-amber-500 animate-pulse' :
                      ticket.status === 'Open' ? 'bg-blue-500' : 'bg-zinc-400'
                    }`}></span>
                    {STATUS_DISPLAY_NAMES[ticket.status] || ticket.status}
                  </span>

                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold px-2 py-0.5 rounded border border-zinc-200 bg-zinc-50 text-zinc-700">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      ticket.priority === 'Critical' || ticket.priority === 'VeryHigh' ? 'bg-rose-500 animate-pulse' :
                      ticket.priority === 'High' ? 'bg-amber-500' : 'bg-zinc-400'
                    }`}></span>
                    {ticket.priority || 'Normal'}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 leading-snug truncate">
                  {ticket.subject}
                </h2>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer shrink-0"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metadata Bar */}
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

          {/* Segmented Tabs */}
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            
            {activeTab === 'details' && (
              <div className="space-y-5">
                <div className="bg-zinc-50/70 rounded-lg p-5 border border-zinc-200">
                  <div className="flex items-center gap-2 mb-2 font-mono text-[11px] uppercase tracking-wider text-zinc-500 font-bold">
                    <MessageSquare className="w-3.5 h-3.5 text-[#990024]" />
                    <span>Requester Problem Statement</span>
                  </div>
                  <div className="text-zinc-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {ticket.description || 'No description provided.'}
                  </div>
                </div>

                {/* AI / SOP Suggestions */}
                <div className="bg-white rounded-lg p-5 border border-zinc-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
                    <div className="flex items-center gap-2">
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
                          <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Priority Check</span>
                          <p className="text-zinc-700">Current: <strong>{ticket.priority}</strong></p>
                          <p className="text-zinc-700">Suggested: <strong className="text-[#990024]">{suggestions.priorityAssessment?.suggested || ticket.priority}</strong></p>
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

                {/* Escalation & Directorate Context */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-zinc-200 bg-white">
                    <div className="flex items-center gap-2 mb-2 font-mono text-[11px] font-bold uppercase text-zinc-700">
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#990024]" />
                      <span>Officer Escalation</span>
                    </div>

                    {!showEscalation ? (
                      <button
                        onClick={() => setShowEscalation(true)}
                        disabled={['Resolved', 'Closed'].includes(ticket.status) || !can(currentUser, 'tickets.escalate')}
                        title={can(currentUser, 'tickets.escalate') ? undefined : 'Your role cannot escalate tickets'}
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
                            className="px-3 py-1 bg-[#990024] text-white rounded text-xs font-semibold cursor-pointer"
                          >
                            {isEscalating ? 'Escalating...' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setShowEscalation(false)}
                            className="px-3 py-1 border border-zinc-200 rounded text-xs text-zinc-600 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

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

                {ticket.status !== 'Closed' && can(currentUser, 'tickets.work') && (
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
              <div className="space-y-2 font-mono text-xs">
                {!detail && <p className="text-zinc-400">Loading activity log...</p>}
                {detail && activityTimeline.length === 0 && (
                  <p className="text-zinc-400">No activity has been recorded for this ticket yet.</p>
                )}
                <ol className="relative border-l border-zinc-200 ml-2">
                  {activityTimeline.map(activity => (
                    <li key={activity.id} className="mb-3 ml-4">
                      <span className={`absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full ${ACTIVITY_TONES[activity.tone] || ACTIVITY_TONES.zinc}`} aria-hidden="true" />
                      <div className="p-3 rounded border border-zinc-100 bg-zinc-50/50">
                        <div className="flex flex-wrap justify-between gap-2">
                          <span className="font-semibold text-zinc-800">{activity.title}</span>
                          <time className="text-zinc-400 text-[11px] tabular-nums" dateTime={activity.timestamp}>
                            {new Date(activity.timestamp).toLocaleString()}
                          </time>
                        </div>
                        <p className="mt-0.5 text-[11px] text-zinc-500">by {activity.actor}</p>
                        {activity.note && <p className="mt-1.5 whitespace-pre-line font-sans text-xs text-zinc-700">{activity.note}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
                {ticket.resolutionNotes && (
                  <div className="p-3 rounded border border-emerald-100 bg-emerald-50/50 font-sans">
                    <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-800">Resolution record</p>
                    <p className="mt-1 whitespace-pre-line text-zinc-800">{ticket.resolutionNotes}</p>
                    <p className="mt-2 text-[11px] text-zinc-600">
                      Effectiveness: {ticket.resolutionEffectiveness ? `${ticket.resolutionEffectiveness}/5` : 'not rated'}
                      {' · '}Reusable: {ticket.resolutionReusable == null ? 'not stated' : ticket.resolutionReusable ? 'yes' : 'no'}
                      {ticket.totalHoldMinutes ? ` · Time on hold: ${Math.round(ticket.totalHoldMinutes / 60)} h` : ''}
                    </p>
                    {ticket.resolutionRecommendations && (
                      <p className="mt-1 text-[11px] text-zinc-600">Recommendations: {ticket.resolutionRecommendations}</p>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div className="border-t border-zinc-200 bg-zinc-50/80 p-3.5 px-6 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-1.5 border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-mono font-semibold rounded transition-colors cursor-pointer"
            >
              Close
            </button>

            <div className="flex items-center gap-2">
              {statusActions
                .filter(action => (action.status === 'Open' ? can(currentUser, 'tickets.reopen') : can(currentUser, 'tickets.work')))
                .map((action) => (
                <button
                  key={action.status}
                  onClick={() => {
                    // Resolving and holding need details (resolution notes / hold reason).
                    if (action.status === 'Resolved') setActionDialog('resolve');
                    else if (action.status === 'OnHold') setActionDialog('hold');
                    else setPendingStatusUpdate(action);
                  }}
                  disabled={isUpdating}
                  className={`px-3.5 py-1.5 text-xs font-mono font-semibold rounded transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 ${
                    action.isPrimary
                      ? 'bg-[#990024] hover:bg-[#80001e] text-white'
                      : 'bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800'
                  }`}
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* REUSABLE CRAFT CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(pendingStatusUpdate)}
        title={pendingStatusUpdate?.dialogTitle || 'Update Status'}
        message={pendingStatusUpdate?.dialogMessage}
        confirmLabel={pendingStatusUpdate?.label || 'Confirm'}
        type={pendingStatusUpdate?.dialogType || 'primary'}
        isLoading={isUpdating}
        onConfirm={() => executeStatusUpdate(pendingStatusUpdate?.status)}
        onCancel={() => setPendingStatusUpdate(null)}
      />
      {actionDialog && (
        <TicketActionDialog
          mode={actionDialog}
          ticket={ticket}
          articles={suggestions?.articles || []}
          isLoading={isUpdating}
          onSubmit={details => executeStatusUpdate(details.status, details)}
          onCancel={() => setActionDialog(null)}
        />
      )}
    </>
  );
};
