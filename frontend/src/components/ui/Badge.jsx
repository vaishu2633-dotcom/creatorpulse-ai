import React from 'react';

export default function Badge({
  children,
  variant = 'indigo',
  size = 'md',
  className = '',
  icon: Icon,
  ...props
}) {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 space-x-1',
    md: 'text-xs px-2.5 py-1 space-x-1.5',
  };

  const variantStyles = {
    indigo:
      'bg-[#EEF2FF] text-[#4338CA] border-[#C7D2FE] dark:bg-[#1E1B4B]/60 dark:text-[#A5B4FC] dark:border-[#3730A3]/60',
    teal:
      'bg-[#F0FDFA] text-[#0F766E] border-[#99F6E4] dark:bg-[#134E4A]/40 dark:text-[#5EEAD4] dark:border-[#115E59]',
    coral:
      'bg-[#FFF7ED] text-[#C2410C] border-[#FFEDD5] dark:bg-[#7C2D12]/30 dark:text-[#FDBA74] dark:border-[#9A3412]/50',
    emerald:
      'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0] dark:bg-[#14532D]/40 dark:text-[#86EFAC] dark:border-[#166534]',
    amber:
      'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A] dark:bg-[#78350F]/30 dark:text-[#FCD34D] dark:border-[#92400E]/50',
    slate:
      'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0] dark:bg-[#1E293B] dark:text-[#CBD5E1] dark:border-[#334155]',
    lavender:
      'bg-[#FAF5FF] text-[#7E22CE] border-[#E9D5FF] dark:bg-[#581C87]/30 dark:text-[#D8B4FE] dark:border-[#6B21A8]/50',
    pink:
      'bg-[#FDF2F8] text-[#BE185D] border-[#FBCFE8] dark:bg-[#831843]/30 dark:text-[#F472B6] dark:border-[#9D174D]/50',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeStyles[size]} ${variantStyles[variant] || variantStyles.indigo} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{children}</span>
    </span>
  );
}
