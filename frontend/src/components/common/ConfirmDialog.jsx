import React, { useEffect } from 'react';
import { AlertCircle, HelpCircle, AlertTriangle, CheckCircle2, X } from 'lucide-react';

export const ConfirmDialog = ({
  isOpen,
  title = 'Confirm Action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  type = 'primary', // 'primary', 'danger', 'warning', 'success'
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape' && !isLoading) onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const typeConfig = {
    primary: {
      icon: HelpCircle,
      iconBg: 'bg-red-50 text-[#990024] border-red-100',
      confirmBtn: 'bg-[#990024] hover:bg-[#80001e] text-white shadow-xs'
    },
    danger: {
      icon: AlertCircle,
      iconBg: 'bg-rose-50 text-rose-700 border-rose-200',
      confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
    },
    success: {
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
    }
  };

  const currentType = typeConfig[type] || typeConfig.primary;
  const Icon = currentType.icon;

  return (
    <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 font-sans animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-xl border border-zinc-200 shadow-2xl max-w-md w-full overflow-hidden flex flex-col scale-100 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 flex items-start gap-3.5">
          <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ${currentType.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
              {title}
            </h3>
            <div className="text-xs text-zinc-500 mt-1 leading-relaxed font-sans">
              {message}
            </div>
          </div>

          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-1 text-zinc-400 hover:text-zinc-600 rounded-md transition-colors -mt-1 -mr-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-zinc-100 bg-zinc-50/70 p-3 px-5 flex items-center justify-end gap-2 font-mono text-xs">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-3.5 py-1.5 border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 rounded font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-1.5 rounded font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${currentType.confirmBtn}`}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
