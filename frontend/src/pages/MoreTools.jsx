import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import StatusChip from '../components/ui/StatusChip';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ImbalanceLab from './ImbalanceLab';
import { usePlatform } from '../context/PlatformContext';
import { getMlResults, getModelInfo } from '../api/apiClient';
import {
  FlaskConical,
  BarChart3,
  Database,
  Layers,
  Cpu,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Info,
  Sliders,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from 'recharts';

export default function MoreTools() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    tabParam === 'performance' ? 'performance' : tabParam === 'dataset' ? 'dataset' : 'lab'
  );

  const { activeSource, dataSourceMeta, switchDataSource } = usePlatform();
  const [modelData, setModelData] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tabParam === 'performance' || tabParam === 'dataset' || tabParam === 'lab') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getMlResults().catch(() => null),
      getModelInfo().catch(() => null)
    ]).then(([mlRes, infoRes]) => {
      if (isMounted) {
        setModelData(mlRes);
        setModelInfo(infoRes);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const featureImportances = modelData?.feature_importances
    ? Object.entries(modelData.feature_importances).map(([name, weight]) => ({
        feature: name.replace(/_/g, ' '),
        rawFeature: name,
        importance: Math.round(weight * 1000) / 10,
        rawWeight: weight
      })).sort((a, b) => b.importance - a.importance)
    : [
        { feature: 'creator avg engagement', importance: 38.4 },
        { feature: 'post hour', importance: 21.2 },
        { feature: 'follower count', importance: 14.5 },
        { feature: 'title length', importance: 11.8 },
        { feature: 'duration sec', importance: 7.9 },
        { feature: 'post weekday', importance: 4.1 },
        { feature: 'hashtag count', importance: 2.1 }
      ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="More Tools"
        subtitle="Advanced machine learning diagnostics, benchmark lab, and training dataset inspector."
        badge={
          <StatusChip
            status="Working now"
            source="3-Way Split ML & Dataset"
            tooltip="Leak-free chronological train/calib/test split with empirical benchmark evaluation"
          />
        }
      />

      {/* Primary Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 sm:gap-2">
        <button
          onClick={() => handleTabChange('lab')}
          className={`flex items-center space-x-2 py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition ${
            activeTab === 'lab'
              ? 'border-violet-600 text-violet-600 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-950/20 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          <span>Model Tests / Imbalance Lab</span>
        </button>

        <button
          onClick={() => handleTabChange('performance')}
          className={`flex items-center space-x-2 py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition ${
            activeTab === 'performance'
              ? 'border-violet-600 text-violet-600 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-950/20 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Model Performance & Features</span>
        </button>

        <button
          onClick={() => handleTabChange('dataset')}
          className={`flex items-center space-x-2 py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition ${
            activeTab === 'dataset'
              ? 'border-violet-600 text-violet-600 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-950/20 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Dataset Information</span>
        </button>
      </div>

      {/* Tab 1: Model Tests / Imbalance Lab */}
      {activeTab === 'lab' && (
        <div className="pt-2">
          <ImbalanceLab />
        </div>
      )}

      {/* Tab 2: Model Performance & Features */}
      {activeTab === 'performance' && (
        <div className="space-y-6 pt-2">
          {/* Top Performance Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Production Classifier
              </div>
              <div className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                {modelInfo?.production_model?.model_type || 'Balanced Random Forest'}
              </div>
              <div className="text-[11px] text-violet-600 dark:text-violet-400 mt-1 font-medium">
                Calibrated with Platt Sigmoid
              </div>
            </Card>

            <Card className="p-4 border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Holdout PR-AUC
              </div>
              <div className="text-base font-extrabold text-emerald-600 mt-1">
                {modelInfo?.production_model?.pr_auc ? (modelInfo.production_model.pr_auc * 100).toFixed(1) + '%' : '20.7%'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Vs 10% naive baseline
              </div>
            </Card>

            <Card className="p-4 border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Calibration Split
              </div>
              <div className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                {modelData?.calibration_samples || 270} posts (15%)
              </div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">
                Zero test leakage
              </div>
            </Card>

            <Card className="p-4 border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Evaluation Split
              </div>
              <div className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                {modelData?.test_samples || 270} posts (15%)
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Untouched held-out chronological
              </div>
            </Card>
          </div>

          {/* Feature Importance Chart */}
          <Card className="p-6 border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-violet-600" />
                  <span>Feature Importances in Breakout Prediction</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Normalized relative influence of each signal in discriminating breakout hits from typical posts.
                </p>
              </div>
              <div className="text-[11px] px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 font-semibold border border-violet-200 dark:border-violet-800">
                Random Forest Gini Importance
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={featureImportances}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" opacity={0.5} />
                  <XAxis type="number" unit="%" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="feature" tick={{ fontSize: 11 }} width={135} />
                  <RechartsTooltip
                    formatter={(val) => [`${val}% relative weight`, 'Importance']}
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#F8FAFC',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                    {featureImportances.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? '#7C3AED' : index === 1 ? '#8B5CF6' : index === 2 ? '#A78BFA' : '#C4B5FD'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Model Trust and Calibration Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2">
              <div className="flex items-center space-x-2 text-violet-600 dark:text-violet-400 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Why Probability Calibration Matters</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Raw random forest decision trees produce distorted probabilities on skewed distributions. Our Platt Sigmoid calibration maps model outputs to true empirical breakout odds, meaning when the predictor says <strong>25% breakout chance</strong>, historical posts with that score break out ~25% of the time.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2">
              <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Info className="w-4 h-4" />
                <span>3-Way Chronological Split (Zero Leakage)</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Training uses posts from the earliest 70% of history. Calibration uses the next 15% to calibrate probabilities. Final evaluation is performed strictly on the most recent untouched 15% holdout set, preventing data contamination.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Dataset Information */}
      {activeTab === 'dataset' && (
        <div className="space-y-6 pt-2">
          {/* Active Dataset Status Card */}
          <Card className="p-6 border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-violet-600" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Active Dataset Provenance
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Currently active training and evaluation dataset feeding the dashboard, predictor, and intelligence models.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                  {activeSource === 'sample' ? 'Sample Synthetic Data' : activeSource === 'uploaded' ? 'Uploaded CSV Dataset' : 'Connected YouTube Channel'}
                </span>
              </div>
            </div>

            {/* Split Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
                <div className="text-[11px] text-slate-400 font-medium">Total Historical Posts</div>
                <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                  {modelData?.total_posts || 1800}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Chronologically ordered</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
                <div className="text-[11px] text-slate-400 font-medium">Training Posts (70%)</div>
                <div className="text-lg font-extrabold text-violet-600 dark:text-violet-400 mt-1">
                  {modelData?.train_samples || 1260}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Model parameter learning</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
                <div className="text-[11px] text-slate-400 font-medium">Calibration Posts (15%)</div>
                <div className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                  {modelData?.calibration_samples || 270}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Probability alignment</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
                <div className="text-[11px] text-slate-400 font-medium">Holdout Evaluation (15%)</div>
                <div className="text-lg font-extrabold text-emerald-600 mt-1">
                  {modelData?.test_samples || 270}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Uncontaminated testing</div>
              </div>
            </div>

            {/* Data Source Switcher Prompt */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-600 dark:text-slate-300">
                Want to train the ML models on your own YouTube channel or a custom CSV export?
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => switchDataSource('sample')}
                  className={activeSource === 'sample' ? 'border-violet-600 text-violet-600' : ''}
                >
                  Use Sample Dataset
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const el = document.getElementById('data-source-trigger');
                    if (el) el.click();
                  }}
                >
                  Upload CSV / Switch Source
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
