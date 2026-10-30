import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  Sparkles,
  SearchCheck,
  PenTool,
  Compass,
  Calendar,
  FlaskConical,
  Users,
  MessageSquareHeart,
  BarChart3,
  Settings2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { usePlatform } from '../context/PlatformContext';
import { getVibeCheckStatus } from '../api/apiClient';

export default function Sidebar({ mobileOpen = false, onCloseMobile }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useUser();
  const { activeDataSource } = usePlatform();
  const [vibeStatus, setVibeStatus] = useState({ isLive: false, label: 'Limited' });

  useEffect(() => {
    let isMounted = true;
    getVibeCheckStatus()
      .then((res) => {
        if (isMounted) {
          setVibeStatus({
            isLive: Boolean(res.youtube_api_configured),
            label: res.youtube_api_configured ? 'Live' : 'Limited',
          });
        }
      })
      .catch(() => {
        if (isMounted) {
          setVibeStatus({ isLive: false, label: 'Limited' });
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const isSample = activeDataSource?.source === 'sample';
  const defaultStatus = isSample ? 'Uses sample data' : 'Working now';

  const navGroups = [
    {
      group: 'INTELLIGENCE & PREDICTION',
      items: [
        {
          path: '/',
          label: 'Dashboard',
          icon: LayoutDashboard,
          accent: 'text-violet-600 dark:text-violet-400',
          truthStatus: defaultStatus,
        },
        {
          path: '/results',
          label: 'Prediction Results',
          icon: Target,
          accent: 'text-blue-600 dark:text-blue-400',
          badge: 'New',
          badgeColor: 'violet',
          truthStatus: defaultStatus,
        },
        {
          path: '/predictor',
          label: 'Post Predictor',
          icon: Sparkles,
          accent: 'text-purple-600 dark:text-purple-400',
          badge: 'New',
          badgeColor: 'violet',
          truthStatus: 'Working now',
        },
        {
          path: '/vibecheck',
          label: 'VibeCheck AI',
          icon: SearchCheck,
          accent: 'text-teal-600 dark:text-teal-400',
          badge: vibeStatus.label,
          badgeColor: vibeStatus.isLive ? 'green' : 'gray',
          truthStatus: vibeStatus.isLive ? 'Working now' : 'Working now (Sample fallback)',
        },
      ],
    },
    {
      group: 'STUDIO & PLANNING',
      items: [
        {
          path: '/studio',
          label: 'Content Studio',
          icon: PenTool,
          accent: 'text-rose-600 dark:text-rose-400',
          badge: 'New',
          badgeColor: 'violet',
          truthStatus: 'Working now',
        },
        {
          path: '/trends',
          label: 'Trend Explorer',
          icon: Compass,
          accent: 'text-amber-600 dark:text-amber-400',
          truthStatus: defaultStatus,
        },
        {
          path: '/drafts',
          label: 'Calendar & Drafts',
          icon: Calendar,
          accent: 'text-emerald-600 dark:text-emerald-400',
          truthStatus: 'Working now',
        },
      ],
    },
    {
      group: 'RESEARCH & CONNECT',
      items: [
        {
          path: '/ml-lab',
          label: 'Model Tests',
          icon: FlaskConical,
          accent: 'text-indigo-600 dark:text-indigo-400',
          truthStatus: 'Working now',
        },
        {
          path: '/competitors',
          label: 'Competitor Analysis',
          icon: Users,
          accent: 'text-cyan-600 dark:text-cyan-400',
          badge: 'New',
          badgeColor: 'violet',
          truthStatus: defaultStatus,
        },
        {
          path: '/comments',
          label: 'Audience Voice',
          icon: MessageSquareHeart,
          accent: 'text-pink-600 dark:text-pink-400',
          truthStatus: defaultStatus,
        },
        {
          path: '/reports',
          label: 'Reports',
          icon: BarChart3,
          accent: 'text-indigo-600 dark:text-indigo-400',
          badge: 'New',
          badgeColor: 'violet',
          truthStatus: defaultStatus,
        },
        {
          path: '/settings',
          label: 'Connect Accounts',
          icon: Settings2,
          accent: 'text-slate-600 dark:text-slate-400',
          truthStatus: 'Working now',
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/40 dark:bg-black/70 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      <aside
        style={{
          width: collapsed ? '4.5rem' : 'clamp(224px, 16vw, 260px)',
        }}
        className={`fixed md:sticky top-0 z-40 h-screen shrink-0 transition-all duration-200 ease-in-out border-r border-[#EAE7F5] dark:border-[#1F293D] bg-[#FFFFFF] dark:bg-[#131927] text-slate-800 dark:text-slate-100 flex flex-col justify-between shadow-xs ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full min-h-0">
          {/* Logo Block (Compact h-12 to save vertical space) */}
          <div className="h-12 flex items-center justify-between px-3 border-b border-[#EAE7F5] dark:border-[#1F293D] shrink-0">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-xs text-white shrink-0">
                <Sparkles className="w-3.5 h-3.5 fill-white" />
              </div>
              {!collapsed && (
                <div className="truncate min-w-0">
                  <div className="font-extrabold text-[13px] tracking-tight flex items-center space-x-1 leading-none">
                    <span className="text-slate-900 dark:text-white truncate">CreatorPulse</span>
                    <span className="font-extrabold text-violet-600 dark:text-violet-400">AI</span>
                  </div>
                  <div className="text-[9.5px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                    Social Intelligence Studio
                  </div>
                </div>
              )}
            </div>

            {/* Collapse button on desktop */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronLeft className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Navigation Links Scrollable Area */}
          <div className="relative flex-1 min-h-0 flex flex-col">
            <div className="flex-1 px-2 py-1 space-y-1.5 overflow-y-auto min-h-0 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {navGroups.map((group) => (
                <div key={group.group} className="space-y-0.5">
                  {!collapsed && (
                    <div className="px-2 pt-1 pb-0.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {group.group}
                    </div>
                  )}
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        onClick={onCloseMobile}
                        title={`${item.label} • Status: ${item.truthStatus}`}
                        className={({ isActive }) =>
                          `group relative flex items-center justify-between px-2.5 py-1 rounded-xl text-xs font-medium h-[33px] transition-all ${
                            isActive
                              ? 'bg-violet-100/90 dark:bg-violet-950/70 text-violet-900 dark:text-violet-200 font-semibold border border-violet-200/80 dark:border-violet-800/80 shadow-2xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                          } ${collapsed ? 'justify-center px-1' : ''}`
                        }
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          <Icon
                            className={`w-3.5 h-3.5 shrink-0 transition-colors ${item.accent}`}
                          />
                          {!collapsed && (
                            <span className="truncate text-[11.5px]">{item.label}</span>
                          )}
                        </div>

                        {!collapsed && item.badge && (
                          <span
                            className={`shrink-0 ml-1.5 text-[8.5px] font-bold px-1.5 py-0.2 rounded-full border leading-normal ${
                              item.badgeColor === 'green'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                : item.badgeColor === 'gray'
                                ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                : 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Soft bottom fade indicator if container scrolls */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white dark:from-[#131927] to-transparent opacity-80" />
          </div>

          {/* Bottom Profile Card (Compact h-11) */}
          <div className="p-1.5 border-t border-[#EAE7F5] dark:border-[#1F293D] bg-slate-50/60 dark:bg-[#111622] shrink-0">
            <NavLink
              to="/settings"
              className="flex items-center justify-between p-1 rounded-xl hover:bg-white dark:hover:bg-slate-800/80 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
              <div className="flex items-center space-x-2 min-w-0">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-6 h-6 rounded-lg object-cover shrink-0 border border-violet-200 dark:border-violet-800 shadow-2xs"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-bold text-[9px] shadow-2xs shrink-0">
                    {user.initials || 'CP'}
                  </div>
                )}
                {!collapsed && (
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate leading-none">
                      {user.channelName || 'Creator Channel'}
                    </div>
                    <div className="text-[9.5px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {user.workspace || 'Prototype Workspace'}
                    </div>
                  </div>
                )}
              </div>
              {!collapsed && (
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              )}
            </NavLink>
          </div>
        </div>
      </aside>
    </>
  );
}
