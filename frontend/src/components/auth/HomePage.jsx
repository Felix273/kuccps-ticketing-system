import React from 'react';
import { Mail, Tag, FileText, ArrowRight, LogIn, CheckCircle2, Shield, Clock, Users } from 'lucide-react';
import { Logo } from '../common/Logo';

export const HomePage = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans text-zinc-900 antialiased">
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo size="md" className="h-12 w-auto" />
            <div>
              <h1 className="text-sm font-bold text-zinc-900 tracking-tight leading-none">
                KUCCPS ICT Support
              </h1>
              <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Internal Ticketing System</p>
            </div>
          </div>

          <button
            onClick={onGetStarted}
            className="px-4 py-2 bg-[#990024] hover:bg-[#80001e] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Staff Login</span>
          </button>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#fff1f3] border border-[#f7dfe5] text-[#990024] text-xs font-semibold">
                <Shield className="w-3.5 h-3.5" />
                Internal ICT Support Portal
              </div>

              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] font-headline text-zinc-900">
                Welcome to the{' '}
                <span className="text-[#990024]">KUCCPS ICT Support</span>{' '}
                Center
              </h2>

              <p className="text-base sm:text-lg text-zinc-500 leading-relaxed max-w-lg">
                To improve our service delivery and ensure that all ICT-related requests are handled efficiently, KUCCPS ICT utilizes an internal support ticket system.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={onGetStarted}
                  className="group px-6 py-3 bg-[#990024] hover:bg-[#80001e] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>IT Staff Login</span>
                  <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5" />
                </button>
                <span className="text-xs text-zinc-400 font-medium">
                  Use your domain / AD credentials
                </span>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="flex items-start gap-4 p-5 rounded-xl border border-zinc-200 bg-white shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-[#fff1f3] text-[#990024] flex items-center justify-center shrink-0">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 text-sm">Unique Ticket Number</h3>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    Each request you submit will be assigned a unique ticket number for easy tracking.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-xl border border-zinc-200 bg-white shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-[#fff1f3] text-[#990024] flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 text-sm">Request History</h3>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    View the full history of your past ICT support requests.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-xl border border-zinc-200 bg-white shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-[#fff1f3] text-[#990024] flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 text-sm">Team Collaboration</h3>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    ICT staff work together to resolve your issues efficiently and transparently.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-[#f2c7ce] bg-gradient-to-br from-[#fff6f7] to-white">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-[#990024]" />
                  <h3 className="font-semibold text-zinc-900 text-sm">How to Submit a Request</h3>
                </div>
                <p className="text-xs text-zinc-500 mb-3 leading-relaxed">
                  To submit an ICT support request, simply send an email to:
                </p>
                <a
                  href="mailto:itsupport@kuccps.ac.ke"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#990024] hover:text-[#7a001d] bg-white px-3.5 py-2 rounded-lg border border-[#f0cacf] shadow-sm transition-colors"
                >
                  <span>itsupport@kuccps.ac.ke</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row justify-between items-center text-xs text-zinc-400 gap-2">
          <p>&copy; {new Date().getFullYear()} Kenya Universities and Colleges Central Placement Service (KUCCPS)</p>
          <p>ICT Support Center - Internal Use Only</p>
        </div>
      </footer>
    </div>
  );
};
