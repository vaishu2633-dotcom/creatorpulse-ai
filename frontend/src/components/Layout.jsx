import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import GuidedTour from './ui/GuidedTour';

export default function Layout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const isDashboard = location.pathname === '/';

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F7FC] dark:bg-[#0B0F19] text-[#1E1B4B] dark:text-[#F8FAFC] transition-colors">
      {/* Sidebar (Desktop clamp width & mobile drawer) */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar (Height 56px, fixed single line) */}
        <Navbar onToggleMobileSidebar={() => setMobileSidebarOpen(true)} />

        {/* Main Content Area */}
        <main
          className={`flex-1 min-h-0 w-full mx-auto ${
            isDashboard
              ? 'p-2 sm:p-2.5 lg:p-3 xl:p-3.5 max-w-[1680px] dashboard-main-fit'
              : 'p-4 sm:p-6 max-w-7xl overflow-y-auto'
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={isDashboard ? 'h-full flex flex-col min-h-0' : ''}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Guided Tour */}
      <GuidedTour />
    </div>
  );
}
