import React from 'react';

export function Skeleton({ className = '', rounded = 'rounded-xl', ...props }) {
  return (
    <div
      className={`animate-pulse bg-[#E8E6DF] dark:bg-[#232B3E] ${rounded} ${className}`}
      {...props}
    />
  );
}

export function CardSkeleton({ lines = 3, className = '' }) {
  return (
    <div
      className={`p-5 rounded-2xl bg-white dark:bg-[#171D2B] border border-[#E8E6DF] dark:border-[#232B3E] shadow-soft space-y-3.5 ${className}`}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="w-24 h-4" />
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
      <Skeleton className="w-32 h-8" />
      <div className="space-y-2 pt-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={`h-3 ${i === 0 ? 'w-full' : 'w-3/4'}`} />
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="w-full space-y-3">
      <div className="flex space-x-4 pb-2 border-b border-[#E8E6DF] dark:border-[#232B3E]">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex space-x-4 py-2 border-b border-[#E8E6DF]/50 dark:border-[#232B3E]/50">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
