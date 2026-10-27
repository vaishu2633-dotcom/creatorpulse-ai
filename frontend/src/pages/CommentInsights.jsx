import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlatform } from '../context/PlatformContext';
import { getCommentsSummary } from '../api/apiClient';
import PageHeader from '../components/ui/PageHeader';
import HowItWorks from '../components/ui/HowItWorks';
import StatusChip from '../components/ui/StatusChip';
import PlatformBadge from '../components/PlatformBadge';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Tooltip from '../components/ui/Tooltip';
import ErrorState from '../components/ui/ErrorState';
import { CardSkeleton } from '../components/ui/Skeleton';
import AudienceListeningIllustration from '../assets/illustrations/audience-listening.svg';
import {
  MessageSquareHeart,
  Smile,
  Meh,
  Frown,
  HelpCircle,
  Tag,
  Sparkles,
  ArrowRight,
  Lightbulb,
  MessageSquare,
  SearchCheck
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';

const HOW_IT_WORKS_STEPS = [
  {
    title: 'Listen to Viewers',
    description: 'Aggregates audience comments and discussions across your channels into a single pulse.'
  },
  {
    title: 'Mood Ring & Sentiment',
    description: 'Breaks down comment tone into positive praise, constructive neutral feedback, and negative critique.'
  },
  {
    title: 'Identify Unanswered Questions',
    description: 'Detects frequently repeated questions that signal high-demand tutorial topics.'
  },
  {
    title: 'Convert to Studio Ideas',
    description: 'One click loads any viewer question into Content Studio to answer it in your next post.'
  }
];

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
  const [selectedTheme, setSelectedTheme] = useState('all');

  const fetchComments = () => {
    setLoading(true);
    setError(null);
    getCommentsSummary(selectedPlatform)
      .then((res) => {
        setSummary(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load comments summary');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchComments();
  }, [selectedPlatform, lastRefreshed]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
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
      <div className="max-w-7xl mx-auto">
        <ErrorState
          title="Failed to load Audience Voice"
          description={error}
          onRetry={fetchComments}
        />
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

  const themes = summary?.top_themes || [];
  const repeatedQuestions = summary?.repeated_questions || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <PageHeader
        title="Audience Voice"
        subtitle="Listen to recurring viewer questions, sentiment moods, and high-interest topics"
        tag="Listening"
        status="Uses sample data"
        icon={MessageSquareHeart}
        illustration={AudienceListeningIllustration}
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={SearchCheck}
            onClick={() => navigate('/vibecheck')}
          >
            Deep VibeCheck AI
          </Button>
        }
      />

      {/* How it Works Strip */}
      <HowItWorks steps={HOW_IT_WORKS_STEPS} />

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Comments Analyzed */}
        <Card className="p-5" hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5B6475] dark:text-[#94A3B8]">
              Comments Monitored
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#1F2430] dark:text-white mt-2">
            {(summary?.total_comments || 0).toLocaleString()}
          </div>
          <div className="text-xs text-[#5B6475] dark:text-[#94A3B8] mt-1">
            Across active community threads
          </div>
        </Card>

        {/* Positive Sentiment */}
        <Card className="p-5" hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5B6475] dark:text-[#94A3B8]">
              Positive Reception
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <Smile className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
            {summary?.sentiment_breakdown?.positive}%
          </div>
          <div className="text-xs text-[#5B6475] dark:text-[#94A3B8] mt-1">
            High encouragement and praise
          </div>
        </Card>

        {/* Repeated Questions */}
        <Card className="p-5" hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5B6475] dark:text-[#94A3B8]">
              Audience Questions
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-2 font-mono">
            {repeatedQuestions.length}
          </div>
          <div className="text-xs text-[#5B6475] dark:text-[#94A3B8] mt-1">
            Ready-to-answer content opportunities
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Sentiment Donut (5 cols) */}
        <Card className="lg:col-span-5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1F2430] dark:text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#5B5BD6]" />
              <span>Audience Mood Ring</span>
            </h3>
            <span className="text-xs text-slate-400">VADER Polarity</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {sentimentData.map((entry) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={SENTIMENT_COLORS[entry.name]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Discussion Topics */}
          <div className="pt-2 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[#5B6475] dark:text-[#94A3B8]">
              Top Discussion Themes
            </div>
            <div className="flex flex-wrap gap-2">
              {themes.map((t) => (
                <button
                  key={t.theme}
                  onClick={() => setSelectedTheme(t.theme)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    selectedTheme === t.theme
                      ? 'bg-[#5B5BD6] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {t.theme} ({t.count})
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Right: Unanswered Viewer Questions with "Turn into Studio Idea" (7 cols) */}
        <Card className="lg:col-span-7 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E6DF] dark:border-[#232B3E]">
            <div>
              <h3 className="text-sm font-bold text-[#1F2430] dark:text-white flex items-center space-x-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Viewer Questions to Answer ({repeatedQuestions.length})</span>
              </h3>
              <p className="text-xs text-[#5B6475] dark:text-[#94A3B8]">
                Proven curiosity signals from your actual comment threads
              </p>
            </div>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {repeatedQuestions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No repeated questions found for this filter.
              </div>
            ) : (
              repeatedQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] space-y-2.5 hover:border-brand-300 transition"
                >
                  <div className="flex items-center justify-between">
                    <PlatformBadge platform={q.platform} size="sm" showName />
                    <span className="text-[11px] font-mono text-slate-400">
                      {q.author}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-[#1F2430] dark:text-slate-100 leading-relaxed">
                    "{q.text}"
                  </p>

                  <div className="flex justify-end pt-1">
                    <Button
                      variant="teal"
                      size="sm"
                      icon={Sparkles}
                      onClick={() => handleTurnIntoIdea(q.text, q.platform)}
                    >
                      Turn into Studio Idea
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
