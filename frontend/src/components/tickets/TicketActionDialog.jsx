import React, { useEffect, useState } from 'react';
import { CheckCircle2, PauseCircle, X } from 'lucide-react';

const EFFECTIVENESS_LABELS = {
  5: 'Fully fixed — root cause addressed',
  4: 'Fixed — minor follow-up possible',
  3: 'Workaround in place',
  2: 'Partially fixed',
  1: 'Not effective — needs further work'
};

/**
 * Collects the details the API requires for a lifecycle action:
 *  - mode "resolve": resolution notes (required), officer's effectiveness rating, whether the
 *    fix is reusable (creates a knowledge-base draft), recommendations, and an optional
 *    knowledge-base tip to include in the requester's email. Resolving closes the ticket.
 *  - mode "hold": the reason (required) — it is emailed to the requester and pauses the SLA.
 */
export const TicketActionDialog = ({ mode, ticket, articles = [], isLoading, onSubmit, onCancel }) => {
  const [notes, setNotes] = useState('');
  const [effectiveness, setEffectiveness] = useState('');
  const [reusable, setReusable] = useState(false);
  const [recommendations, setRecommendations] = useState('');
  const [articleId, setArticleId] = useState('');
  const [holdReason, setHoldReason] = useState('');

  useEffect(() => {
    const onKeyDown = event => {
      if (event.key === 'Escape' && !isLoading) onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isLoading, onCancel]);

  const isResolve = mode === 'resolve';
  const canSubmit = isResolve ? notes.trim().length >= 10 : holdReason.trim().length >= 5;

  const handleSubmit = event => {
    event.preventDefault();
    if (!canSubmit || isLoading) return;
    if (isResolve) {
      onSubmit({
        status: 'Resolved',
        resolutionNotes: notes.trim(),
        resolutionEffectiveness: effectiveness ? Number(effectiveness) : null,
        resolutionReusable: reusable,
        resolutionRecommendations: recommendations.trim() || null,
        knowledgeArticleId: articleId || null
      });
    } else {
      onSubmit({ status: 'OnHold', holdReason: holdReason.trim() });
    }
  };

  const fieldClass = 'w-full p-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-[#990024] focus:bg-white';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="ticket-action-title">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 p-5">
          <div className="flex items-center gap-3">
            <span className={`flex h-9 w-9 items-center justify-center rounded-full border ${isResolve ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
              {isResolve ? <CheckCircle2 className="h-5 w-5" /> : <PauseCircle className="h-5 w-5" />}
            </span>
            <div>
              <h2 id="ticket-action-title" className="text-sm font-bold text-zinc-900">
                {isResolve ? `Resolve and close #${ticket.ticketNumber}` : `Put #${ticket.ticketNumber} on hold`}
              </h2>
              <p className="text-[11px] text-zinc-500">
                {isResolve
                  ? `The ticket closes immediately. ${ticket.requesterEmail} receives your resolution and a satisfaction rating link.`
                  : `The SLA timer pauses. ${ticket.requesterEmail} is emailed the reason below.`}
              </p>
            </div>
          </div>
          <button type="button" onClick={onCancel} disabled={isLoading} className="text-zinc-400 hover:text-zinc-700" aria-label="Cancel">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto p-5">
          {isResolve ? (
            <>
              <div>
                <label htmlFor="resolution-notes" className="mb-1 block text-xs font-semibold text-zinc-700">
                  How was the issue resolved? <span className="text-rose-600">*</span>
                </label>
                <textarea id="resolution-notes" rows={4} value={notes} onChange={event => setNotes(event.target.value)} className={fieldClass}
                  placeholder="Describe the fix. This is sent to the requester." autoFocus />
                <p className="mt-1 text-[10px] text-zinc-400">At least 10 characters.</p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="resolution-effectiveness" className="mb-1 block text-xs font-semibold text-zinc-700">How effective was the solution?</label>
                  <select id="resolution-effectiveness" value={effectiveness} onChange={event => setEffectiveness(event.target.value)} className={fieldClass}>
                    <option value="">Not rated</option>
                    {[5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{value} — {EFFECTIVENESS_LABELS[value]}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="resolution-tip" className="mb-1 block text-xs font-semibold text-zinc-700">Knowledge tip for the requester</label>
                  <select id="resolution-tip" value={articleId} onChange={event => setArticleId(event.target.value)} className={fieldClass}>
                    <option value="">None</option>
                    {articles.map(article => <option key={article.id} value={article.id}>{article.title}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-start gap-2 text-xs text-zinc-700">
                <input type="checkbox" checked={reusable} onChange={event => setReusable(event.target.checked)} className="mt-0.5" disabled={Boolean(articleId)} />
                <span>
                  This solution can be reused for similar issues
                  <span className="block text-[10px] text-zinc-400">A knowledge-base draft is created from this ticket for administrator review.</span>
                </span>
              </label>
              <div>
                <label htmlFor="resolution-recommendations" className="mb-1 block text-xs font-semibold text-zinc-700">Additional information or recommendations</label>
                <textarea id="resolution-recommendations" rows={2} value={recommendations} onChange={event => setRecommendations(event.target.value)} className={fieldClass}
                  placeholder="Optional — e.g. replace the toner supplier, schedule a firmware update" />
              </div>
            </>
          ) : (
            <div>
              <label htmlFor="hold-reason" className="mb-1 block text-xs font-semibold text-zinc-700">
                Why is the ticket on hold? <span className="text-rose-600">*</span>
              </label>
              <textarea id="hold-reason" rows={4} value={holdReason} onChange={event => setHoldReason(event.target.value)} className={fieldClass}
                placeholder="e.g. Waiting for the requester to confirm their asset tag / Awaiting replacement part from supplier" autoFocus />
              <p className="mt-1 text-[10px] text-zinc-400">Say clearly if you need anything from the requester — this text is emailed to them.</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-100 p-4">
          <button type="button" onClick={onCancel} disabled={isLoading} className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
            Cancel
          </button>
          <button type="submit" disabled={!canSubmit || isLoading}
            className={`rounded-lg px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 ${isResolve ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
            {isLoading ? 'Saving...' : isResolve ? 'Resolve & close ticket' : 'Put on hold'}
          </button>
        </div>
      </form>
    </div>
  );
};
