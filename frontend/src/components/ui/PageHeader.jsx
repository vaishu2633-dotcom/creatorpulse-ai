import React from 'react';
import PageTag from './PageTag';
import StatusChip from './StatusChip';
import HowItWorks from './HowItWorks';

const ACCENT_COLORS = {
  indigo:
    'bg-indigo-50 dark:bg-indigo-950/60 text-[#5B5BD6] dark:text-brand-300 border-indigo-200 dark:border-indigo-800',
  teal:
    'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  purple:
    'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  rose:
    'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  blue:
    'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  amber:
    'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  emerald:
    'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  pink:
    'bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-300 border-pink-200 dark:border-pink-800',
  slate:
    'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
};

export default function PageHeader({
  title,
  subtitle,
  description,
  tag,
  pageTag,
  status = 'Uses sample data',
  statusChip,
  icon: Icon,
  accent = 'indigo',
  illustration,
  illustrationAlt = 'Page illustration',
  children,
  howItWorksSteps = [],
  howItWorksDefaultOpen = false,
  className = '',
}) {
  const accentClass = ACCENT_COLORS[accent] || ACCENT_COLORS.indigo;
  const effectiveTag = tag || pageTag;
  const effectiveStatus = statusChip || status;
  const effectiveSubtitle = subtitle || description;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Top Banner Card (Compact 85-110px height) */}
      <div className="relative p-3.5 sm:p-4.5 rounded-2xl bg-white dark:bg-[#131927] border border-[#EAE7F5] dark:border-[#1F293D] shadow-xs overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Identity & Meta */}
        <div className="space-y-1.5 z-10 max-w-2xl">
          {/* Tag & Status Row */}
          <div className="flex flex-wrap items-center gap-1.5">
            {effectiveTag && <PageTag tag={effectiveTag} />}
            {effectiveStatus && <StatusChip status={effectiveStatus} size="sm" />}
          </div>

          {/* Title with Feature Icon */}
          <div className="flex items-center space-x-2.5">
            {Icon && (
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 shadow-2xs ${accentClass}`}
              >
                <Icon className="w-4 h-4" />
              </div>
            )}
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#1E1B4B] dark:text-white leading-tight">
              {title}
            </h1>
          </div>

          {/* Plain Plain-Language Sentence Subtitle */}
          {effectiveSubtitle && (
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed line-clamp-1 sm:line-clamp-2">
              {effectiveSubtitle}
            </p>
          )}

          {/* Optional Inline Children (Buttons, Tabs, Filters) */}
          {children && <div className="pt-1">{children}</div>}
        </div>

        {/* Right Side: Header Illustration Banner */}
        {illustration && (
          <div className="hidden sm:block shrink-0 w-28 h-20 md:w-36 md:h-24 z-0 opacity-90 dark:opacity-80 transition-opacity">
            <img
              src={illustration}
              alt={illustrationAlt}
              className="w-full h-full object-contain pointer-events-none select-none"
            />
          </div>
        )}
      </div>

      {/* Feature-Specific Collapsible How It Works Strip */}
      {howItWorksSteps && howItWorksSteps.length > 0 && (
        <HowItWorks
          steps={howItWorksSteps}
          defaultOpen={howItWorksDefaultOpen}
        />
      )}
    </div>
  );
}
