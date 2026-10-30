import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlatform } from '../context/PlatformContext';
import { useToast } from '../context/ToastContext';
import { getTrends } from '../api/apiClient';
import PageHeader from '../components/ui/PageHeader';
import HowItWorks from '../components/ui/HowItWorks';
import PlatformBadge from '../components/PlatformBadge';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SlideOver from '../components/ui/SlideOver';
import Tabs from '../components/ui/Tabs';
import EmptyState from '../components/ui/EmptyState';
import { CardSkeleton } from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import TrendRadarIllustration from '../assets/illustrations/trend-radar.svg';
import EmptyDraftsIllustration from '../assets/illustrations/empty-drafts.svg';
import {
  Compass,
  Flame,
  ArrowRight,
  Sparkles,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  CircleDot,
  LayoutGrid,
  Radio,
  Globe,
  Info,
  UserCheck,
} from 'lucide-react';

const HOW_IT_WORKS_STEPS = [
  {
    title: 'Pick Time Window & Region',
    description: 'Filter between 24 hours, 7 days, or 30 days, and select target country or channel data.',
  },
  {
    title: 'Explore the Bubble Radar',
    description: 'Bubble size represents topic velocity; bubble color indicates primary platform.',
  },
  {
    title: 'Inspect Topic Signals',
    description: 'Click any trend to preview audience discussion angles, momentum scores, and sample hooks.',
  },
  {
    title: 'Use This Topic in Studio',
    description: 'One click loads the trending angle directly into Content Studio for instant copy generation.',
  },
];

const PLATFORM_BUBBLE_COLORS = {
  youtube: { fill: '#EF4444', text: '#FFFFFF', bg: 'rgba(239, 68, 68, 0.12)', border: '#FCA5A5' },
  instagram: { fill: '#EC4899', text: '#FFFFFF', bg: 'rgba(236, 72, 153, 0.12)', border: '#F472B6' },
  twitter: { fill: '#0284C7', text: '#FFFFFF', bg: 'rgba(2, 132, 199, 0.12)', border: '#7DD3FC' },
  linkedin: { fill: '#0A66C2', text: '#FFFFFF', bg: 'rgba(10, 102, 194, 0.12)', border: '#60A5FA' },
};

const COVER_GRADIENTS = {
  youtube: 'from-red-500/20 via-orange-500/10 to-transparent',
  instagram: 'from-pink-500/20 via-purple-500/10 to-transparent',
  twitter: 'from-sky-500/20 via-blue-500/10 to-transparent',
  linkedin: 'from-blue-600/20 via-cyan-500/10 to-transparent',
};

const REGIONS = [
  { id: 'all', label: 'All Regions' },
  { id: 'US', label: 'United States (US)' },
  { id: 'IN', label: 'India (IN)' },
  { id: 'GB', label: 'United Kingdom (GB)' },
];

export default function TrendExplorer() {
  const { selectedPlatform, lastRefreshed } = usePlatform();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [timeWindow, setTimeWindow] = useState('24h');
  const [region, setRegion] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all'); // 'all', 'creator', 'platform'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'bubble'
  const [trends, setTrends] = useState([]);
  const [trendPackage, setTrendPackage] = useState({
    source: 'Sample data',
    is_sample_data: true,
    last_updated: null,
    has_youtube_key: false,
    creator_rising_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Slide-over inspection
  const [activeTrend, setActiveTrend] = useState(null);

  const fetchTrendingData = () => {
    setLoading(true);
    setError(null);
    getTrends(selectedPlatform, timeWindow, region)
      .then((res) => {
        setTrends(res.trends || []);
        setTrendPackage({
          source: res.source || 'Sample data',
          is_sample_data: Boolean(res.is_sample_data),
          last_updated: res.last_updated,
          has_youtube_key: Boolean(res.has_youtube_key),
          creator_rising_count: res.creator_rising_count || 0,
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch trending topics');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTrendingData();
  }, [selectedPlatform, timeWindow, region, lastRefreshed]);

  const handleUseTopic = (trend) => {
    if (!trend || !trend.topic) return;
    addToast(`Loading "${trend.topic}" into Content Studio...`, 'info');
    navigate(`/studio?topic=${encodeURIComponent(trend.topic)}&platform=${trend.platform || 'youtube'}`);
  };

  // Filter trends based on sourceFilter
  const filteredTrends = trends.filter((t) => {
    if (sourceFilter === 'creator') return t.is_creator_data;
    if (sourceFilter === 'platform') return !t.is_creator_data;
    return true;
  });

  // Generate coordinates for SVG Bubble Map
  const generateBubblePositions = (items) => {
    const width = 800;
    const height = 440;
    const centerX = width / 2;
    const centerY = height / 2;

    return items.map((item, idx) => {
      const strength = item.strength_score || 75;
      const radius = 28 + (strength - 60) * 0.8;

      const angle = idx * 2.39996;
      const distance = 45 + Math.sqrt(idx) * 95;
      const x = Math.max(radius + 15, Math.min(width - radius - 15, centerX + Math.cos(angle) * distance));
      const y = Math.max(radius + 15, Math.min(height - radius - 15, centerY + Math.sin(angle) * (distance * 0.75)));

      return {
        ...item,
        x,
        y,
        radius,
      };
    });
  };

  const bubbleItems = generateBubblePositions(filteredTrends);

  const formattedLastUpdated = trendPackage.last_updated
    ? new Date(trendPackage.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Just now';

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <PageHeader
        title="Trend Explorer"
        subtitle="Detect high-growth conversation angles across platforms and within your own creator posts"
        tag="Trend Radar"
        status={trendPackage.is_sample_data ? 'Uses sample data' : 'Working now'}
        icon={Compass}
        illustration={TrendRadarIllustration}
        actions={
          <div className="flex items-center space-x-2">
            {/* View Switcher */}
            <div className="flex items-center bg-white dark:bg-[#171D2B] p-1 rounded-xl border border-[#E8E6DF] dark:border-[#232B3E]">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'grid'
                    ? 'bg-[#5B5BD6] text-white shadow-2xs'
                    : 'text-[#5B6475] dark:text-[#94A3B8] hover:text-[#1F2430]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards Grid</span>
              </button>
              <button
                onClick={() => setViewMode('bubble')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'bubble'
                    ? 'bg-[#5B5BD6] text-white shadow-2xs'
                    : 'text-[#5B6475] dark:text-[#94A3B8] hover:text-[#1F2430]'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Bubble Radar</span>
              </button>
            </div>
          </div>
        }
      />

      {/* How it Works Strip */}
      <HowItWorks steps={HOW_IT_WORKS_STEPS} />

      {/* Provenance & Source Metadata Banner */}
      <div
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
          trendPackage.is_sample_data
            ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-300'
            : 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300'
        }`}
      >
        <div className="flex items-start sm:items-center space-x-3">
          <Info className={`w-4 h-4 shrink-0 mt-0.5 sm:mt-0 ${trendPackage.is_sample_data ? 'text-amber-600' : 'text-emerald-600'}`} />
          <div>
            <div className="font-semibold">
              <span>Source: </span>
              <strong className="underline underline-offset-2">{trendPackage.source}</strong>
              <span className="mx-2 opacity-50">•</span>
              <span>Last update: {formattedLastUpdated}</span>
            </div>
            <p className="text-[11px] opacity-80 mt-0.5">
              {trendPackage.has_youtube_key
                ? 'Active YouTube Data API integration with real video velocity & creator data signals.'
                : 'Sample trends active. Add YOUTUBE_API_KEY in .env for live regional YouTube trends.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span
            className={`px-2.5 py-1 rounded-full font-mono text-[11px] font-bold border ${
              trendPackage.is_sample_data
                ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300'
            }`}
          >
            {trendPackage.is_sample_data ? 'Sample data' : 'Live data'}
          </span>
        </div>
      </div>

      {/* Filter and Time Window Strip */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#171D2B] border border-[#E8E6DF] dark:border-[#232B3E] shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Source Tabs */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSourceFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                sourceFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                  : 'bg-[#FAF9F6] dark:bg-[#131825] text-[#5B6475] dark:text-[#94A3B8] border-[#E8E6DF] dark:border-[#232B3E]'
              }`}
            >
              All Signals ({trends.length})
            </button>
            <button
              onClick={() => setSourceFilter('creator')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border flex items-center space-x-1.5 ${
                sourceFilter === 'creator'
                  ? 'bg-indigo-600 text-white border-transparent shadow-xs'
                  : 'bg-[#FAF9F6] dark:bg-[#131825] text-[#5B6475] dark:text-[#94A3B8] border-[#E8E6DF] dark:border-[#232B3E]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Rising in Your Content ({trends.filter((t) => t.is_creator_data).length})</span>
            </button>
          </div>

          {/* Region Selector */}
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-[#5B5BD6]" />
            <span className="text-xs text-[#5B6475] dark:text-[#94A3B8]">Region:</span>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] rounded-xl px-2.5 py-1 text-xs text-[#1F2430] dark:text-white focus:outline-none focus:border-[#5B5BD6]"
            >
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Velocity Window */}
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#5B5BD6]" />
            <Tabs
              size="sm"
              tabs={[
                { id: '24h', label: '24 Hours' },
                { id: '7d', label: '7 Days' },
                { id: '30d', label: '30 Days' },
              ]}
              activeTab={timeWindow}
              onChange={(tab) => setTimeWindow(tab)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <CardSkeleton lines={4} />
          <CardSkeleton lines={4} />
          <CardSkeleton lines={4} />
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load Trends"
          description={error}
          onRetry={fetchTrendingData}
        />
      ) : filteredTrends.length === 0 ? (
        <EmptyState
          illustration={EmptyDraftsIllustration}
          title="No trends found for this filter"
          description="Try switching the platform selector, region, or source filter to uncover more trending topics."
          actionText="Reset filters"
          onAction={() => {
            setSourceFilter('all');
            setRegion('all');
            setTimeWindow('24h');
          }}
        />
      ) : viewMode === 'bubble' ? (
        /* Interactive SVG Bubble Map */
        <Card className="p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#1F2430] dark:text-white flex items-center space-x-2">
                <CircleDot className="w-4 h-4 text-[#14B8A6]" />
                <span>Interactive Bubble Radar</span>
              </h3>
              <p className="text-xs text-[#5B6475] dark:text-[#94A3B8]">
                Bubble size corresponds to momentum score. Click any bubble to inspect signals or use topic.
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-[11px] text-slate-400">YouTube</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                <span className="text-[11px] text-slate-400">Instagram</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span className="text-[11px] text-slate-400">X</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span className="text-[11px] text-slate-400">LinkedIn</span>
              </span>
            </div>
          </div>

          <div className="w-full bg-[#FAF9F6] dark:bg-[#121724] rounded-2xl border border-[#E8E6DF] dark:border-[#232B3E] overflow-hidden flex items-center justify-center p-2">
            <svg
              viewBox="0 0 800 440"
              className="w-full h-auto max-h-[480px] select-none"
            >
              <circle cx="400" cy="220" r="190" fill="none" stroke="#E2E8F0" strokeDasharray="4 4" opacity="0.6" />
              <circle cx="400" cy="220" r="130" fill="none" stroke="#E2E8F0" strokeDasharray="4 4" opacity="0.6" />
              <circle cx="400" cy="220" r="70" fill="none" stroke="#E2E8F0" strokeDasharray="4 4" opacity="0.6" />

              {bubbleItems.map((b) => {
                const colors = PLATFORM_BUBBLE_COLORS[b.platform] || PLATFORM_BUBBLE_COLORS.youtube;
                const isSelected = activeTrend?.trend_id === b.trend_id;

                return (
                  <g
                    key={b.trend_id}
                    transform={`translate(${b.x}, ${b.y})`}
                    onClick={() => setActiveTrend(b)}
                    className="cursor-pointer transition-transform duration-200 hover:scale-105"
                  >
                    {isSelected && (
                      <circle
                        r={b.radius + 6}
                        fill="none"
                        stroke="#5B5BD6"
                        strokeWidth="3"
                        strokeDasharray="4 2"
                      />
                    )}

                    <circle
                      r={b.radius}
                      fill={colors.bg}
                      stroke={colors.fill}
                      strokeWidth={isSelected ? 3 : 1.5}
                      className="filter drop-shadow-sm"
                    />

                    <circle
                      cx="0"
                      cy={-b.radius + 12}
                      r="4"
                      fill={colors.fill}
                    />

                    <text
                      textAnchor="middle"
                      y={-2}
                      fontSize={b.radius > 45 ? 11 : 9.5}
                      fontWeight="700"
                      fill="#1F2430"
                      className="dark:fill-slate-100 font-sans pointer-events-none"
                    >
                      {b.topic.length > (b.radius > 45 ? 18 : 12)
                        ? b.topic.slice(0, b.radius > 45 ? 16 : 10) + '…'
                        : b.topic}
                    </text>

                    <text
                      textAnchor="middle"
                      y={14}
                      fontSize="9"
                      fontWeight="600"
                      fill={colors.fill}
                      className="font-mono pointer-events-none"
                    >
                      {b.strength_score}/100
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </Card>
      ) : (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTrends.map((item) => {
            const strength = item.strength_score || 70;
            const grad = COVER_GRADIENTS[item.platform] || 'from-indigo-500/20 to-transparent';

            return (
              <Card
                key={item.trend_id}
                hoverEffect
                onClick={() => setActiveTrend(item)}
                className="flex flex-col justify-between cursor-pointer"
                cover={
                  <div className={`h-16 bg-gradient-to-r ${grad} p-4 flex items-center justify-between border-b border-[#E8E6DF] dark:border-[#232B3E]`}>
                    <div className="flex items-center space-x-2">
                      <PlatformBadge platform={item.platform} />
                      {item.is_creator_data && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-[#5B5BD6] dark:text-brand-300 flex items-center space-x-1 border border-indigo-200 dark:border-indigo-800">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Your Content</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/80 dark:bg-[#1A2333] text-[#5B6475] dark:text-[#94A3B8] border border-slate-200 dark:border-slate-700">
                      {item.category}
                    </span>
                  </div>
                }
              >
                <div className="p-5 space-y-4">
                  <h3 className="text-base font-bold text-[#1F2430] dark:text-white line-clamp-2 hover:text-[#5B5BD6] transition">
                    {item.topic}
                  </h3>

                  <div className="flex items-center space-x-3 text-xs">
                    <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-bold">
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      <span>{item.growth_rate}</span>
                    </div>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-[#5B6475] dark:text-[#94A3B8] font-mono">
                      {(item.volume ?? 0).toLocaleString()} signals
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#5B6475] dark:text-[#94A3B8] font-medium">
                        Interest Strength
                      </span>
                      <span className="text-[#5B5BD6] dark:text-brand-300 font-extrabold font-mono">
                        {strength}/100
                      </span>
                    </div>
                    <div className="w-full bg-[#EFECE6] dark:bg-[#202738] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#5B5BD6] to-[#14B8A6] h-2 rounded-full transition-all duration-500"
                        style={{ width: `${strength}%` }}
                      />
                    </div>
                  </div>

                  {item.sample_hooks && item.sample_hooks.length > 0 && (
                    <div className="p-3 rounded-xl bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] text-xs">
                      <span className="text-[10px] font-bold text-[#858D9D] uppercase tracking-wider block mb-1">
                        Angle Idea
                      </span>
                      <p className="text-[#1F2430] dark:text-[#F1F5F9] italic line-clamp-2">
                        "{item.sample_hooks[0]}"
                      </p>
                    </div>
                  )}

                  <div className="pt-2 flex items-center space-x-2">
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      icon={ArrowRight}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUseTopic(item);
                      }}
                    >
                      Use this topic
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Slide-over topic inspector */}
      <SlideOver
        open={Boolean(activeTrend)}
        onClose={() => setActiveTrend(null)}
        title="Trend Intelligence"
      >
        {activeTrend && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#141A28] border border-[#E8E6DF] dark:border-[#232B3E] space-y-2">
              <div className="flex items-center space-x-2">
                <PlatformBadge platform={activeTrend.platform} size="sm" showName />
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                  {activeTrend.category}
                </span>
                {activeTrend.is_creator_data && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-[#5B5BD6] dark:text-brand-300 font-bold">
                    From Your Content
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-[#1F2430] dark:text-white leading-relaxed">
                {activeTrend.topic}
              </h3>
              <div className="text-[11px] text-[#5B6475] dark:text-[#94A3B8]">
                Source: <strong className="font-semibold">{activeTrend.source || 'Sample data'}</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#171D2B] border border-[#E8E6DF] dark:border-[#232B3E]">
                <div className="text-2xl font-extrabold text-[#5B5BD6] dark:text-brand-300 font-mono">
                  {activeTrend.strength_score}/100
                </div>
                <div className="text-xs text-[#5B6475] dark:text-[#94A3B8]">
                  Interest Strength
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#171D2B] border border-[#E8E6DF] dark:border-[#232B3E]">
                <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {activeTrend.growth_rate}
                </div>
                <div className="text-xs text-[#5B6475] dark:text-[#94A3B8]">
                  Spike Growth Rate
                </div>
              </div>
            </div>

            {/* Sample Angles / Hooks */}
            {activeTrend.sample_hooks && activeTrend.sample_hooks.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#5B6475] dark:text-[#94A3B8] uppercase tracking-wider">
                  Suggested Creative Angles
                </div>
                <div className="space-y-2">
                  {activeTrend.sample_hooks.map((hook, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-white dark:bg-[#171D2B] border border-[#E8E6DF] dark:border-[#232B3E] text-xs text-[#1F2430] dark:text-slate-200 italic"
                    >
                      "{hook}"
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              icon={Sparkles}
              onClick={() => handleUseTopic(activeTrend)}
            >
              Use this topic in Studio
            </Button>
          </div>
        )}
      </SlideOver>
    </div>
  );
}
