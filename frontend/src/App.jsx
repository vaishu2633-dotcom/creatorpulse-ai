import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { PlatformProvider } from './context/PlatformContext';
import Layout from './components/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import TrendExplorer from './pages/TrendExplorer';
import ViralPredictor from './pages/ViralPredictor';
import ContentStudio from './pages/ContentStudio';
import PredictionHistory from './pages/PredictionHistory';
import ImbalanceLab from './pages/ImbalanceLab';
import CalendarDrafts from './pages/CalendarDrafts';
import CommentInsights from './pages/CommentInsights';
import Settings from './pages/Settings';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <PlatformProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="trends" element={<TrendExplorer />} />
                <Route path="predictor" element={<ViralPredictor />} />
                <Route path="studio" element={<ContentStudio />} />
                <Route path="history" element={<PredictionHistory />} />
                <Route path="ml-lab" element={<ImbalanceLab />} />
                <Route path="drafts" element={<CalendarDrafts />} />
                <Route path="comments" element={<CommentInsights />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </PlatformProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
