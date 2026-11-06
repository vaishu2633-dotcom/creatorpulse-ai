import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlatform } from '../context/PlatformContext';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import {
  getDashboardSummary,
  getSnapshots,
  getRecentPosts,
  getTopPosts,
  getBottomPosts,
} from '../api/apiClient';
import { getSampleThumbnail } from '../assets/sample/sampleThumbnails';
import PlatformBadge from '../components/PlatformBadge';
import Card from '../components/ui/Card';
import SlideOver from '../components/ui/SlideOver';
import Button from '../components/ui/Button';
import HeroIllustration from '../assets/illustrations/hero-creator.svg';
import { formatIsoDateTime } from '../utils/timeFormat';
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
  Activity,
  ChevronRight,
  Filter
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

function getDurationBadge(postType, index = 0) {
  if (postType === 'video' || postType === 'long_video') {
    const times = ['8:24', '12:15', '16:40', '6:50', '10:12'];
    return times[index % times.length];
  }
  if (postType === 'reel' || postType === 'short') {
    const times = ['0:45', '0:58', '0:32', '1:00', '0:24'];
    return times[index % times.length];
  }
  if (postType === 'carousel') return '5 slides';
  if (postType === 'thread' || postType === 'tweet') return '7 posts';
  return '3 min';
}

function getTimeAgo(dateStr, idx = 0) {
  if (!dateStr) return `${idx + 1}d ago`;
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.round((now - d) / (1000 * 60 * 60));
    if (diffHours < 24) return `${Math.max(diffHours, 1)}h ago`;
    const diffDays = Math.round(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return `${Math.round(diffDays / 7)}w ago`;
  } catch {
    return `${idx + 1}d ago`;
  }
}

const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return Number(num).toLocaleString();
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { selectedPlatform, activeDataSource } = usePlatform();
  const { user } = useUser();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [activePost, setActivePost] = useState(null);
  const [showTrajectorySlideOver, setShowTrajectorySlideOver] = useState(false);

  // Time range, tabs, sorting for Recent Activity
  const [timeRange, setTimeRange] = useState('all'); // 'all' | '90' | '30' | '7'
  const [activityTab, setActivityTab] = useState('recent'); // 'recent' | 'top' | 'bottom'
  const [sortBy, setSortBy] = useState('published_at'); // 'published_at' | 'views' | 'engagement_rate'

  // VibeCheck URL input state
  const [vibeUrl, setVibeUrl] = useState('');
  const [urlError, setUrlError] = useState('');

  const loadData = () => {
    setLoading(true);
    setError(null);
    const daysParam = timeRange === 'all' ? null : parseInt(timeRange, 10);

    let postsPromise;
    if (activityTab === 'top') {
      postsPromise = getTopPosts(selectedPlatform, daysParam, 20);
    } else if (activityTab === 'bottom') {
      postsPromise = getBottomPosts(selectedPlatform, daysParam, 20);
    } else {
      postsPromise = getRecentPosts(selectedPlatform, 'all', 20, sortBy, true, daysParam);
    }

    Promise.all([
      getDashboardSummary(selectedPlatform, daysParam),
      getSnapshots(selectedPlatform, daysParam || 30),
      postsPromise,
    ])
      .then(([sumRes, snapRes, postsRes]) => {
        setSummary(sumRes || {});
        setSnapshots((snapRes && snapRes.snapshots) || []);
        setRecentPosts((postsRes && postsRes.posts) || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load dashboard data');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [selectedPlatform, timeRange, activityTab, sortBy]);

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

  const baselineEngagement = summary?.average_engagement_rate || 0.052;
  const avgViews = summary?.total_views && summary?.total_posts ? (summary.total_views / summary.total_posts) : 15000;

  const getPostStatus = (post) => {
    const er = post.engagement_rate || 0;
    const views = post.views || 0;

    if (er >= 1.2 * baselineEngagement) {
      return {
        label: 'Performing Well',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
      };
    }
    if (views >= 1.3 * avgViews && er >= 1.0 * baselineEngagement) {
      return {
        label: 'Trending',
        color: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800',
      };
    }
    if (er < 0.8 * baselineEngagement) {
      return {
        label: 'Needs Attention',
        color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
      };
    }
    return {
      label: 'On Track',
      color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    };
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
      path: '/studio?tab=trends',
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
      path: '/studio?tab=calendar',
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

  if (loading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin" />
        <div className="text-xs font-medium text-slate-500">Loading your creator dashboard...</div>
      </div>
    );
  }

  if (error && !summary) {
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
    <div className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* 1. Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 text-white p-4 sm:p-5 shadow-sm">
        {/* Subtle background circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 right-40 w-36 h-36 rounded-full bg-indigo-400/20 blur-lg pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left Text & Trajectory Button */}
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-xs text-[10.5px] font-semibold text-violet-100 border border-white/20">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Live Overview &bull; Social Intelligence Studio</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-tight">
              Good afternoon, {user?.name?.split(' ')[0] || 'Alex'}
            </h1>

            <p className="text-xs sm:text-sm text-violet-100/90 leading-snug">
              Here's your content velocity and audience momentum today across active channels.
            </p>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowTrajectorySlideOver(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white text-indigo-700 hover:bg-violet-50 text-xs font-bold shadow-xs hover:shadow-sm transition cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5 text-indigo-600" />
                <span>30-Day Trajectory</span>
                <ArrowRight className="w-3 h-3 text-indigo-600" />
              </button>
            </div>
          </div>

          {/* Right: Floating Metrics Cards */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {/* Total Views */}
              <div className="px-3.5 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[96px]">
                <div className="text-[10px] text-violet-200 font-medium uppercase tracking-wider">
                  Total views
                </div>
                <div className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                  {formatNumber(summary?.total_views || 0)} views
                </div>
                <div className="text-[9px] text-emerald-300 font-semibold mt-0.5">
                  Active Data
                </div>
              </div>

              {/* Breakout Rate */}
              <div className="px-3.5 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[96px]">
                <div className="text-[10px] text-violet-200 font-medium uppercase tracking-wider">
                  Breakout Rate
                </div>
                <div className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                  {summary?.breakout_hit_rate_percent ?? (summary?.breakout_rate != null ? (summary.breakout_rate * 100).toFixed(1) : '9.8')}%
                </div>
                <div className="text-[9px] text-amber-200 font-semibold mt-0.5">
                  Top 10% mark
                </div>
              </div>

              {/* Avg ER */}
              <div className="px-3.5 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[96px]">
                <div className="text-[10px] text-violet-200 font-medium uppercase tracking-wider">
                  Avg ER
                </div>
                <div className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                  {summary?.avg_engagement_rate_percent ?? (summary?.average_engagement_rate != null ? (summary.average_engagement_rate * 100).toFixed(1) : '8.6')}%
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
      <section className="p-3 rounded-2xl bg-white dark:bg-[#161D2B] border border-[#E8E6DF] dark:border-[#222B3D] shadow-xs">
        <form onSubmit={handleVibeAnalyze} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
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

      {/* 3. Quick Actions Grid */}
      <section className="space-y-2">
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

      {/* 4. Recent Activity Section */}
      <section>
        <Card className="p-4 sm:p-5 rounded-2xl border border-violet-100 dark:border-slate-800 shadow-xs bg-white dark:bg-[#131927]">
          {/* Header with Activity Tabs, Date Filter, and Sorting */}
          <div className="pb-3 mb-2 border-b border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-none">
                    {activityTab === 'recent' ? 'Recent Activity' : activityTab === 'top' ? 'Top Hits' : 'Bottom'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {summary?.total_posts || 0} posts &bull; {formatNumber(summary?.total_views || 0)} views &bull; {summary?.avg_engagement_rate_percent || '0.0'}% ER
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowTrajectorySlideOver(true)}
                  className="text-xs font-semibold text-slate-500 hover:text-violet-600 flex items-center gap-1 transition"
                  title="View analytics trajectory"
                >
                  <LineChart className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Velocity Timeline</span>
                </button>
                <button
                  onClick={() => navigate('/reports')}
                  className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 flex items-center gap-0.5"
                >
                  <span>View full reports</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Sub-bar: Activity View Tabs + Time Filter Pills + Sort Option */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
              {/* Tabs: Recent / Top Hits / Bottom */}
              <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700">
                <button
                  onClick={() => setActivityTab('recent')}
                  className={`px-3 py-1 rounded-md font-semibold transition ${
                    activityTab === 'recent'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  Recent Activity
                </button>
                <button
                  onClick={() => setActivityTab('top')}
                  className={`px-3 py-1 rounded-md font-semibold transition ${
                    activityTab === 'top'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  Top Hits
                </button>
                <button
                  onClick={() => setActivityTab('bottom')}
                  className={`px-3 py-1 rounded-md font-semibold transition ${
                    activityTab === 'bottom'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  Bottom
                </button>
              </div>

              {/* Right controls: Date Filter pills & Sort */}
              <div className="flex items-center space-x-2 ml-auto">
                {/* Time Range Pills: 7d, 30d, All */}
                <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700">
                  {[
                    { id: '7', label: '7d' },
                    { id: '30', label: '30d' },
                    { id: 'all', label: 'All' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTimeRange(t.id)}
                      className={`px-2.5 py-1 rounded-md font-semibold transition ${
                        timeRange === t.id
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="published_at">Newest First</option>
                  <option value="views">Most Views</option>
                  <option value="engagement_rate">Highest Engagement</option>
                </select>
              </div>
            </div>
          </div>

          {/* Rows Container */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {recentPosts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No posts found for this filter combination.
              </div>
            ) : (
              recentPosts.slice(0, 8).map((post, idx) => {
                const status = getPostStatus(post);
                const duration = getDurationBadge(post.post_type, idx);
                const timeAgo = getTimeAgo(post.published_at, idx);
                const thumb = getSampleThumbnail(idx, post.post_type);

                return (
                  <div
                    key={post.post_id || idx}
                    className="py-2.5 flex items-center justify-between gap-3 group hover:bg-slate-50/70 dark:hover:bg-slate-800/40 px-2 rounded-xl transition"
                  >
                    {/* Thumbnail + info */}
                    <div
                      onClick={() => setActivePost(post)}
                      className="flex items-center space-x-3 min-w-0 cursor-pointer flex-1"
                    >
                      <div className="relative w-16 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-900 border border-slate-200/80 dark:border-slate-700">
                        <img
                          src={thumb}
                          alt={post.caption || 'Post thumbnail'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/85 text-white font-mono text-[8.5px] font-bold">
                          {duration}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <PlatformBadge platform={post.platform} size="sm" showLabel={false} />
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate group-hover:text-violet-600 transition">
                            {post.caption || post.title || 'Untitled Post'}
                          </h4>
                        </div>
                        <div className="flex items-center space-x-2 text-[10.5px] text-slate-400">
                          <span>{timeAgo}</span>
                          <span>&bull;</span>
                          <span>{formatNumber(post.views)} views</span>
                        </div>
                      </div>
                    </div>

                    {/* Right metrics + badges */}
                    <div className="flex items-center space-x-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {((post.engagement_rate || 0) * 100).toFixed(1)}% ER
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {formatNumber(post.likes)} likes
                        </div>
                      </div>

                      <span
                        className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${status.color}`}
                      >
                        {status.label}
                      </span>

                      {post.is_breakout && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 text-[9px] font-bold">
                          Breakout
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </section>

      {/* 30-Day Trajectory SlideOver */}
      <SlideOver
        open={showTrajectorySlideOver}
        onClose={() => setShowTrajectorySlideOver(false)}
        title="Channel Performance & Trajectory"
      >
        <div className="space-y-6 p-2">
          {/* Key 4 Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-[11px] text-slate-500 font-medium">Total Views</div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                {(summary?.total_views || 0).toLocaleString()}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-[11px] text-slate-500 font-medium">Engagements</div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                {(summary?.total_engagements || 0).toLocaleString()}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-[11px] text-slate-500 font-medium">Avg Engagement</div>
              <div className="text-xl font-extrabold text-violet-600 dark:text-violet-400 mt-1">
                {((summary?.average_engagement_rate || 0) * 100).toFixed(2)}%
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-[11px] text-slate-500 font-medium">Breakout Hits</div>
              <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                {summary?.breakout_count || 0} / {summary?.total_posts || 0}
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

      {/* Post SlideOver Inspection */}
      <SlideOver
        open={Boolean(activePost)}
        onClose={() => setActivePost(null)}
        title={activePost?.caption || activePost?.title || 'Post Details'}
      >
        {activePost && (
          <div className="space-y-5 p-2">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <PlatformBadge platform={activePost.platform} />
                <span className="text-xs text-slate-500 font-mono">
                  {formatIsoDateTime(activePost.published_at)}
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {activePost.caption || activePost.title}
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-400">Total Views</div>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {formatNumber(activePost.views)}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-400">Engagement Rate</div>
                <div className="text-base font-bold text-emerald-600 mt-0.5">
                  {((activePost.engagement_rate || 0) * 100).toFixed(2)}%
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-400">Likes</div>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {formatNumber(activePost.likes)}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-400">Comments</div>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {formatNumber(activePost.comments)}
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-2.5">
              <button
                onClick={() => {
                  setActivePost(null);
                  navigate('/predictor');
                }}
                className="flex-1 rounded-xl text-xs font-semibold py-2 bg-violet-600 text-white hover:bg-violet-700 transition"
              >
                Predict Again
              </button>
              <button
                onClick={() => {
                  const topic = activePost.caption || activePost.title || '';
                  setActivePost(null);
                  navigate(`/studio?topic=${encodeURIComponent(topic)}`);
                }}
                className="flex-1 rounded-xl text-xs font-semibold py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition"
              >
                Turn Into Idea
              </button>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}
