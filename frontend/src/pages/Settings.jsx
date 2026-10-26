import React, { useState, useEffect } from 'react';
import { getIntegrations } from '../api/apiClient';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import PlatformBadge from '../components/PlatformBadge';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SlideOver from '../components/ui/SlideOver';
import GuidedTour from '../components/ui/GuidedTour';
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
  RotateCcw
} from 'lucide-react';

export default function Settings() {
  const { themePreference, setThemePreference } = useTheme();
  const { addToast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Slide-over state for connection instructions
  const [activePlatformDetail, setActivePlatformDetail] = useState(null);
  const [activeDataSourceDetail, setActiveDataSourceDetail] = useState(null);

  // Guided tour replay
  const [replayTour, setReplayTour] = useState(false);

  useEffect(() => {
    getIntegrations()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const integrations = data?.integrations || [];
  const dataSources = data?.data_sources || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F2430] dark:text-white flex items-center space-x-2.5">
          <span>Connect Accounts & Preferences</span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Settings
          </span>
        </h1>
        <p className="text-sm text-[#5B6475] dark:text-[#94A3B8] mt-1 max-w-2xl">
          Connect your channels, customize interface themes, or review ingestion pipelines.
        </p>
      </div>

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
              <div className="font-bold text-xs sm:text-sm text-[#1F2430] dark:text-white">
                Light Theme (Default)
              </div>
              <div className="text-[11px] text-[#5B6475] dark:text-[#94A3B8]">
                Warm off-white paper canvas
              </div>
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
            <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center shrink-0">
              <Moon className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-[#1F2430] dark:text-white">
                Dark Theme
              </div>
              <div className="text-[11px] text-[#5B6475] dark:text-[#94A3B8]">
                Deep navy-charcoal night mode
              </div>
            </div>
          </button>

          {/* System */}
          <button
            type="button"
            onClick={() => {
              setThemePreference('system');
              addToast('Theme following operating system', 'info', 2000);
            }}
            className={`p-4 rounded-xl text-left border transition flex items-center space-x-3 ${
              themePreference === 'system'
                ? 'bg-brand-50 dark:bg-brand-950/60 border-[#5B5BD6] text-[#5B5BD6] dark:text-brand-300 shadow-soft'
                : 'bg-[#FAF9F6] dark:bg-[#131825] border-[#E8E6DF] dark:border-[#232B3E] text-[#5B6475] dark:text-[#94A3B8] hover:border-slate-300'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-[#1F2430] dark:text-white">
                Follow System
              </div>
              <div className="text-[11px] text-[#5B6475] dark:text-[#94A3B8]">
                Matches device OS setting
              </div>
            </div>
          </button>
        </div>
      </Card>

      {/* Guided Tour Replay */}
      <Card variant="tintedTeal" className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-teal-200 dark:border-teal-900/40">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500 text-white flex items-center justify-center shadow-xs">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1F2430] dark:text-white">
              Want a quick refresher tour?
            </h3>
            <p className="text-xs text-[#5B6475] dark:text-[#94A3B8]">
              Replay the 4-step onboarding guide introducing CreatorPulse features.
            </p>
          </div>
        </div>

        <Button
          variant="teal"
          size="sm"
          icon={RotateCcw}
          onClick={() => setReplayTour(true)}
        >
          Replay Tour
        </Button>
      </Card>

      {/* 4 Social Platforms Connect Cards */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#1F2430] dark:text-white flex items-center space-x-2">
            <Link2 className="w-4 h-4 text-[#5B5BD6]" />
            <span>Connect Creator Accounts</span>
          </h2>
          <p className="text-xs text-[#5B6475] dark:text-[#94A3B8] mt-0.5">
            Click any platform to inspect connection options (API, CSV upload, or sample data).
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
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] text-[#5B6475] dark:text-[#94A3B8]">
                    {item.auth_type}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#1F2430] dark:text-white">
                  {item.name}
                </h3>
                <p className="text-xs text-[#5B6475] dark:text-[#94A3B8] mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#EFECE6] dark:border-[#232B3E] text-xs">
                <span className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/50">
                  {item.status}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePlatformDetail(item);
                  }}
                >
                  {item.action}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 3 Data Ingestion Options */}
      <Card className="p-6 space-y-5">
        <div>
          <h2 className="text-base font-bold text-[#1F2430] dark:text-white flex items-center space-x-2">
            <Database className="w-4 h-4 text-[#5B5BD6]" />
            <span>3 Ways to Provide Data</span>
          </h2>
          <p className="text-xs text-[#5B6475] dark:text-[#94A3B8] mt-0.5">
            Designed for privacy and flexibility — no lock-in.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dataSources.map((ds, i) => (
            <div
              key={i}
              onClick={() => setActiveDataSourceDetail(ds)}
              className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] space-y-2 hover:border-brand-300 transition cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                {i === 0 && <Globe className="w-4 h-4 text-[#5B5BD6]" />}
                {i === 1 && <FileSpreadsheet className="w-4 h-4 text-emerald-500" />}
                {i === 2 && <Database className="w-4 h-4 text-teal-500" />}
                <h3 className="text-xs font-bold text-[#1F2430] dark:text-white">
                  {ds.type}
                </h3>
              </div>
              <p className="text-xs text-[#5B6475] dark:text-[#94A3B8] leading-relaxed">
                {ds.notes}
              </p>
              <div className="text-[11px] text-[#5B5BD6] dark:text-brand-300 font-semibold pt-1">
                {ds.suitability} &rarr;
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Slide-over: Platform Connect Details */}
      <SlideOver
        isOpen={Boolean(activePlatformDetail)}
        onClose={() => setActivePlatformDetail(null)}
        title={`Connect ${activePlatformDetail?.name}`}
        subtitle={`Authentication: ${activePlatformDetail?.auth_type}`}
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" size="sm" onClick={() => setActivePlatformDetail(null)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                addToast(`${activePlatformDetail?.name} connector scheduled for live API v2.0!`, 'info');
                setActivePlatformDetail(null);
              }}
            >
              Request API Access
            </Button>
          </div>
        }
      >
        {activePlatformDetail && (
          <div className="space-y-5 text-xs sm:text-sm">
            <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 text-[#313083] dark:text-brand-300 space-y-1">
              <span className="font-bold text-xs uppercase tracking-wider block">
                How Connection Works
              </span>
              <p className="leading-relaxed">
                In v2.0, you'll authorize your channel via OAuth 2.0 with read-only permissions.
                CreatorPulse AI ingests post telemetry to compute your baseline and alert you to viral breakouts.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-[#1F2430] dark:text-white">
                Planned Features for {activePlatformDetail.name}:
              </h4>
              <ul className="space-y-1.5 text-[#5B6475] dark:text-[#94A3B8]">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Automatic background sync every 6 hours</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Audience retention curve anomaly detection</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Rate limits: {activePlatformDetail.rate_limit}</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </SlideOver>

      {/* Slide-over: Data Source Details */}
      <SlideOver
        isOpen={Boolean(activeDataSourceDetail)}
        onClose={() => setActiveDataSourceDetail(null)}
        title={activeDataSourceDetail?.type}
        subtitle={activeDataSourceDetail?.suitability}
        footer={
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setActiveDataSourceDetail(null)}>
              Close
            </Button>
          </div>
        }
      >
        {activeDataSourceDetail && (
          <div className="space-y-4 text-xs sm:text-sm">
            <p className="text-[#5B6475] dark:text-[#94A3B8] leading-relaxed">
              {activeDataSourceDetail.notes}
            </p>
            <div className="p-3.5 rounded-xl bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E]">
              <span className="font-bold text-[#1F2430] dark:text-white block mb-1">
                Zero API Lock-in
              </span>
              <p className="text-xs text-[#5B6475] dark:text-[#94A3B8] leading-relaxed">
                If you prefer not to grant OAuth API access, you can download your channel analytics CSV from YouTube Studio or Meta Suite and drop it directly into CreatorPulse.
              </p>
            </div>
          </div>
        )}
      </SlideOver>

      {/* Guided Tour Modal if replayed */}
      <GuidedTour forceOpen={replayTour} onClose={() => setReplayTour(false)} />
    </div>
  );
}
