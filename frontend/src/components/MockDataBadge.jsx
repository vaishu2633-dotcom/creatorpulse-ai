import React from 'react';
import { Database, Clock } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';

export default function MockDataBadge({ customTime = null }) {
  const { lastRefreshed, refreshData } = usePlatform();
  const displayTime = customTime || lastRefreshed;

  return (
    <div className="flex items-center space-x-2 text-xs">
      {/* Calm Sample Data Pill */}
      <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#EFECE6] dark:bg-[#1C2333] border border-[#E5E2DA] dark:border-[#263147] text-[#5B6475] dark:text-[#94A3B8]">
        <Database className="w-3 h-3 text-[#5B5BD6] dark:text-brand-400" />
        <span className="text-[11px] font-medium">Sample data</span>
      </div>

      {/* Quiet Last Updated Pill */}
      <button
        type="button"
        onClick={refreshData}
        title="Click to refresh sample data"
        className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-white dark:bg-[#171D2B] border border-[#E8E6DF] dark:border-[#232B3E] text-[#5B6475] dark:text-[#94A3B8] hover:text-[#1F2430] dark:hover:text-white transition shadow-2xs"
      >
        <Clock className="w-3 h-3 text-slate-400" />
        <span className="text-[11px]">Updated {displayTime}</span>
      </button>
    </div>
  );
}
