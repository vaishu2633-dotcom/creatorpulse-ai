import React, { useState, useEffect } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { useToast } from '../context/ToastContext';
import {
  getAccuracyScoreboard,
  recordPredictionOutcome,
  syncYouTubePredictionOutcomes
} from '../api/apiClient';
import PageHeader from '../components/ui/PageHeader';
import HowItWorks from '../components/ui/HowItWorks';
import StatusChip from '../components/ui/StatusChip';
import PlatformBadge from '../components/PlatformBadge';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SlideOver from '../components/ui/SlideOver';
import Tooltip from '../components/ui/Tooltip';
import { CardSkeleton } from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import TrackerIllustration from '../assets/illustrations/tracker-results.svg';
import {
  Target,
  CheckCircle,
  XCircle,
  Clock,
  BarChart2,
  HelpCircle,
  Sparkles,
  TrendingUp,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Save,
  Check,
  Zap
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';

const HOW_IT_WORKS_STEPS = [
  {
    title: 'Forecast in Studio & Predictor',
    description: 'Every post generated or analyzed has its breakout hit chance logged with timestamp and features.'
  },
  {
    title: 'Track Published Outcomes',
    description: 'Performance metrics (views, likes, engagement rate) are monitored to identify true breakout hits.'
  },
  {
    title: 'Mathematical Accuracy Audit',
    description: 'Brier calibration evaluates whether a 20% predicted chance actually yields hits 20% of the time, compared against naive baseline guessing.'
  }
];

export default function PredictionHistory() {
  const { selectedPlatform, lastRefreshed, activeDataSource } = usePlatform();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scoreboard, setScoreboard] = useState(null);

  // Slide-over inspection & manual outcome recording state
  const [activeItem, setActiveItem] = useState(null);
  const [outcomeForm, setOutcomeForm] = useState({
    actualOutcome: true,
    actualViews: '',
    actualER: ''
  });
  const [savingOutcome, setSavingOutcome] = useState(false);
  const [syncingYt, setSyncingYt] = useState(false);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    getAccuracyScoreboard(selectedPlatform)
      .then((res) => {
        setScoreboard(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch prediction scoreboard');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, [selectedPlatform, lastRefreshed]);

  const handleSelectPrediction = (item) => {
    setActiveItem(item);
    setOutcomeForm({
      actualOutcome: item.actual_outcome !== null ? Boolean(item.actual_outcome) : true,
      actualViews: item.actual_views ? String(item.actual_views) : '',
      actualER: item.actual_engagement_rate ? String((item.actual_engagement_rate * 100).toFixed(2)) : ''
    });
  };

  const handleSaveOutcome = async (e) => {
    e.preventDefault();
    if (!activeItem) return;

    setSavingOutcome(true);
    try {
      const viewsNum = outcomeForm.actualViews ? parseInt(outcomeForm.actualViews, 10) : null;
      const erNum = outcomeForm.actualER ? parseFloat(outcomeForm.actualER) / 100 : null;

      const res = await recordPredictionOutcome(activeItem.prediction_id, {
        actual_outcome: outcomeForm.actualOutcome,
        actual_views: viewsNum,
        actual_engagement_rate: erNum
      });

      addToast('Real outcome recorded! Scoreboard recalculated.', 'success');
      setActiveItem(res.prediction);
      setScoreboard(res.scoreboard);
    } catch (err) {
      addToast(err.message || 'Failed to record outcome', 'error');
    } finally {
      setSavingOutcome(false);
    }
  };

  const handleSyncYouTube = async () => {
    setSyncingYt(true);
    try {
      const res = await syncYouTubePredictionOutcomes();
      addToast(res.message, res.updated_count > 0 ? 'success' : 'info');
      fetchData();
    } catch (err) {
      addToast(err.message || 'YouTube sync failed', 'error');
    } finally {
      setSyncingYt(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="h-72 rounded-2xl bg-white dark:bg-[#171D2B] animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <ErrorState
          title="Failed to load Prediction Results"
          description={error}
          onRetry={fetchData}
        />
      </div>
    );
  }

  const calibrationData = scoreboard?.calibration_bins || [];
  const sampleSize = scoreboard?.sample_size || scoreboard?.evaluated_count || 0;
  const isLowSample = scoreboard?.low_sample_warning || sampleSize < 30;

  const evalLabel = scoreboard?.brier_evaluation_label || 'Evaluating';
  const getBrierChipStyle = () => {
    if (evalLabel.includes('Better')) {
      return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
    if (evalLabel.includes('About the same')) {
      return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    }
    return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Prediction Results"
          subtitle="Tracking our post predictions against actual performance after publication"
          tag="Tracker"
          status="Working now"
          icon={Target}
          illustration={TrackerIllustration}
        />
        <div className="shrink-0 flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncYouTube}
            loading={syncingYt}
            icon={RefreshCw}
          >
            Sync YouTube Outcomes
          </Button>
        </div>
      </div>

      {/* How it Works Strip */}
      <HowItWorks steps={HOW_IT_WORKS_STEPS} />

      {/* Low Sample Warning Banner */}
      {isLowSample && (
        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 flex items-start space-x-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-amber-950 dark:text-amber-200">
              Sample Size Notice (N = {sampleSize} evaluated predictions):
            </span>
            <p className="leading-relaxed">
              Accuracy and Brier calibration scores stabilize as more published post outcomes are logged.
              Evaluations become statistically robust at N &ge; 30 evaluated posts.
            </p>
          </div>
        </div>
      )}

      {/* Summary KPI Cards with Sample Size next to every number */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Forecasts */}
        <Card className="p-5" hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5B6475] dark:text-[#94A3B8]">
              Forecasts Tracked
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              N = {scoreboard?.total_predictions || 0}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#1F2430] dark:text-white mt-2">
            {scoreboard?.total_predictions || 0}
          </div>
          <div className="text-xs text-[#5B6475] dark:text-[#94A3B8] mt-1">
            {scoreboard?.evaluated_count} evaluated &bull; {scoreboard?.pending_count} pending
          </div>
        </Card>

        {/* Accuracy Score (Brier Loss vs Baseline Guessing) */}
        <Card className="p-5" hoverEffect>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <span className="text-xs font-bold text-[#5B6475] dark:text-[#94A3B8]">
                Brier Accuracy
              </span>
              <Tooltip
                text="In probability forecasting, Brier score measures calibration error (0.0 is perfect). We compare this model score against naive baseline guessing where you simply guess your creator base rate p every time, giving expected score p(1-p)."
                showIcon
              />
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBrierChipStyle()}`}>
              {evalLabel}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#1F2430] dark:text-white mt-2 font-mono">
            {scoreboard?.brier_score}
          </div>
          <div className="text-xs text-[#5B6475] dark:text-[#94A3B8] mt-1">
            Baseline guessing: <strong className="text-slate-700 dark:text-slate-300 font-mono">{scoreboard?.baseline_brier_score}</strong> (N = {sampleSize})
          </div>
        </Card>

        {/* Precision: When flagged hit, was it hit? */}
        <Card className="p-5" hoverEffect>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <span className="text-xs font-bold text-[#5B6475] dark:text-[#94A3B8]">
                Right when flagged hit
              </span>
              <Tooltip text="Precision: When the model forecasted a breakout hit post, it was correct this percentage of the time." showIcon />
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              N = {sampleSize}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#1F2430] dark:text-white mt-2 font-mono">
            {((scoreboard?.precision || 0) * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-[#5B6475] dark:text-[#94A3B8] mt-1">
            True positive breakout rate
          </div>
        </Card>

        {/* Recall: Hits caught */}
        <Card className="p-5" hoverEffect>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <span className="text-xs font-bold text-[#5B6475] dark:text-[#94A3B8]">
                Hits we caught
              </span>
              <Tooltip text="Recall: Total actual breakout hit posts captured in our predictive alerts." showIcon />
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              N = {sampleSize}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#1F2430] dark:text-white mt-2 font-mono">
            {((scoreboard?.recall || 0) * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-[#5B6475] dark:text-[#94A3B8] mt-1">
            Captured channel hits
          </div>
        </Card>
      </div>

      {/* Calibration Chart: "How accurate were we?" */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#1F2430] dark:text-white flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-[#5B5BD6]" />
              <span>How accurate were our predictions? (Calibration Audit)</span>
            </h2>
            <p className="text-xs text-[#5B6475] dark:text-[#94A3B8] mt-0.5">
              Comparing estimated hit probabilities with actual breakout rates across {sampleSize} published posts
            </p>
          </div>
          <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            Sample: N = {sampleSize}
          </div>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={calibrationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
              <XAxis dataKey="bin" tick={{ fontSize: 11 }} stroke="#94A3B8" />
              <YAxis unit="%" tick={{ fontSize: 11 }} stroke="#94A3B8" domain={[0, 100]} />
              <RechartsTooltip
                formatter={(val) => [`${val}%`, '']}
                contentStyle={{
                  backgroundColor: '#1E293B',
                  borderRadius: '8px',
                  border: 'none',
                  color: '#F8FAFC',
                  fontSize: '11px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="mean_predicted_prob" name="Predicted Hit Chance" fill="#818CF8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual_breakout_rate" name="Actual Breakout Rate" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Predictions Timeline Table */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-[#EFECE6] dark:border-[#232B3E] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#1F2430] dark:text-white">
              Prediction Log & Audit
            </h3>
            <p className="text-xs text-[#5B6475] dark:text-[#94A3B8] mt-0.5">
              Click any row to inspect model factors or record real published outcomes
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Showing latest {scoreboard?.recent_history?.length || 0}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF9F6] dark:bg-[#131825] border-b border-[#EFECE6] dark:border-[#232B3E] text-[#5B6475] dark:text-[#94A3B8] font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Platform</th>
                <th className="py-3 px-3">Post Title</th>
                <th className="py-3 px-3 text-right">Predicted Chance</th>
                <th className="py-3 px-3 text-right">Usual Rate</th>
                <th className="py-3 px-3 text-center">Actual Outcome</th>
                <th className="py-3 px-3 text-right">Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFECE6] dark:divide-[#232B3E]">
              {(scoreboard?.recent_history || []).map((item) => {
                const isEvaluated = item.actual_outcome !== null && item.actual_outcome !== undefined;
                const isHit = Boolean(item.actual_outcome);
                const probPct = Math.round((item.predicted_prob || 0) * 100);
                const basePct = Math.round((item.base_rate || item.creator_base_rate || 0.05) * 100);

                return (
                  <tr
                    key={item.prediction_id}
                    onClick={() => handleSelectPrediction(item)}
                    className="hover:bg-slate-50 dark:hover:bg-[#1A2333] transition cursor-pointer group"
                  >
                    <td className="py-3.5 px-3 text-[#5B6475] dark:text-[#94A3B8] whitespace-nowrap font-mono text-[11px]">
                      {item.created_at ? item.created_at.slice(0, 10) : 'Recent'}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <PlatformBadge platform={item.platform} size="sm" showName />
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-[#1F2430] dark:text-white max-w-xs truncate group-hover:text-violet-600 transition">
                      {item.title}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-[#5B5BD6] dark:text-brand-300">
                      {probPct}%
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-[#5B6475] dark:text-[#94A3B8]">
                      {basePct}%
                    </td>
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {isEvaluated ? (
                        isHit ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Hit</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            <XCircle className="w-3 h-3 text-slate-400" />
                            <span>Normal</span>
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>In Review</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-[#5B6475] dark:text-[#94A3B8]">
                      {item.actual_views ? Number(item.actual_views).toLocaleString() : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Slide-Over Inspection & Recording Panel */}
      <SlideOver
        isOpen={Boolean(activeItem)}
        onClose={() => setActiveItem(null)}
        title="Prediction Audit & Learning Loop"
        subtitle="Review forecasted probabilities and record real published performance"
      >
        {activeItem && (
          <div className="space-y-6 p-2">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#141A28] border border-[#E8E6DF] dark:border-[#232B3E] space-y-2">
              <div className="flex items-center space-x-2">
                <PlatformBadge platform={activeItem.platform} size="sm" showName />
                <span className="text-[11px] text-slate-400 font-mono">
                  ID: {activeItem.prediction_id}
                </span>
              </div>
              <h3 className="text-sm font-bold text-[#1F2430] dark:text-white leading-relaxed">
                {activeItem.title}
              </h3>
            </div>

            {/* Probability Breakdown */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#171D2B] border border-[#E8E6DF] dark:border-[#232B3E] space-y-3">
              <div className="text-xs font-bold text-[#5B6475] dark:text-[#94A3B8] uppercase tracking-wider">
                Forecasted Probabilities
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30">
                  <div className="text-2xl font-extrabold text-[#5B5BD6] dark:text-brand-300 font-mono">
                    {Math.round((activeItem.predicted_prob || 0) * 100)}%
                  </div>
                  <div className="text-[11px] text-[#5B6475] dark:text-[#94A3B8]">
                    Estimated Hit Chance
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <div className="text-2xl font-extrabold text-[#1F2430] dark:text-white font-mono">
                    {Math.round((activeItem.base_rate || activeItem.creator_base_rate || 0.05) * 100)}%
                  </div>
                  <div className="text-[11px] text-[#5B6475] dark:text-[#94A3B8]">
                    Usual Channel Rate
                  </div>
                </div>
              </div>
            </div>

            {/* Manual Learning Loop Form: Record Real Outcome */}
            <form onSubmit={handleSaveOutcome} className="p-4 rounded-xl bg-white dark:bg-[#171D2B] border border-violet-200 dark:border-violet-800/60 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="text-xs font-bold text-violet-900 dark:text-violet-200 uppercase tracking-wider flex items-center space-x-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-violet-600" />
                  <span>Record Real Outcome</span>
                </div>
                <span className="text-[10px] text-slate-400">Closes learning loop</span>
              </div>

              {/* Outcome Toggle */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  Did this post break out as a Hit?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOutcomeForm({ ...outcomeForm, actualOutcome: true })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer border ${
                      outcomeForm.actualOutcome
                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Breakout Hit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOutcomeForm({ ...outcomeForm, actualOutcome: false })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer border ${
                      !outcomeForm.actualOutcome
                        ? 'bg-slate-700 text-white border-slate-800 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Standard / Normal</span>
                  </button>
                </div>
              </div>

              {/* Numbers */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Actual Views
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 45000"
                    value={outcomeForm.actualViews}
                    onChange={(e) => setOutcomeForm({ ...outcomeForm, actualViews: e.target.value })}
                    className="w-full bg-[#FAF9F6] dark:bg-[#111622] border border-[#E8E6DF] dark:border-[#232B3E] rounded-xl px-3 py-1.5 text-xs text-[#1F2430] dark:text-white focus:outline-none focus:border-violet-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Actual ER (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 6.5"
                    value={outcomeForm.actualER}
                    onChange={(e) => setOutcomeForm({ ...outcomeForm, actualER: e.target.value })}
                    className="w-full bg-[#FAF9F6] dark:bg-[#111622] border border-[#E8E6DF] dark:border-[#232B3E] rounded-xl px-3 py-1.5 text-xs text-[#1F2430] dark:text-white focus:outline-none focus:border-violet-600"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={savingOutcome}
                className="w-full"
                icon={Save}
              >
                Save Real Outcome
              </Button>
            </form>

            {/* Model Factors */}
            {activeItem.top_reasons && activeItem.top_reasons.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#5B6475] dark:text-[#94A3B8] uppercase tracking-wider">
                  Model Factors Considered
                </div>
                <div className="space-y-1.5">
                  {activeItem.top_reasons.map((r, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#141A28] border border-[#E8E6DF] dark:border-[#232B3E] text-xs text-[#1F2430] dark:text-slate-200 flex items-start space-x-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </SlideOver>
    </div>
  );
}
