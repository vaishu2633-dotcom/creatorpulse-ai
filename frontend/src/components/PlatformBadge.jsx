import React from 'react';
import { Layers } from 'lucide-react';
import { YoutubeIcon, TwitterIcon } from './SocialIcons';

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

  return (
    <span
      className={`inline-flex items-center space-x-1.5 font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 ${padding}`}
    >
      <Layers className={iconSize} />
      {showName && <span>{platform || 'All Platforms'}</span>}
    </span>
  );
}
