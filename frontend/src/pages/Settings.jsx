import React, { useState, useEffect, useRef } from 'react';
import { getIntegrations } from '../api/apiClient';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useUser } from '../context/UserContext';
import { usePlatform } from '../context/PlatformContext';
import PageHeader from '../components/ui/PageHeader';
import HowItWorks from '../components/ui/HowItWorks';
import StatusChip from '../components/ui/StatusChip';
import PlatformBadge from '../components/PlatformBadge';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SlideOver from '../components/ui/SlideOver';
import GuidedTour from '../components/ui/GuidedTour';
import ErrorState from '../components/ui/ErrorState';
import ConnectIllustration from '../assets/illustrations/connect-platforms.svg';
import {
  Settings2,
  Link2,
  Database,
  FileSpreadsheet,
  Globe,
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
  Server,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Upload,
  FileText,
  AlertCircle,
  HelpCircle,
  Check,
  User as UserIcon,
  Trash2,
  Camera,
  Download,
  AlertTriangle,
  Radio,
  ExternalLink,
  RefreshCw,
  Eye
} from 'lucide-react';
import { YoutubeIcon } from '../components/SocialIcons';

const HOW_IT_WORKS_STEPS = [
  {
    title: 'Choose Your Data Source',
    description: 'Switch freely between simulated sample data, your uploaded CSV post analytics, or live YouTube channel sync.'
  },
  {
    title: 'Validate & Ingest Safely',
    description: 'CSV files are validated on upload with row diagnostics and bad-row detection before importing.'
  },
  {
    title: 'Instant System Calibration',
    description: 'All 9 studio features, metrics, and ViralScope hit predictors immediately calibrate to your chosen data source.'
  }
];

const PLATFORM_EXPORT_GUIDES = {
  youtube: {
    title: 'How to Export YouTube Analytics CSV',
    steps: [
      '1. Go to studio.youtube.com and sign in.',
      '2. In the left navigation, click "Analytics".',
      '3. In the top-right corner, click "Advanced Mode".',
      '4. Set your desired date range (e.g., Last 365 Days).',
      '5. Click the download icon (Export) in the top-right and select "Comma-separated values (.csv)".',
      '6. Drop the exported CSV file into the upload box below!'
    ]
  },
  instagram: {
    title: 'How to Export Instagram / Meta Analytics CSV',
    steps: [
      '1. Open business.facebook.com and go to Meta Business Suite.',
      '2. In the left sidebar, click "Insights" and then "Content".',
      '3. In the top right, select your date range.',
      '4. Click "Export Data" and choose "Post Metrics (.csv)".',
      '5. Upload the CSV into CreatorPulse to analyze swipe-throughs and reach.'
    ]
  },
  twitter: {
    title: 'How to Export X (Twitter) Analytics CSV',
    steps: [
      '1. Visit analytics.x.com (or your Creator Studio account).',
      '2. Click the "Tweets" tab.',
      '3. Select your time window (Last 28 days or custom).',
      '4. Click "Export Data" > "By Tweet".',
      '5. Upload the downloaded CSV file.'
    ]
  },
  linkedin: {
    title: 'How to Export LinkedIn Analytics CSV',
    steps: [
      '1. Go to your LinkedIn Profile or Company Page analytics.',
      '2. Under "Analytics", select "Posts" or "Updates".',
      '3. Choose your date range.',
      '4. In the upper-right corner, click "Export" (.xls or .csv).',
      '5. Drag and drop the file into CreatorPulse.'
    ]
  }
};

export default function Settings() {
  const { themePreference, setThemePreference } = useTheme();
  const { addToast } = useToast();
  const { user, updateAvatar, removeAvatar, updateProfile } = useUser();
  const {
    activeSource,
    switchDataSource,
    dataSourceMeta,
    refreshData,
    sourceLoading
  } = usePlatform();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Profile form state
  const [userName, setUserName] = useState(user.name || '');
  const [channelName, setChannelName] = useState(user.channelName || '');
  const fileInputRef = useRef(null);

  // Slide-over state for connection instructions
  const [activePlatformDetail, setActivePlatformDetail] = useState(null);

  // CSV Ingestion state
  const [csvContent, setCsvContent] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [validatingCsv, setValidatingCsv] = useState(false);
  const [csvPreview, setCsvPreview] = useState(null);
  const [importingCsv, setImportingCsv] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [badRowsExpanded, setBadRowsExpanded] = useState(false);

  // YouTube Channel Sync state
  const [youtubeInput, setYoutubeInput] = useState('');
  const [youtubeConnecting, setYoutubeConnecting] = useState(false);
  const [youtubeStatus, setYoutubeStatus] = useState(null);
  const [youtubeError, setYoutubeError] = useState(null);

  // Guided tour replay
  const [replayTour, setReplayTour] = useState(false);

  const fetchSettingsAndStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const [integrationsData, ytStatusRes] = await Promise.all([
        getIntegrations(),
        fetch('/api/settings/youtube/status').then(r => r.json()).catch(() => null)
      ]);
      setData(integrationsData);
      setYoutubeStatus(ytStatusRes);
    } catch (err) {
      setError(err.message || 'Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndStatus();
  }, []);

  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      addToast('Please upload a JPG, PNG, or WebP image.', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      addToast('Profile picture must be under 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      if (typeof base64 === 'string') {
        updateAvatar(base64);
        addToast('Profile picture updated successfully!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfile({
      name: userName.trim() || 'Alex Rivera',
      channelName: channelName.trim() || 'Creator Channel',
    });
    addToast('Profile information updated!', 'success');
  };

  // CSV Handlers
  const handleDownloadTemplate = () => {
    window.location.href = '/api/settings/csv/template';
    addToast('Downloading sample CSV template...', 'info');
  };

  const handleCsvSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFileName(file.name);
    setCsvPreview(null);
    setUploadResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setCsvContent(text);
        addToast(`Loaded ${file.name}. Validating format...`, 'info');
        // Automatically validate on load
        await validateCsvText(text);
      }
    };
    reader.readAsText(file);
  };

  const validateCsvText = async (textToValidate) => {
    const content = textToValidate || csvContent;
    if (!content.trim()) {
      addToast('Please provide CSV content to validate.', 'error');
      return;
    }

    setValidatingCsv(true);
    try {
      const res = await fetch('/api/settings/csv/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv_text: content })
      });
      const preview = await res.json();
      setCsvPreview(preview);
      if (preview.is_valid) {
        addToast(`Validation passed: ${preview.valid_count} valid posts detected!`, 'success');
      } else {
        addToast(`Validation warning: ${preview.error || 'No valid rows found'}`, 'warning');
      }
    } catch (err) {
      addToast(err.message || 'Validation request failed', 'error');
    } finally {
      setValidatingCsv(false);
    }
  };

  const handleImportCsv = async () => {
    if (!csvContent.trim()) {
      addToast('Please select or paste CSV content first.', 'error');
      return;
    }

    setImportingCsv(true);
    setUploadResult(null);

    try {
      const res = await fetch('/api/settings/csv/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csv_text: csvContent,
          filename: uploadFileName || 'uploaded_posts.csv',
          set_as_active: true
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Failed to import CSV');
      }

      const result = await res.json();
      setUploadResult(result);
      refreshData();
      addToast(`Successfully imported ${result.imported_count} posts and set as active dataset!`, 'success');
    } catch (err) {
      addToast(err.message || 'CSV Import failed', 'error');
    } finally {
      setImportingCsv(false);
    }
  };

  // YouTube Channel Connect Handler
  const handleConnectYoutube = async (e) => {
    e.preventDefault();
    if (!youtubeInput.trim()) {
      addToast('Please enter a YouTube channel URL or @handle.', 'error');
      return;
    }

    setYoutubeConnecting(true);
    setYoutubeError(null);

    try {
      const res = await fetch('/api/settings/youtube/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_url: youtubeInput.trim(),
          set_as_active: true
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.detail || 'Could not connect channel.');
      }

      refreshData();
      fetchSettingsAndStatus();
      addToast(`Connected '${json.channel?.title}' with ${json.imported_count} videos!`, 'success');
      setYoutubeInput('');
    } catch (err) {
      setYoutubeError(err.message || 'Failed to connect YouTube channel');
      addToast(err.message || 'Failed to connect YouTube channel', 'error');
    } finally {
      setYoutubeConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="h-44 rounded-3xl bg-white dark:bg-[#171D2B] animate-pulse border border-[#E8E6DF] dark:border-[#232B3E]" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-48 rounded-2xl bg-white dark:bg-[#171D2B] animate-pulse" />
          <div className="h-48 rounded-2xl bg-white dark:bg-[#171D2B] animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <ErrorState
          title="Could not load connection settings"
          description={error}
          onRetry={fetchSettingsAndStatus}
        />
      </div>
    );
  }

  const integrations = data?.integrations || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <PageHeader
        title="Connect Accounts & Data Sources"
        subtitle="Manage official API connections, validate and import native CSV post analytics, and control active dataset"
        tag="Setup"
        status="Working now"
        icon={Settings2}
        illustration={ConnectIllustration}
      />

      {/* How it Works Strip */}
      <HowItWorks steps={HOW_IT_WORKS_STEPS} />

      {/* 1. Global Data Source Switcher Card */}
      <Card className="p-6 space-y-5 border-2 border-indigo-100 dark:border-indigo-950/60 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Active Data Source Control</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select which dataset powers your entire dashboard, charts, ViralScope hit predictions, and content lab.
            </p>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            Current: {activeSource === 'sample' ? 'Sample data' : activeSource === 'uploaded_csv' ? 'Uploaded CSV' : 'YouTube Channel'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Option 1: Sample Data */}
          <div
            onClick={() => switchDataSource('sample')}
            className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
              activeSource === 'sample'
                ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  Sample Data
                </span>
                {activeSource === 'sample' && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500 text-white">
                    Active
                  </span>
                )}
              </div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white">
                {dataSourceMeta?.counts?.sample || 1800} <span className="text-xs font-normal text-slate-500">posts</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Standard multi-platform simulated dataset for zero-risk exploration and model testing.
              </p>
            </div>
            <Button
              variant={activeSource === 'sample' ? 'primary' : 'outline'}
              size="sm"
              className="mt-3.5 w-full text-xs"
              disabled={activeSource === 'sample' || sourceLoading}
              onClick={(e) => {
                e.stopPropagation();
                switchDataSource('sample');
              }}
            >
              {activeSource === 'sample' ? 'Active Now' : 'Switch to Sample'}
            </Button>
          </div>

          {/* Option 2: Uploaded CSV */}
          <div
            onClick={() => {
              if (dataSourceMeta?.counts?.uploaded_csv > 0) switchDataSource('uploaded_csv');
            }}
            className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
              activeSource === 'uploaded_csv'
                ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-violet-800 dark:text-violet-300 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Uploaded CSV
                </span>
                {activeSource === 'uploaded_csv' && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-violet-600 text-white">
                    Active
                  </span>
                )}
              </div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white">
                {dataSourceMeta?.counts?.uploaded_csv || 0} <span className="text-xs font-normal text-slate-500">posts</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {dataSourceMeta?.uploaded_meta?.filename
                  ? `Active file: ${dataSourceMeta.uploaded_meta.filename}`
                  : 'Import analytics CSV from YouTube Studio, Meta, or X below.'}
              </p>
            </div>
            <Button
              variant={activeSource === 'uploaded_csv' ? 'primary' : 'outline'}
              size="sm"
              className="mt-3.5 w-full text-xs"
              disabled={activeSource === 'uploaded_csv' || (dataSourceMeta?.counts?.uploaded_csv || 0) === 0 || sourceLoading}
              onClick={(e) => {
                e.stopPropagation();
                switchDataSource('uploaded_csv');
              }}
            >
              {activeSource === 'uploaded_csv'
                ? 'Active Now'
                : (dataSourceMeta?.counts?.uploaded_csv || 0) > 0
                ? 'Switch to CSV'
                : 'No CSV Uploaded Yet'}
            </Button>
          </div>

          {/* Option 3: Connected YouTube Channel */}
          <div
            onClick={() => {
              if (dataSourceMeta?.counts?.youtube > 0) switchDataSource('youtube');
            }}
            className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
              activeSource === 'youtube'
                ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                  <YoutubeIcon className="w-3.5 h-3.5 text-rose-600" />
                  YouTube Sync
                </span>
                {activeSource === 'youtube' && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-600 text-white">
                    Active
                  </span>
                )}
              </div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white">
                {dataSourceMeta?.counts?.youtube || 0} <span className="text-xs font-normal text-slate-500">videos</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {dataSourceMeta?.youtube_meta?.channel_title
                  ? `Channel: ${dataSourceMeta.youtube_meta.channel_title}`
                  : 'Sync public videos directly using YouTube Data API v3.'}
              </p>
            </div>
            <Button
              variant={activeSource === 'youtube' ? 'primary' : 'outline'}
              size="sm"
              className="mt-3.5 w-full text-xs"
              disabled={activeSource === 'youtube' || (dataSourceMeta?.counts?.youtube || 0) === 0 || sourceLoading}
              onClick={(e) => {
                e.stopPropagation();
                switchDataSource('youtube');
              }}
            >
              {activeSource === 'youtube'
                ? 'Active Now'
                : (dataSourceMeta?.counts?.youtube || 0) > 0
                ? 'Switch to YouTube'
                : 'Channel Not Synced Yet'}
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. CSV File Ingestion Section (Full validation & diagnostics) */}
      <Card className="p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>CSV Analytics Ingestion (With Validation & Diagnostics)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Upload exports from YouTube Studio, Meta Business Suite, X Analytics, or LinkedIn.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={handleDownloadTemplate}
            className="text-xs shrink-0"
          >
            Download CSV Template
          </Button>
        </div>

        {/* Drop zone */}
        <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-900/40 transition cursor-pointer">
          <input
            type="file"
            accept=".csv,.txt"
            id="settings-csv-upload"
            onChange={handleCsvSelect}
            className="hidden"
          />
          <label htmlFor="settings-csv-upload" className="cursor-pointer block space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {uploadFileName ? uploadFileName : 'Drop analytics CSV here or click to browse'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Recognizes platform, views, likes, comments, shares, published dates, and captions.
            </div>
          </label>
        </div>

        {/* Raw CSV Textarea option */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Or paste raw CSV text:
          </label>
          <textarea
            value={csvContent}
            onChange={(e) => {
              setCsvContent(e.target.value);
              setCsvPreview(null);
            }}
            placeholder="platform,post_type,caption,published_at,views,likes,comments,shares&#10;youtube,long_video,My Breakout Tech Video,2026-03-01,45000,3200,410,120"
            rows={4}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono focus:ring-2 focus:ring-emerald-500/30"
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              icon={Eye}
              loading={validatingCsv}
              disabled={!csvContent.trim()}
              onClick={() => validateCsvText()}
              className="text-xs"
            >
              Validate & Preview
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={CheckCircle2}
              loading={importingCsv}
              disabled={!csvContent.trim()}
              onClick={handleImportCsv}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Import Posts & Activate
            </Button>
          </div>
        </div>

        {/* Validation & Preview Diagnostics Card */}
        {csvPreview && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2.5">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Validation Results:</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold">
                  {csvPreview.valid_count} Valid Posts
                </span>
                {csvPreview.bad_count > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold">
                    {csvPreview.bad_count} Bad Rows
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500">
                Headers detected: {csvPreview.headers?.slice(0, 6).join(', ')}
              </div>
            </div>

            {/* Bad rows diagnostic warning */}
            {csvPreview.bad_count > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs space-y-2">
                <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    Detected {csvPreview.bad_count} rows with formatting issues (skipped automatically)
                  </span>
                  <button
                    onClick={() => setBadRowsExpanded(!badRowsExpanded)}
                    className="text-[11px] underline hover:no-underline font-normal"
                  >
                    {badRowsExpanded ? 'Hide Diagnostics' : 'View Diagnostics'}
                  </button>
                </div>
                {badRowsExpanded && (
                  <div className="space-y-1 pt-1 max-h-36 overflow-y-auto">
                    {csvPreview.bad_rows.map((bad, idx) => (
                      <div key={idx} className="text-[11px] text-amber-900 dark:text-amber-200 font-mono bg-white/70 dark:bg-slate-900/70 p-1.5 rounded-lg border border-amber-200/60">
                        Row {bad.row_number}: {bad.reason}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* First 5 Preview Table */}
            {csvPreview.preview?.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Data Preview (First {csvPreview.preview.length} Rows):
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold">
                      <tr>
                        <th className="px-3 py-2">Platform</th>
                        <th className="px-3 py-2">Caption / Title</th>
                        <th className="px-3 py-2">Views</th>
                        <th className="px-3 py-2">Likes</th>
                        <th className="px-3 py-2">Comments</th>
                        <th className="px-3 py-2">Hit Chance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {csvPreview.preview.map((p, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-3 py-2 capitalize font-semibold text-slate-800 dark:text-slate-200">
                            {p.platform}
                          </td>
                          <td className="px-3 py-2 text-slate-700 dark:text-slate-300 truncate max-w-xs">
                            {p.caption}
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-400 font-mono">
                            {p.views?.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-400 font-mono">
                            {p.likes?.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-400 font-mono">
                            {p.comments?.toLocaleString()}
                          </td>
                          <td className="px-3 py-2">
                            {p.is_breakout ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">Hit</span>
                            ) : (
                              <span className="text-[10px] text-slate-400">Normal</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upload success summary */}
        {uploadResult && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{uploadResult.message} Active dataset updated ({uploadResult.imported_count} posts).</span>
          </div>
        )}
      </Card>

      {/* 3. YouTube Channel Connection Card */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <YoutubeIcon className="w-4 h-4 text-rose-600" />
              <span>YouTube Channel Live Sync</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sync public videos, duration, views, likes, and comment counts directly via official YouTube Data API v3.
            </p>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
              youtubeStatus?.configured
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200'
            }`}
          >
            {youtubeStatus?.configured ? 'YouTube API Ready' : 'API Key Missing in .env'}
          </span>
        </div>

        {/* Clear truthful message if key missing */}
        {!youtubeStatus?.configured && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>YouTube Data API key is not configured in backend/.env</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
              To import live YouTube channel videos, add <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded font-mono">YOUTUBE_API_KEY=your_key</code> to your <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded font-mono">.env</code> file. Alternatively, you can use the CSV import above with zero API keys required!
            </p>
          </div>
        )}

        {/* Error alert if sync failed */}
        {youtubeError && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold">Could not sync channel</div>
              <div className="text-[11px] text-rose-700 dark:text-rose-400">{youtubeError}</div>
            </div>
          </div>
        )}

        {/* Channel input form */}
        <form onSubmit={handleConnectYoutube} className="flex flex-col sm:flex-row gap-2 pt-1">
          <input
            type="text"
            value={youtubeInput}
            onChange={(e) => setYoutubeInput(e.target.value)}
            placeholder="Channel URL or handle, e.g. @MrBeast or https://www.youtube.com/@AlexRivera"
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-rose-500/30"
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={youtubeConnecting}
            disabled={youtubeConnecting || !youtubeInput.trim()}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs shrink-0 px-4 py-2.5"
          >
            Sync Channel Videos
          </Button>
        </form>

        {/* Connected Channel details if available */}
        {youtubeStatus?.connected_channel?.channel_title && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-slate-900 dark:text-white">
                Connected: {youtubeStatus.connected_channel.channel_title}
              </div>
              <div className="text-[11px] text-slate-500">
                {youtubeStatus.connected_channel.count} videos imported • {youtubeStatus.connected_channel.subscriber_count?.toLocaleString()} subscribers
              </div>
            </div>
            {activeSource !== 'youtube' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => switchDataSource('youtube')}
                className="text-xs"
              >
                Set as Active Source
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* 4. Creator Profile & Custom Avatar */}
      <Card className="p-6 space-y-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <UserIcon className="w-4 h-4 text-violet-600" />
            <span>Creator Profile & Custom Avatar</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Personalize your workspace name and profile picture. Stored safely in your local browser workspace.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative group shrink-0">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-violet-200 dark:border-violet-800 shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                {user.initials || 'CP'}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-md hover:bg-slate-50 transition"
              title="Upload custom photo"
            >
              <Camera className="w-4 h-4 text-violet-600" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarFile}
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
            />
          </div>

          <div className="flex-1 space-y-3 w-full">
            <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Creator Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-violet-500/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Channel / Brand Name
                </label>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="e.g. DevPulse with Alex"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-violet-500/30"
                />
              </div>
              <div className="sm:col-span-2 flex items-center gap-3 pt-1">
                <Button
                  type="submit"
                  className="rounded-xl text-xs font-semibold px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                >
                  Save Profile
                </Button>
                {user.avatarUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      removeAvatar();
                      addToast('Reset avatar to initials fallback', 'info');
                    }}
                    className="text-xs text-rose-500 hover:text-rose-600 font-medium"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </Card>

      {/* 5. Appearance & Theme Settings */}
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Workspace Theme</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Default is crisp warm-sand light mode. You can toggle dark or follow your system anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => {
              setThemePreference('light');
              addToast('Theme set to Light mode', 'info', 2000);
            }}
            className={`p-4 rounded-xl text-left border transition flex items-center space-x-3 ${
              themePreference === 'light'
                ? 'bg-indigo-50/50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-700 dark:text-indigo-300 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs">Light Theme</div>
              <div className="text-[10px] text-slate-400">Default warm sand studio</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setThemePreference('dark');
              addToast('Theme set to Dark mode', 'info', 2000);
            }}
            className={`p-4 rounded-xl text-left border transition flex items-center space-x-3 ${
              themePreference === 'dark'
                ? 'bg-indigo-50/50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-700 dark:text-indigo-300 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs">Dark Theme</div>
              <div className="text-[10px] text-slate-400">Deep navy-charcoal cards</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setThemePreference('system');
              addToast('Theme following operating system preference', 'info', 2000);
            }}
            className={`p-4 rounded-xl text-left border transition flex items-center space-x-3 ${
              themePreference === 'system'
                ? 'bg-indigo-50/50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-700 dark:text-indigo-300 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs">Follow System</div>
              <div className="text-[10px] text-slate-400">Matches Windows OS settings</div>
            </div>
          </button>
        </div>
      </Card>

      {/* 6. Platform Export Guides Modal SlideOver */}
      <SlideOver
        isOpen={!!activePlatformDetail}
        onClose={() => setActivePlatformDetail(null)}
        title={activePlatformDetail?.name ? `${activePlatformDetail.name} Analytics Guide` : 'Platform Guide'}
        subtitle="Step-by-step export walkthrough for your channel analytics"
      >
        {activePlatformDetail && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-start gap-3">
              <PlatformBadge platform={activePlatformDetail.id} size="lg" />
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {PLATFORM_EXPORT_GUIDES[activePlatformDetail.id]?.title || `${activePlatformDetail.name} Export`}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Exporting a CSV file gives CreatorPulse 100% accurate historical retention and reach numbers without waiting for API keys.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Export Instructions
              </h5>
              <div className="space-y-2">
                {(PLATFORM_EXPORT_GUIDES[activePlatformDetail.id]?.steps || []).map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300"
                  >
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </SlideOver>

      {/* Guided Tour Modal */}
      {replayTour && (
        <GuidedTour
          isOpen={replayTour}
          onClose={() => setReplayTour(false)}
        />
      )}
    </div>
  );
}
