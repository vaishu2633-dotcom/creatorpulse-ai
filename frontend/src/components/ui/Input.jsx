import React from 'react';

export default function Input({
  label,
  helperText,
  error,
  icon: Icon,
  className = '',
  id,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-[#5B6475] dark:text-[#94A3B8] uppercase tracking-wider mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          className={`w-full rounded-xl bg-white dark:bg-[#171D2B] border ${
            error
              ? 'border-rose-400 focus:ring-rose-400/20 focus:border-rose-500'
              : 'border-[#E4E0D6] dark:border-[#2A334A] focus:ring-[#5B5BD6]/20 focus:border-[#5B5BD6]'
          } text-sm text-[#1F2430] dark:text-[#F1F5F9] placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-150 focus:outline-none focus:ring-2 ${
            Icon ? 'pl-10 pr-3.5 py-2.5' : 'px-3.5 py-2.5'
          } ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <p className="mt-1 text-xs text-rose-500">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
