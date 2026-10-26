import React, { useState } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { useToast } from '../context/ToastContext';
import { predictPost } from '../api/apiClient';
import PlatformBadge from '../components/PlatformBadge';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Tooltip from '../components/ui/Tooltip';
import PredictorReadyIllustration from '../assets/illustrations/predictor-ready.svg';
import {
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Hash,
  Video,
  ShieldCheck,
  Flame,
  ArrowRight,
  TrendingUp,
  Target
} from 'lucide-react';

const POST_TYPES_BY_PLATFORM = {
  youtube: [
    { id: 'long_video', label: 'Long Video (8-15 mins)' },
    { id: 'short', label: 'Shorts (< 60s)' },
  ],
  instagram: [
    { id: 'reel', label: 'Reel (15-60s)' },
    { id: 'carousel', label: 'Carousel (5-10 slides)' },
    { id: 'single_image', label: 'Single Photo Post' },
  ],
  twitter: [
    { id: 'thread', label: 'Multi-tweet Thread' },
    { id: 'single_tweet', label: 'Single Post (< 280 chars)' },
    { id: 'poll', label: 'Interactive Poll' },
  ],
  linkedin: [
    { id: 'story_post', label: 'Story & Narrative Post' },
    { id: 'carousel', label: 'Document / PDF Carousel' },
    { id: 'poll', label: 'Professional Poll' },
  ],
};

const HIT_LEVELS = [
  { id: 'top_20%', label: 'Good', desc: 'Top 20% of your posts' },
  { id: 'top_10%', label: 'Great', desc: 'Top 10% (1 in 10 posts)' },
  { id: 'top_5%',  label: 'Amazing', desc: 'Top 5% (1 in 20 posts)' },
  { id: 'top_1%',  label: 'Viral', desc: 'Top 1% rare breakout' },
];

export default function ViralPredictor() {
  const { selectedPlatform } = usePlatform();
  const { addToast } = useToast();

  const [platform, setPlatform] = useState(
    selectedPlatform !== 'all' ? selectedPlatform : 'youtube'
  );
  const [postType, setPostType] = useState('long_video');
  const [title, setTitle] = useState(
    'Why 90% of Junior Devs Fail Technical Interviews (And How to Fix It)'
  );
  const [hashtagCount, setHashtagCount] = useState(3);
  const [durationSec, setDurationSec] = useState(600);
  const [postHour, setPostHour] = useState(17);
  const [postWeekday, setPostWeekday] = useState(3); // Thursday
  const [strictness, setStrictness] = useState('top_10%');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handlePlatformChange = (p) => {
    setPlatform(p);
    const available = POST_TYPES_BY_PLATFORM[p];
    if (available && available.length > 0) {
      setPostType(available[0].id);
      if (p === 'instagram') setDurationSec(30);
      else if (p === 'youtube') setDurationSec(600);
      else setDurationSec(0);
    }
  };

  const handlePredict = async (e) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await predictPost({
        platform,
        post_type: postType,
        title,
        hashtag_count: Number(hashtagCount),
        duration_sec: Number(durationSec),
        post_hour: Number(postHour),
        post_weekday: Number(postWeekday),
        strictness,
      });
      setResult(res);
      addToast('Prediction estimated and saved to results!', 'success');
    } catch (err) {
      setError(err.message || 'Prediction failed');
      addToast(err.message || 'Prediction failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F2430] dark:text-white flex items-center space-x-2.5">
          <span>Post Predictor</span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-[#5B5BD6] dark:text-brand-300 border border-brand-200 dark:border-brand-800">
            Pillar 2
          </span>
        </h1>
        <p className="text-sm text-[#5B6475] dark:text-[#94A3B8] mt-1 max-w-2xl">
          Estimate the chance your post will do better than your usual baseline before you hit publish.
        </p>

        {/* Reassuring Ethics Banner */}
        <div className="mt-4 p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/40 text-xs text-teal-800 dark:text-teal-300 flex items-start space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-teal-900 dark:text-teal-200">Our promise:</strong> We never guarantee virality.
            Algorithms are unpredictable. We show a realistic hit chance compared with your usual rate,
            so you can make smart creative decisions.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Step-by-Step Form on the Left (7 cols) */}
        <Card className="lg:col-span-7 p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#EFECE6] dark:border-[#232B3E]">
            <h2 className="text-base font-bold text-[#1F2430] dark:text-white flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-[#5B5BD6]" />
              <span>Step 1: Your Post Details</span>
            </h2>
            <span className="text-xs text-[#5B6475] dark:text-[#94A3B8]">Takes ~10 seconds</span>
          </div>

          <form onSubmit={handlePredict} className="space-y-5">
            {/* Platform Selector as big cards */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6475] dark:text-[#94A3B8] mb-2">
                Where are you posting?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['youtube', 'instagram', 'twitter', 'linkedin'].map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => handlePlatformChange(p)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition border ${
                      platform === p
                        ? 'bg-white dark:bg-[#1E2638] text-[#5B5BD6] dark:text-brand-300 border-[#5B5BD6] shadow-soft'
                        : 'bg-[#FAF9F6] dark:bg-[#131825] border-[#E8E6DF] dark:border-[#232B3E] text-[#5B6475] dark:text-[#94A3B8] hover:border-slate-300'
                    }`}
                  >
                    <PlatformBadge platform={p} size="sm" showName={true} />
                  </button>
                ))}
              </div>
            </div>

            {/* Post Format & Title */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6475] dark:text-[#94A3B8] mb-1.5">
                  Content Format
                </label>
                <select
                  value={postType}
                  onChange={(e) => setPostType(e.target.value)}
                  className="w-full bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] rounded-xl px-3.5 py-2.5 text-xs text-[#1F2430] dark:text-white focus:outline-none focus:border-[#5B5BD6]"
                >
                  {(POST_TYPES_BY_PLATFORM[platform] || []).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#5B6475] dark:text-[#94A3B8]">
                    Your Title or Opening Hook
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">{title.length} characters</span>
                </div>
                <textarea
                  rows={3}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Why 90% of Junior Devs Fail Technical Interviews..."
                  className="w-full bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] rounded-xl p-3.5 text-xs text-[#1F2430] dark:text-white focus:outline-none focus:border-[#5B5BD6] placeholder-slate-400 leading-relaxed"
                />
              </div>
            </div>

            {/* Numeric Sliders / Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#5B6475] dark:text-[#94A3B8] mb-1.5 flex items-center space-x-1">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  <span>Hashtags Count</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={hashtagCount}
                  onChange={(e) => setHashtagCount(e.target.value)}
                  className="w-full bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] rounded-xl px-3 py-2 text-xs text-[#1F2430] dark:text-white focus:outline-none focus:border-[#5B5BD6]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5B6475] dark:text-[#94A3B8] mb-1.5 flex items-center space-x-1">
                  <Video className="w-3.5 h-3.5 text-slate-400" />
                  <span>Duration (Seconds)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={7200}
                  value={durationSec}
                  onChange={(e) => setDurationSec(e.target.value)}
                  disabled={platform === 'twitter' || platform === 'linkedin'}
                  className="w-full bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] rounded-xl px-3 py-2 text-xs text-[#1F2430] dark:text-white focus:outline-none focus:border-[#5B5BD6] disabled:opacity-40"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5B6475] dark:text-[#94A3B8] mb-1.5 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Planned Hour</span>
                </label>
                <select
                  value={postHour}
                  onChange={(e) => setPostHour(e.target.value)}
                  className="w-full bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] rounded-xl px-3 py-2 text-xs text-[#1F2430] dark:text-white focus:outline-none focus:border-[#5B5BD6]"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')}:00 {i >= 12 ? 'PM' : 'AM'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Weekday chips */}
            <div>
              <label className="block text-xs font-medium text-[#5B6475] dark:text-[#94A3B8] mb-1.5">
                Posting Day
              </label>
              <div className="grid grid-cols-7 gap-1.5">
                {weekdays.map((day, idx) => (
                  <button
                    type="button"
                    key={day}
                    onClick={() => setPostWeekday(idx)}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition ${
                      postWeekday === idx
                        ? 'bg-[#5B5BD6] text-white shadow-xs'
                        : 'bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] text-[#5B6475] dark:text-[#94A3B8] hover:border-slate-300'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* "How big a hit?" Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1F2430] dark:text-white flex items-center space-x-1.5">
                  <Target className="w-3.5 h-3.5 text-[#5B5BD6]" />
                  <span>How big a hit?</span>
                  <Tooltip text="Sets the performance bar you want to benchmark against your past content." showIcon />
                </label>
                <span className="text-[11px] text-[#5B6475] dark:text-[#94A3B8]">Target percentile</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {HIT_LEVELS.map((lvl) => (
                  <button
                    type="button"
                    key={lvl.id}
                    onClick={() => setStrictness(lvl.id)}
                    className={`p-3 rounded-xl text-left border transition ${
                      strictness === lvl.id
                        ? 'bg-brand-50 dark:bg-brand-950/60 border-[#5B5BD6] text-[#5B5BD6] dark:text-brand-300 shadow-xs'
                        : 'bg-[#FAF9F6] dark:bg-[#131825] border-[#E8E6DF] dark:border-[#232B3E] text-[#5B6475] dark:text-[#94A3B8] hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs">{lvl.label}</div>
                    <div className="text-[10px] text-[#5B6475] dark:text-[#94A3B8] mt-0.5">{lvl.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              loading={loading}
              variant="primary"
              size="lg"
              className="w-full"
              icon={Sparkles}
            >
              Check Hit Chance
            </Button>
          </form>
        </Card>

        {/* Results / Ready Panel on the Right (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {result ? (
            <Card variant="tintedIndigo" className="p-6 space-y-6 border-brand-300 dark:border-brand-800 shadow-soft-lg">
              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-brand-200 dark:border-brand-800/80">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B6475] dark:text-brand-300">
                    Post Estimate
                  </span>
                  <div className="text-sm font-bold text-[#1F2430] dark:text-white mt-0.5">
                    {result.strictness_label}
                  </div>
                </div>

                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white dark:bg-[#1A2333] border border-brand-200 dark:border-brand-700 text-[#5B5BD6] dark:text-brand-300 capitalize">
                  {result.confidence_level} Confidence
                </span>
              </div>

              {/* Big Hit Chance Gauge */}
              <div className="text-center p-6 rounded-2xl bg-white dark:bg-[#151B28] border border-brand-200/80 dark:border-brand-800/60 shadow-xs">
                <div className="text-xs font-semibold text-[#5B6475] dark:text-[#94A3B8] uppercase tracking-wider">
                  Estimated Hit Chance
                </div>

                <div className="text-5xl font-extrabold text-[#5B5BD6] dark:text-brand-300 my-2 tracking-tight">
                  {result.predicted_prob_percent}%
                </div>

                <div className="text-xs text-[#5B6475] dark:text-[#94A3B8]">
                  Your usual rate is <strong className="text-[#1F2430] dark:text-white">{result.base_rate_percent}%</strong>{' '}
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">({result.ratio_display})</span>
                </div>

                {/* Range */}
                <div className="mt-3.5 inline-block px-3 py-1 rounded-full bg-[#FAF9F6] dark:bg-[#1A2333] border border-[#E8E6DF] dark:border-[#232B3E] text-xs text-[#5B6475] dark:text-[#94A3B8]">
                  Realistic range: <strong className="text-[#1F2430] dark:text-white">{result.range_display}</strong>
                </div>
              </div>

              {/* Top Reasons Why */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B6475] dark:text-brand-300 mb-2.5">
                  Why this score? (Top factors)
                </h4>
                <div className="space-y-2">
                  {result.top_reasons?.map((reason, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-white dark:bg-[#151B28] border border-brand-200/60 dark:border-brand-800/40 text-xs text-[#1F2430] dark:text-slate-200 flex items-start space-x-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Similar Past Posts */}
              {result.similar_posts && result.similar_posts.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B6475] dark:text-brand-300 mb-2.5">
                    Similar past posts from your channel
                  </h4>
                  <div className="space-y-2">
                    {result.similar_posts.map((post) => (
                      <div
                        key={post.post_id}
                        className="p-3 rounded-xl bg-white dark:bg-[#151B28] border border-brand-200/60 dark:border-brand-800/40 text-xs flex justify-between items-center"
                      >
                        <div className="truncate pr-2 text-[#1F2430] dark:text-slate-200 max-w-[210px]">
                          {post.title}
                        </div>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono shrink-0">
                          {(Number(post.engagement_rate || 0) * 100).toFixed(1)}% ER
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 text-center text-xs text-[#5B6475] dark:text-brand-300/80 font-medium">
                Saved to Prediction Results automatically.
              </div>
            </Card>
          ) : (
            /* Ready Illustration when no prediction made yet */
            <Card className="p-8 text-center space-y-4">
              <div className="w-48 h-40 mx-auto">
                <img
                  src={PredictorReadyIllustration}
                  alt="Ready to predict post illustration"
                  className="w-full h-full object-contain"
                />
              </div>

              <h3 className="text-base font-bold text-[#1F2430] dark:text-white">
                Ready to check your post
              </h3>

              <p className="text-xs text-[#5B6475] dark:text-[#94A3B8] leading-relaxed max-w-sm mx-auto">
                Fill in your title and release time on the left, then click{' '}
                <strong className="text-[#5B5BD6] dark:text-brand-300">Check Hit Chance</strong>.
                We'll compare it against your past baseline to see how likely it is to stand out.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
