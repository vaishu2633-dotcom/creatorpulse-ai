import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function Select({
  label,
  options = [],
  value,
  onChange,
  helperText,
  error,
  className = '',
  id,
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold text-[#5B6475] dark:text-[#94A3B8] uppercase tracking-wider mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          value={value}
          onChange={onChange}
          className={`w-full appearance-none rounded-xl bg-white dark:bg-[#171D2B] border ${
            error
              ? 'border-rose-400 focus:ring-rose-400/20 focus:border-rose-500'
              : 'border-[#E4E0D6] dark:border-[#2A334A] focus:ring-[#5B5BD6]/20 focus:border-[#5B5BD6]'
          } text-sm text-[#1F2430] dark:text-[#F1F5F9] px-3.5 py-2.5 pr-10 transition-all duration-150 focus:outline-none focus:ring-2 cursor-pointer ${className}`}
          {...props}
        >
          {options.map((opt) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const text = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={val} value={val} className="dark:bg-[#171D2B]">
                {text}
              </option>
            );
          })}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      {error ? (
        <p className="mt-1 text-xs text-rose-500">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
