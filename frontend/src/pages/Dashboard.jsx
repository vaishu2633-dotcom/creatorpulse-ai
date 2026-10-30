import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlatform } from '../context/PlatformContext';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import { getDashboardSummary, getSnapshots } from '../api/apiClient';
import Card from '../components/ui/Card';
import SlideOver from '../components/ui/SlideOver';
import Button from '../components/ui/Button';
import HeroIllustration from '../assets/illustrations/hero-creator.svg';
import {
  Sparkles,
  ArrowRight,
  PenTool,
  Zap,
  Compass,
  Calendar,
  BarChart3,
  TrendingUp,
  SearchCheck,
  Target,
  LineChart,
  Eye,
  Heart,
  MessageSquare,
  Activity
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return Number(num).toLocaleString();
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { selectedPlatform } = usePlatform();
  const { user } = useUser();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [showTrajectorySlideOver, setShowTrajectorySlideOver] = useState(false);

  // VibeCheck URL input state
  const [vibeUrl, setVibeUrl] = useState('');
  const [urlError, setUrlError] = useState('');

  const loadData = () => {
    setLoading(true);
    setError(null);

    Promise.all([
      getDashboardSummary(selectedPlatform),
      getSnapshots(selectedPlatform, 30),
    ])
      .then(([sumRes, snapRes]) => {
        setSummary(sumRes || {});
        setSnapshots((snapRes && snapRes.snapshots) || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load dashboard data');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [selectedPlatform]);

  const handleVibeAnalyze = (e) => {
    e.preventDefault();
    const trimmed = vibeUrl.trim();
    if (!trimmed) {
      setUrlError('Please enter a video or post URL.');
      return;
    }
    setUrlError('');
    navigate(`/vibecheck?url=${encodeURIComponent(trimmed)}`);
  };

  const quickActions = [
    {
      title: 'Analyze URL',
      subtitle: 'Scan video sentiment',
      path: '/vibecheck',
      icon: SearchCheck,
      badge: 'Live Scan',
      accent: 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border-teal-200/80 dark:border-teal-800/60',
    },
    {
      title: 'Generate Content',
      subtitle: 'AI scripts & ideas',
      path: '/studio',
      icon: PenTool,
      badge: 'Studio',
      accent: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200/80 dark:border-rose-800/60',
    },
    {
      title: 'Check Trends',
      subtitle: 'Rising topics radar',
      path: '/trends',
      icon: Compass,
      badge: 'Radar',
      accent: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/60',
    },
    {
      title: 'Predict a Post',
      subtitle: 'Test breakout odds',
      path: '/predictor',
      icon: Target,
      badge: 'ML Tool',
      accent: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-200/80 dark:border-purple-800/60',
    },
    {
      title: 'View Calendar',
      subtitle: 'Schedule & drafts',
      path: '/drafts',
      icon: Calendar,
      badge: 'Planner',
      accent: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/60',
    },
    {
      title: 'Open Reports',
      subtitle: 'Channel analytics',
      path: '/reports',
      icon: BarChart3,
      badge: 'Analytics',
      accent: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200/80 dark:border-indigo-800/60',
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin" />
        <div className="text-xs font-medium text-slate-500">Loading your creator dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-4">
        <div className="text-sm text-rose-600 font-bold">{error}</div>
        <Button variant="primary" size="sm" onClick={loadData}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4.25rem)] flex flex-col justify-between py-2 sm:py-3 px-3 sm:px-4 max-w-[1600px] mx-auto overflow-hidden">
      {/* 1. Compact Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 text-white p-3.5 sm:p-4 shadow-sm shrink-0">
        {/* Subtle background circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 right-40 w-36 h-36 rounded-full bg-indigo-400/20 blur-lg pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Left Text & Trajectory Button */}
          <div className="max-w-xl space-y-1.5">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-xs text-[10.5px] font-semibold text-violet-100 border border-white/20">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Live Overview &bull; Social Intelligence Studio</span>
            </div>

            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white leading-tight">
              Good afternoon, {user?.name?.split(' ')[0] || 'Alex'}
            </h1>

            <p className="text-xs text-violet-100/90 leading-snug">
              Here's your content velocity and audience momentum today across active channels.
            </p>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowTrajectorySlideOver(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-white text-indigo-700 hover:bg-violet-50 text-xs font-bold shadow-xs hover:shadow-sm transition cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5 text-indigo-600" />
                <span>30-Day Trajectory</span>
                <ArrowRight className="w-3 h-3 text-indigo-600" />
              </button>
            </div>
          </div>

          {/* Right: 3 Metric Floating Pills + Illustration */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="grid grid-cols-3 gap-2">
              {/* Total Views */}
              <div className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[92px]">
                <div className="text-[10px] text-violet-200 font-medium uppercase tracking-wider">
                  Total Views
                </div>
                <div className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                  {formatNumber(summary?.total_views || 0)}
                </div>
                <div className="text-[9px] text-emerald-300 font-semibold mt-0.5">
                  Active Data
                </div>
              </div>

              {/* Hit Rate */}
              <div className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[92px]">
                <div className="text-[10px] text-violet-200 font-medium uppercase tracking-wider">
                  Hit Rate
                </div>
                <div className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                  {summary?.breakout_hit_rate_percent || 0}%
                </div>
                <div className="text-[9px] text-amber-200 font-semibold mt-0.5">
                  Top 10% mark
                </div>
              </div>

              {/* Avg ER */}
              <div className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[92px]">
                <div className="text-[10px] text-violet-200 font-medium uppercase tracking-wider">
                  Avg ER
                </div>
                <div className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                  {summary?.avg_engagement_rate_percent || '0.0'}%
                </div>
                <div className="text-[9px] text-violet-200 font-semibold mt-0.5">
                  Benchmark
                </div>
              </div>
            </div>

            {/* Subtle Illustration */}
            <div className="hidden xl:block w-24 h-24 shrink-0 opacity-90">
              <img
                src={HeroIllustration}
                alt="CreatorPulse"
                className="w-full h-full object-contain filter drop-shadow-md"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. VibeCheck AI Strip */}
      <section className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-[#161D2B] border border-[#E8E6DF] dark:border-[#222B3D] shadow-xs shrink-0">
        <form onSubmit={handleVibeAnalyze} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex items-center space-x-2 pl-2 text-[#5B5BD6] dark:text-brand-300 shrink-0">
            <Zap className="w-4 h-4 fill-current" />
            <span className="text-xs font-bold text-[#1F2430] dark:text-white whitespace-nowrap">
              VibeCheck AI:
            </span>
          </div>

          <div className="flex-1 relative">
            <input
              type="text"
              value={vibeUrl}
              onChange={(e) => {
                setVibeUrl(e.target.value);
                if (urlError) setUrlError('');
              }}
              placeholder="Paste a YouTube, TikTok, or Instagram URL to scan sentiment & vibe..."
              className="w-full bg-[#FAF9F6] dark:bg-[#111622] border border-[#E8E6DF] dark:border-[#232B3E] rounded-xl px-3.5 py-2 text-xs text-[#1F2430] dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-violet-600 transition"
            />
            {urlError && (
              <span className="absolute -bottom-4 left-2 text-[10px] text-rose-500 font-medium">
                {urlError}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-xs hover:shadow-sm transition flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
          >
            <SearchCheck className="w-3.5 h-3.5" />
            <span>Analyze Vibe</span>
          </button>
        </form>
      </section>

      {/* 3. Quick Actions Grid (Full Width, 6 in ONE row on wide screens) */}
      <section className="space-y-2 shrink-0">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Quick Actions
            </h2>
            <span className="text-[11px] text-slate-400">&bull; One-click studio shortcuts</span>
          </div>
          <span className="text-[11px] text-violet-600 dark:text-violet-400 font-semibold hidden sm:inline">
            All 6 tools active
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.title}
                type="button"
                onClick={() => navigate(action.path)}
                className="group p-3 rounded-2xl bg-white dark:bg-[#161D2B] border border-[#E8E6DF] dark:border-[#222B3D] shadow-xs hover:shadow-soft hover:-translate-y-0.5 hover:border-violet-300 dark:hover:border-violet-800 transition-all text-left flex flex-col justify-between h-[84px] cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${action.accent}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-violet-600 dark:group-hover:text-violet-400 group-hover:translate-x-0.5 transition" />
                </div>

                <div className="min-w-0">
                  <div className="text-[12px] font-bold text-[#1F2430] dark:text-white leading-tight">
                    {action.title}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {action.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 30-Day Trajectory SlideOver */}
      <SlideOver
        isOpen={showTrajectorySlideOver}
        onClose={() => setShowTrajectorySlideOver(false)}
        title="30-Day Channel Trajectory"
        subtitle="Performance timeline and engagement velocity across your active channels"
      >
        <div className="space-y-6 p-2">
          {/* Key 4 Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-[11px] text-slate-500 font-medium">Total Views (30d)</div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                {formatNumber(summary?.total_views || 0)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-[11px] text-slate-500 font-medium">Avg Engagement Rate</div>
              <div className="text-xl font-extrabold text-violet-600 dark:text-violet-400 mt-1">
                {summary?.avg_engagement_rate_percent || 0}%
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-[11px] text-slate-500 font-medium">Total Likes</div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                {formatNumber(summary?.total_likes || 0)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-[11px] text-slate-500 font-medium">Breakout Hits</div>
              <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                {summary?.breakout_hit_rate_percent || 0}%
              </div>
            </div>
          </div>

          {/* Area Chart */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Views Velocity Timeline
            </h4>
            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={snapshots}>
                  <defs>
                    <linearGradient id="colorViewsTraj" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" tickFormatter={formatNumber} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#F8FAFC',
                      fontSize: '11px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#7C3AED"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorViewsTraj)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                setShowTrajectorySlideOver(false);
                navigate('/reports');
              }}
            >
              Open Full Reports & Analytics
            </Button>
          </div>
        </div>
      </SlideOver>
    </div>
  );
}
