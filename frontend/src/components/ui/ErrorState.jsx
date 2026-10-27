import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

export default function ErrorState({
  title = 'Something went wrong',
  description = 'We encountered an error loading this data. Please try again.',
  onRetry,
  className = ''
}) {
  return (
    <div
      className={`rounded-2xl border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 p-8 text-center flex flex-col items-center justify-center ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-[#1F2430] dark:text-[#F1F5F9] mb-1">
        {title}
      </h3>
      <p className="text-sm text-[#5B6475] dark:text-[#94A3B8] max-w-md mb-4">
        {description}
      </p>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={onRetry}
        >
          Try again
        </Button>
      )}
    </div>
  );
}
