import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SearchCheck,
  Sparkles,
  Link2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Cpu,
  BarChart2,
  MessageSquare,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { YoutubeIcon, TwitterIcon } from '../components/SocialIcons';
import { analyzeVibe, getVibeCheckStatus, getMlModelsComparison } from '../api/apiClient';
import { useToast } from '../context/ToastContext';

export default function VibeCheck({ initialTab = 'analyze', onTabChange }) {
  const { addToast } = useToast();

  // Active top tab: 'analyze' or 'benchmark'
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  // Platform selection: 'youtube' or 'twitter'
  const [selectedPlatform, setSelectedPlatform] = useState('youtube');

  // Input states
  const [urlInput, setUrlInput] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [showOptionalTextInput, setShowOptionalTextInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);

  // Analysis result state
  const [analysis, setAnalysis] = useState(null);
  const [commentFilter, setCommentFilter] = useState('all');

  // Status & ML Model Comparison state
  const [apiStatus, setApiStatus] = useState(null);
  const [mlModels, setMlModels] = useState(null);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    getVibeCheckStatus()
      .then((res) => setApiStatus(res))
      .catch(() => {});

    fetchModelBenchmark();
  }, []);

  const fetchModelBenchmark = async () => {
    setLoadingModels(true);
    try {
      const data = await getMlModelsComparison();
      setMlModels(data);
    } catch {
      // quiet fallback
    } finally {
      setLoadingModels(false);
    }
  };

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setAnalysis(null);

    const trimmedUrl = urlInput.trim();
    const trimmedPasted = pastedText.trim();

    if (!trimmedUrl && !trimmedPasted) {
      setError('Please provide a video or post URL (or paste text directly).');
      return;
    }

    // Client-side quick check
    if (trimmedUrl) {
      const lower = trimmedUrl.toLowerCase();
      if (selectedPlatform === 'youtube' && !lower.includes('youtube.com') && !lower.includes('youtu.be')) {
        setError('The entered URL does not appear to be a YouTube link. Please check the URL or select X (Twitter).');
        return;
      }
      if (selectedPlatform === 'twitter' && !lower.includes('x.com') && !lower.includes('twitter.com')) {
        setError('The entered URL does not appear to be an X (Twitter) link. Please check the URL or select YouTube.');
        return;
      }
    }

    setLoading(true);
    setLoadingStep(1);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 600);

    try {
      const payload = {
        platform: selectedPlatform,
        save_to_history: true,
      };

      if (trimmedUrl) {
        payload.target = trimmedUrl;
        payload.input_type = 'url';
        if (trimmedPasted) {
          payload.raw_text = trimmedPasted;
        }
      } else {
        payload.input_type = 'pasted_comments';
        payload.raw_text = trimmedPasted;
      }

      const res = await analyzeVibe(payload);
      clearInterval(stepInterval);
      setAnalysis(res);

      if (res?.vibecheck_results?.has_prediction) {
        addToast(`Sentiment analysis completed using ${res.vibecheck_results.analysis_information.selected_ml_model}!`, 'success');
      } else {
        addToast('Content retrieved, but no comments available to analyze.', 'info');
      }
    } catch (err) {
      clearInterval(stepInterval);
      setError(err.message || 'An error occurred during sentiment analysis.');
    } finally {
      setLoading(false);
      setLoadingStep(0);
    }
  };

  const results = analysis?.vibecheck_results;
  const metadata = analysis?.metadata;
  const coverage = analysis?.coverage;

  const getOverallVibeBadge = (vibe) => {
    const v = (vibe || '').toLowerCase();
    if (v === 'positive') {
      return {
        label: 'Positive',
        bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        icon: ThumbsUp,
        desc: 'Audience reaction is overwhelmingly favorable, supportive, and enthusiastic.',
      };
    }
    if (v === 'negative') {
      return {
        label: 'Negative',
        bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
        icon: ThumbsDown,
        desc: 'Audience reaction expresses notable dissatisfaction, criticism, or disappointment.',
      };
    }
    return {
      label: 'Neutral',
      bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
      icon: Minus,
      desc: 'Audience reaction is balanced, objective, or purely informative with mixed sentiments.',
    };
  };

  const filteredComments = (analysis?.comments || []).filter((c) => {
    if (commentFilter === 'all') return true;
    return c.sentiment === commentFilter;
  });

  return (
    <div className="space-y-8">
      {/* View Switcher: VibeCheck vs ML Models Benchmark */}
      {activeTab === 'benchmark' ? (
        <MLModelBenchmarkView
          mlModels={mlModels}
          loading={loadingModels}
          onBack={() => handleTabSwitch('analyze')}
        />
      ) : (
        <>
          {/* Hero Header */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Machine Learning Sentiment Classification</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] dark:text-[#F8FAFC] tracking-tight">
              VibeCheck <span className="text-violet-600 dark:text-violet-400">AI</span>
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Analyze audience sentiment for any YouTube video or X post. Predicts whether the overall reaction is{' '}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Positive</span>,{' '}
              <span className="font-semibold text-blue-600 dark:text-blue-400">Neutral</span>, or{' '}
              <span className="font-semibold text-rose-600 dark:text-rose-400">Negative</span> using traditional Machine Learning.
            </p>
          </div>

          {/* Main Input Card */}
          <div className="bg-white dark:bg-[#131927] rounded-2xl border border-[#EAE7F5] dark:border-[#1F293D] shadow-sm p-5 sm:p-7 space-y-6">
            {/* 1. Platform Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                1. Select Platform
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => setSelectedPlatform('youtube')}
                  className={`flex items-center justify-center space-x-2.5 p-3 rounded-xl border text-sm font-semibold transition ${
                    selectedPlatform === 'youtube'
                      ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <YoutubeIcon className="w-5 h-5 text-[#FF0000]" />
                  <span>YouTube</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPlatform('twitter')}
                  className={`flex items-center justify-center space-x-2.5 p-3 rounded-xl border text-sm font-semibold transition ${
                    selectedPlatform === 'twitter'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-400 dark:border-slate-600 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <TwitterIcon className="w-4 h-4 text-slate-900 dark:text-white" />
                  <span>X (Twitter)</span>
                </button>
              </div>
            </div>

            {/* 2. URL Input */}
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  2. Paste {selectedPlatform === 'youtube' ? 'YouTube Video' : 'X Post'} URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Link2 className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder={
                      selectedPlatform === 'youtube'
                        ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                        : 'https://x.com/username/status/1234567890'
                    }
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 dark:text-white placeholder-slate-400"
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>
                    {selectedPlatform === 'youtube'
                      ? 'Official YouTube Data API v3 retrieves real audience comments.'
                      : 'Official X API v2 Bearer Token integration.'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowOptionalTextInput(!showOptionalTextInput)}
                    className="text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center space-x-1"
                  >
                    <span>{showOptionalTextInput ? 'Hide custom text' : 'Paste custom replies/comments'}</span>
                    {showOptionalTextInput ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Optional Manual Comments Input Accordion */}
              {showOptionalTextInput && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Optional: Custom Audience Comments or Post Text
                    </label>
                    <span className="text-[10px] text-slate-500">1 comment per line</span>
                  </div>
                  <textarea
                    rows={4}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Alex: Loved the explanation in this video!&#10;Chris: Audio was too quiet at the beginning.&#10;Sam: What lens did you use for the setup?"
                    className="w-full p-2.5 bg-white dark:bg-[#131927] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                  <p className="text-[11px] text-slate-500">
                    Useful if comments on YouTube are disabled or if X developer credits are exhausted (HTTP 402).
                  </p>
                </div>
              )}

              {/* 3. Analyze Vibe Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || (!urlInput.trim() && !pastedText.trim())}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md shadow-violet-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Analyzing Vibe...</span>
                    </>
                  ) : (
                    <>
                      <SearchCheck className="w-4 h-4" />
                      <span>Analyze Vibe</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Loading Indicator */}
            {loading && (
              <div className="p-4 rounded-xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200/60 dark:border-violet-800/40 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-violet-900 dark:text-violet-200">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-violet-600" />
                    <span>ML Sentiment Analysis in Progress...</span>
                  </div>
                  <span>Step {loadingStep} of 4</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-violet-600 h-full transition-all duration-300"
                    style={{ width: `${(loadingStep / 4) * 100}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className={loadingStep >= 1 ? 'font-semibold text-violet-600 dark:text-violet-400' : ''}>
                    1. URL Validation
                  </span>
                  <span className={loadingStep >= 2 ? 'font-semibold text-violet-600 dark:text-violet-400' : ''}>
                    2. Content Retrieval
                  </span>
                  <span className={loadingStep >= 3 ? 'font-semibold text-violet-600 dark:text-violet-400' : ''}>
                    3. TF-IDF Preprocessing
                  </span>
                  <span className={loadingStep >= 4 ? 'font-semibold text-violet-600 dark:text-violet-400' : ''}>
                    4. ML Classification
                  </span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-start space-x-3 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">Analysis Notice</div>
                  <div className="text-xs leading-relaxed">{error}</div>
                </div>
              </div>
            )}
          </div>

          {/* VIBECHECK RESULTS INTERFACE */}
          {analysis && (
            <div className="space-y-6">
              {/* Content Header Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131927] border border-[#EAE7F5] dark:border-[#1F293D] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {metadata?.platform === 'youtube' ? 'YouTube Video' : 'X (Twitter) Post'}
                    </span>
                    {metadata?.post_url && (
                      <a
                        href={metadata.post_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center space-x-1"
                      >
                        <span>View Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white line-clamp-1">
                    {metadata?.title || 'Analyzed Content'}
                  </h2>
                  <div className="text-xs text-slate-500">
                    By <span className="font-semibold text-slate-700 dark:text-slate-300">{metadata?.author || 'Creator'}</span>
                    {metadata?.view_count > 0 && ` • ${metadata.view_count.toLocaleString()} views`}
                    {metadata?.like_count > 0 && ` • ${metadata.like_count.toLocaleString()} likes`}
                  </div>
                </div>

                <div className="shrink-0 flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {results?.analysis_information?.samples_analyzed || 0} samples analyzed
                  </span>
                </div>
              </div>

              {/* Case 1: Usable text retrieved & ML Prediction available */}
              {results?.has_prediction ? (
                <>
                  {/* Row 1: Overall Vibe & Sentiment Distribution */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* A. Overall Vibe Card */}
                    {(() => {
                      const badge = getOverallVibeBadge(results.overall_vibe);
                      const BadgeIcon = badge.icon;
                      return (
                        <div className="bg-white dark:bg-[#131927] rounded-2xl border border-[#EAE7F5] dark:border-[#1F293D] shadow-sm p-5 sm:p-6 flex flex-col justify-between">
                          <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                              A. Overall Vibe
                            </div>
                            <div className="flex items-center space-x-3 my-3">
                              <div className={`p-3 rounded-2xl border ${badge.bg}`}>
                                <BadgeIcon className="w-7 h-7" />
                              </div>
                              <div>
                                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                  {badge.label}
                                </span>
                                <div className="text-xs text-slate-500 font-medium">Predominant audience sentiment</div>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3">
                            {badge.desc}
                          </p>
                        </div>
                      );
                    })()}

                    {/* B. Sentiment Distribution Visualization */}
                    <div className="md:col-span-2 bg-white dark:bg-[#131927] rounded-2xl border border-[#EAE7F5] dark:border-[#1F293D] shadow-sm p-5 sm:p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          B. Sentiment Distribution
                        </div>
                        <span className="text-[11px] text-slate-500">
                          Based on {results.counts.total} ML text predictions
                        </span>
                      </div>

                      {/* Stacked Progress Bar */}
                      <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                        <div
                          style={{ width: `${results.sentiment_distribution.positive_percentage}%` }}
                          className="bg-emerald-500 transition-all duration-500"
                          title={`Positive: ${results.sentiment_distribution.positive_percentage}%`}
                        />
                        <div
                          style={{ width: `${results.sentiment_distribution.neutral_percentage}%` }}
                          className="bg-blue-500 transition-all duration-500"
                          title={`Neutral: ${results.sentiment_distribution.neutral_percentage}%`}
                        />
                        <div
                          style={{ width: `${results.sentiment_distribution.negative_percentage}%` }}
                          className="bg-rose-500 transition-all duration-500"
                          title={`Negative: ${results.sentiment_distribution.negative_percentage}%`}
                        />
                      </div>

                      {/* Percentage Detail Cards */}
                      <div className="grid grid-cols-3 gap-3 pt-1">
                        <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/50">
                          <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>Positive</span>
                          </div>
                          <div className="text-xl font-extrabold text-emerald-900 dark:text-emerald-200 mt-1">
                            {results.sentiment_distribution.positive_percentage}%
                          </div>
                          <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
                            {results.counts.positive} comments
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/50">
                          <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-700 dark:text-blue-400">
                            <Minus className="w-3.5 h-3.5" />
                            <span>Neutral</span>
                          </div>
                          <div className="text-xl font-extrabold text-blue-900 dark:text-blue-200 mt-1">
                            {results.sentiment_distribution.neutral_percentage}%
                          </div>
                          <div className="text-[11px] text-blue-600/80 dark:text-blue-400/80">
                            {results.counts.neutral} comments
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/50">
                          <div className="flex items-center space-x-1.5 text-xs font-bold text-rose-700 dark:text-rose-400">
                            <ThumbsDown className="w-3.5 h-3.5" />
                            <span>Negative</span>
                          </div>
                          <div className="text-xl font-extrabold text-rose-900 dark:text-rose-200 mt-1">
                            {results.sentiment_distribution.negative_percentage}%
                          </div>
                          <div className="text-[11px] text-rose-600/80 dark:text-rose-400/80">
                            {results.counts.negative} comments
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Analysis Summary & Analysis Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* C. Analysis Summary */}
                    <div className="bg-white dark:bg-[#131927] rounded-2xl border border-[#EAE7F5] dark:border-[#1F293D] shadow-sm p-5 sm:p-6 space-y-2.5">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        C. Analysis Summary
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {results.analysis_summary}
                      </p>
                      {coverage?.notice && (
                        <div className="text-xs text-slate-500 bg-slate-50 dark:bg-[#0B0F19] p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                          {coverage.notice}
                        </div>
                      )}
                    </div>

                    {/* D. Analysis Information */}
                    <div className="bg-white dark:bg-[#131927] rounded-2xl border border-[#EAE7F5] dark:border-[#1F293D] shadow-sm p-5 sm:p-6 space-y-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        D. Analysis Information
                      </div>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        <div>
                          <dt className="text-slate-500">Platform</dt>
                          <dd className="font-bold text-slate-900 dark:text-white">
                            {results.analysis_information.platform}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Selected ML Model</dt>
                          <dd className="font-bold text-violet-600 dark:text-violet-400">
                            {results.analysis_information.selected_ml_model}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Analyzed Samples</dt>
                          <dd className="font-bold text-slate-900 dark:text-white">
                            {results.analysis_information.samples_analyzed}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Analysis Status</dt>
                          <dd className="font-bold text-emerald-600 dark:text-emerald-400">
                            {results.analysis_information.analysis_status}
                          </dd>
                        </div>
                      </dl>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Traditional ML (TF-IDF + Stratified Classifier)</span>
                        <button
                          onClick={() => handleTabSwitch('benchmark')}
                          className="text-violet-600 dark:text-violet-400 hover:underline font-semibold inline-flex items-center space-x-1"
                        >
                          <span>View Benchmark</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Individual Comments with Sentiment Tags */}
                  {analysis?.comments && analysis.comments.length > 0 && (
                    <div className="bg-white dark:bg-[#131927] rounded-2xl border border-[#EAE7F5] dark:border-[#1F293D] shadow-sm p-5 sm:p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4 text-slate-400" />
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            Analyzed Audience Comments ({analysis.comments.length})
                          </h3>
                        </div>

                        {/* Filter pills */}
                        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-[#0B0F19] p-1 rounded-xl text-xs">
                          {['all', 'positive', 'neutral', 'negative'].map((flt) => (
                            <button
                              key={flt}
                              onClick={() => setCommentFilter(flt)}
                              className={`px-2.5 py-1 rounded-lg capitalize font-medium transition ${
                                commentFilter === flt
                                  ? 'bg-white dark:bg-[#1E2638] text-slate-900 dark:text-white shadow-2xs'
                                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              {flt}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Comments Scrollable List */}
                      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                        {filteredComments.map((c, i) => (
                          <div
                            key={c.comment_id || i}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-3 text-xs"
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{c.author}</span>
                                {c.is_spam && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                    Spam
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{c.text}</p>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize shrink-0 border ${
                                c.sentiment === 'positive'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                  : c.sentiment === 'negative'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                                  : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                              }`}
                            >
                              {c.sentiment}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Case 2: No usable text retrieved -> Honest Notice without Sentiment Prediction */
                <div className="p-6 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-3">
                  <div className="flex items-center space-x-2 text-base font-bold">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <span>No Sentiment Prediction Displayed</span>
                  </div>
                  <p className="text-sm leading-relaxed">
                    {coverage?.notice ||
                      'No usable comments or text content could be retrieved from the target URL. In accordance with honest evaluation requirements, no fabricated sentiment prediction is shown.'}
                  </p>
                  <div className="text-xs text-amber-800/80 dark:text-amber-300/80 bg-white/60 dark:bg-[#131927]/60 p-3 rounded-xl border border-amber-200/50 dark:border-amber-800/50 space-y-1">
                    <div className="font-semibold">Why did this happen?</div>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {metadata?.platform === 'youtube' ? (
                        <>
                          <li>The video creator may have disabled comments on this video.</li>
                          <li>The video is newly uploaded and currently has 0 comments.</li>
                        </>
                      ) : (
                        <>
                          <li>The official X API v2 returned HTTP 402 (Payment Required: credits depleted).</li>
                          <li>Per project policy, no additional paid credits are purchased.</li>
                        </>
                      )}
                    </ul>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => setShowOptionalTextInput(true)}
                      className="px-4 py-2 rounded-xl bg-amber-600 text-white font-semibold text-xs hover:bg-amber-700 transition"
                    >
                      Paste Audience Comments Directly
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ----------------- ML Models Benchmark Sub-component -----------------
function MLModelBenchmarkView({ mlModels, loading, onBack }) {
  const models = mlModels?.models || {};
  const datasetInfo = mlModels?.dataset_info || {};
  const bestModelName = mlModels?.best_model || 'Multinomial Naive Bayes';

  const modelKeys = Object.keys(models);

  return (
    <div className="space-y-6">
      {/* Benchmark Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <button
            onClick={onBack}
            className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline mb-1 inline-flex items-center space-x-1"
          >
            <span>← Back to VibeCheck Analyzer</span>
          </button>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            Machine Learning Algorithm Comparison
          </h2>
          <p className="text-xs text-slate-500">
            Rigorously trained and tested on {datasetInfo.total_samples || 1200} balanced social media sentiment samples (80% Train, 20% Stratified Test Split).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
            Selected Winner: {bestModelName}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-violet-600" />
          <p className="text-xs">Loading Machine Learning benchmark results...</p>
        </div>
      ) : (
        <>
          {/* Algorithm Comparison Table */}
          <div className="bg-white dark:bg-[#131927] rounded-2xl border border-[#EAE7F5] dark:border-[#1F293D] shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <BarChart2 className="w-4 h-4 text-violet-600" />
                <span>Evaluation Metrics Table (Traditional ML)</span>
              </h3>
              <span className="text-[11px] text-slate-400">Zero Data Leakage • TF-IDF (1,2 n-grams)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#0B0F19] text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Algorithm</th>
                    <th className="py-3 px-4">Accuracy</th>
                    <th className="py-3 px-4">Precision (Weighted)</th>
                    <th className="py-3 px-4">Recall (Weighted)</th>
                    <th className="py-3 px-4">F1-Score (Weighted)</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {modelKeys.map((key) => {
                    const m = models[key];
                    const isWinner = m.model_name === bestModelName;
                    return (
                      <tr
                        key={key}
                        className={isWinner ? 'bg-violet-50/40 dark:bg-violet-950/20 font-medium' : ''}
                      >
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                          <span>{m.model_name}</span>
                          {isWinner && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-violet-600 text-white font-extrabold uppercase">
                              Active in VibeCheck
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                          {(m.accuracy * 100).toFixed(2)}%
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                          {(m.precision_weighted * 100).toFixed(2)}%
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                          {(m.recall_weighted * 100).toFixed(2)}%
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          {(m.f1_score_weighted * 100).toFixed(2)}%
                        </td>
                        <td className="py-3.5 px-4">
                          {isWinner ? (
                            <span className="inline-flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Best Model</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">Candidate</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Confusion Matrices Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-violet-600" />
              <span>Confusion Matrices on Test Set (240 Holdout Samples)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {modelKeys.map((key) => {
                const m = models[key];
                const matrix = m.confusion_matrix?.matrix || [
                  [0, 0, 0],
                  [0, 0, 0],
                  [0, 0, 0],
                ];
                const labels = m.confusion_matrix?.labels || ['positive', 'neutral', 'negative'];
                const isWinner = m.model_name === bestModelName;

                return (
                  <div
                    key={key}
                    className={`p-4 rounded-2xl bg-white dark:bg-[#131927] border ${
                      isWinner
                        ? 'border-violet-400 dark:border-violet-600 ring-2 ring-violet-400/20'
                        : 'border-[#EAE7F5] dark:border-[#1F293D]'
                    } space-y-3`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{m.model_name}</span>
                      {isWinner && (
                        <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400">Winner</span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 font-medium">Rows = Actual, Columns = Predicted</div>

                    <div className="grid grid-cols-4 gap-1 text-center text-[10.5px]">
                      {/* Header */}
                      <div className="text-slate-400"></div>
                      <div className="font-bold text-emerald-600">Pos</div>
                      <div className="font-bold text-blue-600">Neu</div>
                      <div className="font-bold text-rose-600">Neg</div>

                      {/* Row 0: Pos */}
                      <div className="font-bold text-emerald-600 flex items-center justify-end pr-1">Pos</div>
                      <div className="p-1.5 rounded bg-emerald-50 dark:bg-emerald-950/40 font-bold text-emerald-800 dark:text-emerald-200">
                        {matrix[0][0]}
                      </div>
                      <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {matrix[0][1]}
                      </div>
                      <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {matrix[0][2]}
                      </div>

                      {/* Row 1: Neu */}
                      <div className="font-bold text-blue-600 flex items-center justify-end pr-1">Neu</div>
                      <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {matrix[1][0]}
                      </div>
                      <div className="p-1.5 rounded bg-blue-50 dark:bg-blue-950/40 font-bold text-blue-800 dark:text-blue-200">
                        {matrix[1][1]}
                      </div>
                      <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {matrix[1][2]}
                      </div>

                      {/* Row 2: Neg */}
                      <div className="font-bold text-rose-600 flex items-center justify-end pr-1">Neg</div>
                      <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {matrix[2][0]}
                      </div>
                      <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {matrix[2][1]}
                      </div>
                      <div className="p-1.5 rounded bg-rose-50 dark:bg-rose-950/40 font-bold text-rose-800 dark:text-rose-200">
                        {matrix[2][2]}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
