import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
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
import Button from '../components/ui/Button';
import SlideOver from '../components/ui/SlideOver';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import Tooltip from '../components/ui/Tooltip';
import HowItWorks from '../components/ui/HowItWorks';
import HeroIllustration from '../assets/illustrations/hero-creator.svg';
import { formatIsoDateTime } from '../utils/timeFormat';
import { YoutubeIcon, InstagramIcon, TwitterIcon, LinkedinIcon } from '../components/SocialIcons';
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
  Flame,
  Lightbulb,
  Play,
  MoreVertical,
  Check,
  Copy,
  ExternalLink,
  ChevronRight,
  Eye,
  Heart,
  MessageSquare,
  Users,
  AlertCircle,
  Share2,
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

const HOW_IT_WORKS_STEPS = [
  {
    title: 'Monitor Cross-Platform Pulse',
    description: 'Track audience growth and breakout post velocity across YouTube, Instagram, X, and LinkedIn.',
  },
  {
    title: 'Analyze Content Resonance',
    description: 'Run VibeCheck on recent videos to understand audience sentiment, repeated questions, and community mood.',
  },
  {
    title: 'Plan Your Next Breakout',
    description: 'Predict hit probability before filming, generate tailored concepts in Studio, and schedule in your Planner.',
  },
];

// Helper to estimate video / post duration badge
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

// Helper to compute relative time string
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

  // VibeCheck URL bar state
  const [vibeUrl, setVibeUrl] = useState('');
  const [urlError, setUrlError] = useState('');

  // Kebab menu state: post_id or null
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

  // Baseline metrics for dynamic status computation
  const baselineEngagement = summary?.average_engagement_rate || 0.052;
  const avgViews = summary?.total_views && summary?.total_posts ? (summary.total_views / summary.total_posts) : 15000;

  // Compute status chip for each post dynamically
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

    // Basic URL validation
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

    const isValid = validPatterns.some((pattern) => pattern.test(trimmed));
    if (!isValid) {
      setUrlError('Please enter a valid URL (YouTube, Instagram, TikTok, or X).');
      return;
    }

    navigate(`/vibecheck?url=${encodeURIComponent(trimmed)}&auto=true`);
  };

  // Quick Action Tiles Config
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
    <div className="space-y-8 pb-12">
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-50/90 via-indigo-50/60 to-purple-50/80 dark:from-violet-950/20 dark:via-indigo-950/20 dark:to-slate-900 border border-violet-100 dark:border-violet-900/40 p-6 sm:p-10 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 border border-violet-200/80 dark:border-violet-800/60 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              <span className="text-xs font-bold text-violet-900 dark:text-violet-200">
                Welcome back, {user.name ? user.name.split(' ')[0] : 'Creator'}!
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              Your Creator Insights &{' '}
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Growth Loop
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
              Discover emerging trends, predict breakout probabilities against your historical baseline, and craft high-impact content across all your channels.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="primary"
                onClick={() => navigate('/predictor')}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl px-5 py-3 font-semibold text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition"
              >
                <span>Predict a Post</span>
                <ArrowRight className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate('/studio')}
                className="border border-violet-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 hover:bg-white text-slate-800 dark:text-slate-200 rounded-xl px-5 py-3 font-semibold text-xs flex items-center gap-2 shadow-2xs hover:shadow-xs transition"
              >
                <PenTool className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <span>Open Studio</span>
              </Button>
            </div>
          </div>

          {/* Hero Right: Illustration + Floating Cards */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="relative w-full max-w-[380px] aspect-[4/3] flex items-center justify-center">
              <img
                src={HeroIllustration}
                alt="Creator workspace with laptop, camera on tripod, and plant"
                className="w-full h-full object-contain drop-shadow-sm select-none"
              />

              {/* Floating Card 1: Grow Faster (Top Left) */}
              <motion.div
                animate={shouldReduceMotion ? {} : { y: [0, -7, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-2 left-2 sm:-left-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 dark:border-slate-700 shadow-md flex items-center space-x-2.5 z-10"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-800 dark:text-white leading-none">
                    Grow Faster
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                    +340% velocity
                  </div>
                </div>
              </motion.div>

              {/* Floating Card 2: Create Better (Top Right) */}
              <motion.div
                animate={shouldReduceMotion ? {} : { y: [0, 8, 0] }}
                transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                className="absolute -top-3 right-0 sm:-right-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 dark:border-slate-700 shadow-md flex items-center space-x-2.5 z-10"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-800 dark:text-white leading-none">
                    Create Better
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    10 ranked hooks
                  </div>
                </div>
              </motion.div>

              {/* Floating Card 3: More Reach (Bottom Left) */}
              <motion.div
                animate={shouldReduceMotion ? {} : { y: [0, -6, 0] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
                className="absolute bottom-2 left-4 sm:-left-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 dark:border-slate-700 shadow-md flex items-center space-x-2.5 z-10"
              >
                <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 flex items-center justify-center">
                  <Play className="w-4 h-4 fill-violet-600" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-800 dark:text-white leading-none">
                    More Reach
                  </div>
                  <div className="text-[10px] text-violet-600 font-semibold mt-0.5">
                    Breakout radar
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. VIBECHECK AI STRIP */}
      <section>
        <Card className="p-6 sm:p-7 rounded-3xl border border-violet-100 dark:border-slate-800 shadow-xs bg-white dark:bg-[#131927]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left form area */}
            <div className="lg:col-span-8 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <SearchCheck className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
                    VibeCheck AI
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                    New
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Analyze viewer sentiment, tone distribution, and audience questions on any public video or reel.
              </p>

              <form onSubmit={handleVibeCheckSubmit} className="space-y-2">
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <div className="relative flex-1 w-full">
                    <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={vibeUrl}
                      onChange={(e) => {
                        setVibeUrl(e.target.value);
                        if (urlError) setUrlError('');
                      }}
                      placeholder="Paste a public Reel, Short, or video URL..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 text-slate-900 dark:text-white"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full sm:w-auto shrink-0 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl px-5 py-2.5 font-semibold text-xs flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition"
                  >
                    <span>Analyze Vibe</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
                {urlError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                    {urlError}
                  </p>
                )}
              </form>

              {/* Supported platform quick chips */}
              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                <span>Supported:</span>
                <button
                  type="button"
                  onClick={() => setVibeUrl('https://www.youtube.com/watch?v=sample_video')}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-violet-600 transition"
                >
                  YouTube
                </button>
                <button
                  type="button"
                  onClick={() => setVibeUrl('https://www.instagram.com/reel/sample_reel')}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-violet-600 transition"
                >
                  Instagram
                </button>
                <button
                  type="button"
                  onClick={() => setVibeUrl('https://www.tiktok.com/@creator/video/sample')}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-violet-600 transition"
                >
                  TikTok
                </button>
                <span className="text-[10px] text-slate-400 font-medium">+ more</span>
              </div>
            </div>

            {/* Right instant insights card */}
            <div className="lg:col-span-4 bg-violet-50/70 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40 rounded-2xl p-4 space-y-2.5">
              <div className="text-xs font-bold text-violet-900 dark:text-violet-200">
                Get instant insights on:
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 text-[11px] font-semibold text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/60 shadow-2xs">
                  Sentiment
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 text-[11px] font-semibold text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60 shadow-2xs">
                  Audience mood
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 shadow-2xs">
                  Top themes
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 leading-relaxed">
                Extract repeated questions, viewer praise, and criticism backed by comment evidence counts.
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* 3. TWO-COLUMN SECTION: RECENT ACTIVITY & QUICK ACTIONS */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Recent Activity (8 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-6 rounded-3xl border border-violet-100 dark:border-slate-800 shadow-xs bg-white dark:bg-[#131927]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Recent Activity
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {summary?.metadata?.data_source === 'mock data (JSON storage)'
                      ? 'Sample activity'
                      : 'Latest posts from your connected accounts'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate('/results')}
                className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 flex items-center gap-1"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Post rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {recentPosts.slice(0, 6).map((post, idx) => {
                const status = getPostStatus(post);
                const duration = getDurationBadge(post.post_type, idx);
                const timeAgo = getTimeAgo(post.published_at, idx);
                const thumb = getSampleThumbnail(idx, post.post_type);

                return (
                  <div
                    key={post.post_id || idx}
                    className="py-3.5 flex items-center justify-between gap-3 group hover:bg-slate-50/70 dark:hover:bg-slate-800/40 px-2 rounded-2xl transition"
                  >
                    {/* Thumbnail + info */}
                    <div
                      onClick={() => setActivePost(post)}
                      className="flex items-center space-x-3 min-w-0 cursor-pointer flex-1"
                    >
                      <div className="relative w-16 h-11 rounded-xl overflow-hidden shrink-0 bg-slate-900 border border-slate-200/80 dark:border-slate-700">
                        <img
                          src={thumb}
                          alt={post.caption || 'Post thumbnail'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-white font-mono text-[9px] font-bold">
                          {duration}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <PlatformBadge platform={post.platform} size="sm" showLabel={false} />
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate group-hover:text-violet-600 transition">
                            {post.caption || 'Untitled Post'}
                          </h4>
                        </div>

                        {/* Stats line */}
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
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
                    <div className="flex items-center space-x-2 shrink-0">
                      <Tooltip content={status.tooltip} position="top">
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border cursor-help shadow-2xs ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </Tooltip>

                      <div className="relative">
                        <button
                          onClick={() => setOpenKebab(openKebab === post.post_id ? null : post.post_id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          aria-label="More post options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {openKebab === post.post_id && (
                          <div
                            ref={kebabRef}
                            className="absolute right-0 mt-1 w-44 rounded-2xl bg-white dark:bg-[#1E2638] border border-slate-200 dark:border-slate-700 shadow-xl py-1.5 z-40 text-xs"
                          >
                            <button
                              onClick={() => {
                                setOpenKebab(null);
                                setActivePost(post);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-300"
                            >
                              Open details
                            </button>
                            <button
                              onClick={() => {
                                setOpenKebab(null);
                                navigate('/predictor');
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-300"
                            >
                              Predict again
                            </button>
                            <button
                              onClick={() => {
                                setOpenKebab(null);
                                navigate('/studio');
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-300"
                            >
                              Turn into idea
                            </button>
                            <button
                              onClick={() => {
                                setOpenKebab(null);
                                navigator.clipboard?.writeText(window.location.origin);
                                addToast('Post link copied to clipboard', 'success');
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-300 flex items-center justify-between"
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

        {/* Right: Quick Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-6 rounded-3xl border border-violet-100 dark:border-slate-800 shadow-xs bg-white dark:bg-[#131927]">
            <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 flex items-center justify-center">
                <Rocket className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Quick Actions
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Jump directly into intelligence and creation tools
                </p>
              </div>
            </div>

            {/* 3x2 responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={action.onClick}
                    className={`group text-left p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between h-32 hover:-translate-y-1 hover:shadow-md ${
                      action.highlight
                        ? 'bg-gradient-to-br from-violet-50 to-indigo-50/60 dark:from-violet-950/40 dark:to-slate-900 border-violet-200 dark:border-violet-800 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          action.highlight
                            ? 'bg-violet-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-violet-600 dark:text-violet-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 group-hover:translate-x-1 transition" />
                    </div>

                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-violet-600 transition">
                        {action.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
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

      {/* 4. CROSS-PLATFORM ANALYTICS TRAJECTORY */}
      <section className="space-y-4">
        <Card className="p-6 sm:p-8 rounded-3xl border border-violet-100 dark:border-slate-800 shadow-xs bg-white dark:bg-[#131927]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  30-Day Cross-Platform Trajectory
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Sample Data
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Visualizing view velocity, impressions, and follower growth trajectory over time.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-3 h-3 rounded-full bg-violet-600" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Views</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-3 h-3 rounded-full bg-teal-500" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Engagements</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={snapshots} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stop-color="#7C3AED" stop-opacity={0.3} />
                    <stop offset="95%" stop-color="#7C3AED" stop-opacity={0} />
                  </linearGradient>
                  <linearGradient id="colorEngage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stop-color="#14B8A6" stop-opacity={0.25} />
                    <stop offset="95%" stop-color="#14B8A6" stop-opacity={0} />
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
                  fill="url(#colorViews)"
                />
                <Area
                  type="monotone"
                  dataKey="engagements"
                  stroke="#14B8A6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorEngage)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      {/* 5. HOW IT WORKS COLLAPSIBLE STRIP */}
      <HowItWorks steps={HOW_IT_WORKS_STEPS} />

      {/* Post Slide-Over for inspection */}
      <SlideOver
        open={Boolean(activePost)}
        onClose={() => setActivePost(null)}
        title={activePost?.caption || 'Post Details'}
      >
        {activePost && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <PlatformBadge platform={activePost.platform} />
                <span className="text-xs text-slate-500 font-mono">
                  {formatIsoDateTime(activePost.published_at)}
                </span>
              </div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white">
                {activePost.caption}
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-400">Total Views</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {activePost.views?.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-400">Engagement Rate</div>
                <div className="text-lg font-bold text-emerald-600 mt-1">
                  {((activePost.engagement_rate || 0) * 100).toFixed(2)}%
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-400">Likes</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {activePost.likes?.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-400">Comments</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {activePost.comments?.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <Button
                variant="primary"
                onClick={() => {
                  setActivePost(null);
                  navigate('/predictor');
                }}
                className="flex-1 rounded-xl text-xs font-semibold py-2.5"
              >
                Predict Again
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setActivePost(null);
                  navigate('/studio');
                }}
                className="flex-1 rounded-xl text-xs font-semibold py-2.5"
              >
                Turn Into Idea
              </Button>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}
