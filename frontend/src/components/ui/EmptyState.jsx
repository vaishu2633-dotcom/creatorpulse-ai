import React from 'react';
import Button from './Button';

export default function EmptyState({
  illustration,
  illustrationAlt = 'Illustration',
  title,
  description,
  actionText,
  onAction,
  actionIcon,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl bg-white dark:bg-[#171D2B] border border-[#E8E6DF] dark:border-[#232B3E] shadow-soft ${className}`}
    >
      {illustration && (
        <div className="w-48 h-36 mb-5 flex items-center justify-center">
          <img
            src={illustration}
            alt={illustrationAlt}
            className="w-full h-full object-contain"
          />
        </div>
      )}

      <h3 className="text-base sm:text-lg font-bold text-[#1F2430] dark:text-white mb-1.5">
        {title}
      </h3>

      {description && (
        <p className="text-xs sm:text-sm text-[#5B6475] dark:text-[#94A3B8] max-w-sm mb-5 leading-relaxed">
          {description}
        </p>
      )}

      {actionText && onAction && (
        <Button variant="primary" size="sm" icon={actionIcon} onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
