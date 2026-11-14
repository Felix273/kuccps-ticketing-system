import React, { useState } from 'react';
import { AlertCircle, User, Lock, Eye, EyeOff, LogIn, ChevronDown, ChevronUp } from 'lucide-react';

export const LoginPage = ({ onLogin, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemoCreds, setShowDemoCreds] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await onLogin(username, password);
      if (!result.success) {
        setError(result.message || 'Invalid username or password');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to connect to server. Please try again.');
      setIsLoading(false);
    }
  };

  const fillCredentials = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div 
      className="min-h-screen w-full relative flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat overflow-hidden select-none font-sans"
      style={{
        backgroundImage: `
          linear-gradient(135deg, rgba(133, 10, 30, 0.90) 0%, rgba(98, 8, 22, 0.94) 100%),
          url('/office-bg.jpg')
        `
      }}
    >
      {/* Decorative Dot Matrix behind card */}
      <div className="absolute right-[22%] top-[18%] hidden lg:grid grid-cols-6 gap-3 opacity-40 pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-white"></div>
        ))}
      </div>

      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-5 left-5 z-50 px-3.5 py-1.5 text-xs font-semibold bg-white/90 hover:bg-white text-gray-700 rounded-md shadow transition-all flex items-center gap-1.5 cursor-pointer"
        >
          ← Back to Home
        </button>
      )}

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-[460px] bg-white rounded-2xl shadow-2xl px-8 py-9 sm:px-10 sm:py-10">
        
        {/* Header Dual Logo Banner */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 pb-3 border-b border-gray-100">
          <div className="flex flex-col items-center">
            <img 
              src="/kenya-coat-of-arms.png" 
              alt="Republic of Kenya" 
              className="h-14 sm:h-16 w-auto object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <span className="text-[9px] font-extrabold tracking-wider text-gray-800 uppercase mt-1">
              Republic of Kenya
            </span>
          </div>

          <div className="h-12 w-[1px] bg-gray-300"></div>

          <div className="flex items-center">
            <img 
              src="/kuccps-logo.png" 
              alt="KUCCPS Logo" 
              className="h-12 sm:h-14 w-auto object-contain"
            />
          </div>
        </div>

        {/* Portal Title & Subtitle */}
        <div className="text-center mt-6 mb-7">
          <h1 className="font-headline text-3xl sm:text-[2.1rem] font-bold text-gray-700 uppercase leading-none tracking-[0.04em]">
            Self Service Portal
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 font-normal mt-1">
            Please sign-in to your account
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* USERNAME */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 tracking-[0.18em] uppercase mb-1.5">
              Username
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. USER.NAME or KUCCPS\USER.NAME"
                required
                disabled={isLoading}
                className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#990024] focus:ring-1 focus:ring-[#990024] transition-all"
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-gray-600 tracking-[0.18em] uppercase">
                Password
              </label>
              <button
                type="button"
                onClick={() => alert('Please contact the ICT Helpdesk to reset your domain password.')}
                className="text-[11px] font-semibold text-[#990024] hover:text-[#7d001d] transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                disabled={isLoading}
                className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#990024] focus:ring-1 focus:ring-[#990024] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* SIGN IN BUTTON */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 bg-[#990024] hover:bg-[#80001e] active:bg-[#6c0019] text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Signing in...
              </span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Card Footer Copyright */}
        <div className="mt-7 pt-4 text-center">
          <p className="text-xs text-gray-400 font-normal">
            &copy; {new Date().getFullYear()} KUCCPS
          </p>
        </div>

        {/* Collapsible Local Demo Credentials */}
        <div className="mt-4 pt-3 border-t border-dashed border-gray-200">
          <button
            type="button"
            onClick={() => setShowDemoCreds(!showDemoCreds)}
            className="w-full flex items-center justify-between text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span>Developer Test Accounts</span>
            {showDemoCreds ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDemoCreds && (
            <div className="mt-2.5 p-2.5 bg-gray-50 rounded-lg text-[11px] space-y-1.5 text-gray-600">
              <div 
                onClick={() => fillCredentials('admin', 'admin123')}
                className="flex justify-between items-center p-1 rounded hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <span>Admin: <strong className="text-gray-800">admin</strong></span>
                <span className="text-[10px] text-[#990024] font-semibold">Click to fill</span>
              </div>
              <div 
                onClick={() => fillCredentials('itstaff', 'staff123')}
                className="flex justify-between items-center p-1 rounded hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <span>Staff: <strong className="text-gray-800">itstaff</strong></span>
                <span className="text-[10px] text-[#990024] font-semibold">Click to fill</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
