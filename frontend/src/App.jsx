import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { PlatformProvider } from './context/PlatformContext';
import { UserProvider } from './context/UserContext';
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
import VibeCheck from './pages/VibeCheck';
import CompetitorAnalysis from './pages/CompetitorAnalysis';
import Reports from './pages/Reports';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <PlatformProvider>
          <UserProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="results" element={<PredictionHistory />} />
                  <Route path="vibecheck" element={<VibeCheck />} />
                  <Route path="trends" element={<TrendExplorer />} />
                  <Route path="predictor" element={<ViralPredictor />} />
                  <Route path="studio" element={<ContentStudio />} />
                  <Route path="content-studio" element={<Navigate to="/studio" replace />} />
                  <Route path="history" element={<Navigate to="/results" replace />} />
                  <Route path="ml-lab" element={<ImbalanceLab />} />
                  <Route path="model-tests" element={<Navigate to="/ml-lab" replace />} />
                  <Route path="competitors" element={<CompetitorAnalysis />} />
                  <Route path="drafts" element={<CalendarDrafts />} />
                  <Route path="calendar" element={<Navigate to="/drafts" replace />} />
                  <Route path="comments" element={<CommentInsights />} />
                  <Route path="audience" element={<Navigate to="/comments" replace />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </UserProvider>
        </PlatformProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
