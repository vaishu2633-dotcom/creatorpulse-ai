import React from 'react';
import { Flame, Sparkles, Minus } from 'lucide-react';

export default function BreakoutBadge({ isBreakout, prob = null }) {
  if (isBreakout === true || (prob !== null && prob >= 0.20)) {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
        <Flame className="w-3 h-3 text-emerald-600 dark:text-emerald-400 fill-emerald-600 dark:fill-emerald-400" />
        <span>Hit post</span>
      </span>
    );
  }

  if (prob !== null && prob >= 0.10) {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
        <Sparkles className="w-3 h-3 text-amber-500" />
        <span>High potential</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700">
      <Minus className="w-3 h-3 text-slate-400" />
      <span>Usual pace</span>
    </span>
  );
}
