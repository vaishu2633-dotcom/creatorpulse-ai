import React from 'react';
import { motion } from 'framer-motion';
import { usePlatform, PLATFORMS } from '../context/PlatformContext';
import { useTheme } from '../context/ThemeContext';
import MockDataBadge from './MockDataBadge';
import { Layers, Sun, Moon, Menu } from 'lucide-react';
import { YoutubeIcon, InstagramIcon, TwitterIcon, LinkedinIcon } from './SocialIcons';

const ICON_MAP = {
  Layers: Layers,
  Youtube: YoutubeIcon,
  Instagram: InstagramIcon,
  Twitter: TwitterIcon,
  Linkedin: LinkedinIcon,
};

export default function Navbar({ onToggleMobileSidebar }) {
  const { selectedPlatform, setSelectedPlatform } = usePlatform();
  const { activeTheme, toggleTheme } = useTheme();

  return (
    <header className="h-16 bg-white/80 dark:bg-[#171D2B]/80 backdrop-blur-md border-b border-[#E8E6DF] dark:border-[#232B3E] sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between transition-colors">
      <div className="flex items-center space-x-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Platform Pill Selector with Animated Sliding Indicator */}
        <div className="flex items-center space-x-1 bg-[#EFECE6] dark:bg-[#111622] p-1 rounded-2xl border border-[#E5E2DA] dark:border-[#1F2738] overflow-x-auto max-w-[280px] sm:max-w-none">
          {PLATFORMS.map((plat) => {
            const Icon = ICON_MAP[plat.icon] || Layers;
            const isSelected = selectedPlatform === plat.id;

            return (
              <button
                key={plat.id}
                onClick={() => setSelectedPlatform(plat.id)}
                className={`relative flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 z-10 ${
                  isSelected
                    ? 'text-[#1F2430] dark:text-white'
                    : 'text-[#5B6475] dark:text-[#94A3B8] hover:text-[#1F2430] dark:hover:text-white'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activePlatformIndicator"
                    className="absolute inset-0 bg-white dark:bg-[#20283A] rounded-xl shadow-xs border border-slate-200/60 dark:border-slate-700/60 -z-10"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <Icon
                  className="w-3.5 h-3.5"
                  style={{ color: plat.color || undefined }}
                />
                <span className="hidden sm:inline">{plat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right controls: Theme toggle, sample data badge */}
      <div className="flex items-center space-x-3">
        <MockDataBadge />

        {/* Theme Toggle (Sun / Moon) */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={activeTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={activeTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#FAF9F6] dark:bg-[#1A2333] border border-[#E8E6DF] dark:border-[#2A354D] text-[#5B6475] dark:text-[#94A3B8] hover:text-[#5B5BD6] dark:hover:text-brand-300 hover:border-[#5B5BD6]/40 transition shadow-2xs"
        >
          {activeTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-[#5B5BD6]" />
          )}
        </button>
      </div>
    </header>
  );
}
