import React from 'react';
import { Mail, Tag, FileText, ArrowRight } from 'lucide-react';
import { Logo } from '../common/Logo';

export const HomePage = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Logo size="md" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">KUCCPS ICT Support</h1>
                <p className="text-xs text-gray-600">Internal Ticketing System</p>
              </div>
            </div>
            <button
              onClick={onGetStarted}
              className="px-6 py-2 bg-gradient-to-r from-[#911414] to-[#d20001] text-white rounded-lg hover:from-[#ac0807] hover:to-[#911414] font-medium transition-all shadow-md"
            >
              Staff Login
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-8">
            <Logo size="xl" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Welcome to the KUCCPS ICT Support Center
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-12">
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            To improve our service delivery and ensure that all ICT-related requests are handled efficiently, 
            KUCCPS ICT utilizes an internal support ticket system.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 my-8">
            <div className="flex items-start gap-4 p-6 bg-red-50 rounded-xl border border-red-100">
              <div className="w-12 h-12 bg-[#911414] rounded-lg flex items-center justify-center flex-shrink-0">
                <Tag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Unique Ticket Number</h3>
                <p className="text-sm text-gray-600">
                  Each request you submit will be assigned a unique ticket number for easy tracking.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-red-50 rounded-xl border border-red-100">
              <div className="w-12 h-12 bg-[#d20001] rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Request History</h3>
                <p className="text-sm text-gray-600">
                  View the full history of your past ICT support requests.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#911414]" />
              How to Submit a Request
            </h3>
            <p className="text-gray-700 mb-4">
              To submit an ICT support request, simply send an email to:
            </p>
            <a 
              href="mailto:itsupport@kuccps.ac.ke" 
              className="inline-flex items-center gap-2 text-lg font-semibold text-[#911414] hover:text-[#d20001] transition-colors"
            >
              itsupport@kuccps.ac.ke
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#911414] to-[#d20001] text-white text-lg font-semibold rounded-xl hover:from-[#ac0807] hover:to-[#911414] transition-all shadow-lg"
          >
            IT Staff Login
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-600">
            <p>&copy; 2024 Kenya Universities and Colleges Central Placement Service (KUCCPS)</p>
            <p className="mt-2">ICT Support Center - Internal Use Only</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
