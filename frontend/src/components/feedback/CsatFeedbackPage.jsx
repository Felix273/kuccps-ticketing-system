import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, RefreshCw, Star } from 'lucide-react';
import { operationsService } from '../../services/operationsService';

const RATING_LABELS = {
  5: 'Extremely Contented',
  4: 'Contented',
  3: 'Satisfied (Good)',
  2: 'Discontented',
  1: 'Very Discontented'
};

export const CsatFeedbackPage = ({ token }) => {
  const [feedback, setFeedback] = useState(null);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [ticketClosed, setTicketClosed] = useState(false);
  const [recordedRating, setRecordedRating] = useState(null);
  const [commentSaved, setCommentSaved] = useState(false);

  useEffect(() => {
    let active = true;

    // 1. Validate token & Immediately auto-submit rating to CLOSE the ticket
    operationsService.getPublicCsat(token)
      .then(async (result) => {
        if (!active) return;
        if (result.success) {
          setFeedback(result);
          // Record the rating immediately; the server closes a Resolved ticket.
          try {
            const submitted = await operationsService.submitPublicCsat(token, '');
            if (!active) return;
            // If feedback was already given, show the rating that was actually stored.
            setRecordedRating(submitted.response?.rating ?? result.rating);
            setTicketClosed(submitted.ticketStatus === 'Closed');
          } catch (submitError) {
            if (active) setError(submitError.message || 'Your rating could not be recorded. Please try again.');
          }
        } else {
          setError(result.message || 'This feedback link is unavailable.');
        }
      })
      .catch((err) => {
        if (active) setError(err.message || 'This feedback link has expired or was already submitted.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const handleSaveComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await operationsService.submitPublicCsat(token, comment);
      setCommentSaved(true);
    } catch (err) {
      setError(err.message || 'Failed to save comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 font-sans">
        <div className="flex items-center gap-3 font-mono text-xs text-zinc-500">
          <RefreshCw className="w-5 h-5 animate-spin text-[#990024]" />
          <span>RECORDING_RATING_AND_CLOSING_TICKET...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 font-sans text-zinc-800">
      <div className="max-w-md w-full bg-white border border-zinc-200 shadow-xl rounded-2xl p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          {error ? (
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <AlertCircle className="w-7 h-7" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-7 h-7" />
            </div>
          )}

          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
            {error ? 'We could not record your feedback' : 'Thank you for your feedback!'}
          </h2>

          {feedback && !error && ticketClosed && (
            <p className="font-mono text-xs text-zinc-500">
              Ticket <strong className="text-zinc-900">#{feedback.ticketNumber}</strong> is now officially <span className="text-emerald-700 font-bold uppercase">Closed</span>.
            </p>
          )}
        </div>

        {error ? (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-mono text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          feedback && (
            <div className="space-y-4">
              {/* Recorded Star Card */}
              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 text-center space-y-1">
                <div className="flex items-center justify-center gap-1 text-amber-400 text-lg">
                  {Array.from({ length: recordedRating || feedback.rating || 5 }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <p className="font-mono text-xs font-bold text-zinc-800">
                  {recordedRating || feedback.rating} Stars — {RATING_LABELS[recordedRating || feedback.rating] || 'Satisfied'}
                </p>
                <p className="text-[11px] text-zinc-400 font-mono">
                  Feedback registered in ICT Directorate analytics.
                </p>
              </div>

              {/* Optional Comment Section */}
              {!commentSaved ? (
                <form onSubmit={handleSaveComment} className="space-y-3 pt-2 border-t border-zinc-100">
                  <label className="block text-xs font-mono font-semibold text-zinc-600">
                    Would you like to leave any additional comments? (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us what went well or how we can improve..."
                    className="w-full p-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-[#990024] focus:bg-white font-sans"
                  />
                  <button
                    type="submit"
                    disabled={!comment.trim() || isSubmitting}
                    className="w-full py-2 bg-[#990024] hover:bg-[#80001e] text-white text-xs font-mono font-bold rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Saving Note...' : 'Submit Additional Note'}
                  </button>
                </form>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-mono text-emerald-800 text-center">
                  Your comment has been attached to the closed ticket record.
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
};
