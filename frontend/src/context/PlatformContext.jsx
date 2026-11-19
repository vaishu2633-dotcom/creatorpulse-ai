import React, { createContext, useContext, useState } from 'react';

const PlatformContext = createContext();

export const PLATFORMS = [
  { id: 'youtube', label: 'YouTube', icon: 'Youtube', color: '#EF4444' },
];

export function PlatformProvider({ children }) {
  const [selectedPlatform, setSelectedPlatform] = useState('youtube');

  return (
    <PlatformContext.Provider
      value={{
        selectedPlatform,
        setSelectedPlatform,
        platforms: PLATFORMS,
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
