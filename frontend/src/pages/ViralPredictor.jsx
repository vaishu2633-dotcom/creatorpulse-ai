import React, { useState, useEffect, useRef } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { useToast } from '../context/ToastContext';
import { predictPost } from '../api/apiClient';
import PageHeader from '../components/ui/PageHeader';
import HowItWorks from '../components/ui/HowItWorks';
import StatusChip from '../components/ui/StatusChip';
import PlatformBadge from '../components/PlatformBadge';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Tooltip from '../components/ui/Tooltip';
import PredictorReadyIllustration from '../assets/illustrations/predictor-ready.svg';
import { formatTime12h, getHourOptions } from '../utils/timeFormat';
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
  Target,
  RefreshCw,
  Lightbulb,
  Check
} from 'lucide-react';

const HOW_IT_WORKS_STEPS = [
  {
    title: 'Write Your Post Details',
    description: 'Enter your proposed title or hook and choose your content format.'
  },
  {
    title: 'Pick Day and Time',
    description: 'Select your planned release hour and day of week to account for audience habits.'
  },
  {
    title: 'See Your Hit Chance',
    description: 'Our trained machine learning model calculates your breakout probability compared with your usual base rate.'
  }
];

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
  { id: 'top_20%', label: 'Good (Top 20%)', desc: '1 in 5 posts beat this mark' },
  { id: 'top_10%', label: 'Great (Top 10%)', desc: '1 in 10 posts beat this mark' },
  { id: 'top_5%',  label: 'Amazing (Top 5%)', desc: '1 in 20 posts beat this mark' },
  { id: 'top_1%',  label: 'Viral Hit (Top 1%)', desc: 'Rare breakout achievement' },
];

const WEEKDAYS = [
  { label: 'Mon', index: 0 },
  { label: 'Tue', index: 1 },
  { label: 'Wed', index: 2 },
  { label: 'Thu', index: 3 },
  { label: 'Fri', index: 4 },
  { label: 'Sat', index: 5 },
  { label: 'Sun', index: 6 },
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
  const [postHour, setPostHour] = useState(14); // 2:00 PM default
  const [postWeekday, setPostWeekday] = useState(2); // Wednesday
  const [strictness, setStrictness] = useState('top_10%');

  // Wizard step state (1: Post, 2: Timing, 3: Hit Chance)
  const [activeStep, setActiveStep] = useState(1);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Live "What-If" preview state
  const [whatIfProb, setWhatIfProb] = useState(null);
  const debounceTimer = useRef(null);

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
      setWhatIfProb(res.predicted_prob_percent);
      setActiveStep(3); // advance wizard to results
      addToast('Prediction estimated and saved to results!', 'success');
    } catch (err) {
      setError(err.message || 'Prediction failed');
      addToast(err.message || 'Prediction failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Live Debounced What-If Estimator
  useEffect(() => {
    if (!title.trim()) return;
    clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
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
        setWhatIfProb(res.predicted_prob_percent);
      } catch {
        // silent fallback for what-if
      }
    }, 450);

    return () => clearTimeout(debounceTimer.current);
  }, [platform, postType, hashtagCount, durationSec, postHour, postWeekday, strictness]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Page Header with Shared Identity */}
      <PageHeader
        title="Post Predictor"
        subtitle="Write your post, pick your timing, and see your hit chance before publishing"
        tag="Prediction Tool"
        status="Uses sample data"
        icon={Sparkles}
        illustration={PredictorReadyIllustration}
      />

      {/* How it Works Strip */}
      <HowItWorks steps={HOW_IT_WORKS_STEPS} />

      {/* Wizard Step Progression Bar */}
      <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#171D2B]/80 border border-[#E8E6DF] dark:border-[#232B3E] shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold">
          <button
            onClick={() => setActiveStep(1)}
            className={`flex items-center space-x-2 transition ${
              activeStep === 1
                ? 'text-[#5B5BD6] dark:text-brand-300'
                : 'text-[#5B6475] dark:text-[#94A3B8] hover:text-[#1F2430]'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-[#5B5BD6] text-white flex items-center justify-center text-[10px]">
              1
            </span>
            <span>Write your post</span>
          </button>

          <div className="h-0.5 flex-1 mx-4 bg-slate-200 dark:bg-slate-700" />

          <button
            onClick={() => setActiveStep(2)}
            className={`flex items-center space-x-2 transition ${
              activeStep === 2
                ? 'text-[#5B5BD6] dark:text-brand-300'
                : 'text-[#5B6475] dark:text-[#94A3B8] hover:text-[#1F2430]'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              activeStep >= 2 ? 'bg-[#5B5BD6] text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
            }`}>
              2
            </span>
            <span>Pick day and time</span>
          </button>

          <div className="h-0.5 flex-1 mx-4 bg-slate-200 dark:bg-slate-700" />

          <button
            onClick={() => result && setActiveStep(3)}
            className={`flex items-center space-x-2 transition ${
              activeStep === 3
                ? 'text-[#5B5BD6] dark:text-brand-300'
                : 'text-[#5B6475] dark:text-[#94A3B8] hover:text-[#1F2430]'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              activeStep === 3 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
            }`}>
              3
            </span>
            <span>See your hit chance</span>
          </button>
        </div>
      </div>

      {/* Main Prediction Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form & Adjustments (7 cols) */}
        <Card className="lg:col-span-7 p-6 space-y-6">
          <form onSubmit={handlePredict} className="space-y-6">
            {/* Step 1: Post details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E8E6DF] dark:border-[#232B3E]">
                <h3 className="text-sm font-bold text-[#1F2430] dark:text-white flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/50 text-[#5B5BD6] dark:text-brand-300 text-xs flex items-center justify-center">1</span>
                  <span>Post Details & Format</span>
                </h3>
                <span className="text-xs text-[#5B6475] dark:text-[#94A3B8]">Step 1 of 2</span>
              </div>

              {/* Platform selector cards */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6475] dark:text-[#94A3B8] mb-2">
                  Choose Platform
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

              {/* Format selection */}
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

              {/* Title / Hook */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#5B6475] dark:text-[#94A3B8]">
                    Your Title or Opening Hook
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">{title.length} chars</span>
                </div>
                <textarea
                  rows={3}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Why 90% of Junior Devs Fail Technical Interviews..."
                  className="w-full bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] rounded-xl p-3 text-xs text-[#1F2430] dark:text-white focus:outline-none focus:border-[#5B5BD6] leading-relaxed"
                />
              </div>
            </div>

            {/* Step 2: Schedule & Timing */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#E8E6DF] dark:border-[#232B3E]">
                <h3 className="text-sm font-bold text-[#1F2430] dark:text-white flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/50 text-[#5B5BD6] dark:text-brand-300 text-xs flex items-center justify-center">2</span>
                  <span>Schedule & Timing</span>
                </h3>
                <span className="text-xs text-[#5B6475] dark:text-[#94A3B8]">Step 2 of 2</span>
              </div>

              {/* Numeric Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#5B6475] dark:text-[#94A3B8] mb-1.5 flex items-center space-x-1">
                    <Hash className="w-3.5 h-3.5 text-slate-400" />
                    <span>Hashtags</span>
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
                    <span>Duration (Sec)</span>
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
                    {getHourOptions().map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Day of Week Selector */}
              <div>
                <label className="block text-xs font-medium text-[#5B6475] dark:text-[#94A3B8] mb-1.5">
                  Posting Day
                </label>
                <div className="grid grid-cols-7 gap-1.5">
                  {WEEKDAYS.map((d) => (
                    <button
                      type="button"
                      key={d.label}
                      onClick={() => setPostWeekday(d.index)}
                      className={`py-2 rounded-lg text-xs font-semibold transition ${
                        postWeekday === d.index
                          ? 'bg-[#5B5BD6] text-white shadow-xs'
                          : 'bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] text-[#5B6475] dark:text-[#94A3B8] hover:border-slate-300'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Strictness bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#1F2430] dark:text-white flex items-center space-x-1.5">
                    <Target className="w-3.5 h-3.5 text-[#5B5BD6]" />
                    <span>How big a hit?</span>
                  </label>
                  <span className="text-[11px] text-[#5B6475] dark:text-[#94A3B8]">Target benchmark</span>
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
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              loading={loading}
              variant="primary"
              size="lg"
              className="w-full"
              icon={Sparkles}
            >
              See Your Hit Chance
            </Button>
          </form>
        </Card>

        {/* Right Column: Your Hit Chance & What-If Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live What-If Quick Gauge Banner */}
          {whatIfProb !== null && (
            <div className="p-4 rounded-2xl bg-white dark:bg-[#171D2B] border border-[#E8E6DF] dark:border-[#232B3E] flex items-center justify-between shadow-xs">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-[#5B5BD6] dark:text-brand-300 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1F2430] dark:text-white">
                    Live What-If Preview
                  </div>
                  <div className="text-[11px] text-[#5B6475] dark:text-[#94A3B8]">
                    Adjust hour or day above to see instant odds
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-extrabold text-[#5B5BD6] dark:text-brand-300">
                  {whatIfProb}%
                </div>
                <div className="text-[10px] text-slate-400">hit chance</div>
              </div>
            </div>
          )}

          {/* Results Card */}
          {result ? (
            <Card variant="tintedIndigo" className="p-6 space-y-6 border-brand-300 dark:border-brand-800 shadow-soft-lg">
              <div className="flex items-center justify-between pb-3.5 border-b border-brand-200 dark:border-brand-800/80">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B6475] dark:text-brand-300">
                    Your hit chance
                  </span>
                  <div className="text-sm font-bold text-[#1F2430] dark:text-white mt-0.5">
                    {result.strictness_label}
                  </div>
                </div>

                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white dark:bg-[#1A2333] border border-brand-200 dark:border-brand-700 text-[#5B5BD6] dark:text-brand-300 capitalize">
                  {result.confidence_level} Confidence
                </span>
              </div>

              {/* Big Radial Hit Chance Gauge */}
              <div className="text-center p-6 rounded-2xl bg-white dark:bg-[#151B28] border border-brand-200/80 dark:border-brand-800/60 shadow-xs space-y-2">
                <div className="text-xs font-semibold text-[#5B6475] dark:text-[#94A3B8] uppercase tracking-wider">
                  Estimated Hit Chance
                </div>

                <div className="text-5xl font-extrabold text-[#5B5BD6] dark:text-brand-300 tracking-tight my-1">
                  {result.predicted_prob_percent}%
                </div>

                <div className="text-xs text-[#5B6475] dark:text-[#94A3B8]">
                  Your usual rate is <strong className="text-[#1F2430] dark:text-white">{result.base_rate_percent}%</strong>{' '}
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">({result.ratio_display})</span>
                </div>

                <div className="mt-3 inline-block px-3 py-1 rounded-full bg-[#FAF9F6] dark:bg-[#1A2333] border border-[#E8E6DF] dark:border-[#232B3E] text-xs text-[#5B6475] dark:text-[#94A3B8]">
                  Realistic range: <strong className="text-[#1F2430] dark:text-white">{result.range_display}</strong>
                </div>

                {/* Plain-Language Truth Guarantee */}
                <div className="pt-2 text-[11px] text-slate-400 italic">
                  This is an estimate, not a guarantee.
                </div>
              </div>

              {/* Why this score? Top Factors */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B6475] dark:text-brand-300 mb-2.5">
                  Top Factors Influencing This Score
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
                    How viewers watched similar past posts
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
                <strong className="text-[#5B5BD6] dark:text-brand-300">See Your Hit Chance</strong>.
                We'll compare it against your past baseline to see how likely it is to stand out.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
