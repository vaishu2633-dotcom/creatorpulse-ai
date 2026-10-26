import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  Sparkles,
  PenTool,
  History,
  FlaskConical,
  Calendar,
  MessageSquareHeart,
  Settings2,
  ChevronLeft,
  ChevronRight,
  HeartHandshake,
  UserCheck
} from 'lucide-react';

const NAV_GROUPS = [
  {
    group: 'Create & Discover',
    items: [
      { path: '/', label: 'Insights', icon: LayoutDashboard },
      { path: '/trends', label: 'Trend Explorer', icon: Compass },
      { path: '/predictor', label: 'Post Predictor', icon: Sparkles, badge: 'AI' },
      { path: '/studio', label: 'Content Studio', icon: PenTool },
    ],
  },
  {
    group: 'Plan & Test',
    items: [
      { path: '/drafts', label: 'Calendar & Drafts', icon: Calendar },
      { path: '/history', label: 'Prediction Results', icon: History },
      { path: '/ml-lab', label: 'Model Tests', icon: FlaskConical, badge: 'Labs' },
    ],
  },
  {
    group: 'Community & Setup',
    items: [
      { path: '/comments', label: 'Audience Voice', icon: MessageSquareHeart },
      { path: '/settings', label: 'Connect Accounts', icon: Settings2 },
    ],
  },
];

export default function Sidebar({ mobileOpen = false, onCloseMobile }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/40 dark:bg-black/60 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 z-40 h-screen shrink-0 transition-all duration-300 ease-in-out border-r border-[#E8E6DF] dark:border-[#232B3E] bg-[#FAF9F6] dark:bg-[#121724] text-[#1F2430] dark:text-[#F1F5F9] flex flex-col justify-between ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'w-20' : 'w-64'}`}
      >
        <div>
          {/* Header & Brand */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-[#E8E6DF] dark:border-[#232B3E]">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5B5BD6] to-[#14B8A6] flex items-center justify-center shadow-soft text-white shrink-0">
                <Sparkles className="w-5 h-5 fill-white" />
              </div>
              {!collapsed && (
                <div className="truncate">
                  <div className="font-extrabold text-base tracking-tight flex items-center space-x-1.5">
                    <span className="text-[#1F2430] dark:text-white">CreatorPulse</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B5BD6] dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                      AI
                    </span>
                  </div>
                  <div className="text-[11px] text-[#5B6475] dark:text-[#94A3B8]">
                    Friendly Creator Toolkit
                  </div>
                </div>
              )}
            </div>

            {/* Collapse button on desktop */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-4 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
            {NAV_GROUPS.map((group) => (
              <div key={group.group} className="space-y-1">
                {!collapsed && (
                  <div className="px-3 pb-1.5 text-[10px] font-bold text-[#858D9D] dark:text-[#64748B] uppercase tracking-wider">
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
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                          isActive
                            ? 'bg-white dark:bg-[#1E2638] text-[#5B5BD6] dark:text-brand-300 shadow-soft border border-[#E8E6DF] dark:border-[#2D364D]'
                            : 'text-[#5B6475] dark:text-[#94A3B8] hover:text-[#1F2430] dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#171D2B]/60'
                        } ${collapsed ? 'justify-center px-2' : ''}`
                      }
                      title={collapsed ? item.label : undefined}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <Icon className="w-4 h-4 shrink-0" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </div>
                      {!collapsed && item.badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B5BD6] dark:bg-brand-900/50 dark:text-brand-300">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Creator Profile Mini-Footer */}
        <div className="p-3 border-t border-[#E8E6DF] dark:border-[#232B3E] bg-white/60 dark:bg-[#141A28]">
          <div className="flex items-center space-x-3 p-2 rounded-xl">
            {/* Initials Avatar Fallback */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#5B5BD6] to-[#818CF8] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              AL
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#1F2430] dark:text-white truncate">
                  Alex | DevPulse
                </div>
                <div className="text-[11px] text-[#5B6475] dark:text-[#94A3B8] truncate">
                  @devpulse_alex
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
