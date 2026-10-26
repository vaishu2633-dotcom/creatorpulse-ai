import React from 'react';
import { Layers } from 'lucide-react';
import { YoutubeIcon, InstagramIcon, TwitterIcon, LinkedinIcon } from './SocialIcons';

export default function PlatformBadge({ platform, size = 'sm', showName = true }) {
  const p = (platform || '').toLowerCase();

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  if (p === 'youtube') {
    return (
      <span
        className={`inline-flex items-center space-x-1.5 font-medium rounded-full bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50 ${padding}`}
      >
        <YoutubeIcon className={`${iconSize} text-[#FF0000]`} />
        {showName && <span>YouTube</span>}
      </span>
    );
  }

  if (p === 'instagram') {
    return (
      <span
        className={`inline-flex items-center space-x-1.5 font-medium rounded-full bg-pink-50 text-pink-600 border border-pink-200 dark:bg-pink-950/40 dark:text-pink-400 dark:border-pink-900/50 ${padding}`}
      >
        <InstagramIcon className={`${iconSize} text-[#E1306C]`} />
        {showName && <span>Instagram</span>}
      </span>
    );
  }

  if (p === 'twitter' || p === 'x') {
    return (
      <span
        className={`inline-flex items-center space-x-1.5 font-medium rounded-full bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 ${padding}`}
      >
        <TwitterIcon className={`${iconSize} text-slate-900 dark:text-white`} />
        {showName && <span>X (Twitter)</span>}
      </span>
    );
  }

  if (p === 'linkedin') {
    return (
      <span
        className={`inline-flex items-center space-x-1.5 font-medium rounded-full bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50 ${padding}`}
      >
        <LinkedinIcon className={`${iconSize} text-[#0A66C2]`} />
        {showName && <span>LinkedIn</span>}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center space-x-1.5 font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 ${padding}`}
    >
      <Layers className={iconSize} />
      {showName && <span>{platform || 'All Platforms'}</span>}
    </span>
  );
}
