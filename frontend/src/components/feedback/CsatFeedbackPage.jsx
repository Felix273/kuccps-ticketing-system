import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, LoaderCircle, Star } from 'lucide-react';
import { operationsService } from '../../services/operationsService';

const RATING_LABELS = {
  1: 'Very dissatisfied',
  2: 'Dissatisfied',
  3: 'Satisfied',
  4: 'Contented',
  5: 'Extremely contented'
};

export const CsatFeedbackPage = ({ token }) => {
  const [feedback, setFeedback] = useState(null);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let active = true;
    operationsService.getPublicCsat(token)
      .then(result => {
        if (active && result.success) setFeedback(result);
        else if (active) setError(result.message || 'This feedback link is unavailable.');
      })
      .catch(requestError => {
        if (active) setError(requestError.message || 'This feedback link is invalid or has expired.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!feedback || isSubmitting || submitted) return;

    setIsSubmitting(true);
    setError('');
    try {
      const result = await operationsService.submitPublicCsat(token, comment);
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.message || 'We could not save your feedback. Please try again.');
      }
    } catch (requestError) {
      setError(requestError.message || 'We could not save your feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:py-16 flex items-center justify-center font-sans text-slate-800">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-[#990024]">
            {submitted ? <CheckCircle2 className="h-6 w-6" /> : <Star className="h-6 w-6" />}
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {submitted ? 'Thank you for your feedback' : 'Rate your support experience'}
          </h1>
          {feedback && (
            <p className="mt-2 text-sm text-slate-500">
              Ticket <span className="font-semibold text-slate-700">{feedback.ticketNumber}</span>
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Validating your feedback link...
          </div>
        ) : submitted ? (
          <p className="rounded-xl bg-emerald-50 p-4 text-center text-sm text-emerald-800">
            Your rating has been recorded. Thank you for helping us improve our ICT support.
          </p>
        ) : feedback ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
              <div className="flex justify-center gap-1 text-amber-400" aria-label={`${feedback.rating} out of 5 stars`}>
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    className={`h-7 w-7 ${index < feedback.rating ? 'fill-current' : 'text-slate-300'}`}
                  />
                ))}
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-800">
                {feedback.rating} out of 5 — {RATING_LABELS[feedback.rating]}
              </p>
            </div>

            <div>
              <label htmlFor="csat-comment" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Additional comments <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                id="csat-comment"
                value={comment}
                onChange={event => setComment(event.target.value)}
                maxLength={2000}
                rows={4}
                placeholder="Tell us what went well or how we can improve."
                className="w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#990024] focus:ring-2 focus:ring-[#990024]/15"
              />
              <p className="mt-1 text-right text-xs text-slate-400">{comment.length}/2000</p>
            </div>

            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#990024] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#80001e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Submitting feedback...' : 'Submit feedback'}
            </button>
            <p className="text-center text-xs text-slate-400">No login required. Your feedback is linked to this ticket.</p>
          </form>
        ) : (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 p-4 text-sm text-rose-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error || 'This feedback link is invalid or has expired. Please contact ICT support if you still need help.'}
          </p>
        )}
      </section>
    </main>
  );
};
