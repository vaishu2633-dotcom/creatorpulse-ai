import React, { useState, useEffect } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { useToast } from '../context/ToastContext';
import { getReportsAnalytics, getReportsCsvExportUrl } from '../api/apiClient';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SlideOver from '../components/ui/SlideOver';
import PlatformBadge from '../components/PlatformBadge';
import { getSampleThumbnail } from '../assets/sample/sampleThumbnails';
import { formatIsoDateTime } from '../utils/timeFormat';
import {
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  Calendar,
  Eye,
  Heart,
  MessageSquare,
  Activity,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  SlidersHorizontal,
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

const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return Number(num).toLocaleString();
};

export default function Reports() {
  const { selectedPlatform, activeDataSource } = usePlatform();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  // Filters state
  const [timeRange, setTimeRange] = useState('all'); // '7' | '30' | '90' | 'all'
  const [platformFilter, setPlatformFilter] = useState(selectedPlatform || 'all');
  const [postsTab, setPostsTab] = useState('top'); // 'top' | 'bottom' | 'all'
  const [sortBy, setSortBy] = useState('views'); // 'published_at' | 'views' | 'engagement_rate'
  const [activePost, setActivePost] = useState(null);

  const fetchAnalytics = () => {
    setLoading(true);
    setError(null);
    const daysParam = timeRange === 'all' ? null : parseInt(timeRange, 10);

    getReportsAnalytics(platformFilter, daysParam, sortBy, true, 50)
      .then((data) => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load report analytics');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, platformFilter, sortBy]);

  const handleExportCsv = () => {
    const daysParam = timeRange === 'all' ? null : parseInt(timeRange, 10);
    const url = getReportsCsvExportUrl(platformFilter, daysParam);
    window.open(url, '_blank');
    addToast('Downloading CSV report...', 'info');
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const summary = analytics?.summary || {};
  const snapshots = analytics?.snapshots || [];

  // Determine which posts to render
  const displayPosts =
    postsTab === 'top'
      ? analytics?.top_posts || []
      : postsTab === 'bottom'
      ? analytics?.bottom_posts || []
      : analytics?.posts || [];

  const isSample = activeDataSource?.source === 'sample';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header with shared identity */}
      <PageHeader
        title="Channel Reports & Analytics"
        subtitle="Full channel performance totals, velocity charts, and exportable records"
        tag="Analytics"
        status={isSample ? 'Uses sample data' : 'Working now'}
        icon={BarChart3}
      />

      {/* 2. Filter & Export Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#161D2B] border border-[#E8E6DF] dark:border-[#222B3D] shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Time Filter Pills */}
        <div className="flex items-center space-x-1.5">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Range:</span>
          </span>
          {[
            { id: '7', label: '7d' },
            { id: '30', label: '30d' },
            { id: '90', label: '90d' },
            { id: 'all', label: 'All Time' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setTimeRange(pill.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                timeRange === pill.id
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Platform Dropdown Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500">Platform:</span>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="bg-[#FAF9F6] dark:bg-[#111622] border border-[#E8E6DF] dark:border-[#232B3E] rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white font-semibold focus:outline-none focus:border-violet-600 cursor-pointer"
          >
            <option value="all">All Channels</option>
            <option value="youtube">YouTube</option>
            <option value="instagram">Instagram</option>
            <option value="twitter">Twitter / X</option>
            <option value="linkedin">LinkedIn</option>
          </select>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            icon={Download}
          >
            Export CSV
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrintPdf}
            icon={Printer}
          >
            Print / PDF
          </Button>
        </div>
      </div>

      {loading && !analytics ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-3">
          <div className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <div className="text-xs font-medium text-slate-500">Compiling report metrics...</div>
        </div>
      ) : error ? (
        <div className="p-8 text-center space-y-3">
          <div className="text-sm font-bold text-rose-600">{error}</div>
          <Button variant="primary" size="sm" onClick={fetchAnalytics}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          {/* 3. 4 Big KPI Totals Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Views */}
            <Card className="p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Total Views</span>
                <Eye className="w-4 h-4 text-violet-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {formatNumber(summary.total_views || 0)}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Verified active data</span>
              </div>
            </Card>

            {/* Likes */}
            <Card className="p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Total Likes</span>
                <Heart className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {formatNumber(summary.total_likes || 0)}
              </div>
              <div className="text-[11px] text-slate-400">
                Across {summary.total_posts || 0} published posts
              </div>
            </Card>

            {/* Comments */}
            <Card className="p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Audience Comments</span>
                <MessageSquare className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {formatNumber(summary.total_comments || 0)}
              </div>
              <div className="text-[11px] text-slate-400">
                Community conversations
              </div>
            </Card>

            {/* Engagement Rate */}
            <Card className="p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Avg Engagement Rate</span>
                <Activity className="w-4 h-4 text-teal-500" />
              </div>
              <div className="text-2xl font-extrabold text-violet-600 dark:text-violet-400">
                {summary.avg_engagement_rate_percent || 0}%
              </div>
              <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                {summary.breakout_hit_rate_percent || 0}% hit rate (top 10% benchmark)
              </div>
            </Card>
          </div>

          {/* 4. Views & Engagement Trend Chart */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Audience Growth & Velocity Timeline
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daily views trajectory and engagement volume over time
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
                {snapshots.length} Data Points
              </span>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={snapshots}>
                  <defs>
                    <linearGradient id="colorReportViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" tickFormatter={formatNumber} />
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
                    fill="url(#colorReportViews)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* 5. Top Hits vs Needs Work Table */}
          <Card className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              {/* Tabs */}
              <div className="flex items-center space-x-1.5">
                {[
                  { id: 'top', label: 'Top Hits', icon: Flame },
                  { id: 'bottom', label: 'Needs Work', icon: ArrowDownRight },
                  { id: 'all', label: 'All Posts', icon: BarChart3 },
                ].map((tab) => {
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setPostsTab(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                        postsTab === tab.id
                          ? 'bg-violet-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      <TabIcon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Sort By Select */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500 font-semibold">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-[#FAF9F6] dark:bg-[#111622] border border-[#E8E6DF] dark:border-[#232B3E] rounded-xl px-2.5 py-1 text-xs text-slate-800 dark:text-white font-semibold focus:outline-none focus:border-violet-600 cursor-pointer"
                >
                  <option value="views">Views (High to Low)</option>
                  <option value="engagement_rate">Engagement Rate</option>
                  <option value="published_at">Publish Date</option>
                </select>
              </div>
            </div>

            {/* Posts List Table */}
            {displayPosts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No posts found for the selected filter range.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {displayPosts.map((post, idx) => (
                  <div
                    key={post.post_id || idx}
                    onClick={() => setActivePost(post)}
                    className="py-3 px-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition cursor-pointer group"
                  >
                    {/* Left: Thumbnail & Title */}
                    <div className="flex items-center space-x-3 min-w-0 flex-1 pr-4">
                      <div className="w-14 h-9 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 relative">
                        <img
                          src={post.thumbnail_url || getSampleThumbnail(post.platform, idx)}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition">
                          {post.title}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center space-x-2 mt-0.5">
                          <PlatformBadge platform={post.platform} size="xs" showName={true} />
                          <span>&bull;</span>
                          <span>{formatIsoDateTime(post.published_at)}</span>
                          {post.is_breakout && (
                            <>
                              <span>&bull;</span>
                              <span className="text-amber-600 font-bold">Top Hit</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Metrics & Arrow */}
                    <div className="flex items-center space-x-4 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                          {formatNumber(post.views)} views
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          {(Number(post.engagement_rate || 0) * 100).toFixed(1)}% ER
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-600 transition" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {/* Post Details SlideOver */}
      <SlideOver
        isOpen={Boolean(activePost)}
        onClose={() => setActivePost(null)}
        title={activePost?.title || 'Post Performance Breakdown'}
        subtitle="Full metrics, engagement velocity, and viewer actions"
      >
        {activePost && (
          <div className="space-y-6 p-2">
            <div className="w-full h-44 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img
                src={activePost.thumbnail_url || getSampleThumbnail(activePost.platform, 0)}
                alt={activePost.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] text-slate-500 font-medium">Views</div>
                <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {formatNumber(activePost.views)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] text-slate-500 font-medium">Engagement Rate</div>
                <div className="text-lg font-extrabold text-violet-600 dark:text-violet-400 mt-0.5">
                  {(Number(activePost.engagement_rate || 0) * 100).toFixed(2)}%
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] text-slate-500 font-medium">Likes</div>
                <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {formatNumber(activePost.likes)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] text-slate-500 font-medium">Comments</div>
                <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {formatNumber(activePost.comments)}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-violet-50/60 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 text-xs text-violet-900 dark:text-violet-200 space-y-1">
              <div className="font-bold flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                <span>Diagnostic Insight</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                This post achieved {activePost.is_breakout ? 'top-tier hit velocity' : 'solid baseline retention'}.
                Viewer likes-to-views ratio was {((Number(activePost.likes) / Math.max(1, Number(activePost.views))) * 100).toFixed(1)}%.
              </p>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}
