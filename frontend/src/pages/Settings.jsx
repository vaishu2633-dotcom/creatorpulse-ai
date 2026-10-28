import React, { useState, useEffect, useRef } from 'react';
import { getIntegrations } from '../api/apiClient';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useUser } from '../context/UserContext';
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
  Compass,
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
} from 'lucide-react';

const HOW_IT_WORKS_STEPS = [
  {
    title: 'Choose Data Ingestion Method',
    description: 'Use direct CSV file upload for immediate deep analytics without waiting for developer API approvals.'
  },
  {
    title: 'Export Native Platform CSV',
    description: 'Download standard performance CSVs from YouTube Studio, Meta Business Suite, X Analytics, or LinkedIn.'
  },
  {
    title: 'Instant Calibration & Refresh',
    description: 'Upload your file to immediately populate the Dashboard, Trend Explorer, and ViralScope predictor.'
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

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Avatar and profile form state
  const [userName, setUserName] = useState(user.name || '');
  const [channelName, setChannelName] = useState(user.channelName || '');
  const fileInputRef = useRef(null);

  // Slide-over state for connection instructions
  const [activePlatformDetail, setActivePlatformDetail] = useState(null);

  // CSV Upload state
  const [csvContent, setCsvContent] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  // Guided tour replay
  const [replayTour, setReplayTour] = useState(false);

  const fetchSettings = () => {
    setLoading(true);
    setError(null);
    getIntegrations()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load integrations');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      addToast('Please upload a JPG, PNG, or WebP image.', 'error');
      return;
    }

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      addToast('Image size exceeds 2MB limit.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl === 'string') {
        updateAvatar(dataUrl);
        addToast('Custom profile photo saved successfully!', 'success');
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

  const handleCsvSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setCsvContent(text);
        addToast(`Loaded ${file.name}. Ready to import.`, 'info');
      }
    };
    reader.readAsText(file);
  };

  const handleImportCsv = async () => {
    if (!csvContent.trim()) {
      addToast('Please select a valid CSV file first.', 'error');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const res = await fetch('/api/settings/upload-csv-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv_text: csvContent })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Failed to import CSV');
      }

      const result = await res.json();
      setUploadResult(result);
      addToast(`Successfully imported ${result.imported_count} posts into dataset!`, 'success');
      setCsvContent('');
      setUploadFileName('');
    } catch (err) {
      addToast(err.message || 'CSV Import failed', 'error');
    } finally {
      setUploading(false);
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
          onRetry={fetchSettings}
        />
      </div>
    );
  }

  const integrations = data?.integrations || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <PageHeader
        title="Connect Accounts"
        subtitle="Manage official API connections, import native CSV post analytics, and customize your workspace"
        tag="Setup"
        status="Coming soon"
        icon={Settings2}
        illustration={ConnectIllustration}
      />

      {/* How it Works Strip */}
      <HowItWorks steps={HOW_IT_WORKS_STEPS} />

      {/* Creator Profile & Custom Avatar */}
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
                    className="text-xs font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </Card>

      {/* Theme Selection Section */}
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#1F2430] dark:text-white flex items-center space-x-2">
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Theme & Display Preference</span>
          </h2>
          <p className="text-xs text-[#5B6475] dark:text-[#94A3B8] mt-0.5">
            Choose your preferred interface theme. Light theme is the default.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Light Theme */}
          <button
            type="button"
            onClick={() => {
              setThemePreference('light');
              addToast('Theme set to Light mode', 'info', 2000);
            }}
            className={`p-4 rounded-xl text-left border transition flex items-center space-x-3 ${
              themePreference === 'light'
                ? 'bg-brand-50 dark:bg-brand-950/60 border-[#5B5BD6] text-[#5B5BD6] dark:text-brand-300 shadow-soft'
                : 'bg-[#FAF9F6] dark:bg-[#131825] border-[#E8E6DF] dark:border-[#232B3E] text-[#5B6475] dark:text-[#94A3B8] hover:border-slate-300'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs">Light Theme</div>
              <div className="text-[10px] text-slate-400">Warm off-white background</div>
            </div>
          </button>

          {/* Dark Theme */}
          <button
            type="button"
            onClick={() => {
              setThemePreference('dark');
              addToast('Theme set to Dark mode', 'info', 2000);
            }}
            className={`p-4 rounded-xl text-left border transition flex items-center space-x-3 ${
              themePreference === 'dark'
                ? 'bg-brand-50 dark:bg-brand-950/60 border-[#5B5BD6] text-[#5B5BD6] dark:text-brand-300 shadow-soft'
                : 'bg-[#FAF9F6] dark:bg-[#131825] border-[#E8E6DF] dark:border-[#232B3E] text-[#5B6475] dark:text-[#94A3B8] hover:border-slate-300'
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

          {/* Follow System */}
          <button
            type="button"
            onClick={() => {
              setThemePreference('system');
              addToast('Theme following operating system preference', 'info', 2000);
            }}
            className={`p-4 rounded-xl text-left border transition flex items-center space-x-3 ${
              themePreference === 'system'
                ? 'bg-brand-50 dark:bg-brand-950/60 border-[#5B5BD6] text-[#5B5BD6] dark:text-brand-300 shadow-soft'
                : 'bg-[#FAF9F6] dark:bg-[#131825] border-[#E8E6DF] dark:border-[#232B3E] text-[#5B6475] dark:text-[#94A3B8] hover:border-slate-300'
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

      {/* CSV File Upload Section */}
      <Card className="p-6 space-y-5">
        <div>
          <h2 className="text-base font-bold text-[#1F2430] dark:text-white flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
            <span>Direct CSV Post Ingestion (Works Immediately)</span>
          </h2>
          <p className="text-xs text-[#5B6475] dark:text-[#94A3B8] mt-0.5">
            Import your native post export CSV without waiting for developer API keys.
          </p>
        </div>

        <div className="border-2 border-dashed border-[#E8E6DF] dark:border-[#232B3E] rounded-2xl p-6 text-center hover:bg-slate-50 dark:hover:bg-[#141A28] transition cursor-pointer">
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
            <div className="text-sm font-bold text-[#1F2430] dark:text-white">
              {uploadFileName ? uploadFileName : 'Drop analytics CSV here or click to browse'}
            </div>
            <div className="text-xs text-[#5B6475] dark:text-[#94A3B8] max-w-sm mx-auto">
              Auto-detects platform, views, likes, comments, shares, and captions.
            </div>
          </label>
        </div>

        {csvContent && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#141A28] border border-[#E8E6DF] dark:border-[#232B3E] flex items-center justify-between">
            <div className="text-xs text-slate-700 dark:text-slate-300">
              <span className="font-bold">Ready to import:</span> {csvContent.split('\n').length} rows in {uploadFileName}
            </div>
            <Button
              variant="primary"
              size="sm"
              loading={uploading}
              icon={CheckCircle2}
              onClick={handleImportCsv}
            >
              Import into CreatorPulse
            </Button>
          </div>
        )}

        {uploadResult && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{uploadResult.message} Total posts in dataset: {uploadResult.total_posts}.</span>
          </div>
        )}
      </Card>

      {/* 4 Social Platforms Connect Cards (Truthfully Labeled "Coming soon") */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#1F2430] dark:text-white flex items-center space-x-2">
            <Link2 className="w-4 h-4 text-[#5B5BD6]" />
            <span>Direct API Connectors</span>
          </h2>
          <p className="text-xs text-[#5B6475] dark:text-[#94A3B8] mt-0.5">
            Click any platform to view export instructions and upcoming OAuth connector status.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((item) => (
            <Card
              key={item.id}
              hoverEffect
              onClick={() => setActivePlatformDetail(item)}
              className="p-5 flex flex-col justify-between space-y-4 cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <PlatformBadge platform={item.id} />
                  <StatusChip status="Coming soon" size="sm" />
                </div>

                <h3 className="text-sm font-bold text-[#1F2430] dark:text-white">
                  {item.name}
                </h3>
                <p className="text-xs text-[#5B6475] dark:text-[#94A3B8] mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#EFECE6] dark:border-[#232B3E] text-xs">
                <span className="text-[11px] text-slate-500 font-mono">
                  {item.auth_type}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePlatformDetail(item);
                  }}
                >
                  View Guide
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Slide-over: Platform Connect Details & CSV Export Instructions */}
      <SlideOver
        open={Boolean(activePlatformDetail)}
        onClose={() => setActivePlatformDetail(null)}
        title={activePlatformDetail?.name ? `Connecting ${activePlatformDetail.name}` : 'Platform Guide'}
      >
        {activePlatformDetail && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#141A28] border border-[#E8E6DF] dark:border-[#232B3E] space-y-2">
              <div className="flex items-center space-x-2">
                <PlatformBadge platform={activePlatformDetail.id} size="sm" showName />
                <StatusChip status="Coming soon" size="sm" />
              </div>
              <p className="text-xs text-[#5B6475] dark:text-[#94A3B8]">
                {activePlatformDetail.description}
              </p>
            </div>

            {/* Official Export Guide for this platform */}
            {PLATFORM_EXPORT_GUIDES[activePlatformDetail.id] && (
              <div className="p-4 rounded-xl bg-white dark:bg-[#171D2B] border border-[#E8E6DF] dark:border-[#232B3E] space-y-3">
                <div className="text-xs font-bold text-[#1F2430] dark:text-white flex items-center space-x-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  <span>{PLATFORM_EXPORT_GUIDES[activePlatformDetail.id].title}</span>
                </div>
                <div className="space-y-2 text-xs text-[#5B6475] dark:text-[#94A3B8]">
                  {PLATFORM_EXPORT_GUIDES[activePlatformDetail.id].steps.map((st, i) => (
                    <div key={i} className="leading-relaxed">
                      {st}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 space-y-1">
              <div className="font-bold">OAuth 2.0 Direct API Status:</div>
              <p className="leading-relaxed">
                Direct OAuth login for {activePlatformDetail.name} is slated for Production release.
                Use the CSV drag-and-drop feature above to import your channel data today.
              </p>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}
