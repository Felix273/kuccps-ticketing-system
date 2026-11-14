import React from 'react';
import { Mail, Tag, FileText, ArrowRight, LogIn, CheckCircle2 } from 'lucide-react';
import { Logo } from '../common/Logo';

export const HomePage = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-[#f4f6f8] flex flex-col font-sans text-slate-800 antialiased">
      <header className="bg-white/95 border-b border-slate-200/80 sticky top-0 z-30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex justify-between items-center">
          <div className="flex items-center gap-3.5">
            <Logo size="md" className="h-10 w-auto sm:h-11" />
            <div className="border-l border-slate-200 pl-3.5">
              <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none">
                KUCCPS ICT Support
              </h1>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Internal Ticketing System</p>
            </div>
          </div>

          <div className="flex items-center">
            <button
              onClick={onGetStarted}
              className="px-4 py-2 bg-[#990024] hover:bg-[#80001e] active:bg-[#6c0019] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Staff Login</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-6 space-y-6 text-left">
              <h2 className="text-[2.6rem] sm:text-[4.2rem] leading-[0.92] tracking-[-0.06em] font-black text-slate-900">
                Welcome to the <br className="hidden sm:block" />
                <span className="text-[#990024]">KUCCPS ICT Support</span> <br className="hidden sm:block" />
                Center
              </h2>

              <p className="max-w-[35rem] text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                To improve our service delivery and ensure that all ICT-related requests are handled efficiently, KUCCPS ICT utilizes an internal support ticket system.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  onClick={onGetStarted}
                  className="group px-6 py-3.5 bg-[#990024] hover:bg-[#80001e] active:bg-[#6c0019] text-white text-sm font-semibold rounded-xl shadow-[0_12px_28px_rgba(153,0,36,0.22)] hover:shadow-[0_16px_32px_rgba(153,0,36,0.28)] transition-all flex items-center gap-2.5 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>IT Staff Login</span>
                  <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5" />
                </button>
                <span className="text-xs text-slate-500 font-medium">
                  Use your domain / AD credentials
                </span>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-white/90 rounded-[1.6rem] border border-slate-200/80 shadow-[0_20px_45px_rgba(15,23,42,0.06)] p-5 sm:p-7 space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50/80 hover:bg-slate-50 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-[#fff1f3] text-[#990024] flex items-center justify-center shrink-0 border border-[#f7dfe5] shadow-sm">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      Unique Ticket Number
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                      Each request you submit will be assigned a unique ticket number for easy tracking.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50/80 hover:bg-slate-50 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-[#fff1f3] text-[#990024] flex items-center justify-center shrink-0 border border-[#f7dfe5] shadow-sm">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      Request History
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                      View the full history of your past ICT support requests.
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-[#f2c7ce] bg-gradient-to-br from-[#fff6f7] to-[#fff0f1] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-[#990024]" />
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      How to Submit a Request
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
                    To submit an ICT support request, simply send an email to:
                  </p>
                  <a
                    href="mailto:itsupport@kuccps.ac.ke"
                    className="inline-flex items-center gap-2 text-sm sm:text-base font-bold text-[#990024] hover:text-[#7a001d] bg-white px-3.5 py-2.5 rounded-xl border border-[#f0cacf] shadow-sm hover:shadow-md transition-all"
                  >
                    <span>itsupport@kuccps.ac.ke</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-2">
          <p>&copy; {new Date().getFullYear()} Kenya Universities and Colleges Central Placement Service (KUCCPS)</p>
          <p className="text-slate-400">ICT Support Center - Internal Use Only</p>
        </div>
      </footer>
    </div>
  );
};
