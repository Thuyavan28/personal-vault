import React, { useEffect } from 'react';
import { AlertCircle, X, ShieldCheck } from 'lucide-react';

export function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl transition-all border-2 ${
        isError
          ? 'bg-white text-[#cc001e] border-[#cc001e]'
          : 'bg-white text-[#0e0e0e] border-[#0e0e0e]'
      }`}>
        {isError ? (
          <AlertCircle className="w-5 h-5 text-[#cc001e] shrink-0 stroke-[2.5]" />
        ) : (
          <ShieldCheck className="w-5 h-5 text-[#cc001e] shrink-0 stroke-[2.5]" />
        )}
        <div className="text-sm font-extrabold pr-2 text-[#0e0e0e] font-sans">
          {toast.message}
        </div>
        <button
          onClick={onClose}
          className="text-[#0e0e0e] hover:text-[#cc001e] transition-colors p-1 rounded-lg cursor-pointer"
          aria-label="Close notification"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
