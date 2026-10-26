import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlatform } from '../context/PlatformContext';
import { getTrends } from '../api/apiClient';
import PlatformBadge from '../components/PlatformBadge';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SlideOver from '../components/ui/SlideOver';
import Tabs from '../components/ui/Tabs';
import EmptyState from '../components/ui/EmptyState';
import { CardSkeleton } from '../components/ui/Skeleton';
import EmptyDraftsIllustration from '../assets/illustrations/empty-drafts.svg';
import {
  Compass,
  Flame,
  ArrowRight,
  Sparkles,
  Clock,
  Lightbulb,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Tag
} from 'lucide-react';

const COVER_GRADIENTS = {
  youtube: 'from-red-500/20 via-orange-500/10 to-transparent',
  instagram: 'from-pink-500/20 via-purple-500/10 to-transparent',
  twitter: 'from-slate-700/20 via-slate-600/10 to-transparent',
  linkedin: 'from-blue-600/20 via-cyan-500/10 to-transparent',
};

export default function TrendExplorer() {
  const { selectedPlatform, lastRefreshed } = usePlatform();
  const navigate = useNavigate();

  const [timeWindow, setTimeWindow] = useState('24h');
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Slide-over inspection
  const [activeTrend, setActiveTrend] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    getTrends(selectedPlatform, timeWindow)
      .then((res) => {
        if (!isMounted) return;
        setTrends(res.trends || []);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to fetch trending topics');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedPlatform, timeWindow, lastRefreshed]);

  const handleUseTopic = (trend) => {
    navigate(`/studio?topic=${encodeURIComponent(trend.topic)}&platform=${trend.platform}`);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F2430] dark:text-white flex items-center space-x-2.5">
            <span>Trend Explorer</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              Discovery
            </span>
          </h1>
          <p className="text-sm text-[#5B6475] dark:text-[#94A3B8] mt-1">
            Detect high-growth conversation angles across your platforms before they get crowded.
          </p>
        </div>

        {/* Time-Window Filter Chips */}
        <div className="self-start sm:self-auto">
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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <CardSkeleton lines={4} />
          <CardSkeleton lines={4} />
          <CardSkeleton lines={4} />
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200">
          <h2 className="text-base font-bold mb-1">Failed to load Trends</h2>
          <p className="text-sm">{error}</p>
        </div>
      ) : trends.length === 0 ? (
        <EmptyState
          illustration={EmptyDraftsIllustration}
          title="No trends found"
          description="Try switching the platform selector or time window to uncover more trending topics."
          actionText="View all platforms"
          onAction={() => navigate('/trends')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {trends.map((item) => {
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
                    <PlatformBadge platform={item.platform} />
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/80 dark:bg-[#1A2333] text-[#5B6475] dark:text-[#94A3B8] border border-slate-200 dark:border-slate-700">
                      {item.category}
                    </span>
                  </div>
                }
              >
                <div className="p-5 space-y-4">
                  {/* Topic Title */}
                  <h3 className="text-base font-bold text-[#1F2430] dark:text-white line-clamp-2 hover:text-[#5B5BD6] transition">
                    {item.topic}
                  </h3>

                  {/* Growth & Volume Indicators */}
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

                  {/* Narrative Strength Meter */}
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

                  {/* Sample Hook Sneak-peek */}
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

                  {/* Use this topic button */}
                  <div className="pt-2">
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
                      Use in Content Studio
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Slide-over Panel: Trend Details */}
      <SlideOver
        isOpen={Boolean(activeTrend)}
        onClose={() => setActiveTrend(null)}
        title={activeTrend?.topic}
        subtitle={`${activeTrend?.platform?.toUpperCase()} • ${activeTrend?.category}`}
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" size="sm" onClick={() => setActiveTrend(null)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Sparkles}
              onClick={() => {
                if (activeTrend) handleUseTopic(activeTrend);
              }}
            >
              Use in Studio
            </Button>
          </div>
        }
      >
        {activeTrend && (
          <div className="space-y-6 text-sm">
            <div className="flex items-center justify-between">
              <PlatformBadge platform={activeTrend.platform} />
              <div className="flex items-center space-x-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>{activeTrend.growth_rate} growth velocity</span>
              </div>
            </div>

            {/* Strength meter detail */}
            <div className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#1F2430] dark:text-white">
                  Audience Narrative Strength
                </span>
                <span className="font-mono text-base font-extrabold text-[#5B5BD6] dark:text-brand-300">
                  {activeTrend.strength_score}/100
                </span>
              </div>
              <div className="w-full bg-[#EFECE6] dark:bg-[#202738] rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#5B5BD6] to-[#14B8A6] h-2.5 rounded-full"
                  style={{ width: `${activeTrend.strength_score}%` }}
                />
              </div>
              <p className="text-xs text-[#5B6475] dark:text-[#94A3B8] pt-1 leading-relaxed">
                Posts published around this topic in the next 48 hours benefit from high initial algorithmic recommendation velocity.
              </p>
            </div>

            {/* Sample angles & hooks */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#858D9D]">
                Recommended Angles & Hooks
              </h4>
              {activeTrend.sample_hooks?.map((hook, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-white dark:bg-[#171D2B] border border-[#E8E6DF] dark:border-[#232B3E] text-xs leading-relaxed text-[#1F2430] dark:text-slate-200 italic shadow-2xs"
                >
                  "{hook}"
                </div>
              ))}
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}
