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
    'rounded-2xl border transition-all duration-200 overflow-hidden';
  
  const variantStyles = {
    default:
      'bg-white dark:bg-[#171D2B] border-[#E8E6DF] dark:border-[#232B3E] shadow-soft',
    subtle:
      'bg-[#FAF9F6] dark:bg-[#131825] border-[#EAE7E0] dark:border-[#1E2536]',
    tintedIndigo:
      'bg-[#F5F3FF] dark:bg-[#1A1F36] border-[#DDD6FE] dark:border-[#2D3559]',
    tintedTeal:
      'bg-[#F0FDFA] dark:bg-[#132328] border-[#CCFBF1] dark:border-[#1A383F]',
    tintedPeach:
      'bg-[#FFF7ED] dark:bg-[#251D1E] border-[#FFEDD5] dark:border-[#3D2927]',
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
