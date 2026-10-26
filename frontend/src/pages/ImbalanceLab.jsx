import React, { useState, useEffect } from 'react';
import { getMlResults } from '../api/apiClient';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SlideOver from '../components/ui/SlideOver';
import Tabs from '../components/ui/Tabs';
import Tooltip from '../components/ui/Tooltip';
import { CardSkeleton } from '../components/ui/Skeleton';
import {
  FlaskConical,
  BarChart2,
  AlertTriangle,
  Info,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

const PLAIN_METHODS = {
  baseline_none: {
    title: 'No special handling',
    tech: 'Baseline Model',
    desc: 'The model treats hit posts just like standard posts without compensating for rarity.',
    impact: 'Fails to detect hits when they become very rare (predicts everything as non-hit).',
  },
  class_weight_balanced: {
    title: 'Give hits more weight',
    tech: "class_weight='balanced'",
    desc: 'Penalizes the algorithm heavily when it misses a rare breakout post.',
    impact: 'Forces the model to pay attention to hits without fabricating fake data.',
  },
  random_oversampling: {
    title: 'Repeat hit examples',
    tech: 'Random Oversampling (ROS)',
    desc: 'Duplicates historical hit posts so the training data has equal proportions.',
    impact: 'Effective but can cause slight overfitting to specific phrases.',
  },
  smote: {
    title: 'Create extra synthetic hit examples',
    tech: 'SMOTE (Synthetic Minority Oversampling)',
    desc: 'Blends features of neighboring hit posts to create realistic practice posts.',
    impact: 'Expands the hit territory smoothly inside the training pipeline.',
  },
  smote_tomek: {
    title: 'Synthesize & clean border posts',
    tech: 'SMOTE-Tomek Combination',
    desc: 'Synthesizes hit posts and removes ambiguous borderline examples.',
    impact: 'Sharpens clear decision boundaries between hit posts and baseline posts.',
  },
  balanced_random_forest: {
    title: 'Balanced decision trees',
    tech: 'Balanced Random Forest',
    desc: 'Draws a balanced sample of hit and standard posts for each decision tree.',
    impact: 'High recall across all rarity levels.',
  },
  xgboost_scale_weight: {
    title: 'Gradient boosted hit focus',
    tech: 'XGBoost (scale_pos_weight)',
    desc: 'Gradient boosting model with weighted loss focused on rare hit discovery.',
    impact: 'Strong balance of precision and recall in moderate rarity regimes.',
  },
  threshold_tuning: {
    title: 'Adjust decision cutoff',
    tech: 'Optimal Threshold Tuning',
    desc: 'Instead of assuming a default 50% cutoff, finds the optimal decision threshold that maximizes F1 score.',
    impact: 'Crucial when hit posts are extremely rare (1%).',
  },
};

const METRIC_OPTIONS = [
  { id: 'pr_auc', label: 'PR-AUC (Quality Score)' },
  { id: 'f1', label: 'Balanced F1 Score' },
  { id: 'recall', label: 'Hits Caught (Recall)' },
  { id: 'precision', label: 'Right When Calling Hit (Precision)' },
  { id: 'brier_score', label: 'Accuracy Score (Brier Loss)' },
];

export default function ImbalanceLab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeRatio, setActiveRatio] = useState('90_10');
  const [activeMetric, setActiveMetric] = useState('pr_auc');

  // Slide-over inspection for method explanation
  const [activeMethodKey, setActiveMethodKey] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getMlResults()
      .then((res) => {
        if (!isMounted) return;
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load model test results');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 rounded-2xl bg-white dark:bg-[#171D2B] animate-pulse" />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200">
          <h2 className="text-base font-bold mb-1">Failed to load Model Tests</h2>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const currentScenario = data?.benchmarks?.[activeRatio];
  const methodsObj = currentScenario?.methods || {};

  // Formatted horizontal bar chart data
  const chartData = Object.entries(methodsObj).map(([key, metrics]) => {
    const info = PLAIN_METHODS[key] || { title: key };
    return {
      key,
      title: info.title,
      value: metrics[activeMetric] !== undefined ? metrics[activeMetric] : 0,
      f1: metrics.f1,
      pr_auc: metrics.pr_auc,
      recall: metrics.recall,
      precision: metrics.precision,
    };
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F2430] dark:text-white flex items-center space-x-2.5">
          <span>Model Tests</span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-[#5B5BD6] dark:text-brand-300 border border-brand-200 dark:border-brand-800">
            How we handle rare hits
          </span>
        </h1>
        <p className="text-sm text-[#5B6475] dark:text-[#94A3B8] mt-1 max-w-3xl">
          Hit posts are naturally rare (5% to 10% of all content). Here is how we train models to detect them accurately without being fooled by plain accuracy.
        </p>

        {/* Friendly Plain Explanation of Rare Events */}
        <div className="mt-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 space-y-1.5 leading-relaxed">
          <div className="flex items-center space-x-2 font-bold text-amber-950 dark:text-amber-100">
            <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Why "Plain Accuracy" is a trap for creator analytics</span>
          </div>
          <p>
            If only 1 in 100 posts goes viral, a lazy AI model could guess "Not a hit" for every single post and boast a 99% accuracy score — while failing to help you even once!
            That is why we use <strong>PR-AUC, F1, and Precision-Recall</strong> instead of plain accuracy.
          </p>
        </div>
      </div>

      {/* Rarity Scenario Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-2xl bg-white dark:bg-[#171D2B] border border-[#E8E6DF] dark:border-[#232B3E] shadow-soft">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: '80_20', label: '1 in 5 is a hit (80:20)' },
            { id: '90_10', label: '1 in 10 is a hit (90:10)' },
            { id: '95_5',  label: '1 in 20 is a hit (95:5)' },
            { id: '99_1',  label: '1 in 100 is a hit (99:1)' },
          ].map((sc) => (
            <button
              key={sc.id}
              onClick={() => setActiveRatio(sc.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                activeRatio === sc.id
                  ? 'bg-brand-50 dark:bg-brand-950/70 border-[#5B5BD6] text-[#5B5BD6] dark:text-brand-300 shadow-2xs'
                  : 'bg-[#FAF9F6] dark:bg-[#131825] border-[#E8E6DF] dark:border-[#232B3E] text-[#5B6475] dark:text-[#94A3B8] hover:border-slate-300'
              }`}
            >
              {sc.label}
            </button>
          ))}
        </div>

        {/* Metric Selector */}
        <div className="flex items-center space-x-2 shrink-0 px-1">
          <span className="text-xs font-semibold text-[#5B6475] dark:text-[#94A3B8]">
            Compare by:
          </span>
          <select
            value={activeMetric}
            onChange={(e) => setActiveMetric(e.target.value)}
            className="bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] rounded-xl px-3 py-1.5 text-xs text-[#1F2430] dark:text-white focus:outline-none focus:border-[#5B5BD6]"
          >
            {METRIC_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Horizontal Bar Chart Comparison */}
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#1F2430] dark:text-white">
            Performance: {METRIC_OPTIONS.find((m) => m.id === activeMetric)?.label}
          </h2>
          <p className="text-xs text-[#5B6475] dark:text-[#94A3B8] mt-0.5">
            Scenario: {currentScenario?.name} • Evaluated on 360 held-out recent chronological posts
          </p>
        </div>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 160, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} opacity={0.6} />
              <XAxis type="number" stroke="#94A3B8" tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="title"
                stroke="#94A3B8"
                tick={{ fontSize: 11 }}
                width={150}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E8E6DF',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="value" fill="#5B5BD6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Detailed Methods Grid (Clickable to open SlideOver) */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[#1F2430] dark:text-white">
          Techniques Tested (Click any for plain explanation)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(methodsObj).map(([key, m]) => {
            const info = PLAIN_METHODS[key] || { title: key, tech: key };

            return (
              <Card
                key={key}
                hoverEffect
                onClick={() => setActiveMethodKey(key)}
                className="p-5 flex flex-col justify-between cursor-pointer space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-[#1F2430] dark:text-white">
                      {info.title}
                    </h3>
                    <span className="text-xs font-bold text-[#5B5BD6] dark:text-brand-300 font-mono">
                      Score: {m[activeMetric]}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    {info.tech}
                  </div>
                  <p className="text-xs text-[#5B6475] dark:text-[#94A3B8] mt-2 line-clamp-2 leading-relaxed">
                    {info.desc}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#EFECE6] dark:border-[#232B3E] text-xs">
                  <span className="text-[#5B6475] dark:text-[#94A3B8]">
                    F1: <strong className="text-[#1F2430] dark:text-white font-mono">{m.f1}</strong> • Rec: <strong className="text-[#1F2430] dark:text-white font-mono">{m.recall}</strong>
                  </span>
                  <span className="text-[#5B5BD6] font-semibold flex items-center space-x-1">
                    <span>Learn more</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Slide-over: Method Plain Language Explainer */}
      <SlideOver
        isOpen={Boolean(activeMethodKey)}
        onClose={() => setActiveMethodKey(null)}
        title={PLAIN_METHODS[activeMethodKey]?.title}
        subtitle={PLAIN_METHODS[activeMethodKey]?.tech}
        footer={
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setActiveMethodKey(null)}>
              Close
            </Button>
          </div>
        }
      >
        {activeMethodKey && (
          <div className="space-y-5 text-xs sm:text-sm">
            <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 text-[#313083] dark:text-brand-300">
              <span className="font-bold text-xs uppercase tracking-wider block mb-1">
                How it works in plain terms
              </span>
              <p className="leading-relaxed">
                {PLAIN_METHODS[activeMethodKey]?.desc}
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="font-bold text-[#1F2430] dark:text-white">
                Practical impact on your hit alerts:
              </span>
              <p className="text-[#5B6475] dark:text-[#94A3B8] leading-relaxed">
                {PLAIN_METHODS[activeMethodKey]?.impact}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] space-y-2">
              <span className="font-bold text-xs uppercase tracking-wider text-[#858D9D] block">
                Recorded benchmark numbers in active scenario:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>Quality (PR-AUC): <strong className="text-[#5B5BD6]">{methodsObj[activeMethodKey]?.pr_auc}</strong></div>
                <div>F1 Score: <strong className="text-[#1F2430] dark:text-white">{methodsObj[activeMethodKey]?.f1}</strong></div>
                <div>Hits Caught (Recall): <strong className="text-emerald-600">{methodsObj[activeMethodKey]?.recall}</strong></div>
                <div>Precision: <strong className="text-indigo-600">{methodsObj[activeMethodKey]?.precision}</strong></div>
              </div>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}
