import React from 'react';
import { motion } from 'framer-motion';

export default function Card({
  children,
  className = '',
  hoverEffect = false,
  onClick,
  cover,
  variant = 'default',
  ...props
}) {
  const isClickable = Boolean(onClick);

  const baseStyles =
    'rounded-3xl border transition-all duration-200 overflow-hidden';
  
  const variantStyles = {
    default:
      'bg-white dark:bg-[#131927] border-[#EAE7F5] dark:border-[#1F293D] shadow-xs',
    subtle:
      'bg-[#F8F7FC] dark:bg-[#0E1422] border-[#EAE7F5] dark:border-[#1B2438]',
    tintedIndigo:
      'bg-violet-50/70 dark:bg-violet-950/30 border-violet-100 dark:border-violet-900/40',
    tintedTeal:
      'bg-teal-50/70 dark:bg-teal-950/30 border-teal-100 dark:border-teal-900/40',
    tintedPeach:
      'bg-amber-50/70 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40',
  };

  const hoverStyles = hoverEffect || isClickable
    ? 'hover:-translate-y-0.5 hover:shadow-soft-lg cursor-pointer active:translate-y-0'
    : '';

  return (
    <div
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant] || variantStyles.default} ${hoverStyles} ${className}`}
      {...props}
    >
      {cover && <div className="w-full overflow-hidden">{cover}</div>}
      {children}
    </div>
  );
}
