import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PlatformContext = createContext();

export const PLATFORMS = [
  { id: 'all', label: 'All Platforms', icon: 'Layers' },
  { id: 'youtube', label: 'YouTube', icon: 'Youtube', color: '#EF4444' },
  { id: 'instagram', label: 'Instagram', icon: 'Instagram', color: '#EC4899' },
  { id: 'twitter', label: 'X (Twitter)', icon: 'Twitter', color: '#38BDF8' },
  { id: 'linkedin', label: 'LinkedIn', icon: 'Linkedin', color: '#3B82F6' },
];

export function PlatformProvider({ children }) {
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [lastRefreshed, setLastRefreshed] = useState(new Date().toLocaleTimeString());
  const [activeSource, setActiveSource] = useState('sample');
  const [dataSourceMeta, setDataSourceMeta] = useState(null);
  const [sourceLoading, setSourceLoading] = useState(false);

  const fetchDataSourceState = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/data-source');
      if (res.ok) {
        const data = await res.json();
        setActiveSource(data.active_source || 'sample');
        setDataSourceMeta(data.metadata || null);
        if (data.metadata?.last_refreshed) {
          const date = new Date(data.metadata.last_refreshed);
          setLastRefreshed(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      }
    } catch {
      // Keep defaults on connection error
    }
  }, []);

  useEffect(() => {
    fetchDataSourceState();
  }, [fetchDataSourceState]);

  const switchDataSource = async (newSource) => {
    setSourceLoading(true);
    try {
      const res = await fetch('/api/settings/data-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: newSource })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveSource(data.active_source);
        setDataSourceMeta(data.metadata);
        setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch {
      // fallback
    } finally {
      setSourceLoading(false);
    }
  };

  const refreshData = () => {
    setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    fetchDataSourceState();
  };

  return (
    <PlatformContext.Provider
      value={{
        selectedPlatform,
        setSelectedPlatform,
        platforms: PLATFORMS,
        lastRefreshed,
        refreshData,
        activeSource,
        dataSourceMeta,
        sourceLoading,
        switchDataSource,
        fetchDataSourceState
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return context;
}
