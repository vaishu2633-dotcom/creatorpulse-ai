import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  icon: Icon,
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 space-x-1.5 h-8',
    md: 'text-sm px-4 py-2 space-x-2 h-10',
    lg: 'text-base px-6 py-3 space-x-2.5 h-12',
  };

  const variantStyles = {
    primary:
      'bg-[#5B5BD6] hover:bg-[#4B4AC0] text-white shadow-sm hover:shadow-soft focus-visible:ring-[#5B5BD6]',
    teal:
      'bg-[#14B8A6] hover:bg-[#0D9488] text-white shadow-sm hover:shadow-soft focus-visible:ring-[#14B8A6]',
    secondary:
      'bg-[#EFECE6] dark:bg-[#202738] hover:bg-[#E4E0D6] dark:hover:bg-[#2A334A] text-[#1F2430] dark:text-[#F1F5F9] focus-visible:ring-slate-400',
    outline:
      'border border-[#E4E0D6] dark:border-[#2A334A] bg-transparent hover:bg-slate-100/70 dark:hover:bg-slate-800/60 text-[#1F2430] dark:text-[#F1F5F9] focus-visible:ring-slate-400',
    ghost:
      'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-[#5B6475] dark:text-[#94A3B8] hover:text-[#1F2430] dark:hover:text-white',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0 text-current" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
