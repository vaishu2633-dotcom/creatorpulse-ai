import React from 'react';

const STATUS_CONFIGS = {
  'Working now': {
    dot: 'bg-emerald-500',
    badge:
      'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  'Uses sample data': {
    dot: 'bg-amber-500',
    badge:
      'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
  },
  'Coming soon': {
    dot: 'bg-slate-400',
    badge:
      'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  },
};

export default function StatusChip({
  status = 'Uses sample data',
  size = 'md',
  className = '',
}) {
  const config = STATUS_CONFIGS[status] || STATUS_CONFIGS['Uses sample data'];

  const sizeClasses =
    size === 'sm'
      ? 'text-[10px] px-2 py-0.5 space-x-1.5'
      : 'text-xs px-2.5 py-1 space-x-2';

  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border shadow-2xs ${config.badge} ${sizeClasses} ${className}`}
    >
      <span className={`rounded-full shrink-0 ${dotSize} ${config.dot}`} />
      <span>{status}</span>
    </span>
  );
}
