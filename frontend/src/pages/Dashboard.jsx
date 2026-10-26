import React, { useState, useEffect } from 'react';
import { usePlatform } from '../context/PlatformContext';
import {
  getDashboardSummary,
  getSnapshots,
  getRecentPosts,
  getTopPosts,
  getBottomPosts,
} from '../api/apiClient';
import PlatformBadge from '../components/PlatformBadge';
import BreakoutBadge from '../components/BreakoutBadge';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SlideOver from '../components/ui/SlideOver';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import { CardSkeleton, TableSkeleton } from '../components/ui/Skeleton';
import Tooltip from '../components/ui/Tooltip';
import HeroIllustration from '../assets/illustrations/hero-creator.svg';
import {
  Users,
  Eye,
  Heart,
  Flame,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  Lightbulb,
  ArrowRight,
  Filter,
  CheckCircle2,
  Calendar,
  Share2,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  PenTool
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { selectedPlatform, lastRefreshed, refreshData } = usePlatform();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [topPosts, setTopPosts] = useState([]);
  const [bottomPosts, setBottomPosts] = useState([]);
  const [postTypeFilter, setPostTypeFilter] = useState('all');

  // Slide-over post inspect state
  const [activePost, setActivePost] = useState(null);

  const loadData = () => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      getDashboardSummary(selectedPlatform),
      getSnapshots(selectedPlatform, 30),
      getRecentPosts(selectedPlatform, postTypeFilter, 12),
      getTopPosts(selectedPlatform, 4),
      getBottomPosts(selectedPlatform, 4),
    ])
      .then(([sumRes, snapRes, postsRes, topRes, botRes]) => {
        if (!isMounted) return;
        setSummary(sumRes || {});
        setSnapshots((snapRes && snapRes.snapshots) || []);
        setRecentPosts((postsRes && postsRes.posts) || []);
        setTopPosts((topRes && topRes.posts) || []);
        setBottomPosts((botRes && botRes.posts) || []);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load your creator insights');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  };

  useEffect(() => {
    const cleanup = loadData();
    return cleanup;
  }, [selectedPlatform, postTypeFilter, lastRefreshed]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-44 rounded-3xl bg-white dark:bg-[#171D2B] animate-pulse border border-[#E8E6DF] dark:border-[#232B3E]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="h-72 rounded-2xl bg-white dark:bg-[#171D2B] animate-pulse border border-[#E8E6DF] dark:border-[#232B3E]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-[#171D2B] border border-rose-200 dark:border-rose-900/40 text-center space-y-4 shadow-soft">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#1F2430] dark:text-white">
          Could not load insights
        </h2>
        <p className="text-xs text-[#5B6475] dark:text-[#94A3B8] max-w-sm mx-auto">
          {error}. Make sure the backend API server is running on port 8000.
        </p>
        <Button variant="primary" size="sm" icon={RefreshCw} onClick={loadData}>
          Try Again
        </Button>
      </div>
    );
  }

  // Safe formatted chart data
  const chartData = (snapshots || []).map((s) => ({
    date: s?.date ? String(s.date).slice(5) : '',
    views: typeof s?.views === 'number' ? s.views : 0,
    er_percent: typeof s?.engagement_rate === 'number' ? Number((s.engagement_rate * 100).toFixed(2)) : 0,
  }));

  return (
    <div className="space-y-8">
      {/* Friendly Hero Banner with Local Illustration */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#EEF2FF] via-[#F5F3FF] to-[#FAF9F6] dark:from-[#171E30] dark:via-[#161B29] dark:to-[#121622] border border-[#DDD6FE] dark:border-[#2B354D] p-6 sm:p-8 shadow-soft">
        <div className="relative z-10 max-w-xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/80 dark:bg-[#1E273A] border border-brand-200 dark:border-brand-800 text-xs font-semibold text-[#5B5BD6] dark:text-brand-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome back, Alex! 👋</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F2430] dark:text-white">
            Your Creator Insights & Growth Loop
          </h1>

          <p className="text-sm text-[#5B6475] dark:text-[#94A3B8] leading-relaxed">
            Here is how your channels are performing this week. Test a new hook before publishing
            to see its estimated hit chance against your usual rate.
          </p>

          <div className="pt-2 flex flex-wrap gap-2.5">
            <Button
              variant="primary"
              size="sm"
              icon={Sparkles}
              onClick={() => navigate('/predictor')}
            >
              Predict a Post
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={PenTool}
              onClick={() => navigate('/studio')}
            >
              Open Studio
            </Button>
          </div>
        </div>

        {/* Hero Illustration */}
        <div className="hidden lg:block absolute right-4 -bottom-4 w-72 h-64 pointer-events-none select-none">
          <img
            src={HeroIllustration}
            alt="Friendly content creator with ideas and analytics"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* 4 Summary Cards (with Animated Counter) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Audience */}
        <Card className="p-5" hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5B6475] dark:text-[#94A3B8]">
              Total Audience
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#1F2430] dark:text-white mt-3">
            <AnimatedCounter value={summary?.total_followers || 0} />
          </div>
          <div className="flex items-center space-x-1 text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Monitored across {summary?.creators_monitored || 1} accounts</span>
          </div>
        </Card>

        {/* Content Views */}
        <Card className="p-5" hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5B6475] dark:text-[#94A3B8]">
              Content Views
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-[#5B5BD6] dark:text-brand-300 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#1F2430] dark:text-white mt-3">
            <AnimatedCounter
              value={summary?.total_views || 0}
              formatter={(v) =>
                v > 1000000 ? `${(v / 1000000).toFixed(1)}M` : Math.round(v).toLocaleString()
              }
            />
          </div>
          <div className="text-xs text-[#5B6475] dark:text-[#94A3B8] mt-1">
            Across {summary?.total_posts || 0} posts
          </div>
        </Card>

        {/* Usual Engagement Rate */}
        <Card className="p-5" hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5B6475] dark:text-[#94A3B8]">
              Usual Engagement
            </span>
            <div className="w-8 h-8 rounded-xl bg-pink-50 dark:bg-pink-950/50 text-pink-500 flex items-center justify-center">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#1F2430] dark:text-white mt-3">
            <AnimatedCounter
              value={(summary?.average_engagement_rate || 0) * 100}
              formatter={(v) => `${v.toFixed(1)}%`}
            />
          </div>
          <div className="text-xs text-[#5B6475] dark:text-[#94A3B8] mt-1">
            {summary?.total_engagements ? summary.total_engagements.toLocaleString() : '0'} total reactions
          </div>
        </Card>

        {/* Hit Posts */}
        <Card variant="tintedIndigo" className="p-5" hoverEffect>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <span className="text-xs font-bold text-[#5B5BD6] dark:text-brand-300">
                Hit Posts
              </span>
              <Tooltip text="Posts that reached the top 10% engagement tier compared to your usual average." showIcon />
            </div>
            <div className="w-8 h-8 rounded-xl bg-[#5B5BD6] text-white flex items-center justify-center shadow-xs">
              <Flame className="w-4 h-4 fill-white" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#5B5BD6] dark:text-brand-200 mt-3">
            <AnimatedCounter
              value={(summary?.breakout_rate || 0) * 100}
              formatter={(v) => `${v.toFixed(1)}%`}
            />
          </div>
          <div className="text-xs text-[#5B6475] dark:text-brand-300/80 mt-1 font-medium">
            {summary?.breakout_count || 0} posts hit the top tier
          </div>
        </Card>
      </div>

      {/* "What to do today" Suggestions Card */}
      <Card variant="tintedTeal" className="p-5 sm:p-6 border-teal-200 dark:border-teal-900/40">
        <div className="flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-soft">
            <Lightbulb className="w-5 h-5 fill-white" />
          </div>
          <div className="space-y-3 flex-1 min-w-0">
            <div>
              <h2 className="text-base font-bold text-[#1F2430] dark:text-white">
                What to do today (Creator Suggestions)
              </h2>
              <p className="text-xs text-[#5B6475] dark:text-[#94A3B8] mt-0.5">
                Friendly algorithmic cues to give your content the best opportunity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-white/80 dark:bg-[#17212E] border border-teal-100 dark:border-teal-900/30 text-xs space-y-1">
                <span className="font-bold text-teal-800 dark:text-teal-300 block">
                  1. Best Posting Window
                </span>
                <p className="text-[#5B6475] dark:text-[#94A3B8]">
                  Thursday between 5:00 PM – 7:00 PM historically yields +24% higher early watch-time.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/80 dark:bg-[#17212E] border border-teal-100 dark:border-teal-900/30 text-xs space-y-1">
                <span className="font-bold text-teal-800 dark:text-teal-300 block">
                  2. Trending Angle to Catch
                </span>
                <p className="text-[#5B6475] dark:text-[#94A3B8]">
                  "Cursor AI Fullstack Build" is accelerating (+84% velocity). Turn it into a concept.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/80 dark:bg-[#17212E] border border-teal-100 dark:border-teal-900/30 text-xs space-y-1">
                <span className="font-bold text-teal-800 dark:text-teal-300 block">
                  3. Community Fuel
                </span>
                <p className="text-[#5B6475] dark:text-[#94A3B8]">
                  Viewers repeatedly asked how to profile memory in production. Great short post topic!
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Engagement Trajectory Chart */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
          <div>
            <h2 className="text-base font-bold text-[#1F2430] dark:text-white flex items-center space-x-2">
              <span>Views & Engagement Trajectory</span>
              <Tooltip text="Daily snapshot of views and engagement over the past 30 days." showIcon />
            </h2>
            <p className="text-xs text-[#5B6475] dark:text-[#94A3B8] mt-0.5">
              30-day historical activity curve
            </p>
          </div>
          <div className="flex items-center space-x-4 text-xs font-medium">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-[#5B5BD6] inline-block"></span>
              <span className="text-[#5B6475] dark:text-[#94A3B8]">Views</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-[#14B8A6] inline-block"></span>
              <span className="text-[#5B6475] dark:text-[#94A3B8]">Engagement %</span>
            </div>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5B5BD6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#5B5BD6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} opacity={0.6} />
              <XAxis dataKey="date" stroke="#94A3B8" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" stroke="#94A3B8" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#14B8A6" tick={{ fontSize: 11 }} unit="%" />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E8E6DF',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  boxShadow: '0 4px 20px -2px rgba(0,0,0,0.06)',
                }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="views"
                stroke="#5B5BD6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#viewsGrad)"
                name="Views"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Top vs Bottom Posts Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Hit Posts */}
        <Card className="p-5">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#EFECE6] dark:border-[#232B3E] mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center">
                <Flame className="w-4 h-4 fill-current" />
              </div>
              <h3 className="text-sm font-bold text-[#1F2430] dark:text-white">
                Top Hit Posts (What Worked)
              </h3>
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              Highest engagement
            </span>
          </div>

          <div className="space-y-3">
            {topPosts.map((post) => (
              <div
                key={post.post_id}
                onClick={() => setActivePost(post)}
                className="p-3.5 rounded-xl bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-soft transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <PlatformBadge platform={post.platform} />
                  <BreakoutBadge isBreakout={post.is_breakout} />
                </div>
                <h4 className="text-xs font-semibold text-[#1F2430] dark:text-white line-clamp-2">
                  {post.title}
                </h4>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#EFECE6] dark:border-[#1E2536] text-[11px] text-[#5B6475] dark:text-[#94A3B8]">
                  <span>{post.views ? post.views.toLocaleString() : '0'} views</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {post.engagement_rate ? (post.engagement_rate * 100).toFixed(1) : '0.0'}% ER
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Lower Engagement Posts */}
        <Card className="p-5">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#EFECE6] dark:border-[#232B3E] mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#1F2430] dark:text-white">
                Usual Pace Posts (Room to Grow)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Standard baseline</span>
          </div>

          <div className="space-y-3">
            {bottomPosts.map((post) => (
              <div
                key={post.post_id}
                onClick={() => setActivePost(post)}
                className="p-3.5 rounded-xl bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-soft transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <PlatformBadge platform={post.platform} />
                  <span className="text-[10px] text-slate-400 font-mono capitalize">
                    {post.post_type}
                  </span>
                </div>
                <h4 className="text-xs font-medium text-[#5B6475] dark:text-[#94A3B8] line-clamp-2">
                  {post.title}
                </h4>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#EFECE6] dark:border-[#1E2536] text-[11px] text-[#5B6475] dark:text-[#94A3B8]">
                  <span>{post.views ? post.views.toLocaleString() : '0'} views</span>
                  <span>{post.engagement_rate ? (post.engagement_rate * 100).toFixed(2) : '0.00'}% ER</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Posts Stream Table */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <div>
            <h2 className="text-base font-bold text-[#1F2430] dark:text-white">
              Recent Content Stream
            </h2>
            <p className="text-xs text-[#5B6475] dark:text-[#94A3B8] mt-0.5">
              Click any row to open post details and inspect engagement drivers
            </p>
          </div>

          {/* Format Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={postTypeFilter}
              onChange={(e) => setPostTypeFilter(e.target.value)}
              className="bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] rounded-xl px-3 py-1.5 text-xs text-[#1F2430] dark:text-white focus:outline-none focus:border-brand-500"
            >
              <option value="all">All Formats</option>
              <option value="long_video">Long Video</option>
              <option value="short">Shorts / Reels</option>
              <option value="thread">Threads</option>
              <option value="story_post">Story Posts</option>
              <option value="carousel">Carousels</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#EFECE6] dark:border-[#232B3E] text-[#858D9D] dark:text-[#64748B] uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Platform</th>
                <th className="py-3 px-3">Post Title</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3 text-right">Views</th>
                <th className="py-3 px-3 text-right">Likes</th>
                <th className="py-3 px-3 text-right">Engagement</th>
                <th className="py-3 px-3 text-center">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFECE6] dark:divide-[#232B3E]">
              {recentPosts.map((post) => (
                <tr
                  key={post.post_id}
                  onClick={() => setActivePost(post)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer"
                >
                  <td className="py-3 px-3 whitespace-nowrap">
                    <PlatformBadge platform={post.platform} size="sm" />
                  </td>
                  <td className="py-3 px-3 font-medium text-[#1F2430] dark:text-white max-w-xs truncate">
                    {post.title}
                  </td>
                  <td className="py-3 px-3 text-[#5B6475] dark:text-[#94A3B8] whitespace-nowrap capitalize">
                    {post.post_type}
                  </td>
                  <td className="py-3 px-3 text-right text-[#1F2430] dark:text-white font-mono">
                    {post.views ? post.views.toLocaleString() : '0'}
                  </td>
                  <td className="py-3 px-3 text-right text-[#5B6475] dark:text-[#94A3B8] font-mono">
                    {post.likes ? post.likes.toLocaleString() : '0'}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-[#5B5BD6] dark:text-brand-300 font-mono">
                    {post.engagement_rate ? (post.engagement_rate * 100).toFixed(2) : '0.00'}%
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <BreakoutBadge isBreakout={post.is_breakout} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Slide-over Post Inspection Panel */}
      <SlideOver
        isOpen={Boolean(activePost)}
        onClose={() => setActivePost(null)}
        title={activePost?.title}
        subtitle={`${activePost?.platform?.toUpperCase()} • Published on ${activePost?.published_at?.slice(0, 10)}`}
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" size="sm" onClick={() => setActivePost(null)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Sparkles}
              onClick={() => {
                const topicParam = encodeURIComponent(activePost?.title || '');
                const platParam = activePost?.platform || 'youtube';
                setActivePost(null);
                navigate(`/studio?topic=${topicParam}&platform=${platParam}`);
              }}
            >
              Draft Similar in Studio
            </Button>
          </div>
        }
      >
        {activePost && (
          <div className="space-y-6 text-sm">
            {/* Badges */}
            <div className="flex items-center justify-between">
              <PlatformBadge platform={activePost.platform} />
              <BreakoutBadge isBreakout={activePost.is_breakout} />
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E]">
                <div className="text-xs text-[#5B6475] dark:text-[#94A3B8]">Total Views</div>
                <div className="text-xl font-extrabold text-[#1F2430] dark:text-white mt-1">
                  {activePost.views ? activePost.views.toLocaleString() : '0'}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E]">
                <div className="text-xs text-[#5B6475] dark:text-[#94A3B8]">Engagement Rate</div>
                <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {activePost.engagement_rate ? (activePost.engagement_rate * 100).toFixed(2) : '0.00'}%
                </div>
              </div>
            </div>

            {/* Interaction Breakdown */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#1A2333] border border-[#E8E6DF] dark:border-[#232B3E] space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B6475] dark:text-[#94A3B8]">
                Audience Interactions
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xs text-slate-400">Likes</div>
                  <div className="font-bold text-[#1F2430] dark:text-white mt-0.5">
                    {activePost.likes ? activePost.likes.toLocaleString() : '0'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Comments</div>
                  <div className="font-bold text-[#1F2430] dark:text-white mt-0.5">
                    {activePost.comments ? activePost.comments.toLocaleString() : '0'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Shares</div>
                  <div className="font-bold text-[#1F2430] dark:text-white mt-0.5">
                    {activePost.shares ? activePost.shares.toLocaleString() : '0'}
                  </div>
                </div>
              </div>
            </div>

            {/* What Worked / Key Learning */}
            <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 text-xs text-[#313083] dark:text-brand-300 space-y-2">
              <div className="flex items-center space-x-1.5 font-bold">
                <Sparkles className="w-4 h-4 text-[#5B5BD6]" />
                <span>What worked for this post</span>
              </div>
              <p className="leading-relaxed">
                {activePost.is_breakout
                  ? 'Strong title curiosity gap paired with an optimal release time drove above-average initial retention, propelling this post into your top decile.'
                  : 'Standard performance. Consider sharpening the first 3 seconds of the hook or testing a punchier contrarian premise next time.'}
              </p>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}
