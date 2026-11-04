import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import HowItWorks from '../components/ui/HowItWorks';
import StatusChip from '../components/ui/StatusChip';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SlideOver from '../components/ui/SlideOver';
import ErrorState from '../components/ui/ErrorState';
import { useToast } from '../context/ToastContext';
import { analyzeVibe, getVibeCheckHistory, deleteVibeCheckReport } from '../api/apiClient';
import {
  SearchCheck,
  Sparkles,
  Link2,
  FileText,
  MessageSquare,
  Upload,
  AlertCircle,
  CheckCircle2,
  Download,
  Trash2,
  HelpCircle,
  Filter,
  ShieldAlert,
  Terminal,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  History,
  Eye,
  ThumbsUp,
  Clock,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import vibeIllustration from '../assets/illustrations/vibecheck-analyzer.svg';

const HOW_IT_WORKS_STEPS = [
  {
    title: 'Input Post or Comments',
    description: 'Paste any public YouTube, Instagram, or TikTok link, or supply your own audience comments or video transcript directly.'
  },
  {
    title: 'Multi-Platform Adapter',
    description: 'Parses captions, likes, and viewer comments via official APIs or fallback parsers with zero unauthorized scraping.'
  },
  {
    title: 'Sentiment & 8-Vibe Engine',
    description: 'VADER-powered polarity scoring clusters audience reactions into 8 distinct emotional vibes and flags promotional bots.'
  },
  {
    title: 'Evidence-Backed Actions',
    description: 'Delivers high-leverage content ideas and production fixes, strictly citing exact comment counts and viewer questions.'
  }
];

const SAMPLE_COMMENTS_PRESET = `Alex Rivera: This completely changed how I think about pacing! The hook in the first 5 seconds was brilliant.
TechExplored: Can you make a dedicated tutorial on the exact color grading LUT you used at 02:45? Been trying to replicate that look forever.
DevSam: The audio seems slightly desynced around the 4 minute mark on mobile, anyone else notice that?
CryptoKing2026: Check out my profile for 100x crypto signals guaranteed returns telegram link in bio 🚀🚀🚀
Elena M.: Bro the transition at 01:15 had me laughing out loud 😂 such clean editing!
Mark Vance: I disagree with point #3. In 2026, audience attention spans are actually shorter, not longer. Look at retention graphs.
Sophia Lin: Always inspiring to watch your process. Thanks for breaking down the actual analytics instead of giving vague advice.
bot_earn_cash: Message Mr James on WhatsApp +18005550199 for investment advice he made me 50k
Maya Patel: The pacing was so good that a 12 minute video felt like 3 minutes. More content like this please!
Chris B.: Great breakdown, but is this applicable for small channels under 1,000 subscribers or just established creators?`;

export default function VibeCheck() {
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleTurnIntoStudioIdea = (topicCandidate) => {
    const topic = topicCandidate || analysis?.metadata?.title || 'Audience Feedback Concept';
    addToast(`Loading "${topic.slice(0, 35)}..." into Content Studio`, 'info');
    navigate(`/studio?topic=${encodeURIComponent(topic)}&platform=${analysis?.metadata?.platform || 'youtube'}`);
  };

  // Input states
  const [activeTab, setActiveTab] = useState('url'); // 'url', 'pasted', 'transcript', 'csv', 'whisper'
  const [urlInput, setUrlInput] = useState('');
  const [customText, setCustomText] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customAuthor, setCustomAuthor] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);

  // Results state
  const [analysis, setAnalysis] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [copiedWhisper, setCopiedWhisper] = useState(false);

  const location = useLocation();

  // History slide-over
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyReports, setHistoryReports] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Supported platforms list
  const [platformsInfo, setPlatformsInfo] = useState([]);

  useEffect(() => {
    fetchSupportedPlatforms();
    fetchHistory();

    // Check URL query parameters (e.g. from Dashboard VibeCheck strip)
    const params = new URLSearchParams(location.search);
    const targetUrl = params.get('url');
    const autoAnalyze = params.get('auto');

    if (targetUrl) {
      setUrlInput(targetUrl);
      setActiveTab('url');
      if (autoAnalyze === 'true') {
        setTimeout(() => {
          runAnalysisForUrl(targetUrl);
        }, 200);
      }
    }
  }, [location.search]);

  const fetchSupportedPlatforms = async () => {
    try {
      const res = await fetch('/api/vibecheck/supported-platforms');
      if (res.ok) {
        const data = await res.json();
        setPlatformsInfo(data.platforms || []);
      }
    } catch {
      // quiet fallback
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await getVibeCheckHistory();
      setHistoryReports(data.reports || []);
    } catch {
      // quiet fallback
    } finally {
      setLoadingHistory(false);
    }
  };

  const runAnalysisForUrl = async (url) => {
    setError(null);
    setLoading(true);
    setLoadingStep(1);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 700);

    try {
      const data = await analyzeVibe({
        target: url,
        input_type: 'url',
        save_to_history: true,
      });
      clearInterval(stepInterval);
      setAnalysis(data);
      addToast('VibeCheck analysis completed successfully!', 'success');
      fetchHistory();
    } catch (err) {
      clearInterval(stepInterval);
      setError(err.message || 'Could not complete analysis.');
    } finally {
      setLoading(false);
      setLoadingStep(0);
    }
  };

  const runAnalysis = async () => {
    setError(null);
    setLoading(true);
    setLoadingStep(1);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 700);

    let payload = {
      save_to_history: true
    };

    if (activeTab === 'url') {
      if (!urlInput.trim()) {
        setError('Please enter a valid YouTube, Instagram, or TikTok URL');
        setLoading(false);
        clearInterval(stepInterval);
        return;
      }
      payload.target = urlInput.trim();
      payload.input_type = 'url';
    } else if (activeTab === 'pasted') {
      if (!customText.trim()) {
        setError('Please paste comments to analyze');
        setLoading(false);
        clearInterval(stepInterval);
        return;
      }
      payload.input_type = 'pasted_comments';
      payload.raw_text = customText.trim();
      payload.title = customTitle.trim() || 'Audience Comments Analysis';
      payload.author = customAuthor.trim() || 'Creator';
    } else if (activeTab === 'transcript') {
      if (!customText.trim()) {
        setError('Please paste transcript or subtitle text');
        setLoading(false);
        clearInterval(stepInterval);
        return;
      }
      payload.input_type = 'transcript';
      payload.raw_text = customText.trim();
      payload.title = customTitle.trim() || 'Video Transcript Review';
      payload.author = customAuthor.trim() || 'Creator';
    } else if (activeTab === 'csv') {
      if (!customText.trim()) {
        setError('Please upload or paste CSV comments');
        setLoading(false);
        clearInterval(stepInterval);
        return;
      }
      payload.input_type = 'csv_text';
      payload.raw_text = customText.trim();
      payload.title = customTitle.trim() || 'CSV Export Audience Review';
    }

    try {
      const data = await analyzeVibe(payload);
      clearInterval(stepInterval);
      setAnalysis(data);
      addToast('VibeCheck analysis completed successfully!', 'success');
      fetchHistory();
    } catch (err) {
      clearInterval(stepInterval);
      setError(err.message || 'Could not complete analysis. Check server connection.');
    } finally {
      setLoading(false);
      setLoadingStep(0);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setCustomText(text);
        if (!customTitle) {
          setCustomTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
        addToast(`Loaded ${file.name} successfully`, 'info');
      }
    };
    reader.readAsText(file);
  };

  const loadReport = (report) => {
    if (report.full_analysis) {
      setAnalysis(report.full_analysis);
      setHistoryOpen(false);
      addToast(`Loaded report: "${report.title}"`, 'info');
    }
  };

  const deleteReport = async (reportId, e) => {
    e.stopPropagation();
    try {
      await deleteVibeCheckReport(reportId);
      setHistoryReports((prev) => prev.filter((r) => r.report_id !== reportId));
      addToast('Report deleted', 'info');
    } catch {
      addToast('Failed to delete report', 'error');
    }
  };

  const exportCSV = () => {
    if (!analysis || !analysis.comments) return;
    const headers = ['Comment ID', 'Author', 'Text', 'Sentiment', 'Vibe', 'Likes', 'Is Question', 'Is Spam'];
    const rows = analysis.comments.map((c) => [
      c.comment_id,
      `"${(c.author || '').replace(/"/g, '""')}"`,
      `"${(c.text || '').replace(/"/g, '""')}"`,
      c.sentiment,
      c.vibe,
      c.like_count || 0,
      c.is_question ? 'YES' : 'NO',
      c.is_spam ? 'YES' : 'NO'
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vibecheck_${analysis.metadata.title.replace(/\s+/g, '_').toLowerCase()}.csv`;
    link.click();
    addToast('Downloaded comments CSV', 'success');
  };

  // Filtered comments
  const commentsToDisplay = (analysis?.comments || []).filter((c) => {
    if (sentimentFilter === 'positive' && c.sentiment !== 'positive') return false;
    if (sentimentFilter === 'neutral' && c.sentiment !== 'neutral') return false;
    if (sentimentFilter === 'negative' && c.sentiment !== 'negative') return false;
    if (sentimentFilter === 'questions' && !c.is_question) return false;
    if (sentimentFilter === 'spam' && !c.is_spam) return false;

    if (selectedTopic !== 'all') {
      const kw = selectedTopic.toLowerCase();
      if (!c.text.toLowerCase().includes(kw)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <PageHeader
        title="VibeCheck AI"
        subtitle="Analyze audience sentiment, emotional vibes, and spam patterns with evidence-backed recommendations"
        tag="Analyzer"
        status="Working now"
        icon={SearchCheck}
        illustration={vibeIllustration}
        actions={
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              icon={History}
              onClick={() => setHistoryOpen(true)}
            >
              Reports ({historyReports.length})
            </Button>
          </div>
        }
      />

      {/* How it Works Strip */}
      <HowItWorks steps={HOW_IT_WORKS_STEPS} />

      {/* Supported Platforms Strip */}
      <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#171D2B]/70 border border-[#E8E6DF] dark:border-[#232B3E] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-[#5B6475] dark:text-[#94A3B8] font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Supported Input Modes:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40 font-medium">
            YouTube Data API v3
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-900/40 font-medium">
            Instagram oEmbed
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-900/40 font-medium">
            TikTok oEmbed
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40 font-medium">
            Pasted Comments (100% Real)
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/40 font-medium">
            Audio / SRT Transcripts
          </span>
        </div>
      </div>

      {/* Main Analysis Input Box */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 border-b border-[#E8E6DF] dark:border-[#232B3E] pb-3 mb-5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('url')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shrink-0 ${
              activeTab === 'url'
                ? 'bg-[#5B5BD6] text-white'
                : 'text-[#5B6475] dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Public Post URL</span>
          </button>
          <button
            onClick={() => setActiveTab('pasted')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shrink-0 ${
              activeTab === 'pasted'
                ? 'bg-[#5B5BD6] text-white'
                : 'text-[#5B6475] dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Pasted Comments</span>
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shrink-0 ${
              activeTab === 'transcript'
                ? 'bg-[#5B5BD6] text-white'
                : 'text-[#5B6475] dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Transcript / SRT</span>
          </button>
          <button
            onClick={() => setActiveTab('csv')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shrink-0 ${
              activeTab === 'csv'
                ? 'bg-[#5B5BD6] text-white'
                : 'text-[#5B6475] dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload CSV</span>
          </button>
          <button
            onClick={() => setActiveTab('whisper')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shrink-0 ${
              activeTab === 'whisper'
                ? 'bg-[#14B8A6] text-white'
                : 'text-[#5B6475] dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Local Whisper Audio Guide</span>
          </button>
        </div>

        {/* Tab 1: Public Post URL */}
        {activeTab === 'url' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-stretch gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Link2 className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or instagram.com/p/... or tiktok.com/@user/..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-[#171D2B] border border-[#E8E6DF] dark:border-[#232B3E] text-sm text-[#1F2430] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#5B5BD6]/20 focus:border-[#5B5BD6]"
                />
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={runAnalysis}
                loading={loading}
                icon={SearchCheck}
                className="shrink-0"
              >
                Run VibeCheck
              </Button>
            </div>

            <div className="flex items-center justify-between text-xs text-[#5B6475] dark:text-[#94A3B8]">
              <span className="flex items-center space-x-1">
                <span>Try sample video:</span>
                <button
                  type="button"
                  onClick={() => setUrlInput('https://www.youtube.com/watch?v=dQw4w9WgXcQ')}
                  className="text-[#5B5BD6] dark:text-brand-300 font-semibold hover:underline"
                >
                  YouTube Masterclass
                </button>
                <span>or</span>
                <button
                  type="button"
                  onClick={() => setUrlInput('https://www.instagram.com/reel/C3x9L')}
                  className="text-[#5B5BD6] dark:text-brand-300 font-semibold hover:underline"
                >
                  Instagram Reel
                </button>
              </span>
              <span className="text-[11px] text-slate-400">Zero HTML scraping • Strict API compliance</span>
            </div>
          </div>
        )}

        {/* Tab 2: Pasted Comments */}
        {activeTab === 'pasted' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Post title or topic (e.g., Color Grading Masterclass)"
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#171D2B] border border-[#E8E6DF] dark:border-[#232B3E] text-xs text-[#1F2430] dark:text-[#F1F5F9]"
              />
              <input
                type="text"
                value={customAuthor}
                onChange={(e) => setCustomAuthor(e.target.value)}
                placeholder="Creator / Channel name"
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#171D2B] border border-[#E8E6DF] dark:border-[#232B3E] text-xs text-[#1F2430] dark:text-[#F1F5F9]"
              />
            </div>
            <textarea
              rows={6}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Paste comments here (one comment per line, or 'Username: comment text')..."
              className="w-full p-3.5 rounded-xl bg-white dark:bg-[#171D2B] border border-[#E8E6DF] dark:border-[#232B3E] text-xs font-mono text-[#1F2430] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#5B5BD6]/20 focus:border-[#5B5BD6]"
            />
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCustomText(SAMPLE_COMMENTS_PRESET)}
              >
                Insert Realistic Sample Comments
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={runAnalysis}
                loading={loading}
                icon={SearchCheck}
              >
                Analyze Comments
              </Button>
            </div>
          </div>
        )}

        {/* Tab 3: Transcript / SRT */}
        {activeTab === 'transcript' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 text-xs text-purple-900 dark:text-purple-300">
              Paste your video script, dialogue, or SRT subtitle text. Subtitle timestamps (e.g. 00:01:20) are automatically detected and stripped.
            </div>
            <textarea
              rows={6}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Paste dialogue or SRT subtitles here..."
              className="w-full p-3.5 rounded-xl bg-white dark:bg-[#171D2B] border border-[#E8E6DF] dark:border-[#232B3E] text-xs font-mono text-[#1F2430] dark:text-[#F1F5F9]"
            />
            <div className="flex justify-end">
              <Button
                variant="primary"
                size="md"
                onClick={runAnalysis}
                loading={loading}
                icon={SearchCheck}
              >
                Analyze Transcript
              </Button>
            </div>
          </div>
        )}

        {/* Tab 4: Upload CSV */}
        {activeTab === 'csv' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-[#E8E6DF] dark:border-[#232B3E] rounded-2xl p-6 text-center hover:bg-slate-50 dark:hover:bg-[#1a2133] transition cursor-pointer">
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                id="csv-vibe-upload"
                className="hidden"
              />
              <label htmlFor="csv-vibe-upload" className="cursor-pointer block">
                <Upload className="w-8 h-8 mx-auto text-[#5B5BD6] mb-2" />
                <div className="text-sm font-bold text-[#1F2430] dark:text-[#F1F5F9]">
                  Upload CSV of Comments
                </div>
                <div className="text-xs text-[#5B6475] dark:text-[#94A3B8] mt-1">
                  Supports columns: comment/text, author, likes
                </div>
              </label>
            </div>
            {customText && (
              <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>✓ Loaded {customText.splitlines?.()?.length || customText.split('\n').length} CSV lines</span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={runAnalysis}
                  loading={loading}
                  icon={SearchCheck}
                >
                  Analyze Uploaded CSV
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Local Whisper Audio Guide */}
        {activeTab === 'whisper' && (
          <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-[#141A28] border border-[#E8E6DF] dark:border-[#232B3E]">
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <Terminal className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-bold text-[#1F2430] dark:text-[#F1F5F9]">
                  Run OpenAI Whisper Locally (100% Free & Private)
                </div>
                <div className="text-xs text-[#5B6475] dark:text-[#94A3B8]">
                  Transcribe long videos on your own laptop with zero cloud costs and zero privacy leaks.
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-semibold text-slate-700 dark:text-slate-300">
                1. In your terminal, install OpenAI Whisper:
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 text-teal-300 font-mono text-[11px] flex items-center justify-between">
                <code>pip install openai-whisper</code>
              </div>

              <div className="font-semibold text-slate-700 dark:text-slate-300 mt-2">
                2. Transcribe any video or audio file:
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 text-teal-300 font-mono text-[11px] flex items-center justify-between">
                <code>whisper "my_video.mp4" --model base --output_format txt</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('whisper "my_video.mp4" --model base --output_format txt');
                    setCopiedWhisper(true);
                    setTimeout(() => setCopiedWhisper(false), 2000);
                  }}
                  className="p-1 hover:text-white transition"
                  title="Copy command"
                >
                  {copiedWhisper ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="font-semibold text-slate-700 dark:text-slate-300 mt-2">
                3. Paste the generated .txt content into the <button onClick={() => setActiveTab('transcript')} className="text-[#5B5BD6] font-bold underline">Transcript / SRT tab</button> above!
              </div>
            </div>
          </div>
        )}

        {/* Animated Progress Indicator */}
        {loading && (
          <div className="mt-6 p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[#5B5BD6] dark:text-brand-300">
              <span className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running VibeCheck AI Pipeline...</span>
              </span>
              <span>Step {loadingStep} of 4</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#5B5BD6] h-full transition-all duration-300 rounded-full"
                style={{ width: `${(loadingStep / 4) * 100}%` }}
              />
            </div>
            <div className="text-[11px] text-[#5B6475] dark:text-[#94A3B8]">
              {loadingStep === 1 && '1/4 Fetching post metadata and comments through platform adapter...'}
              {loadingStep === 2 && '2/4 Calculating VADER polarity and 8-category emotional vibe clustering...'}
              {loadingStep === 3 && '3/4 Scanning comment corpus for promotional spam & bot patterns...'}
              {loadingStep === 4 && '4/4 Synthesizing evidence-backed recommendations citing comment counts...'}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4">
            <ErrorState
              title="Analysis Error"
              description={error}
              onRetry={runAnalysis}
            />
          </div>
        )}
      </Card>

      {/* Analysis Results Display */}
      {analysis && (
        <div className="space-y-8 animate-fadeIn">
          {/* Post Header Card & Coverage Report */}
          <Card className="p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-[#E8E6DF] dark:border-[#232B3E]">
              <div className="flex items-start space-x-4 min-w-0">
                {analysis.metadata.thumbnail_url ? (
                  <img
                    src={analysis.metadata.thumbnail_url}
                    alt={analysis.metadata.title}
                    className="w-24 h-16 rounded-xl object-cover shrink-0 shadow-xs border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="w-24 h-16 rounded-xl bg-gradient-to-tr from-[#5B5BD6] to-[#14B8A6] flex items-center justify-center text-white shrink-0 shadow-xs font-bold text-lg">
                    {analysis.metadata.platform.toUpperCase().slice(0, 2)}
                  </div>
                )}
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {analysis.metadata.platform}
                    </span>
                    {analysis.coverage.is_sample_data ? (
                      <StatusChip status="Uses sample data" size="sm" />
                    ) : (
                      <StatusChip status="Working now" size="sm" />
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-[#1F2430] dark:text-[#F1F5F9] truncate">
                    {analysis.metadata.title}
                  </h2>
                  <div className="text-xs text-[#5B6475] dark:text-[#94A3B8]">
                    By <span className="font-semibold text-slate-800 dark:text-slate-200">{analysis.metadata.author}</span>
                    {analysis.metadata.view_count ? ` • ${analysis.metadata.view_count.toLocaleString()} views` : ''}
                    {analysis.metadata.like_count ? ` • ${analysis.metadata.like_count.toLocaleString()} likes` : ''}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  icon={Sparkles}
                  onClick={() => handleTurnIntoStudioIdea(analysis.metadata.title)}
                >
                  Turn into Studio idea
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Download}
                  onClick={exportCSV}
                >
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Copy}
                  onClick={() => {
                    navigator.clipboard.writeText(analysis.summary);
                    addToast('Copied summary to clipboard', 'info');
                  }}
                >
                  Copy Summary
                </Button>
              </div>
            </div>

            {/* Coverage Notice Banner */}
            <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-[#141A28] border border-[#E8E6DF] dark:border-[#232B3E] flex items-start space-x-3 text-xs text-[#5B6475] dark:text-[#94A3B8]">
              <HelpCircle className="w-4 h-4 text-[#5B5BD6] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Data Coverage:
                </span>{' '}
                {analysis.coverage.notice}
              </div>
            </div>
          </Card>

          {/* Vibe & Sentiment Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Overall Vibe Scorecard */}
            <Card className="p-6 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-[#5B6475] dark:text-[#94A3B8] uppercase tracking-wider mb-2">
                  Audience Vibe Score
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-extrabold text-[#1F2430] dark:text-[#F1F5F9]">
                    {analysis.sentiment.vibe_score}
                  </span>
                  <span className="text-sm text-slate-400">/ 100</span>
                </div>
                <div className="mt-2 inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900/40 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                  <span>Dominant: {analysis.sentiment.dominant_vibe}</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E8E6DF] dark:border-[#232B3E] space-y-1.5 text-xs text-[#5B6475] dark:text-[#94A3B8]">
                <div className="flex justify-between items-center">
                  <span>Sentiment Model:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {analysis.sentiment.model_used || 'VADER (Rule-based)'}
                  </span>
                </div>
                {analysis.sentiment.model_notice && (
                  <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium italic">
                    {analysis.sentiment.model_notice}
                  </div>
                )}
                <div className="text-[10px] text-slate-400">
                  Compound polarity average: {analysis.sentiment.average_compound}
                </div>
              </div>
            </Card>

            {/* 2. Sentiment Breakdown */}
            <Card className="p-6 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-[#5B6475] dark:text-[#94A3B8] uppercase tracking-wider mb-3">
                  Sentiment Polarity
                </div>
                {/* Visual Bar */}
                <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-700 mb-3">
                  <div
                    style={{ width: `${analysis.sentiment.breakdown.positive}%` }}
                    className="bg-emerald-500 h-full"
                    title={`Positive: ${analysis.sentiment.breakdown.positive}%`}
                  />
                  <div
                    style={{ width: `${analysis.sentiment.breakdown.neutral}%` }}
                    className="bg-slate-400 h-full"
                    title={`Neutral: ${analysis.sentiment.breakdown.neutral}%`}
                  />
                  <div
                    style={{ width: `${analysis.sentiment.breakdown.negative}%` }}
                    className="bg-rose-500 h-full"
                    title={`Negative: ${analysis.sentiment.breakdown.negative}%`}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">
                      {analysis.sentiment.breakdown.positive}%
                    </div>
                    <div className="text-[10px] text-slate-400">Positive ({analysis.sentiment.counts.positive})</div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-600 dark:text-slate-300">
                      {analysis.sentiment.breakdown.neutral}%
                    </div>
                    <div className="text-[10px] text-slate-400">Neutral ({analysis.sentiment.counts.neutral})</div>
                  </div>
                  <div>
                    <div className="font-bold text-rose-600 dark:text-rose-400">
                      {analysis.sentiment.breakdown.negative}%
                    </div>
                    <div className="text-[10px] text-slate-400">Negative ({analysis.sentiment.counts.negative})</div>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2 text-[10px] text-slate-400 dark:text-slate-500 italic">
                {analysis.sentiment.sarcasm_disclaimer}
              </div>
            </Card>

            {/* 3. Community Hygiene & Spam Check */}
            <Card className="p-6 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-[#5B6475] dark:text-[#94A3B8] uppercase tracking-wider mb-2">
                  Community Hygiene
                </div>
                <div className="flex items-center space-x-2">
                  {analysis.spam_detection.flagged_count === 0 ? (
                    <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Clean feed (0% Spam)</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-bold text-lg">
                      <ShieldAlert className="w-5 h-5" />
                      <span>{analysis.spam_detection.flagged_count} Flagged ({analysis.spam_detection.spam_percentage}%)</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-[#5B6475] dark:text-[#94A3B8] mt-2">
                  {analysis.engagement.question_count} viewer questions identified ({analysis.engagement.question_rate}% of audience).
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-[#E8E6DF] dark:border-[#232B3E] text-xs text-[#5B6475] dark:text-[#94A3B8]">
                Avg comment length: {analysis.engagement.average_word_length} words
              </div>
            </Card>
          </div>

          {/* 8-Category Vibe Breakdown Grid */}
          <Card className="p-6">
            <h3 className="text-sm font-bold text-[#1F2430] dark:text-[#F1F5F9] mb-4">
              8-Category Audience Vibe Clusters
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {analysis.vibes.map((vb) => (
                <div
                  key={vb.vibe}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#141A28] border border-[#E8E6DF] dark:border-[#232B3E] space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#1F2430] dark:text-[#F1F5F9] truncate pr-1">
                      {vb.vibe}
                    </span>
                    <span className="text-slate-400 text-[11px] shrink-0 font-medium">
                      {vb.count} ({vb.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#5B5BD6] h-full rounded-full transition-all duration-300"
                      style={{ width: `${vb.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Evidence-Backed Recommendations Section */}
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#5B5BD6]" />
              <h3 className="text-base font-bold text-[#1F2430] dark:text-[#F1F5F9]">
                Evidence-Backed Content Actions
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#121724] border border-[#E8E6DF] dark:border-[#232B3E] space-y-2"
                >
                  <div className="text-xs font-bold text-[#5B5BD6] dark:text-brand-300 uppercase tracking-wider">
                    {rec.type.replace('_', ' ')}
                  </div>
                  <h4 className="text-sm font-bold text-[#1F2430] dark:text-[#F1F5F9]">
                    {rec.title}
                  </h4>
                  <p className="text-xs text-[#5B6475] dark:text-[#94A3B8]">
                    <strong className="text-slate-700 dark:text-slate-300">Data Evidence:</strong> {rec.evidence}
                  </p>
                  <p className="text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-[#171D2B] p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
                    <strong>Recommended Next Step:</strong> {rec.action}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleTurnIntoStudioIdea(rec.title)}
                    className="text-[11px] font-bold text-[#5B5BD6] hover:underline flex items-center space-x-1 pt-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Turn into Studio idea</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Interactive Comment Explorer with Topic Chips */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-5 pb-4 border-b border-[#E8E6DF] dark:border-[#232B3E]">
              <div>
                <h3 className="text-base font-bold text-[#1F2430] dark:text-[#F1F5F9]">
                  Audience Comment Explorer ({commentsToDisplay.length})
                </h3>
                <div className="text-xs text-[#5B6475] dark:text-[#94A3B8]">
                  Filter comments by topic keyword or sentiment polarity
                </div>
              </div>

              {/* Sentiment filter pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {['all', 'positive', 'neutral', 'negative', 'questions', 'spam'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setSentimentFilter(f)}
                    className={`px-2.5 py-1 rounded-lg capitalize font-medium transition ${
                      sentimentFilter === f
                        ? 'bg-[#5B5BD6] text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic Chips */}
            {analysis.topics.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs font-semibold text-[#5B6475] dark:text-[#94A3B8]">
                  Topics:
                </span>
                <button
                  onClick={() => setSelectedTopic('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    selectedTopic === 'all'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  All Topics
                </button>
                {analysis.topics.map((t) => (
                  <button
                    key={t.keyword}
                    onClick={() => setSelectedTopic(t.keyword)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      selectedTopic === t.keyword
                        ? 'bg-[#14B8A6] text-white'
                        : 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900/40'
                    }`}
                  >
                    {t.keyword} ({t.mention_count})
                  </button>
                ))}
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {commentsToDisplay.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No comments match the selected filters.
                </div>
              ) : (
                commentsToDisplay.map((c) => (
                  <div
                    key={c.comment_id}
                    className={`p-3.5 rounded-xl border transition ${
                      c.is_spam
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                        : 'bg-white dark:bg-[#171D2B] border-[#E8E6DF] dark:border-[#232B3E]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-[#1F2430] dark:text-[#F1F5F9]">
                          {c.author}
                        </span>
                        {c.is_spam && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-bold">
                            Spam
                          </span>
                        )}
                        {c.is_question && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 font-bold">
                            Question
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-[11px]">
                        <span
                          className={`font-semibold capitalize ${
                            c.sentiment === 'positive'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : c.sentiment === 'negative'
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-500'
                          }`}
                        >
                          {c.sentiment}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                          {c.vibe}
                        </span>
                        {c.like_count > 0 && (
                          <span className="flex items-center space-x-0.5 text-slate-400">
                            <ThumbsUp className="w-3 h-3" />
                            <span>{c.like_count}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-[#1F2430] dark:text-[#E2E8F0] leading-relaxed">
                      {c.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* History SlideOver */}
      <SlideOver
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Previous VibeCheck Reports"
      >
        <div className="space-y-4">
          <div className="text-xs text-[#5B6475] dark:text-[#94A3B8]">
            Click any previous analysis to reload its metrics, recommendations, and comment explorer.
          </div>
          {loadingHistory ? (
            <div className="p-8 text-center text-xs text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
              Loading history...
            </div>
          ) : historyReports.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No previous reports saved yet. Run an analysis above!
            </div>
          ) : (
            <div className="space-y-3">
              {historyReports.map((r) => (
                <div
                  key={r.report_id}
                  onClick={() => loadReport(r)}
                  className="p-3.5 rounded-xl bg-white dark:bg-[#171D2B] border border-[#E8E6DF] dark:border-[#232B3E] hover:border-[#5B5BD6] transition cursor-pointer space-y-1.5 group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#1F2430] dark:text-[#F1F5F9] truncate pr-2">
                      {r.title}
                    </span>
                    <button
                      onClick={(e) => deleteReport(r.report_id, e)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition opacity-0 group-hover:opacity-100"
                      title="Delete report"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] text-[#5B6475] dark:text-[#94A3B8]">
                    <span className="capitalize font-semibold text-[#5B5BD6]">{r.platform}</span>
                    <span>•</span>
                    <span>Vibe: {r.vibe_score}/100</span>
                    <span>•</span>
                    <span>{r.comment_count} comments</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {r.summary}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SlideOver>
    </div>
  );
}
