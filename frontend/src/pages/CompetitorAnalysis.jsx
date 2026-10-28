import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Eye,
  Calendar,
  TrendingUp,
  Plus,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import PageHeader from '../components/ui/PageHeader';
import HowItWorks from '../components/ui/HowItWorks';
import SlideOver from '../components/ui/SlideOver';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import { useToast } from '../context/ToastContext';
import { getCompetitorSummary, addCompetitor, deleteCompetitor } from '../api/apiClient';
import competitorIllustration from '../assets/illustrations/competitor-benchmark.svg';

const HOW_IT_WORKS_STEPS = [
  {
    title: 'Add Competitor Channels',
    description: 'Enter up to 3 competitor channel handles or public YouTube URLs for side-by-side benchmarking.',
  },
  {
    title: 'Compare Key Public Metrics',
    description: 'Evaluate subscriber scale, average views per post, publishing cadence, and estimated engagement.',
  },
  {
    title: 'Discover Breakout Themes',
    description: 'Inspect their top performing public uploads to uncover high-demand topics for your own studio.',
  },
];

export default function CompetitorAnalysis() {
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add competitor form state
  const [searchQuery, setSearchQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [inputError, setInputError] = useState('');

  // SlideOver for inspecting competitor top posts
  const [selectedChannel, setSelectedChannel] = useState(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCompetitorSummary();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load competitor benchmarking data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setInputError('');
    const q = searchQuery.trim();

    if (!q) {
      setInputError('Please enter a channel handle (e.g. @codecraft) or YouTube URL.');
      return;
    }

    if (data?.competitors?.length >= 3) {
      setInputError('Maximum 3 competitors allowed. Please remove one first.');
      return;
    }

    setAdding(true);
    try {
      const res = await addCompetitor({ query: q, platform: 'youtube' });
      addToast(res.message || 'Competitor channel added successfully!', 'success');
      setSearchQuery('');
      fetchSummary();
    } catch (err) {
      setInputError(err.message || 'Could not add competitor.');
      addToast(err.message || 'Failed to add competitor.', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (compId, compName) => {
    try {
      await deleteCompetitor(compId);
      addToast(`Removed ${compName} from comparison.`, 'info');
      fetchSummary();
    } catch (err) {
      addToast(err.message || 'Failed to delete competitor.', 'error');
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Competitor Analysis"
          description="Compare your channel performance against niche peers using verified public metrics."
          pageTag="Benchmarking"
          statusChip={data?.metadata?.api_key_configured ? 'Working now' : 'Uses sample data'}
          illustration={competitorIllustration}
        />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Competitor Analysis"
          description="Compare your channel performance against niche peers using verified public metrics."
          pageTag="Benchmarking"
          statusChip="Uses sample data"
          illustration={competitorIllustration}
        />
        <ErrorState
          title="Could not load competitor data"
          message={error}
          onRetry={fetchSummary}
        />
      </div>
    );
  }

  const user = data.user_channel;
  const competitors = data.competitors || [];
  const allChannels = [user, ...competitors];
  const chartSeries = data.chart_series || [];
  const isSampleData = !data.metadata?.api_key_configured;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Competitor Analysis"
        description="Compare your channel metrics against peers using public Data API telemetry or labeled sample benchmarks."
        pageTag="Benchmarking"
        statusChip={isSampleData ? 'Uses sample data' : 'Working now'}
        illustration={competitorIllustration}
      />

      {/* How it Works Strip */}
      <HowItWorks steps={HOW_IT_WORKS_STEPS} />

      {/* Platform Transparency Notice */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <span className="font-bold text-indigo-900 dark:text-indigo-200">Public Data Transparency: </span>
          {data.metadata?.disclaimer}
          {isSampleData && (
            <span className="block mt-1 font-medium text-amber-700 dark:text-amber-400">
              Operating in sample mode. Set <code className="bg-amber-100 dark:bg-amber-950/80 px-1 py-0.5 rounded text-[11px]">YOUTUBE_API_KEY</code> in backend/.env for live channel lookups.
            </span>
          )}
        </div>
      </div>

      {/* Add Competitor Bar */}
      <Card className="p-5 rounded-2xl border border-violet-100 dark:border-slate-800 shadow-xs">
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (inputError) setInputError('');
              }}
              placeholder="Search or add YouTube channel (e.g., @mkbhd, @veritasium, or full URL)..."
              disabled={competitors.length >= 3}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 disabled:opacity-50"
            />
          </div>
          <Button
            type="submit"
            disabled={adding || competitors.length >= 3}
            className="w-full sm:w-auto shrink-0 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl px-5 py-2.5 font-semibold text-xs flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition"
          >
            {adding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>Add Competitor ({competitors.length}/3)</span>
          </Button>
        </form>
        {inputError && (
          <p className="mt-2 text-xs text-rose-600 dark:text-rose-400 font-medium">{inputError}</p>
        )}
      </Card>

      {/* Channel Comparison Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {allChannels.map((channel, idx) => {
          const isUser = channel.id === 'user_channel';
          return (
            <motion.div
              key={channel.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`rounded-2xl p-5 border transition-all ${
                isUser
                  ? 'bg-gradient-to-b from-violet-50/80 to-white dark:from-violet-950/30 dark:to-slate-900 border-violet-200 dark:border-violet-800 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      isUser
                        ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {channel.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {channel.name}
                      </h3>
                      {isUser && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {channel.handle}
                    </p>
                  </div>
                </div>

                {!isUser && (
                  <button
                    onClick={() => handleDelete(channel.id, channel.name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                    title="Remove from comparison"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Key Metrics */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Subscribers
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {channel.subscriber_count.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> Avg Views
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {channel.avg_views.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Posts / Week
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {channel.posts_per_week}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> Est. Engagement
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {(channel.engagement_rate * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {channel.is_sample ? 'Sample data' : 'Verified API'}
                </span>
                <button
                  onClick={() => setSelectedChannel(channel)}
                  className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 flex items-center gap-1"
                >
                  <span>Top posts</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Head-to-Head Comparison Chart */}
      <Card className="p-6 rounded-3xl border border-violet-100 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <span>Comparative Performance Radar</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Side-by-side comparison across audience size, view velocity, cadence, and engagement.
            </p>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {isSampleData ? 'Benchmark: Sample data' : 'Benchmark: Official YouTube API'}
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartSeries} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey={user.name} fill="#7C3AED" radius={[6, 6, 0, 0]} name={`${user.name} (You)`} />
              {competitors.map((c, i) => {
                const colors = ['#2563EB', '#0D9488', '#EA580C'];
                return (
                  <Bar
                    key={c.id || i}
                    dataKey={c.name}
                    fill={colors[i % colors.length]}
                    radius={[6, 6, 0, 0]}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Top Performing Public Posts SlideOver */}
      <SlideOver
        open={Boolean(selectedChannel)}
        onClose={() => setSelectedChannel(null)}
        title={`${selectedChannel?.name || 'Channel'} - Top Public Posts`}
      >
        {selectedChannel && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center text-sm">
                  {selectedChannel.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{selectedChannel.name}</h4>
                  <p className="text-xs text-slate-500">{selectedChannel.handle} • {selectedChannel.subscriber_count.toLocaleString()} subscribers</p>
                </div>
              </div>
            </div>

            <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400 pt-2">
              Recent High-Performing Uploads
            </h5>

            <div className="space-y-3">
              {(selectedChannel.top_posts || []).map((post, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-700 bg-white dark:bg-slate-900/60 transition"
                >
                  <p className="font-semibold text-xs text-slate-900 dark:text-white leading-snug">
                    {post.title}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                      <Eye className="w-3 h-3 text-slate-400" />
                      {post.views.toLocaleString()} views
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <TrendingUp className="w-3 h-3" />
                      {(post.engagement_rate * 100).toFixed(1)}% ER
                    </span>
                    {post.published_at && (
                      <span className="text-slate-400">
                        {post.published_at}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <p className="text-[11px] text-slate-400 leading-normal">
                Data reflects verified public metadata. Private watch-time percentages and impression CTRs are restricted by YouTube platform privacy rules.
              </p>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}
