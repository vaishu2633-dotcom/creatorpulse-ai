import React from 'react';

const TAG_STYLES = {
  'Live Overview':
    'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  'Trend Radar':
    'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  'Prediction Tool':
    'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  'Creator Tool':
    'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  'Tracker':
    'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  'Research Lab':
    'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  'Planner':
    'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  'Listening':
    'bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800',
  'Setup':
    'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
};

export default function PageTag({ tag, className = '' }) {
  const style = TAG_STYLES[tag] || TAG_STYLES['Live Overview'];

  return (
    <span
      className={`inline-flex items-center text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full border ${style} ${className}`}
    >
      {tag}
    </span>
  );
}
