import React, { useState, useEffect } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { getAccuracyScoreboard } from '../api/apiClient';
import PlatformBadge from '../components/PlatformBadge';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SlideOver from '../components/ui/SlideOver';
import Tooltip from '../components/ui/Tooltip';
import { CardSkeleton } from '../components/ui/Skeleton';
import {
  History,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  BarChart2,
  HelpCircle,
  Sparkles,
  TrendingUp,
  Eye,
  CheckCircle2
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

export default function PredictionHistory() {
  const { selectedPlatform, lastRefreshed } = usePlatform();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scoreboard, setScoreboard] = useState(null);

  // Slide-over inspection
  const [activeItem, setActiveItem] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    getAccuracyScoreboard(selectedPlatform)
      .then((res) => {
        if (!isMounted) return;
        setScoreboard(res);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to fetch prediction scoreboard');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedPlatform, lastRefreshed]);

  if (loading) {
    return (
      <div className="space-y-6">
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
      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200">
          <h2 className="text-base font-bold mb-1">Failed to load Prediction Results</h2>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const calibrationData = scoreboard?.calibration_bins || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F2430] dark:text-white flex items-center space-x-2.5">
          <span>Prediction Results</span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
            Accountability
          </span>
        </h1>
        <p className="text-sm text-[#5B6475] dark:text-[#94A3B8] mt-1 max-w-2xl">
          Tracking our post predictions against actual performance after publication.
        </p>
      </div>

      {/* Summary KPI Cards with Friendly Labels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Forecasts */}
        <Card className="p-5" hoverEffect>
          <span className="text-xs font-bold text-[#5B6475] dark:text-[#94A3B8]">
            Forecasts Tracked
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#1F2430] dark:text-white mt-2">
            {scoreboard?.total_predictions || 0}
          </div>
          <div className="text-xs text-[#5B6475] dark:text-[#94A3B8] mt-1">
            {scoreboard?.evaluated_count} evaluated, {scoreboard?.pending_count} pending
          </div>
        </Card>

        {/* Accuracy Score (Brier Loss) */}
        <Card className="p-5" hoverEffect>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <span className="text-xs font-bold text-[#5B6475] dark:text-[#94A3B8]">
                Accuracy score
              </span>
              <Tooltip text="Brier score: measures how close probabilities were to reality. Closer to 0 means high accuracy." showIcon />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
              Excellent
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
            {scoreboard?.brier_score}
          </div>
          <div className="text-xs text-[#5B6475] dark:text-[#94A3B8] mt-1">
            Low probability error rate
          </div>
        </Card>

        {/* Right when we said hit (Precision) */}
        <Card className="p-5" hoverEffect>
          <div className="flex items-center space-x-1">
            <span className="text-xs font-bold text-[#5B6475] dark:text-[#94A3B8]">
              Right when we said hit
            </span>
            <Tooltip text="Precision: When the model forecasted a hit post, it was correct this percentage of the time." showIcon />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#1F2430] dark:text-white mt-2 font-mono">
            {((scoreboard?.precision || 0) * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-[#5B6475] dark:text-[#94A3B8] mt-1">
            True positive breakout rate
          </div>
        </Card>

        {/* Hits we caught (Recall) */}
        <Card className="p-5" hoverEffect>
          <div className="flex items-center space-x-1">
            <span className="text-xs font-bold text-[#5B6475] dark:text-[#94A3B8]">
              Hits we caught
            </span>
            <Tooltip text="Recall: Total actual breakout hit posts captured in our predictive alerts." showIcon />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#1F2430] dark:text-white mt-2 font-mono">
            {((scoreboard?.recall || 0) * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-[#5B6475] dark:text-[#94A3B8] mt-1">
            Captured channel hits
          </div>
        </Card>
      </div>

      {/* Easy Calibration Chart: "How accurate were we?" */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#1F2430] dark:text-white flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-[#5B5BD6]" />
              <span>How accurate were we? (Predicted vs Actual Outcomes)</span>
              <Tooltip text="Comparing our predicted probability tiers with the actual percentage of posts that became hits." showIcon />
            </h2>
            <p className="text-xs text-[#5B6475] dark:text-[#94A3B8] mt-0.5">
              A well-calibrated tool ensures a predicted 30% hit chance matches ~30% in real life.
            </p>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={calibrationData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} opacity={0.6} />
              <XAxis dataKey="bin" stroke="#94A3B8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} unit="%" />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E8E6DF',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="mean_predicted_prob" name="Our Prediction %" fill="#5B5BD6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="actual_breakout_rate" name="Actual Hit Rate %" fill="#14B8A6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Predictions Table (Clickable for Slide-Over) */}
      <Card className="p-6">
        <h2 className="text-base font-bold text-[#1F2430] dark:text-white mb-4">
          All Past Predictions
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#EFECE6] dark:border-[#232B3E] text-[#858D9D] dark:text-[#64748B] uppercase tracking-wider text-[10px]">
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
              {scoreboard?.recent_history?.map((pred) => {
                const isKnown = pred.actual_outcome !== null;
                const isSuccess = pred.actual_outcome === true;

                return (
                  <tr
                    key={pred.prediction_id}
                    onClick={() => setActiveItem(pred)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer"
                  >
                    <td className="py-3 px-3 whitespace-nowrap text-[#5B6475] dark:text-[#94A3B8] font-mono text-[11px]">
                      {pred.created_at?.slice(0, 10)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <PlatformBadge platform={pred.platform} size="sm" />
                    </td>
                    <td className="py-3 px-3 font-medium text-[#1F2430] dark:text-white max-w-xs truncate">
                      {pred.title}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-[#5B5BD6] dark:text-brand-300 font-mono">
                      {Math.round((pred.predicted_prob || 0) * 100)}%
                    </td>
                    <td className="py-3 px-3 text-right text-[#5B6475] dark:text-[#94A3B8] font-mono">
                      {Math.round((pred.base_rate || 0) * 100)}%
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {isKnown ? (
                        isSuccess ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>Hit post</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400">
                            <XCircle className="w-3 h-3 text-slate-400" />
                            <span>Usual</span>
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>Evaluating</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right text-[#1F2430] dark:text-white font-mono">
                      {pred.actual_views ? pred.actual_views.toLocaleString() : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Slide-over: Prediction vs Actual Outcome Details */}
      <SlideOver
        isOpen={Boolean(activeItem)}
        onClose={() => setActiveItem(null)}
        title={activeItem?.title}
        subtitle={`Forecasted on ${activeItem?.created_at?.slice(0, 10)}`}
        footer={
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setActiveItem(null)}>
              Close
            </Button>
          </div>
        }
      >
        {activeItem && (
          <div className="space-y-6 text-sm">
            <div className="flex items-center justify-between">
              <PlatformBadge platform={activeItem.platform} />
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {activeItem.post_type}
              </span>
            </div>

            {/* Score Comparison */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800">
                <span className="text-xs font-semibold text-[#5B5BD6] dark:text-brand-300">
                  Forecasted Hit Chance
                </span>
                <div className="text-2xl font-extrabold text-[#5B5BD6] dark:text-brand-300 mt-1">
                  {Math.round(activeItem.predicted_prob * 100)}%
                </div>
                <span className="text-[11px] text-[#5B6475] dark:text-brand-300/80 mt-1 block">
                  Usual rate: {Math.round(activeItem.base_rate * 100)}%
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E]">
                <span className="text-xs font-semibold text-[#5B6475] dark:text-[#94A3B8]">
                  Actual Outcome
                </span>
                <div className="text-base font-bold text-[#1F2430] dark:text-white mt-2">
                  {activeItem.actual_outcome === true ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center justify-center space-x-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>Hit!</span>
                    </span>
                  ) : activeItem.actual_outcome === false ? (
                    <span className="text-slate-500">Standard</span>
                  ) : (
                    <span className="text-amber-500">Evaluating</span>
                  )}
                </div>
                <span className="text-[11px] text-[#5B6475] dark:text-[#94A3B8] mt-1 block">
                  {activeItem.actual_views ? `${activeItem.actual_views.toLocaleString()} views` : 'Pending'}
                </span>
              </div>
            </div>

            {/* Reasons Evaluated */}
            {activeItem.top_reasons && activeItem.top_reasons.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#858D9D]">
                  Predictive Reasons Given
                </h4>
                {activeItem.top_reasons.map((r, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] text-xs text-[#1F2430] dark:text-slate-200 flex items-start space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </SlideOver>
    </div>
  );
}
