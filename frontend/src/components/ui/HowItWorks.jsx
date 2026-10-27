import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, ArrowRight } from 'lucide-react';

export default function HowItWorks({
  steps = [],
  defaultOpen = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!steps || steps.length === 0) return null;

  return (
    <div
      className={`rounded-2xl border border-[#E8E6DF] dark:border-[#232B3E] bg-[#FAF9F6]/80 dark:bg-[#131825]/80 overflow-hidden transition-colors ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-4 h-4 text-[#5B5BD6] dark:text-brand-300 shrink-0" />
          <span className="text-xs font-bold text-[#1F2430] dark:text-white uppercase tracking-wider">
            How it works
          </span>
          <span className="text-[11px] text-[#5B6475] dark:text-[#94A3B8]">
            ({steps.length} simple steps)
          </span>
        </div>

        <div className="flex items-center space-x-1 text-xs font-medium text-[#5B5BD6] dark:text-brand-300">
          <span>{isOpen ? 'Hide steps' : 'View steps'}</span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="px-4 pb-4 pt-1 border-t border-[#EFECE6] dark:border-[#1E2536]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                {steps.map((step, index) => {
                  const title = typeof step === 'string' ? step : step.title;
                  const desc = typeof step === 'object' ? step.desc : null;

                  return (
                    <div
                      key={index}
                      className="relative p-3 rounded-xl bg-white dark:bg-[#171D2B] border border-[#E8E6DF] dark:border-[#232B3E] shadow-2xs space-y-1.5 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="w-6 h-6 rounded-full bg-brand-50 dark:bg-brand-950/80 text-[#5B5BD6] dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-xs font-extrabold flex items-center justify-center font-mono">
                          {index + 1}
                        </span>
                        {index < steps.length - 1 && (
                          <ArrowRight className="hidden lg:block w-3.5 h-3.5 text-slate-300 dark:text-slate-600 -mr-1" />
                        )}
                      </div>

                      <div className="font-bold text-xs text-[#1F2430] dark:text-white leading-snug">
                        {title}
                      </div>

                      {desc && (
                        <div className="text-[11px] text-[#5B6475] dark:text-[#94A3B8] leading-relaxed">
                          {desc}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
