import React from 'react';
import { Sparkles, Sun, Moon, SearchCheck, Cpu } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ activeTab, onTabChange }) {
  const { activeTheme, setTheme } = useTheme();

  return (
    <header className="h-16 bg-white/95 dark:bg-[#131927]/95 backdrop-blur-md border-b border-[#EAE7F5] dark:border-[#1F293D] sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between transition-colors shadow-2xs">
      {/* Left: CreatorPulse AI Brand */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-base sm:text-lg font-bold text-[#1E1B4B] dark:text-[#F8FAFC] tracking-tight">
              CreatorPulse <span className="text-violet-600 dark:text-violet-400">AI</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
              VibeCheck AI
            </span>
          </div>
          <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            YouTube Comment Sentiment Analysis System
          </p>
        </div>
      </div>

      {/* Middle: Simple Navigation */}
      <nav className="flex items-center space-x-1.5 bg-slate-100 dark:bg-[#0B0F19] p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
        <button
          onClick={() => onTabChange && onTabChange('analyze')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'analyze'
              ? 'bg-white dark:bg-[#1E2638] text-violet-700 dark:text-violet-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <SearchCheck className="w-3.5 h-3.5" />
          <span>VibeCheck</span>
        </button>

        <button
          onClick={() => onTabChange && onTabChange('benchmark')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'benchmark'
              ? 'bg-white dark:bg-[#1E2638] text-violet-700 dark:text-violet-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>ML Models Benchmark</span>
        </button>
      </nav>

      {/* Right: Theme Toggle */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setTheme(activeTheme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          title={`Switch to ${activeTheme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
        >
          {activeTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-violet-600" />
          )}
        </button>
      </div>
    </header>
  );
}
