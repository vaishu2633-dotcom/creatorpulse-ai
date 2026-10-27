import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlatform } from '../context/PlatformContext';
import { useToast } from '../context/ToastContext';
import { generateContent, runIdeaTournament, createDraft } from '../api/apiClient';
import PageHeader from '../components/ui/PageHeader';
import HowItWorks from '../components/ui/HowItWorks';
import StatusChip from '../components/ui/StatusChip';
import PlatformBadge from '../components/PlatformBadge';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Tooltip from '../components/ui/Tooltip';
import StudioCreativeIllustration from '../assets/illustrations/studio-creative.svg';
import {
  PenTool,
  Trophy,
  Sparkles,
  Save,
  Check,
  Copy,
  Languages,
  ListOrdered,
  FileText,
  MessageSquare,
  HelpCircle,
  Hash,
  Flame,
  ArrowRight,
  Info,
  Calendar,
  ThumbsUp,
  Share2,
  Bookmark,
  Heart,
  MessageCircle,
  Repeat
} from 'lucide-react';

const HOW_IT_WORKS_STEPS = [
  {
    title: 'Choose Platform and Topic',
    description: 'Select where you are publishing and specify your core theme or video premise.'
  },
  {
    title: 'Generate or Rank Ideas',
    description: 'Create multi-part content packages or run a 10-idea tournament to find the highest breakout potential.'
  },
  {
    title: 'Edit, Copy, or Schedule',
    description: 'Copy hooks directly to your clipboard or send completed packages straight to Calendar & Drafts.'
  }
];

const PLATFORM_GOALS = [
  { id: 'engagement', label: 'Comments & Discussions', desc: 'Prompts replies and debates' },
  { id: 'shares', label: 'Maximum Shares', desc: 'Creates high-value saveable assets' },
  { id: 'authority', label: 'Authority & Trust', desc: 'Positions you as a category leader' },
  { id: 'conversion', label: 'Audience Action (CTA)', desc: 'Directs viewers to links or newsletter' },
];

const TONES = [
  { id: 'educational', label: 'Educational & Clear' },
  { id: 'storytelling', label: 'Narrative & Personal' },
  { id: 'direct', label: 'Punchy & Provocative' },
  { id: 'empathetic', label: 'Warm & Relatable' },
];

const LANGUAGES = [
  { id: 'English', label: 'English' },
  { id: 'Spanish', label: 'Spanish (Español)' },
  { id: 'German', label: 'German (Deutsch)' },
  { id: 'French', label: 'French (Français)' },
  { id: 'Hindi', label: 'Hindi (हिंदी)' },
];

export default function ContentStudio() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { selectedPlatform } = usePlatform();
  const { addToast } = useToast();

  const initialPlatform =
    searchParams.get('platform') ||
    (selectedPlatform !== 'all' ? selectedPlatform : 'youtube');
  const initialTopic = searchParams.get('topic') || 'Fullstack AI Development in 2026';

  const [platform, setPlatform] = useState(initialPlatform);
  const [topic, setTopic] = useState(initialTopic);
  const [goal, setGoal] = useState('engagement');
  const [tone, setTone] = useState('educational');
  const [language, setLanguage] = useState('English');

  const [generating, setGenerating] = useState(false);
  const [content, setContent] = useState(null);
  const [tournamentLoading, setTournamentLoading] = useState(false);
  const [tournamentResults, setTournamentResults] = useState(null);

  const [copiedSection, setCopiedSection] = useState(null);
  const [draftSaved, setDraftSaved] = useState(false);

  useEffect(() => {
    if (searchParams.get('topic')) {
      setTopic(searchParams.get('topic'));
    }
    if (searchParams.get('platform')) {
      setPlatform(searchParams.get('platform'));
    }
  }, [searchParams]);

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;

    setGenerating(true);
    setTournamentResults(null);
    setDraftSaved(false);

    try {
      const res = await generateContent({
        platform,
        topic,
        goal,
        tone,
        language,
      });
      setContent(res.content);
      addToast('Creative package generated successfully!', 'success');
    } catch (err) {
      addToast(`Generation failed: ${err.message}`, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleRunTournament = async () => {
    if (!topic.trim()) return;

    setTournamentLoading(true);
    try {
      const res = await runIdeaTournament({
        platform,
        topic,
        count: 10,
      });
      setTournamentResults(res.tournament_rankings);
      addToast('Top 10 ideas ranked successfully!', 'success');
    } catch (err) {
      addToast(`Ranking failed: ${err.message}`, 'error');
    } finally {
      setTournamentLoading(false);
    }
  };

  const copyToClipboard = (text, sectionName) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionName);
    addToast('Copied to clipboard!', 'info');
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleSaveDraft = async () => {
    if (!content) return;

    try {
      let draftTitle = topic;
      if (content.titles && content.titles.length > 0) {
        draftTitle = content.titles[0];
      } else if (content.hook) {
        draftTitle = content.hook.slice(0, 60);
      }

      await createDraft({
        platform: content.platform,
        title: draftTitle,
        status: 'idea',
        language: content.language,
        hook: content.hook || content.reel_concept || content.story_post,
        content_payload: content,
      });

      setDraftSaved(true);
      addToast('Saved to Calendar & Drafts!', 'success');
    } catch (err) {
      addToast(`Failed to save draft: ${err.message}`, 'error');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <PageHeader
        title="Content Studio"
        subtitle="Choose platform and topic, generate tailored copy, and save directly to your planner"
        tag="Creator Tool"
        status="Uses sample data"
        icon={PenTool}
        illustration={StudioCreativeIllustration}
      />

      {/* How it Works Strip */}
      <HowItWorks steps={HOW_IT_WORKS_STEPS} />

      {/* Template Mode Notification Banner */}
      <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 flex items-start space-x-3 text-xs text-[#5B6475] dark:text-[#94A3B8]">
        <Info className="w-4 h-4 text-[#5B5BD6] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-800 dark:text-slate-200">Template Mode Active:</strong> Running with curated high-retention frameworks. Add <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[11px] text-[#5B5BD6]">LLM_API_KEY</code> to <code className="font-mono text-[11px]">backend/.env</code> for custom AI generation via Gemini or OpenAI.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Creative Brief (5 cols) */}
        <Card className="lg:col-span-5 p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#EFECE6] dark:border-[#232B3E]">
            <h2 className="text-base font-bold text-[#1F2430] dark:text-white flex items-center space-x-2">
              <PenTool className="w-4 h-4 text-[#5B5BD6]" />
              <span>Creative Brief</span>
            </h2>
            <button
              type="button"
              onClick={handleRunTournament}
              disabled={tournamentLoading || !topic.trim()}
              className="text-xs font-bold text-[#14B8A6] hover:text-teal-700 dark:hover:text-teal-300 flex items-center space-x-1.5 transition disabled:opacity-40"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>{tournamentLoading ? 'Ranking...' : 'Rank Top 10'}</span>
            </button>
          </div>

          <form onSubmit={handleGenerate} className="space-y-5">
            {/* Platform Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6475] dark:text-[#94A3B8] mb-2">
                Platform Target
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['youtube', 'instagram', 'twitter', 'linkedin'].map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition border ${
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

            {/* Topic Input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#5B6475] dark:text-[#94A3B8]">
                  Topic or Video Idea
                </label>
                <span className="text-[11px] text-slate-400">Be specific</span>
              </div>
              <textarea
                rows={3}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. 5 Habits of High-Performing Engineers in 2026..."
                className="w-full bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] rounded-xl p-3 text-xs text-[#1F2430] dark:text-white focus:outline-none focus:border-[#5B5BD6] placeholder-slate-400 leading-relaxed"
              />
            </div>

            {/* Strategic Goal */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6475] dark:text-[#94A3B8] mb-1.5">
                Primary Goal
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PLATFORM_GOALS.map((g) => (
                  <button
                    type="button"
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    className={`p-2.5 rounded-xl text-left border transition text-xs ${
                      goal === g.id
                        ? 'bg-brand-50 dark:bg-brand-950/60 border-[#5B5BD6] text-[#5B5BD6] dark:text-brand-300 shadow-xs'
                        : 'bg-[#FAF9F6] dark:bg-[#131825] border-[#E8E6DF] dark:border-[#232B3E] text-[#5B6475] dark:text-[#94A3B8] hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold">{g.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tone & Multi-Lingual */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6475] dark:text-[#94A3B8] mb-1.5">
                  Voice Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] rounded-xl px-3 py-2 text-xs text-[#1F2430] dark:text-white focus:outline-none focus:border-[#5B5BD6]"
                >
                  {TONES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6475] dark:text-[#94A3B8] mb-1.5">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] rounded-xl px-3 py-2 text-xs text-[#1F2430] dark:text-white focus:outline-none focus:border-[#5B5BD6]"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              type="submit"
              loading={generating}
              variant="primary"
              size="lg"
              className="w-full"
              icon={Sparkles}
            >
              Generate Content Package
            </Button>
          </form>
        </Card>

        {/* Right Output View (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Top 10 Ideas Tournament Leaderboard */}
          {tournamentResults && (
            <Card className="p-6 space-y-4 border-teal-200 dark:border-teal-900/60 bg-teal-50/20 dark:bg-teal-950/10">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E6DF] dark:border-[#232B3E]">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <div>
                    <h3 className="text-sm font-bold text-[#1F2430] dark:text-white">
                      Top 10 Ideas (Ranked by Breakout Probability)
                    </h3>
                    <div className="text-[11px] text-[#5B6475] dark:text-[#94A3B8]">
                      Evaluated across 10 angles for {platform}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setTournamentResults(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Close
                </button>
              </div>

              <div className="space-y-2.5">
                {tournamentResults.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border transition flex items-center justify-between ${
                      item.is_winner
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/60 shadow-xs'
                        : 'bg-white dark:bg-[#171D2B] border-[#E8E6DF] dark:border-[#232B3E]'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0 pr-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        item.is_winner
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>
                        {item.rank}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#1F2430] dark:text-white truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-[#5B6475] dark:text-[#94A3B8]">
                          Angle: <span className="font-semibold">{item.angle_name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-extrabold text-[#5B5BD6] dark:text-brand-300 font-mono">
                        {item.predicted_prob_percent}%
                      </div>
                      <div className="text-[10px] text-slate-400">
                        usual: {item.base_rate_percent}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Generated Package */}
          {content ? (
            <div className="space-y-5">
              {/* Output Actions Bar */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#171D2B] border border-[#E8E6DF] dark:border-[#232B3E] shadow-soft">
                <div className="flex items-center space-x-2">
                  <PlatformBadge platform={content.platform} />
                  <span className="text-xs text-[#5B6475] dark:text-[#94A3B8]">
                    Generated in <strong className="text-[#1F2430] dark:text-white">{content.language}</strong>
                  </span>
                </div>

                <Button
                  variant={draftSaved ? 'teal' : 'primary'}
                  size="sm"
                  icon={draftSaved ? Check : Save}
                  onClick={handleSaveDraft}
                >
                  {draftSaved ? 'Saved to Planner!' : 'Save to Calendar & Drafts'}
                </Button>
              </div>

              {/* YouTube Authentic Preview */}
              {content.platform === 'youtube' && (
                <div className="space-y-4">
                  {/* YouTube Preview Card */}
                  <Card className="p-5 space-y-3">
                    <div className="flex items-center space-x-2 pb-2 border-b border-[#E8E6DF] dark:border-[#232B3E]">
                      <PlatformBadge platform="youtube" size="sm" showName />
                      <span className="text-xs font-bold text-[#1F2430] dark:text-white">
                        YouTube Video Preview
                      </span>
                    </div>

                    <div className="w-full h-44 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white flex flex-col justify-end p-4 relative overflow-hidden">
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/60 text-[10px] font-mono">
                        12:45
                      </div>
                      <div className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                        Title Preview
                      </div>
                      <div className="text-sm font-extrabold line-clamp-2">
                        {content.titles?.[0] || topic}
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B6475] dark:text-[#94A3B8]">
                        Alternative High-Click Titles
                      </h4>
                      {content.titles?.slice(1).map((t, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#141A28] border border-[#E8E6DF] dark:border-[#232B3E] text-xs flex justify-between items-center"
                        >
                          <span className="truncate pr-2">{t}</span>
                          <button
                            onClick={() => copyToClipboard(t, `yt_t_${idx}`)}
                            className="text-slate-400 hover:text-[#5B5BD6] p-1 shrink-0"
                          >
                            {copiedSection === `yt_t_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Cold Hook */}
                    <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-[#5B5BD6] dark:text-brand-300">
                        <span>First 30 Seconds (Cold Hook)</span>
                        <button
                          onClick={() => copyToClipboard(content.hook, 'yt_hook')}
                          className="text-[#5B5BD6] hover:underline"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="text-xs text-slate-800 dark:text-slate-200 italic leading-relaxed">
                        "{content.hook}"
                      </p>
                    </div>
                  </Card>
                </div>
              )}

              {/* Instagram Authentic Preview */}
              {content.platform === 'instagram' && (
                <div className="space-y-4">
                  <Card className="p-5 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E8E6DF] dark:border-[#232B3E]">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-0.5">
                          <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full flex items-center justify-center font-bold text-[10px]">
                            CP
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#1F2430] dark:text-white">
                            creatorpulse.studio
                          </div>
                          <div className="text-[10px] text-slate-400">Audio • Original audio</div>
                        </div>
                      </div>
                      <PlatformBadge platform="instagram" size="sm" />
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-tr from-pink-50 to-orange-50 dark:from-pink-950/20 dark:to-orange-950/20 border border-pink-200 dark:border-pink-900/30 space-y-2">
                      <div className="text-xs font-bold text-pink-700 dark:text-pink-300 uppercase tracking-wider">
                        Reel Visual Concept
                      </div>
                      <p className="text-xs text-[#1F2430] dark:text-slate-200 leading-relaxed">
                        {content.reel_concept}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>Caption & Hashtags</span>
                        <button
                          onClick={() => copyToClipboard(content.caption, 'ig_cap')}
                          className="text-[#5B5BD6] hover:underline"
                        >
                          Copy caption
                        </button>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                        {content.caption}
                      </p>
                    </div>

                    {/* Carousel Outline */}
                    {content.carousel_outline && (
                      <div className="space-y-2 pt-1">
                        <div className="text-xs font-bold uppercase tracking-wider text-[#5B6475] dark:text-[#94A3B8]">
                          Carousel Slide Outline (5 Slides)
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {content.carousel_outline.map((s) => (
                            <div key={s.slide} className="p-3 rounded-xl bg-slate-50 dark:bg-[#141A28] border border-[#E8E6DF] dark:border-[#232B3E] text-xs">
                              <span className="font-bold text-[#1F2430] dark:text-white block">
                                Slide {s.slide}: {s.heading}
                              </span>
                              <span className="text-[11px] text-[#5B6475] dark:text-[#94A3B8]">{s.sub}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {/* Twitter / X Authentic Preview (Strictly NO verified badge) */}
              {content.platform === 'twitter' && (
                <div className="space-y-4">
                  <Card className="p-5 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E8E6DF] dark:border-[#232B3E]">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                          CP
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#1F2430] dark:text-white flex items-center space-x-1">
                            <span>CreatorPulse</span>
                            <span className="text-slate-400 font-normal">@creatorpulse</span>
                          </div>
                        </div>
                      </div>
                      <PlatformBadge platform="twitter" size="sm" />
                    </div>

                    {/* Hook Variants */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-[#5B6475] dark:text-[#94A3B8]">
                        Opening Hook Options
                      </div>
                      {content.hook_variants?.map((h, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] text-xs text-[#1F2430] dark:text-slate-200 flex justify-between items-center"
                        >
                          <span className="pr-2">{h}</span>
                          <button
                            onClick={() => copyToClipboard(h, `tw_h_${i}`)}
                            className="text-slate-400 hover:text-[#5B5BD6] p-1 shrink-0"
                          >
                            {copiedSection === `tw_h_${i}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Full Thread Tweets */}
                    <div className="space-y-2 pt-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-[#5B6475] dark:text-[#94A3B8]">
                        Complete Thread Flow (5 Tweets)
                      </div>
                      <div className="space-y-2">
                        {content.thread_tweets?.map((tweet, i) => (
                          <div
                            key={i}
                            className="p-3.5 rounded-xl bg-white dark:bg-[#171D2B] border border-[#E8E6DF] dark:border-[#232B3E] text-xs space-y-1 relative pl-8"
                          >
                            <span className="absolute left-2.5 top-3.5 text-[10px] font-mono font-bold text-slate-400">
                              {i + 1}/5
                            </span>
                            <p className="text-[#1F2430] dark:text-slate-200 leading-relaxed">
                              {tweet}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* LinkedIn Authentic Preview */}
              {content.platform === 'linkedin' && (
                <div className="space-y-4">
                  <Card className="p-5 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E8E6DF] dark:border-[#232B3E]">
                      <div className="flex items-center space-x-2">
                        <div className="w-9 h-9 rounded-full bg-[#0A66C2] text-white flex items-center justify-center font-bold text-xs">
                          CP
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#1F2430] dark:text-white">
                            CreatorPulse Studio
                          </div>
                          <div className="text-[10px] text-slate-400">Author & Content Strategist • 1h</div>
                        </div>
                      </div>
                      <PlatformBadge platform="linkedin" size="sm" />
                    </div>

                    <div className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span>Story & Perspective Post</span>
                        <button
                          onClick={() => copyToClipboard(content.story_post, 'li_post')}
                          className="text-[#5B5BD6] hover:underline"
                        >
                          Copy post
                        </button>
                      </div>
                      <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                        {content.story_post}
                      </p>
                    </div>

                    {/* Actionable listicle */}
                    {content.listicle && (
                      <div className="space-y-2 pt-1">
                        <div className="text-xs font-bold uppercase tracking-wider text-[#5B6475] dark:text-[#94A3B8]">
                          Actionable 5-Point Takeaway
                        </div>
                        <div className="space-y-1.5">
                          {content.listicle.map((point, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#141A28] border border-[#E8E6DF] dark:border-[#232B3E] text-xs">
                              {point}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              )}
            </div>
          ) : (
            /* Start Screen with Local Creative Illustration */
            <Card className="p-8 sm:p-12 text-center space-y-4">
              <div className="w-56 h-44 mx-auto">
                <img
                  src={StudioCreativeIllustration}
                  alt="Creative writing studio desk illustration"
                  className="w-full h-full object-contain"
                />
              </div>

              <h3 className="text-base font-bold text-[#1F2430] dark:text-white">
                Studio Ready for Ideas
              </h3>

              <p className="text-xs text-[#5B6475] dark:text-[#94A3B8] leading-relaxed max-w-sm mx-auto">
                Enter your topic on the left and click{' '}
                <strong className="text-[#5B5BD6] dark:text-brand-300">Generate Content Package</strong>{' '}
                or discover proven winning angles with the{' '}
                <strong className="text-teal-600 dark:text-teal-400">Top 10 Ideas</strong> tournament.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
