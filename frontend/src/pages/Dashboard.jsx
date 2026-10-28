import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { usePlatform } from '../context/PlatformContext';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import {
  getDashboardSummary,
  getSnapshots,
  getRecentPosts,
} from '../api/apiClient';
import { getSampleThumbnail } from '../assets/sample/sampleThumbnails';
import PlatformBadge from '../components/PlatformBadge';
import Card from '../components/ui/Card';
import SlideOver from '../components/ui/SlideOver';
import Tooltip from '../components/ui/Tooltip';
import HeroIllustration from '../assets/illustrations/hero-creator.svg';
import { formatIsoDateTime } from '../utils/timeFormat';
import {
  Sparkles,
  ArrowRight,
  PenTool,
  Link as LinkIcon,
  Zap,
  Rocket,
  SearchCheck,
  TrendingUp,
  Compass,
  Calendar,
  BarChart3,
  Lightbulb,
  Play,
  MoreVertical,
  Copy,
  ChevronRight,
  Eye,
  Heart,
  MessageSquare,
  LineChart,
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

export default function Dashboard() {
  const navigate = useNavigate();
  const { selectedPlatform } = usePlatform();
  const { user } = useUser();
  const { addToast } = useToast();
  const shouldReduceMotion = useReducedMotion();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [activePost, setActivePost] = useState(null);
  const [showTrajectorySlideOver, setShowTrajectorySlideOver] = useState(false);

  // VibeCheck URL state
  const [vibeUrl, setVibeUrl] = useState('');
  const [urlError, setUrlError] = useState('');

  // Kebab menu state
  const [openKebab, setOpenKebab] = useState(null);
  const kebabRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (kebabRef.current && !kebabRef.current.contains(event.target)) {
        setOpenKebab(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      getDashboardSummary(selectedPlatform),
      getSnapshots(selectedPlatform, 30),
      getRecentPosts(selectedPlatform, 'all', 15),
    ])
      .then(([sumRes, snapRes, postsRes]) => {
        setSummary(sumRes || {});
        setSnapshots((snapRes && snapRes.snapshots) || []);
        setRecentPosts((postsRes && postsRes.posts) || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load creator insights');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [selectedPlatform]);

  // Baseline metrics for computed status chips
  const baselineEngagement = summary?.average_engagement_rate || 0.052;
  const avgViews = summary?.total_views && summary?.total_posts ? (summary.total_views / summary.total_posts) : 15000;

  const getPostStatus = (post) => {
    const er = post.engagement_rate || 0;
    const views = post.views || 0;

    if (er >= 1.2 * baselineEngagement) {
      return {
        label: 'Performing Well',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
        tooltip: `Performing Well: engagement (${(er * 100).toFixed(1)}%) is above 120% of your channel average (${(baselineEngagement * 100).toFixed(1)}%).`,
      };
    }
    if (views >= 1.3 * avgViews && er >= 1.0 * baselineEngagement) {
      return {
        label: 'Trending',
        color: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800',
        tooltip: `Trending: views (${views.toLocaleString()}) are 130%+ of your channel average (${Math.round(avgViews).toLocaleString()}).`,
      };
    }
    if (er >= 0.8 * baselineEngagement) {
      return {
        label: 'Stable',
        color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
        tooltip: `Stable: engagement (${(er * 100).toFixed(1)}%) is within standard range (80%-120% of baseline ${(baselineEngagement * 100).toFixed(1)}%).`,
      };
    }
    return {
      label: 'Below usual',
      color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
      tooltip: `Below usual: engagement (${(er * 100).toFixed(1)}%) is under 80% of your channel baseline (${(baselineEngagement * 100).toFixed(1)}%).`,
    };
  };

  const handleVibeCheckSubmit = (e) => {
    e.preventDefault();
    setUrlError('');
    const trimmed = vibeUrl.trim();

    if (!trimmed) {
      setUrlError('Please paste a public video, Reel, or Short URL.');
      return;
    }

    const validPatterns = [
      /youtube\.com/i,
      /youtu\.be/i,
      /instagram\.com/i,
      /tiktok\.com/i,
      /twitter\.com/i,
      /x\.com/i,
      /vimeo\.com/i,
      /^https?:\/\//i,
    ];

    if (!validPatterns.some((pattern) => pattern.test(trimmed))) {
      setUrlError('Please enter a valid URL (YouTube, Instagram, TikTok, or X).');
      return;
    }

    navigate(`/vibecheck?url=${encodeURIComponent(trimmed)}&auto=true`);
  };

  const quickActions = [
    {
      id: 'vibecheck',
      title: 'Analyze URL',
      subtitle: 'VibeCheck AI',
      icon: SearchCheck,
      highlight: true,
      onClick: () => navigate('/vibecheck'),
    },
    {
      id: 'studio',
      title: 'Generate Content',
      subtitle: 'AI Content Studio',
      icon: PenTool,
      onClick: () => navigate('/studio'),
    },
    {
      id: 'trends',
      title: 'Check Trends',
      subtitle: 'Trend Explorer',
      icon: Compass,
      onClick: () => navigate('/trends'),
    },
    {
      id: 'predict',
      title: 'Predict Performance',
      subtitle: 'Post Predictor',
      icon: Sparkles,
      onClick: () => navigate('/predictor'),
    },
    {
      id: 'calendar',
      title: 'View Calendar',
      subtitle: 'Content Planner',
      icon: Calendar,
      onClick: () => navigate('/drafts'),
    },
    {
      id: 'reports',
      title: 'Open Reports',
      subtitle: 'Analytics & Insights',
      icon: BarChart3,
      onClick: () => navigate('/results'),
    },
  ];

  return (
    <div className="h-full flex flex-col min-h-0 gap-2 sm:gap-2.5 lg:gap-3 xl:gap-3.5">
      {/* 1. HERO BANNER (Compact clamp height 150px-205px) */}
      <section className="shrink-0 relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-50/90 via-indigo-50/60 to-purple-50/80 dark:from-violet-950/20 dark:via-indigo-950/20 dark:to-slate-900 border border-violet-100 dark:border-violet-900/40 p-3 sm:p-3.5 lg:p-4 shadow-xs h-[clamp(145px,22vh,200px)] flex items-center">
        <div className="flex items-center justify-between w-full h-full gap-4">
          {/* Left Text & Buttons */}
          <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-white/90 dark:bg-slate-800/90 border border-violet-200/80 dark:border-violet-800/60 shadow-2xs">
                <Sparkles className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                <span className="text-[10.5px] font-bold text-violet-900 dark:text-violet-200">
                  Welcome back, {user.name ? user.name.split(' ')[0] : 'Alex'}!
                </span>
              </div>

              <h1 className="text-[clamp(1.25rem,2.1vw,1.85rem)] font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mt-1">
                Your Creator Insights &{' '}
                <span className="bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Growth Loop
                </span>
              </h1>

              <p className="text-[11.5px] sm:text-xs text-slate-600 dark:text-slate-300 max-w-xl line-clamp-1 sm:line-clamp-2 leading-relaxed mt-0.5">
                Track performance, predict what's next, create better content and grow faster, all in one place.
              </p>
            </div>

            {/* Buttons on ONE line */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                onClick={() => navigate('/predictor')}
                className="inline-flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-xs shadow-xs hover:shadow-md transition"
              >
                <span>Predict a Post</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>

              <button
                onClick={() => navigate('/studio')}
                className="inline-flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 rounded-xl border border-violet-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs shadow-2xs hover:bg-white transition"
              >
                <PenTool className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                <span>Open Studio</span>
              </button>
            </div>
          </div>

          {/* Right Illustration with gentle bobbing floating cards */}
          <div className="hidden md:flex relative items-center justify-center shrink-0 h-full max-h-[160px] lg:max-h-[185px] w-[260px] lg:w-[320px]">
            <img
              src={HeroIllustration}
              alt="Creator workspace illustration"
              className="h-full w-full object-contain drop-shadow-2xs select-none"
            />

            {/* Floating Card 1: Grow Faster */}
            <motion.div
              animate={shouldReduceMotion ? {} : { y: [0, -4, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              className="hidden xl:flex absolute -top-1 left-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-xl p-1.5 border border-slate-200/80 dark:border-slate-700 shadow-xs items-center space-x-1.5 z-10"
            >
              <div className="w-5 h-5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-3 h-3" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-800 dark:text-white leading-none">
                  Grow Faster
                </div>
                <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Track your growth
                </div>
              </div>
            </motion.div>

            {/* Floating Card 2: Create Better */}
            <motion.div
              animate={shouldReduceMotion ? {} : { y: [0, 5, 0] }}
              transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
              className="hidden xl:flex absolute -top-1.5 right-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-xl p-1.5 border border-slate-200/80 dark:border-slate-700 shadow-xs items-center space-x-1.5 z-10"
            >
              <div className="w-5 h-5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                <Lightbulb className="w-3 h-3" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-800 dark:text-white leading-none">
                  Create Better
                </div>
                <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Get content ideas
                </div>
              </div>
            </motion.div>

            {/* Floating Card 3: More Reach */}
            <motion.div
              animate={shouldReduceMotion ? {} : { y: [0, -4, 0] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
              className="hidden xl:flex absolute bottom-0 left-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-xl p-1.5 border border-slate-200/80 dark:border-slate-700 shadow-xs items-center space-x-1.5 z-10"
            >
              <div className="w-5 h-5 rounded-md bg-violet-50 dark:bg-violet-950/60 text-violet-600 flex items-center justify-center">
                <Play className="w-3 h-3 fill-violet-600" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-800 dark:text-white leading-none">
                  More Reach
                </div>
                <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Spot rising trends
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. VIBECHECK AI STRIP (One row, ~88px tall) */}
      <section className="shrink-0 rounded-2xl border border-violet-100 dark:border-slate-800 shadow-xs bg-white dark:bg-[#131927] p-2.5 sm:p-3 lg:p-3 flex items-center justify-between gap-3 min-h-[76px] lg:h-[86px]">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Waveform Icon */}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <SearchCheck className="w-4 h-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-extrabold text-xs text-slate-900 dark:text-white shrink-0">
                VibeCheck AI
              </span>
              <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border border-violet-200 shrink-0">
                New
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden md:inline">
                Analyze viewer sentiment, tone distribution, and audience questions on any video or reel.
              </span>
            </div>

            {/* Input + Button + Quick Chips */}
            <form onSubmit={handleVibeCheckSubmit} className="flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={vibeUrl}
                  onChange={(e) => {
                    setVibeUrl(e.target.value);
                    if (urlError) setUrlError('');
                  }}
                  placeholder="Paste a public Reel, Short, or video URL..."
                  className="w-full pl-8 pr-3 py-1.5 h-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/30 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="h-8 whitespace-nowrap px-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs hover:shadow-md transition shrink-0"
              >
                <span>Analyze Vibe</span>
                <ArrowRight className="w-3 h-3" />
              </button>

              <div className="hidden lg:flex items-center gap-1 text-[10.5px] text-slate-400 shrink-0 pl-1">
                <button
                  type="button"
                  onClick={() => setVibeUrl('https://www.youtube.com/watch?v=sample_video')}
                  className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-violet-600 transition"
                >
                  YouTube
                </button>
                <button
                  type="button"
                  onClick={() => setVibeUrl('https://www.instagram.com/reel/sample_reel')}
                  className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-violet-600 transition"
                >
                  Instagram
                </button>
                <button
                  type="button"
                  onClick={() => setVibeUrl('https://www.tiktok.com/@creator/video/sample')}
                  className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-violet-600 transition"
                >
                  TikTok
                </button>
                <span className="text-[10px] text-slate-400">+ more</span>
              </div>
            </form>
            {urlError && (
              <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium mt-0.5">
                {urlError}
              </p>
            )}
          </div>
        </div>

        {/* Right card: only above 1400px width */}
        <div className="hidden 2xl:flex bg-violet-50/70 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40 rounded-xl px-3 py-1.5 flex-col justify-center shrink-0 max-w-[210px]">
          <div className="text-[10px] font-bold text-violet-900 dark:text-violet-200">
            Get instant insights on:
          </div>
          <div className="flex gap-1 mt-1">
            <span className="px-1.5 py-0.2 rounded bg-white dark:bg-slate-900 text-[9.5px] font-semibold text-violet-700 dark:text-violet-300 border border-violet-200/60 shadow-2xs">
              Sentiment
            </span>
            <span className="px-1.5 py-0.2 rounded bg-white dark:bg-slate-900 text-[9.5px] font-semibold text-teal-700 dark:text-teal-300 border border-teal-200/60 shadow-2xs">
              Mood
            </span>
            <span className="px-1.5 py-0.2 rounded bg-white dark:bg-slate-900 text-[9.5px] font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 shadow-2xs">
              Themes
            </span>
          </div>
        </div>
      </section>

      {/* 3. BOTTOM ROW: RECENT ACTIVITY (60%) & QUICK ACTIONS (40%) */}
      <section className="flex-1 min-h-[200px] grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3 xl:gap-3.5 overflow-hidden">
        {/* Left: Recent Activity (lg:col-span-7 ~ 60%) */}
        <div className="lg:col-span-7 h-full min-h-0 flex flex-col">
          <Card className="h-full flex flex-col min-h-0 p-3 sm:p-3.5 rounded-2xl border border-violet-100 dark:border-slate-800 shadow-xs bg-white dark:bg-[#131927]">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between pb-2 mb-1 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-slate-900 dark:text-white leading-none">
                    Recent Activity
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {summary?.metadata?.data_source === 'mock data (JSON storage)'
                      ? 'Sample activity'
                      : 'Latest posts from your connected accounts'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowTrajectorySlideOver(true)}
                  className="text-[10.5px] font-medium text-slate-500 hover:text-violet-600 flex items-center gap-1 transition"
                  title="View 30-day analytics area trajectory"
                >
                  <LineChart className="w-3 h-3" />
                  <span className="hidden sm:inline">30-day Trajectory</span>
                </button>
                <button
                  onClick={() => navigate('/results')}
                  className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 flex items-center gap-0.5"
                >
                  <span>View all</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Scrollable Rows Container */}
            <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 pr-1">
              {recentPosts.map((post, idx) => {
                const status = getPostStatus(post);
                const duration = getDurationBadge(post.post_type, idx);
                const timeAgo = getTimeAgo(post.published_at, idx);
                const thumb = getSampleThumbnail(idx, post.post_type);

                return (
                  <div
                    key={post.post_id || idx}
                    className="py-2 flex items-center justify-between gap-2.5 group hover:bg-slate-50/70 dark:hover:bg-slate-800/40 px-1.5 rounded-xl transition"
                  >
                    {/* Thumbnail + info */}
                    <div
                      onClick={() => setActivePost(post)}
                      className="flex items-center space-x-2.5 min-w-0 cursor-pointer flex-1"
                    >
                      <div className="relative w-14 h-9 sm:w-16 sm:h-10 rounded-lg overflow-hidden shrink-0 bg-slate-900 border border-slate-200/80 dark:border-slate-700">
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
                            {post.caption || 'Untitled Post'}
                          </h4>
                        </div>

                        {/* Stats line */}
                        <div className="flex items-center gap-2.5 text-[10.5px] text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3 text-slate-400" />
                            {post.views?.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3 text-rose-500/70" />
                            {post.likes?.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-slate-400" />
                            {post.comments?.toLocaleString()}
                          </span>
                          <span className="text-slate-400">• {timeAgo}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Chip + Kebab */}
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <Tooltip content={status.tooltip} position="top">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border cursor-help shadow-2xs whitespace-nowrap ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </Tooltip>

                      <div className="relative">
                        <button
                          onClick={() => setOpenKebab(openKebab === post.post_id ? null : post.post_id)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          aria-label="More post options"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {openKebab === post.post_id && (
                          <div
                            ref={kebabRef}
                            className="absolute right-0 mt-1 w-40 rounded-xl bg-white dark:bg-[#1E2638] border border-slate-200 dark:border-slate-700 shadow-xl py-1 z-40 text-xs"
                          >
                            <button
                              onClick={() => {
                                setOpenKebab(null);
                                setActivePost(post);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-300"
                            >
                              Open details
                            </button>
                            <button
                              onClick={() => {
                                setOpenKebab(null);
                                navigate('/predictor');
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-300"
                            >
                              Predict again
                            </button>
                            <button
                              onClick={() => {
                                setOpenKebab(null);
                                navigate('/studio');
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-300"
                            >
                              Turn into idea
                            </button>
                            <button
                              onClick={() => {
                                setOpenKebab(null);
                                navigator.clipboard?.writeText(window.location.origin);
                                addToast('Post link copied to clipboard', 'success');
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-300 flex items-center justify-between"
                            >
                              <span>Copy link</span>
                              <Copy className="w-3 h-3 text-slate-400" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right: Quick Actions (lg:col-span-5 ~ 40%) */}
        <div className="lg:col-span-5 h-full min-h-0 flex flex-col">
          <Card className="h-full flex flex-col min-h-0 p-3 sm:p-3.5 rounded-2xl border border-violet-100 dark:border-slate-800 shadow-xs bg-white dark:bg-[#131927]">
            {/* Header */}
            <div className="shrink-0 flex items-center space-x-2 pb-2 mb-1 border-b border-slate-100 dark:border-slate-800">
              <div className="w-6 h-6 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 flex items-center justify-center">
                <Rocket className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="font-extrabold text-xs text-slate-900 dark:text-white leading-none">
                  Quick Actions
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  6 creation & intelligence tools
                </p>
              </div>
            </div>

            {/* 3x2 Grid (or 2x3 on narrower screens) - Never scrolls, all 6 tiles visible */}
            <div className="flex-1 min-h-0 grid grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={action.onClick}
                    className={`group text-left p-2.5 rounded-xl border transition-all duration-150 flex flex-col justify-between h-full min-h-[72px] hover:-translate-y-0.5 hover:shadow-sm ${
                      action.highlight
                        ? 'bg-gradient-to-br from-violet-50 to-indigo-50/60 dark:from-violet-950/40 dark:to-slate-900 border-violet-200 dark:border-violet-800 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                          action.highlight
                            ? 'bg-violet-600 text-white shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-violet-600 dark:text-violet-400'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                      </div>
                      <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-violet-600 group-hover:translate-x-0.5 transition" />
                    </div>

                    <div className="mt-1">
                      <div className="font-bold text-[11px] text-slate-900 dark:text-white group-hover:text-violet-600 transition truncate leading-snug">
                        {action.title}
                      </div>
                      <div className="text-[9.5px] text-slate-500 dark:text-slate-400 truncate leading-none">
                        {action.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </section>

      {/* Trajectory Area Chart SlideOver */}
      <SlideOver
        open={showTrajectorySlideOver}
        onClose={() => setShowTrajectorySlideOver(false)}
        title="30-Day Channel Trajectory"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Aggregated cross-platform view velocity and community engagements over the past 30 days.
          </p>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={snapshots} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViewsModal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorEngageModal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="#7C3AED"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorViewsModal)"
                />
                <Area
                  type="monotone"
                  dataKey="engagements"
                  stroke="#14B8A6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorEngageModal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </SlideOver>

      {/* Post Slide-Over for inspection */}
      <SlideOver
        open={Boolean(activePost)}
        onClose={() => setActivePost(null)}
        title={activePost?.caption || 'Post Details'}
      >
        {activePost && (
          <div className="space-y-5">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <PlatformBadge platform={activePost.platform} />
                <span className="text-xs text-slate-500 font-mono">
                  {formatIsoDateTime(activePost.published_at)}
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {activePost.caption}
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-400">Total Views</div>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {activePost.views?.toLocaleString()}
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
                  {activePost.likes?.toLocaleString()}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-400">Comments</div>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {activePost.comments?.toLocaleString()}
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
                  setActivePost(null);
                  navigate('/studio');
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
