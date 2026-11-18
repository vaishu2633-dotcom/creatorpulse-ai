import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { PlatformProvider } from './context/PlatformContext';
import Layout from './components/Layout';
import VibeCheck from './pages/VibeCheck';

export default function App() {
  const [navTab, setNavTab] = useState('analyze');

  return (
    <ThemeProvider>
      <ToastProvider>
        <PlatformProvider>
          <BrowserRouter>
            <Layout activeTab={navTab} onTabChange={setNavTab}>
              <Routes>
                <Route path="/" element={<VibeCheck initialTab={navTab} onTabChange={setNavTab} />} />
                <Route path="/vibecheck" element={<VibeCheck initialTab={navTab} onTabChange={setNavTab} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </PlatformProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
