import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlatform } from '../context/PlatformContext';
import { useToast } from '../context/ToastContext';
import { generateContent, runIdeaTournament, createDraft } from '../api/apiClient';
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
  ArrowRight
} from 'lucide-react';

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
      addToast('Best ideas tournament completed and ranked!', 'success');
    } catch (err) {
      addToast(`Tournament failed: ${err.message}`, 'error');
    } finally {
      setTournamentLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!content) return;
    try {
      const titleToSave =
        content.titles?.[0] ||
        content.hook_variants?.[0] ||
        content.single_post?.slice(0, 50) ||
        topic;

      await createDraft({
        platform,
        title: titleToSave,
        status: 'drafted',
        tags: content.tags || content.hashtags || [topic.toLowerCase().replace(/\s+/g, '')],
        language,
        hook: content.hook || content.caption || content.story_post?.slice(0, 120),
        content_payload: content,
      });
      setDraftSaved(true);
      addToast('Saved to Calendar & Drafts!', 'success');
      setTimeout(() => setDraftSaved(false), 3000);
    } catch (err) {
      addToast(`Save failed: ${err.message}`, 'error');
    }
  };

  const copyToClipboard = (text, sectionId) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    addToast('Copied to clipboard!', 'success', 2000);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F2430] dark:text-white flex items-center space-x-2.5">
            <span>Content Studio</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-lavender-50 dark:bg-lavender-950/60 text-lavender-700 dark:text-lavender-300 border border-lavender-200 dark:border-lavender-800">
              Pillar 3
            </span>
          </h1>
          <p className="text-sm text-[#5B6475] dark:text-[#94A3B8] mt-1">
            Turn topics into ready-to-publish scripts, hooks, threads, and carousels across 3 languages.
          </p>
        </div>

        {/* Best Ideas Ranking CTA Button */}
        <Button
          variant="teal"
          size="md"
          icon={Trophy}
          loading={tournamentLoading}
          onClick={handleRunTournament}
          className="self-start sm:self-auto"
        >
          Run Best Ideas Ranking (10 Angles)
        </Button>
      </div>

      {/* Best Ideas Tournament Leaderboard (when active) */}
      {tournamentResults && (
        <Card variant="tintedPeach" className="p-6 border-orange-200 dark:border-orange-900/40 space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-orange-200/80 dark:border-orange-900/40">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
                <Trophy className="w-4 h-4 fill-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#1F2430] dark:text-white">
                  Best Ideas Ranking (10 Angles Tested)
                </h2>
                <p className="text-xs text-[#5B6475] dark:text-[#94A3B8]">
                  Scored by our post predictor based on curiosity, length, and timing
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {tournamentResults.map((item) => (
              <div
                key={item.rank}
                className={`p-4 rounded-xl border transition-all ${
                  item.is_winner
                    ? 'bg-white dark:bg-[#1A2333] border-orange-400 dark:border-orange-600 shadow-soft'
                    : 'bg-white/80 dark:bg-[#151B28] border-orange-100 dark:border-orange-950/40'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ${
                        item.is_winner
                          ? 'bg-orange-500 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      #{item.rank}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#858D9D]">
                          {item.angle_name}
                        </span>
                        {item.is_winner && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                            Top Recommendation 🏆
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-[#1F2430] dark:text-white truncate mt-0.5">
                        "{item.title}"
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base font-extrabold text-[#5B5BD6] dark:text-brand-300">
                      {item.predicted_prob_percent}%
                    </div>
                    <div className="text-[10px] text-[#5B6475] dark:text-[#94A3B8] font-mono">
                      {item.probability_ratio}x usual rate
                    </div>
                  </div>
                </div>

                {item.top_reasons && item.top_reasons.length > 0 && (
                  <div className="mt-2 text-xs text-[#5B6475] dark:text-[#94A3B8] italic pt-1 border-t border-orange-100 dark:border-orange-950/50">
                    Why: {item.top_reasons[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Main Studio Controls & Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Inputs (5 cols) */}
        <Card className="lg:col-span-5 p-6 space-y-5">
          <h2 className="text-base font-bold text-[#1F2430] dark:text-white flex items-center space-x-2">
            <PenTool className="w-4 h-4 text-[#5B5BD6]" />
            <span>Creative Brief</span>
          </h2>

          <form onSubmit={handleGenerate} className="space-y-4">
            {/* Big Platform Cards */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6475] dark:text-[#94A3B8] mb-2">
                Format Platform
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['youtube', 'instagram', 'twitter', 'linkedin'].map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`py-3 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition border ${
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
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6475] dark:text-[#94A3B8] mb-1.5">
                Topic or Idea
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. System Design for Senior Devs..."
                className="w-full bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] rounded-xl px-3.5 py-2.5 text-xs text-[#1F2430] dark:text-white focus:outline-none focus:border-[#5B5BD6]"
              />
            </div>

            {/* Goal & Tone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#5B6475] dark:text-[#94A3B8] mb-1.5">
                  Content Goal
                </label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] rounded-xl px-3 py-2 text-xs text-[#1F2430] dark:text-white focus:outline-none focus:border-[#5B5BD6]"
                >
                  <option value="engagement">High Engagement</option>
                  <option value="shares">Bookmarks & Shares</option>
                  <option value="followers">Follower Growth</option>
                  <option value="authority">Thought Leadership</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5B6475] dark:text-[#94A3B8] mb-1.5">
                  Creator Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] rounded-xl px-3 py-2 text-xs text-[#1F2430] dark:text-white focus:outline-none focus:border-[#5B5BD6]"
                >
                  <option value="educational">Educational & Clear</option>
                  <option value="provocative">Contrarian & Bold</option>
                  <option value="storytelling">Storytelling & Honest</option>
                  <option value="actionable">Step-by-step Quick</option>
                </select>
              </div>
            </div>

            {/* Multi-language Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6475] dark:text-[#94A3B8] mb-1.5 flex items-center space-x-1">
                <Languages className="w-3.5 h-3.5 text-[#5B5BD6]" />
                <span>Language</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['English', 'Hindi', 'Marathi'].map((lang) => (
                  <button
                    type="button"
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`py-2 text-xs rounded-xl font-semibold transition border ${
                      language === lang
                        ? 'bg-brand-50 dark:bg-brand-950/60 text-[#5B5BD6] dark:text-brand-300 border-[#5B5BD6] shadow-xs'
                        : 'bg-[#FAF9F6] dark:bg-[#131825] border-[#E8E6DF] dark:border-[#232B3E] text-[#5B6475] dark:text-[#94A3B8] hover:border-slate-300'
                    }`}
                  >
                    {lang === 'English' ? 'English' : lang === 'Hindi' ? 'हिंदी' : 'मराठी'}
                  </button>
                ))}
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

        {/* Right Output View (7 cols) with Step-by-Step Fade-in */}
        <div className="lg:col-span-7 space-y-6">
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
                  {draftSaved ? 'Saved to Drafts!' : 'Save as Draft'}
                </Button>
              </div>

              {/* YouTube Format Package */}
              {content.platform === 'youtube' && (
                <div className="space-y-4">
                  {/* Title Options */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Card className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2430] dark:text-white flex items-center space-x-1.5">
                          <ListOrdered className="w-4 h-4 text-[#5B5BD6]" />
                          <span>5 Click-Worthy Title Options</span>
                        </h3>
                      </div>
                      <div className="space-y-2">
                        {content.titles?.map((t, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] text-xs font-medium text-[#1F2430] dark:text-slate-200 flex justify-between items-center group"
                          >
                            <span className="pr-2">{idx + 1}. {t}</span>
                            <button
                              onClick={() => copyToClipboard(t, `title_${idx}`)}
                              className="text-slate-400 hover:text-[#5B5BD6] transition shrink-0 p-1"
                              title="Copy title"
                            >
                              {copiedSection === `title_${idx}` ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </motion.div>

                  {/* Cold Hook */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.1 }}
                  >
                    <Card variant="tintedIndigo" className="p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#5B5BD6] dark:text-brand-300">
                          First 30 Seconds (Cold Hook)
                        </h3>
                        <button
                          onClick={() => copyToClipboard(content.hook, 'hook')}
                          className="text-[#5B5BD6] hover:underline text-xs flex items-center space-x-1 font-semibold"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </button>
                      </div>
                      <p className="text-xs sm:text-sm text-[#1F2430] dark:text-slate-100 italic leading-relaxed">
                        "{content.hook}"
                      </p>
                    </Card>
                  </motion.div>

                  {/* Outline */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.2 }}
                  >
                    <Card className="p-5 space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2430] dark:text-white">
                        Script Retention Outline
                      </h3>
                      <div className="space-y-2">
                        {content.script_outline?.map((sec, i) => (
                          <div key={i} className="p-3 rounded-xl bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] text-xs">
                            <span className="font-bold text-[#1F2430] dark:text-white block mb-0.5">
                              {sec.section}
                            </span>
                            <span className="text-[#5B6475] dark:text-[#94A3B8] leading-relaxed">
                              {sec.content}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </motion.div>

                  {/* Description & Tags */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.3 }}
                  >
                    <Card className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2430] dark:text-white">
                          Description & Search Tags
                        </h3>
                        <button
                          onClick={() => copyToClipboard(content.description, 'desc')}
                          className="text-[#5B5BD6] hover:underline text-xs flex items-center space-x-1 font-semibold"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy description</span>
                        </button>
                      </div>
                      <pre className="p-3.5 rounded-xl bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] text-xs text-[#5B6475] dark:text-[#94A3B8] whitespace-pre-wrap font-sans leading-relaxed">
                        {content.description}
                      </pre>
                    </Card>
                  </motion.div>
                </div>
              )}

              {/* Instagram Format Package */}
              {content.platform === 'instagram' && (
                <div className="space-y-4">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card variant="tintedPeach" className="p-5 space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300">
                        Reel Visual Concept
                      </h3>
                      <p className="text-xs sm:text-sm text-[#1F2430] dark:text-slate-100 leading-relaxed">
                        {content.reel_concept}
                      </p>
                    </Card>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="p-5 space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2430] dark:text-white">
                          Caption & CTA
                        </h3>
                        <button
                          onClick={() => copyToClipboard(content.caption, 'ig_cap')}
                          className="text-[#5B5BD6] hover:underline text-xs flex items-center space-x-1 font-semibold"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </button>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] text-xs text-[#1F2430] dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {content.caption}
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="p-5 space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2430] dark:text-white">
                        Carousel Slide Outline (5 Slides)
                      </h3>
                      <div className="space-y-2">
                        {content.carousel_outline?.map((s) => (
                          <div key={s.slide} className="p-3 rounded-xl bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] text-xs">
                            <span className="font-bold text-[#1F2430] dark:text-white block">
                              Slide {s.slide}: {s.heading}
                            </span>
                            <span className="text-[#5B6475] dark:text-[#94A3B8]">{s.sub}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </motion.div>
                </div>
              )}

              {/* Twitter / X Format Package */}
              {content.platform === 'twitter' && (
                <div className="space-y-4">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="p-5 space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2430] dark:text-white">
                        Opening Hook Variants
                      </h3>
                      <div className="space-y-2">
                        {content.hook_variants?.map((h, i) => (
                          <div key={i} className="p-3 rounded-xl bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] text-xs text-[#1F2430] dark:text-slate-200 flex justify-between items-center">
                            <span>{h}</span>
                            <button
                              onClick={() => copyToClipboard(h, `hook_${i}`)}
                              className="text-slate-400 hover:text-[#5B5BD6] p-1 shrink-0 ml-2"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <Card className="p-5 space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2430] dark:text-white">
                          7-Tweet Thread Draft
                        </h3>
                        <button
                          onClick={() => copyToClipboard(content.thread?.join('\n\n'), 'thread_all')}
                          className="text-[#5B5BD6] hover:underline text-xs flex items-center space-x-1 font-semibold"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy full thread</span>
                        </button>
                      </div>
                      <div className="space-y-2.5">
                        {content.thread?.map((t, idx) => (
                          <div key={idx} className="p-3.5 rounded-xl bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] text-xs text-[#1F2430] dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                            {t}
                          </div>
                        ))}
                      </div>
                    </Card>
                  </motion.div>
                </div>
              )}

              {/* LinkedIn Format Package */}
              {content.platform === 'linkedin' && (
                <div className="space-y-4">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="p-5 space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2430] dark:text-white">
                          Perspective & Story Post
                        </h3>
                        <button
                          onClick={() => copyToClipboard(content.story_post, 'li_story')}
                          className="text-[#5B5BD6] hover:underline text-xs flex items-center space-x-1 font-semibold"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy post</span>
                        </button>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] text-xs text-[#1F2430] dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {content.story_post}
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="p-5 space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2430] dark:text-white">
                        Actionable 5-Point Listicle
                      </h3>
                      <div className="space-y-1.5 text-xs text-[#1F2430] dark:text-slate-200">
                        {content.listicle?.map((item, i) => (
                          <div key={i} className="p-2.5 rounded-lg bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E]">
                            {item}
                          </div>
                        ))}
                      </div>
                    </Card>
                  </motion.div>
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
                or battle-test 10 angles with the{' '}
                <strong className="text-teal-600 dark:text-teal-400">Best Ideas Ranking</strong>.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
