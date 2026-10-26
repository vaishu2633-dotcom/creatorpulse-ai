import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlatform } from '../context/PlatformContext';
import { getCommentsSummary } from '../api/apiClient';
import PlatformBadge from '../components/PlatformBadge';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Tooltip from '../components/ui/Tooltip';
import { CardSkeleton } from '../components/ui/Skeleton';
import {
  MessageSquareHeart,
  Smile,
  Meh,
  Frown,
  HelpCircle,
  Tag,
  Sparkles,
  ArrowRight,
  Lightbulb
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';

const SENTIMENT_COLORS = {
  Positive: '#10B981',
  Neutral: '#94A3B8',
  Negative: '#EF4444',
};

export default function CommentInsights() {
  const { selectedPlatform, lastRefreshed } = usePlatform();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    getCommentsSummary(selectedPlatform)
      .then((res) => {
        if (!isMounted) return;
        setSummary(res);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load comments summary');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedPlatform, lastRefreshed]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200">
          <h2 className="text-base font-bold mb-1">Failed to load Audience Voice</h2>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const sentimentData = [
    { name: 'Positive', value: summary?.sentiment_breakdown?.positive || 0 },
    { name: 'Neutral', value: summary?.sentiment_breakdown?.neutral || 0 },
    { name: 'Negative', value: summary?.sentiment_breakdown?.negative || 0 },
  ];

  const handleTurnIntoIdea = (questionText, platform) => {
    navigate(`/studio?topic=${encodeURIComponent(questionText)}&platform=${platform}`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F2430] dark:text-white flex items-center space-x-2.5">
          <span>Audience Voice</span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800">
            Community Signals
          </span>
        </h1>
        <p className="text-sm text-[#5B6475] dark:text-[#94A3B8] mt-1 max-w-2xl">
          Understand community mood, trending feedback themes, and repeated viewer questions that can fuel your next posts.
        </p>
      </div>

      {/* Mood Summary with Friendly Icons & Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sentiment Donut Chart Card */}
        <Card className="p-6 flex flex-col items-center justify-center">
          <div className="flex items-center justify-between w-full mb-2">
            <h2 className="text-sm font-bold text-[#1F2430] dark:text-white">
              Overall Community Mood
            </h2>
            <Tooltip text="Distribution of positive reactions vs neutral inquiries vs constructive critiques." showIcon />
          </div>

          <div className="w-full h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[entry.name]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E8E6DF',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                  formatter={(val) => [`${val}%`, 'Share']}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 3 Mood Metric Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Positive */}
            <Card variant="tintedTeal" className="p-5 text-center space-y-2 border-teal-200 dark:border-teal-900/40" hoverEffect>
              <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-xs">
                <Smile className="w-5 h-5 fill-white" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
                {summary?.sentiment_breakdown?.positive}%
              </div>
              <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                Positive Praise
              </div>
            </Card>

            {/* Neutral */}
            <Card className="p-5 text-center space-y-2" hoverEffect>
              <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center mx-auto">
                <Meh className="w-5 h-5" />
              </div>
              <div className="text-3xl font-extrabold text-[#1F2430] dark:text-white">
                {summary?.sentiment_breakdown?.neutral}%
              </div>
              <div className="text-xs font-semibold text-[#5B6475] dark:text-[#94A3B8]">
                Inquiries & Questions
              </div>
            </Card>

            {/* Critique */}
            <Card variant="tintedPeach" className="p-5 text-center space-y-2 border-rose-200 dark:border-rose-900/40" hoverEffect>
              <div className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center mx-auto shadow-xs">
                <Frown className="w-5 h-5 fill-white" />
              </div>
              <div className="text-3xl font-extrabold text-rose-700 dark:text-rose-300">
                {summary?.sentiment_breakdown?.negative}%
              </div>
              <div className="text-xs font-semibold text-rose-800 dark:text-rose-200">
                Feedback & Critiques
              </div>
            </Card>
          </div>

          {/* Top Discussion Topics as Chips */}
          <Card className="p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#858D9D]">
              Frequent Discussion Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {summary?.top_themes?.map((th, i) => (
                <div
                  key={i}
                  className="px-3.5 py-1.5 rounded-xl bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] text-xs font-semibold text-[#1F2430] dark:text-slate-200 flex items-center space-x-2"
                >
                  <Tag className="w-3 h-3 text-[#5B5BD6]" />
                  <span className="capitalize">{th.theme}</span>
                  <span className="text-[11px] text-[#5B6475] dark:text-[#94A3B8] font-mono">
                    ({th.count})
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Repeated Audience Questions (Idea Fuel) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#1F2430] dark:text-white flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-[#5B5BD6]" />
            <span>Audience Questions (Your Next Content Goldmine)</span>
          </h2>
          <p className="text-xs text-[#5B6475] dark:text-[#94A3B8] mt-0.5">
            Turn actual viewer curiosities into dedicated tutorials or shorts with one click.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary?.repeated_questions?.map((q) => (
            <Card
              key={q.comment_id}
              className="p-5 flex flex-col justify-between space-y-3"
              hoverEffect
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-[#EFECE6] dark:bg-[#202738] flex items-center justify-center font-bold text-xs text-[#5B5BD6]">
                      {(q.author?.[0] || '?').toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-[#1F2430] dark:text-white">
                      @{q.author}
                    </span>
                  </div>
                  <PlatformBadge platform={q.platform} size="sm" />
                </div>

                <p className="text-xs sm:text-sm text-[#1F2430] dark:text-slate-200 italic leading-relaxed bg-[#FAF9F6] dark:bg-[#131825] p-3 rounded-xl border border-[#E8E6DF] dark:border-[#232B3E]">
                  "{q.text}"
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#EFECE6] dark:border-[#232B3E]">
                <span className="text-[11px] text-[#5B6475] dark:text-[#94A3B8] capitalize">
                  Theme: <strong>{q.theme}</strong>
                </span>

                <Button
                  variant="primary"
                  size="sm"
                  icon={Sparkles}
                  onClick={() => handleTurnIntoIdea(q.text, q.platform)}
                >
                  Turn into Content Idea
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
