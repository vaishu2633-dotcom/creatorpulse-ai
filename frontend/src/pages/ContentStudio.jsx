import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePlatform } from '../context/PlatformContext';
import { useToast } from '../context/ToastContext';
import {
  getContentStudioStatus,
  generateContent,
  runIdeaTournament,
  createDraft,
} from '../api/apiClient';
import PageHeader from '../components/ui/PageHeader';
import HowItWorks from '../components/ui/HowItWorks';
import PlatformBadge from '../components/PlatformBadge';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StudioCreativeIllustration from '../assets/illustrations/studio-creative.svg';
import {
  PenTool,
  Trophy,
  Sparkles,
  Save,
  Check,
  Copy,
  Info,
  Calendar,
  RotateCw,
  Edit3,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

const HOW_IT_WORKS_STEPS = [
  {
    title: 'Choose Platform and Topic',
    description: 'Select your target channel and define your core hook or video premise.',
  },
  {
    title: 'Generate or Rank Ideas',
    description: 'Create multi-part content packages or run a 10-idea tournament scored by the real predictor.',
  },
  {
    title: 'Edit, Copy, or Plan',
    description: 'Tweak copy inline, copy individual sections or the full brief, and save straight to Calendar & Drafts.',
  },
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
  { id: 'Hindi', label: 'Hindi (हिंदी)' },
  { id: 'Marathi', label: 'Marathi (मराठी)' },
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

  const [llmStatus, setLlmStatus] = useState({
    has_key: false,
    mode: 'template',
    model_label: 'Curated Templates',
  });

  const [generating, setGenerating] = useState(false);
  const [content, setContent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState({});

  const [tournamentLoading, setTournamentLoading] = useState(false);
  const [tournamentResults, setTournamentResults] = useState(null);

  const [copiedSection, setCopiedSection] = useState(null);
  const [draftSaved, setDraftSaved] = useState(false);

  // Load LLM status on mount
  useEffect(() => {
    let mounted = true;
    getContentStudioStatus()
      .then((res) => {
        if (mounted && res) {
          setLlmStatus(res);
        }
      })
      .catch(() => {
        // Fallback default
      });
    return () => {
      mounted = false;
    };
  }, []);

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
    setIsEditing(false);

    try {
      const res = await generateContent({
        platform,
        topic,
        goal,
        tone,
        language,
      });
      const generated = res.content || res;
      setContent(generated);
      setEditableContent({ ...generated });
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
        language,
      });
      setTournamentResults(res.tournament_rankings);
      addToast('Top 10 ideas ranked with calibrated predictor!', 'success');
    } catch (err) {
      addToast(`Ranking failed: ${err.message}`, 'error');
    } finally {
      setTournamentLoading(false);
    }
  };

  const copyToClipboard = (text, sectionName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionName);
    addToast('Copied to clipboard!', 'info');
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleCopyAll = () => {
    if (!content) return;
    const c = isEditing ? editableContent : content;
    let fullText = `=== CREATORPULSE CONTENT PACKAGE ===\nPlatform: ${c.platform}\nLanguage: ${c.language}\nTopic: ${c.topic}\n\n`;

    if (c.platform === 'youtube') {
      fullText += `TITLES:\n${(c.titles || []).map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\n`;
      fullText += `HOOK (Cold Open):\n${c.hook || ''}\n\n`;
      fullText += `DESCRIPTION:\n${c.description || ''}\n\n`;
      fullText += `TAGS:\n${(c.tags || []).join(', ')}`;
    } else if (c.platform === 'instagram') {
      fullText += `REEL CONCEPT:\n${c.reel_concept || ''}\n\n`;
      fullText += `CAPTION:\n${c.caption || ''}\n\n`;
      fullText += `HASHTAGS:\n${(c.hashtags || []).join(' ')}`;
    } else if (c.platform === 'twitter') {
      fullText += `HOOK VARIANTS:\n${(c.hook_variants || []).map((h, i) => `${i + 1}. ${h}`).join('\n')}\n\n`;
      fullText += `SINGLE POST:\n${c.single_post || ''}\n\n`;
      fullText += `THREAD:\n${(c.thread_tweets || []).join('\n\n')}`;
    } else {
      fullText += `STORY POST:\n${c.story_post || ''}\n\n`;
      fullText += `LISTICLE:\n${(c.listicle || []).join('\n')}`;
    }

    copyToClipboard(fullText, 'copy_all');
  };

  const handleSaveDraft = async () => {
    const activeData = isEditing ? editableContent : content;
    if (!activeData) return;

    try {
      let draftTitle = topic;
      if (activeData.titles && activeData.titles.length > 0) {
        draftTitle = activeData.titles[0];
      } else if (activeData.single_post) {
        draftTitle = activeData.single_post.slice(0, 60);
      } else if (activeData.hook) {
        draftTitle = activeData.hook.slice(0, 60);
      } else if (activeData.reel_concept) {
        draftTitle = activeData.reel_concept.slice(0, 60);
      }

      await createDraft({
        platform: activeData.platform,
        title: draftTitle,
        status: 'idea',
        language: activeData.language,
        hook: activeData.hook || activeData.reel_concept || activeData.story_post || activeData.single_post,
        content_payload: activeData,
      });

      setDraftSaved(true);
      addToast('Saved to Calendar & Drafts!', 'success');
    } catch (err) {
      addToast(`Failed to save draft: ${err.message}`, 'error');
    }
  };

  const handleSelectTournamentIdea = (item) => {
    setTopic(item.title);
    addToast(`Selected idea: "${item.title.slice(0, 40)}..."`, 'info');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <PageHeader
        title="Content Studio"
        subtitle="Choose platform and topic, generate tailored copy, and save directly to your planner"
        tag="Creator Tool"
        status={llmStatus.has_key ? 'Working now' : 'Uses sample data'}
        icon={PenTool}
        illustration={StudioCreativeIllustration}
      />

      {/* How it Works Strip */}
      <HowItWorks steps={HOW_IT_WORKS_STEPS} />

      {/* Mode Notification Banner */}
      <div
        className={`p-3.5 rounded-2xl border flex items-center justify-between space-x-3 text-xs ${
          llmStatus.has_key
            ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300'
            : 'bg-indigo-50/70 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/40 text-[#5B6475] dark:text-[#94A3B8]'
        }`}
      >
        <div className="flex items-center space-x-2.5">
          <Info className={`w-4 h-4 shrink-0 ${llmStatus.has_key ? 'text-emerald-600' : 'text-[#5B5BD6]'}`} />
          <div>
            <strong className="text-slate-800 dark:text-slate-200 font-semibold">
              {llmStatus.has_key ? 'AI Generation Mode Active' : 'Template Mode Active'}:
            </strong>{' '}
            {llmStatus.has_key
              ? `Connected to ${llmStatus.model_label}. Custom copy is generated on demand.`
              : 'Running curated high-retention frameworks. Set LLM_API_KEY in .env for custom AI generation.'}
          </div>
        </div>

        <div className="shrink-0">
          <span
            className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-bold border ${
              llmStatus.has_key
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300'
                : 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-300'
            }`}
          >
            {llmStatus.has_key ? 'AI Mode' : 'Template mode'}
          </span>
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
              <span>{tournamentLoading ? 'Ranking Ideas...' : 'Rank Top 10'}</span>
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
                      Top 10 Ideas (Ranked by Real Predictor)
                    </h3>
                    <div className="text-[11px] text-[#5B6475] dark:text-[#94A3B8]">
                      Calibrated breakout probabilities for {platform} in {language}
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
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          item.is_winner
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {item.rank}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#1F2430] dark:text-white truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-[#5B6475] dark:text-[#94A3B8] flex items-center space-x-2 mt-0.5">
                          <span>
                            Angle: <strong className="font-semibold">{item.angle_name}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSelectTournamentIdea(item)}
                            className="text-[#5B5BD6] hover:underline font-bold text-[11px] inline-flex items-center space-x-0.5"
                          >
                            <span>Use as Topic</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
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
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#171D2B] border border-[#E8E6DF] dark:border-[#232B3E] shadow-soft">
                <div className="flex items-center space-x-2">
                  <PlatformBadge platform={content.platform} />
                  <span className="text-xs text-[#5B6475] dark:text-[#94A3B8]">
                    Generated in <strong className="text-[#1F2430] dark:text-white">{content.language}</strong> (
                    {content.generation_mode === 'ai' ? 'AI' : 'Template'})
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={isEditing ? Check : Edit3}
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? 'Done Editing' : 'Edit Copy'}
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    icon={copiedSection === 'copy_all' ? Check : Copy}
                    onClick={handleCopyAll}
                  >
                    {copiedSection === 'copy_all' ? 'Copied All!' : 'Copy All'}
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    icon={RotateCw}
                    loading={generating}
                    onClick={handleGenerate}
                  >
                    Regenerate
                  </Button>

                  <Button
                    variant={draftSaved ? 'teal' : 'primary'}
                    size="sm"
                    icon={draftSaved ? Check : Save}
                    onClick={handleSaveDraft}
                  >
                    {draftSaved ? 'Saved to Planner!' : 'Save to Drafts'}
                  </Button>
                </div>
              </div>

              {/* YouTube Preview */}
              {content.platform === 'youtube' && (
                <div className="space-y-4">
                  <Card className="p-5 space-y-3">
                    <div className="flex items-center space-x-2 pb-2 border-b border-[#E8E6DF] dark:border-[#232B3E]">
                      <PlatformBadge platform="youtube" size="sm" showName />
                      <span className="text-xs font-bold text-[#1F2430] dark:text-white">
                        YouTube Video Package
                      </span>
                    </div>

                    <div className="w-full h-44 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white flex flex-col justify-end p-4 relative overflow-hidden">
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/60 text-[10px] font-mono">
                        12:45
                      </div>
                      <div className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                        Primary Title
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editableContent.titles?.[0] || ''}
                          onChange={(e) => {
                            const newTitles = [...(editableContent.titles || [])];
                            newTitles[0] = e.target.value;
                            setEditableContent({ ...editableContent, titles: newTitles });
                          }}
                          className="w-full bg-black/60 border border-slate-600 rounded p-1.5 text-xs text-white"
                        />
                      ) : (
                        <div className="text-sm font-extrabold line-clamp-2">
                          {(editableContent.titles && editableContent.titles[0]) || topic}
                        </div>
                      )}
                    </div>

                    {/* Titles */}
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B6475] dark:text-[#94A3B8]">
                          Alternative Titles
                        </h4>
                      </div>
                      {(editableContent.titles || []).slice(1).map((t, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#141A28] border border-[#E8E6DF] dark:border-[#232B3E] text-xs flex justify-between items-center"
                        >
                          {isEditing ? (
                            <input
                              type="text"
                              value={t}
                              onChange={(e) => {
                                const newTitles = [...(editableContent.titles || [])];
                                newTitles[idx + 1] = e.target.value;
                                setEditableContent({ ...editableContent, titles: newTitles });
                              }}
                              className="w-full bg-transparent border-none text-xs text-[#1F2430] dark:text-white focus:outline-none"
                            />
                          ) : (
                            <span className="truncate pr-2">{t}</span>
                          )}
                          <button
                            onClick={() => copyToClipboard(t, `yt_t_${idx}`)}
                            className="text-slate-400 hover:text-[#5B5BD6] p-1 shrink-0"
                          >
                            {copiedSection === `yt_t_${idx}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Hook */}
                    <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-[#5B5BD6] dark:text-brand-300">
                        <span>Cold Hook (First 30 Seconds)</span>
                        <button
                          onClick={() => copyToClipboard(editableContent.hook, 'yt_hook')}
                          className="text-[#5B5BD6] hover:underline"
                        >
                          Copy
                        </button>
                      </div>
                      {isEditing ? (
                        <textarea
                          rows={2}
                          value={editableContent.hook || ''}
                          onChange={(e) =>
                            setEditableContent({ ...editableContent, hook: e.target.value })
                          }
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 rounded p-2 text-xs"
                        />
                      ) : (
                        <p className="text-xs text-slate-800 dark:text-slate-200 italic leading-relaxed">
                          "{editableContent.hook}"
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    <div className="p-3.5 rounded-xl bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>Video Description & Timestamps</span>
                        <button
                          onClick={() => copyToClipboard(editableContent.description, 'yt_desc')}
                          className="text-[#5B5BD6] hover:underline"
                        >
                          Copy
                        </button>
                      </div>
                      {isEditing ? (
                        <textarea
                          rows={4}
                          value={editableContent.description || ''}
                          onChange={(e) =>
                            setEditableContent({ ...editableContent, description: e.target.value })
                          }
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 rounded p-2 text-xs"
                        />
                      ) : (
                        <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                          {editableContent.description}
                        </p>
                      )}
                    </div>
                  </Card>
                </div>
              )}

              {/* Instagram Preview */}
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
                          <div className="text-[10px] text-slate-400">Audio: Original audio</div>
                        </div>
                      </div>
                      <PlatformBadge platform="instagram" size="sm" />
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-tr from-pink-50 to-orange-50 dark:from-pink-950/20 dark:to-orange-950/20 border border-pink-200 dark:border-pink-900/30 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-pink-700 dark:text-pink-300 uppercase tracking-wider">
                        <span>Reel Visual Concept</span>
                        <button
                          onClick={() => copyToClipboard(editableContent.reel_concept, 'ig_reel')}
                          className="hover:underline capitalize"
                        >
                          Copy
                        </button>
                      </div>
                      {isEditing ? (
                        <textarea
                          rows={2}
                          value={editableContent.reel_concept || ''}
                          onChange={(e) =>
                            setEditableContent({ ...editableContent, reel_concept: e.target.value })
                          }
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 rounded p-2 text-xs"
                        />
                      ) : (
                        <p className="text-xs text-[#1F2430] dark:text-slate-200 leading-relaxed">
                          {editableContent.reel_concept}
                        </p>
                      )}
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>Caption & Hashtags</span>
                        <button
                          onClick={() => copyToClipboard(editableContent.caption, 'ig_cap')}
                          className="text-[#5B5BD6] hover:underline"
                        >
                          Copy caption
                        </button>
                      </div>
                      {isEditing ? (
                        <textarea
                          rows={4}
                          value={editableContent.caption || ''}
                          onChange={(e) =>
                            setEditableContent({ ...editableContent, caption: e.target.value })
                          }
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 rounded p-2 text-xs"
                        />
                      ) : (
                        <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                          {editableContent.caption}
                        </p>
                      )}
                    </div>
                  </Card>
                </div>
              )}

              {/* Twitter / X Preview */}
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

                    {/* Single post */}
                    <div className="p-3.5 rounded-xl bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span>Standalone Post</span>
                        <button
                          onClick={() => copyToClipboard(editableContent.single_post, 'tw_single')}
                          className="text-[#5B5BD6] hover:underline"
                        >
                          Copy
                        </button>
                      </div>
                      {isEditing ? (
                        <textarea
                          rows={2}
                          value={editableContent.single_post || ''}
                          onChange={(e) =>
                            setEditableContent({ ...editableContent, single_post: e.target.value })
                          }
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 rounded p-2 text-xs"
                        />
                      ) : (
                        <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                          {editableContent.single_post}
                        </p>
                      )}
                    </div>

                    {/* Thread */}
                    {editableContent.thread_tweets && (
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between items-center">
                          <div className="text-xs font-bold uppercase tracking-wider text-[#5B6475] dark:text-[#94A3B8]">
                            Thread Tweets
                          </div>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                (editableContent.thread_tweets || []).join('\n\n'),
                                'tw_thread'
                              )
                            }
                            className="text-xs text-[#5B5BD6] hover:underline"
                          >
                            Copy thread
                          </button>
                        </div>
                        <div className="space-y-2">
                          {(editableContent.thread_tweets || []).map((tweet, i) => (
                            <div
                              key={i}
                              className="p-3.5 rounded-xl bg-white dark:bg-[#171D2B] border border-[#E8E6DF] dark:border-[#232B3E] text-xs space-y-1 relative pl-8"
                            >
                              <span className="absolute left-2.5 top-3.5 text-[10px] font-mono font-bold text-slate-400">
                                {i + 1}
                              </span>
                              <p className="text-[#1F2430] dark:text-slate-200 leading-relaxed">
                                {tweet}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {/* LinkedIn Preview */}
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
                          <div className="text-[10px] text-slate-400">Author & Content Strategist</div>
                        </div>
                      </div>
                      <PlatformBadge platform="linkedin" size="sm" />
                    </div>

                    <div className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span>Perspective Post</span>
                        <button
                          onClick={() => copyToClipboard(editableContent.story_post, 'li_post')}
                          className="text-[#5B5BD6] hover:underline"
                        >
                          Copy post
                        </button>
                      </div>
                      {isEditing ? (
                        <textarea
                          rows={6}
                          value={editableContent.story_post || ''}
                          onChange={(e) =>
                            setEditableContent({ ...editableContent, story_post: e.target.value })
                          }
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 rounded p-2 text-xs"
                        />
                      ) : (
                        <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                          {editableContent.story_post}
                        </p>
                      )}
                    </div>
                  </Card>
                </div>
              )}
            </div>
          ) : (
            /* Start Screen */
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
                or rank 10 angles using the{' '}
                <strong className="text-teal-600 dark:text-teal-400">Rank Top 10</strong> predictor tournament.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
