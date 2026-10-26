import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast Overlay Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((toast) => {
            const isSuccess = toast.type === 'success';
            const isError = toast.type === 'error';

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-soft-lg text-sm font-medium ${
                  isSuccess
                    ? 'bg-white dark:bg-[#1A2333] border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                    : isError
                    ? 'bg-white dark:bg-[#1A2333] border-rose-500/30 text-rose-800 dark:text-rose-300'
                    : 'bg-white dark:bg-[#1A2333] border-brand-500/30 text-brand-900 dark:text-brand-300'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                  {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                  {isError && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                  {!isSuccess && !isError && <Info className="w-4 h-4 text-brand-500 shrink-0" />}
                  <span className="truncate text-xs sm:text-sm">{toast.message}</span>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
