import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePlatform, PLATFORMS } from '../context/PlatformContext';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import SlideOver from './ui/SlideOver';
import GuidedTour from './ui/GuidedTour';
import {
  Layers,
  Sun,
  Moon,
  Laptop,
  Menu,
  Bell,
  RefreshCw,
  ChevronDown,
  Database,
  Upload,
  Link2,
  Settings as SettingsIcon,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { YoutubeIcon, InstagramIcon, TwitterIcon, LinkedinIcon } from './SocialIcons';

const ICON_MAP = {
  Layers: Layers,
  Youtube: YoutubeIcon,
  Instagram: InstagramIcon,
  Twitter: TwitterIcon,
  Linkedin: LinkedinIcon,
};

const SAMPLE_NOTIFICATIONS = [
  {
    id: 'notif_1',
    title: 'Breakout Hit Detected',
    message: 'Your video "Why 90% of Junior Devs Fail Technical Interviews" hit top 5% view velocity.',
    time: '2 hours ago',
    source: 'Sample telemetry',
  },
  {
    id: 'notif_2',
    title: 'Emerging Topic Radar',
    message: 'Topic "AI Prompt Engineering for Production" is trending with 84% momentum across YouTube and X.',
    time: '5 hours ago',
    source: 'Sample telemetry',
  },
  {
    id: 'notif_3',
    title: 'Audience Question Surge',
    message: '14 viewers asked about setup costs in your recent comments. Ready to turn into Studio idea?',
    time: '1 day ago',
    source: 'Sample telemetry',
  },
];

export default function Navbar({ onToggleMobileSidebar }) {
  const navigate = useNavigate();
  const {
    selectedPlatform,
    setSelectedPlatform,
    activeSource,
    dataSourceMeta,
    switchDataSource,
    lastRefreshed,
    refreshData
  } = usePlatform();
  const { activeTheme, setTheme } = useTheme();
  const { user } = useUser();

  const [dataDropdownOpen, setDataDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const dataDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dataDropdownRef.current && !dataDropdownRef.current.contains(event.target)) {
        setDataDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    refreshData();
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  const getSourceBadgeConfig = () => {
    if (activeSource === 'uploaded_csv') {
      return {
        label: 'Uploaded CSV',
        classes: 'bg-violet-50/90 dark:bg-violet-950/40 text-violet-800 dark:text-violet-300 border-violet-200/80 dark:border-violet-800/60',
        iconClass: 'text-violet-600 dark:text-violet-400'
      };
    }
    if (activeSource === 'youtube') {
      return {
        label: 'YouTube Channel',
        classes: 'bg-rose-50/90 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60',
        iconClass: 'text-rose-600 dark:text-rose-400'
      };
    }
    return {
      label: 'Sample data',
      classes: 'bg-amber-50/90 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
      iconClass: 'text-amber-600 dark:text-amber-400'
    };
  };

  const badgeConfig = getSourceBadgeConfig();

  return (
    <>
      <header className="h-14 bg-white/95 dark:bg-[#131927]/95 backdrop-blur-md border-b border-[#EAE7F5] dark:border-[#1F293D] sticky top-0 z-30 px-3 sm:px-5 flex items-center justify-between transition-colors shadow-2xs shrink-0">
        {/* Left: Mobile trigger & Segmented platform pills */}
        <div className="flex items-center space-x-2.5 min-w-0">
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
            aria-label="Open mobile navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Segmented Platform Pills - Compact without horizontal scrollbar */}
          <div className="flex items-center space-x-0.5 bg-slate-100/90 dark:bg-[#0B0F19] p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-800 shrink-0">
            {PLATFORMS.map((plat) => {
              const Icon = ICON_MAP[plat.icon] || Layers;
              const isSelected = selectedPlatform === plat.id;

              return (
                <button
                  key={plat.id}
                  onClick={() => setSelectedPlatform(plat.id)}
                  title={plat.label}
                  className={`relative flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 z-10 ${
                    isSelected
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="navbarActivePlatform"
                      className="absolute inset-0 bg-white dark:bg-[#1E2638] rounded-lg shadow-xs border border-slate-200/80 dark:border-slate-700 -z-10"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <Icon
                    className="w-3.5 h-3.5 shrink-0"
                    style={{ color: plat.color || undefined }}
                  />
                  {/* Keep active one labeled, show other labels only on wider screens (>= 1280px) */}
                  <span className={`text-[11.5px] ${isSelected ? 'inline' : 'hidden xl:inline'}`}>
                    {plat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Controls - One Line, No Wrap, Fully Visible */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0 pl-2">
          {/* Dynamic Active Data Source Dropdown Chip */}
          <div className="relative" ref={dataDropdownRef}>
            <button
              onClick={() => setDataDropdownOpen(!dataDropdownOpen)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold whitespace-nowrap transition shadow-2xs ${badgeConfig.classes}`}
            >
              <Database className={`w-3 h-3 shrink-0 ${badgeConfig.iconClass}`} />
              <span>{badgeConfig.label}</span>
              <ChevronDown className="w-2.5 h-2.5 opacity-70 shrink-0 ml-0.5" />
            </button>

            <AnimatePresence>
              {dataDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  className="absolute right-0 mt-1.5 w-64 rounded-2xl bg-white dark:bg-[#1E2638] border border-slate-200 dark:border-slate-700 shadow-xl py-1.5 z-50 text-xs"
                >
                  <div className="px-3 py-1 font-bold uppercase tracking-wider text-[9.5px] text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    Active Data Source Switcher
                  </div>

                  {/* Option 1: Sample data */}
                  <button
                    onClick={() => {
                      switchDataSource('sample');
                      setDataDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition ${
                      activeSource === 'sample' ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''
                    }`}
                  >
                    {activeSource === 'sample' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>Sample data</span>
                        <span className="text-[10px] text-amber-600 font-normal">
                          {dataSourceMeta?.counts?.sample || 1800} posts
                        </span>
                      </div>
                      <div className="text-[10.5px] text-slate-500">Simulated posts for safe prototype testing</div>
                    </div>
                  </button>

                  {/* Option 2: Uploaded CSV */}
                  <button
                    onClick={() => {
                      if (dataSourceMeta?.counts?.uploaded_csv > 0) {
                        switchDataSource('uploaded_csv');
                        setDataDropdownOpen(false);
                      } else {
                        setDataDropdownOpen(false);
                        navigate('/settings');
                      }
                    }}
                    className={`w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition ${
                      activeSource === 'uploaded_csv' ? 'bg-violet-50/50 dark:bg-violet-950/20' : ''
                    }`}
                  >
                    {activeSource === 'uploaded_csv' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>Uploaded CSV</span>
                        <span className="text-[10px] text-violet-600 font-normal">
                          {dataSourceMeta?.counts?.uploaded_csv || 0} posts
                        </span>
                      </div>
                      <div className="text-[10.5px] text-slate-500">
                        {dataSourceMeta?.uploaded_meta?.filename
                          ? `Active: ${dataSourceMeta.uploaded_meta.filename}`
                          : 'Click to upload your own CSV'}
                      </div>
                    </div>
                  </button>

                  {/* Option 3: YouTube Channel */}
                  <button
                    onClick={() => {
                      if (dataSourceMeta?.counts?.youtube > 0) {
                        switchDataSource('youtube');
                        setDataDropdownOpen(false);
                      } else {
                        setDataDropdownOpen(false);
                        navigate('/settings');
                      }
                    }}
                    className={`w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition ${
                      activeSource === 'youtube' ? 'bg-rose-50/50 dark:bg-rose-950/20' : ''
                    }`}
                  >
                    {activeSource === 'youtube' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>YouTube Channel</span>
                        <span className="text-[10px] text-rose-600 font-normal">
                          {dataSourceMeta?.counts?.youtube || 0} videos
                        </span>
                      </div>
                      <div className="text-[10.5px] text-slate-500">
                        {dataSourceMeta?.youtube_meta?.channel_title
                          ? `Connected: ${dataSourceMeta.youtube_meta.channel_title}`
                          : 'Click to connect channel via API'}
                      </div>
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Updated <time> Chip */}
          <button
            onClick={handleRefresh}
            title="Click to refresh telemetry"
            className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-medium whitespace-nowrap hover:bg-slate-200/60 transition shadow-2xs"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin text-violet-600' : 'text-slate-400'}`} />
            <span>Updated {lastRefreshed}</span>
          </button>

          {/* Notification Bell with Red Dot */}
          <button
            onClick={() => setNotificationsOpen(true)}
            className="relative w-8 h-8 rounded-lg flex items-center justify-center bg-white dark:bg-[#1E2638] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-300 transition shadow-2xs shrink-0"
            aria-label="View notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
          </button>

          {/* Profile Avatar Dropdown */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center space-x-1 p-0.5 rounded-lg hover:ring-2 hover:ring-violet-500/20 transition shrink-0"
              aria-label="User profile menu"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-lg object-cover border border-violet-200 dark:border-violet-800 shadow-2xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                  {user.initials || 'CP'}
                </div>
              )}
            </button>

            <AnimatePresence>
              {profileDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  className="absolute right-0 mt-1.5 w-56 rounded-2xl bg-white dark:bg-[#1E2638] border border-slate-200 dark:border-slate-700 shadow-xl py-1.5 z-50 text-xs"
                >
                  <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="font-bold text-slate-900 dark:text-white truncate">{user.name}</div>
                    <div className="text-[10.5px] text-slate-500 truncate">{user.channelName}</div>
                    <div className="mt-1 flex items-center space-x-1.5 text-[10px] text-violet-600 dark:text-violet-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{activeSource === 'sample' ? 'Sample Data Mode' : activeSource === 'uploaded' ? 'Uploaded CSV Dataset' : 'YouTube Live Connected'}</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate('/settings#accounts');
                      }}
                      className="w-full text-left px-3.5 py-2 flex items-center space-x-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition"
                    >
                      <Link2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Connect Accounts</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate('/settings');
                      }}
                      className="w-full text-left px-3.5 py-2 flex items-center space-x-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition"
                    >
                      <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>Settings & API Keys</span>
                    </button>

                    <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                    <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Data Source</span>
                      <span className="text-[9px] text-violet-600 dark:text-violet-400 font-semibold cursor-pointer" onClick={() => switchDataSource(activeSource === 'sample' ? 'uploaded' : 'sample')}>
                        Switch
                      </span>
                    </div>
                    <div className="px-3.5 py-1 text-[11px] text-slate-600 dark:text-slate-400 flex items-center space-x-1.5">
                      <Database className="w-3 h-3 text-violet-500" />
                      <span className="truncate">{activeSource === 'sample' ? 'Synthetic 1,800 posts' : 'Custom user dataset'}</span>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                    <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Theme
                    </div>
                    <div className="px-3 flex items-center gap-1 pb-1">
                      <button
                        onClick={() => setTheme('light')}
                        className={`flex-1 py-1 rounded-md text-[10.5px] font-semibold flex items-center justify-center gap-1 border ${
                          activeTheme === 'light'
                            ? 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Sun className="w-3 h-3 text-amber-500" />
                        <span>Light</span>
                      </button>
                      <button
                        onClick={() => setTheme('dark')}
                        className={`flex-1 py-1 rounded-md text-[10.5px] font-semibold flex items-center justify-center gap-1 border ${
                          activeTheme === 'dark'
                            ? 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Moon className="w-3 h-3 text-violet-400" />
                        <span>Dark</span>
                      </button>
                      <button
                        onClick={() => setTheme('system')}
                        className={`flex-1 py-1 rounded-md text-[10.5px] font-semibold flex items-center justify-center gap-1 border ${
                          activeTheme === 'system'
                            ? 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Laptop className="w-3 h-3 text-slate-400" />
                        <span>Auto</span>
                      </button>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setTourOpen(true);
                      }}
                      className="w-full text-left px-3.5 py-1.5 flex items-center space-x-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>Replay Product Tour</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Notifications SlideOver */}
      <SlideOver
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="Channel Notifications & Alerts"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-bold text-slate-900 dark:text-white">Note: </span>
            All notifications reflect simulated prototype activity until live social APIs are connected.
          </div>

          <div className="space-y-2.5">
            {SAMPLE_NOTIFICATIONS.map((n) => (
              <div
                key={n.id}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-violet-300 dark:hover:border-violet-700 transition"
              >
                <div className="flex items-center justify-between text-[10.5px] text-slate-400 mb-1">
                  <span className="font-semibold text-violet-600 dark:text-violet-400">{n.source}</span>
                  <span>{n.time}</span>
                </div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">{n.title}</h4>
                <p className="text-[11.5px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                  {n.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      </SlideOver>

      {/* Replayable Guided Tour */}
      <GuidedTour forceOpen={tourOpen} onClose={() => setTourOpen(false)} />
    </>
  );
}
