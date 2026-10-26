import React from 'react';
import { motion } from 'framer-motion';

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  className = '',
  size = 'md',
}) {
  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
  };

  return (
    <div
      role="tablist"
      className={`inline-flex items-center p-1 bg-[#EFECE6] dark:bg-[#1A2131] rounded-xl border border-[#E5E2DA] dark:border-[#232B3E] ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center space-x-2 font-medium rounded-lg transition-colors z-10 ${
              sizeStyles[size]
            } ${
              isActive
                ? 'text-[#1F2430] dark:text-white font-semibold'
                : 'text-[#5B6475] dark:text-[#94A3B8] hover:text-[#1F2430] dark:hover:text-white'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute inset-0 bg-white dark:bg-[#262F44] rounded-lg shadow-sm border border-slate-200/60 dark:border-slate-700/60 -z-10"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
            {Icon && <Icon className="w-4 h-4 shrink-0" />}
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
