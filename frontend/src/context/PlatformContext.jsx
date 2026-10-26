import React, { createContext, useContext, useState, useEffect } from 'react';

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

  const refreshData = () => {
    setLastRefreshed(new Date().toLocaleTimeString());
  };

  return (
    <PlatformContext.Provider
      value={{
        selectedPlatform,
        setSelectedPlatform,
        platforms: PLATFORMS,
        lastRefreshed,
        refreshData,
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
