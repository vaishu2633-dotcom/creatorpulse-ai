import React from 'react';
import Navbar from './Navbar';

export default function Layout({ activeTab = 'analyze', onTabChange, children }) {
  return (
    <div className="min-h-screen bg-[#F8F7FC] dark:bg-[#0B0F19] text-[#1E1B4B] dark:text-[#F8FAFC] flex flex-col transition-colors">
      <Navbar activeTab={activeTab} onTabChange={onTabChange} />
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
      <footer className="py-6 border-t border-[#EAE7F5] dark:border-[#1F293D] text-center text-xs text-slate-500 dark:text-slate-400">
        creatorPulse • Academic Machine Learning YouTube Comment Sentiment Analysis
      </footer>
    </div>
  );
}
