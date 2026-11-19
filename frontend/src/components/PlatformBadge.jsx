import React from 'react';
import { Layers } from 'lucide-react';
import { YoutubeIcon } from './SocialIcons';

export default function PlatformBadge({ platform = 'youtube', size = 'sm', showName = true }) {
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center space-x-1.5 font-medium rounded-full bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50 ${padding}`}
    >
      <YoutubeIcon className={`${iconSize} text-[#FF0000]`} />
      {showName && <span>YouTube</span>}
    </span>
  );
}
