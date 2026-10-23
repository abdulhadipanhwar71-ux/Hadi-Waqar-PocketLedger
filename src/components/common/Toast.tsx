import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-16 md:bottom-6 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        const Icon =
          toast.type === 'success'
            ? CheckCircle2
            : toast.type === 'error'
            ? AlertCircle
            : Info;

        const borderBg =
          toast.type === 'success'
            ? 'bg-emerald-900/90 text-white border-emerald-500/40'
            : toast.type === 'error'
            ? 'bg-rose-900/90 text-white border-rose-500/40'
            : 'bg-navy-900/95 text-white border-navy-700';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between rounded-xl border p-3.5 shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 ${borderBg}`}
          >
            <div className="flex items-center space-x-2.5">
              <Icon className="h-5 w-5 shrink-0 text-emerald-400" />
              <p className="text-sm font-medium leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-3 rounded p-1 text-slate-300 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
