import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Light is the DEFAULT theme. Wrap in try/catch for safety.
  const [themePreference, setThemePreference] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem('creatorpulse_theme') || 'light';
      }
    } catch (e) {
      console.warn('localStorage read error, falling back to light theme:', e);
    }
    return 'light';
  });

  const [activeTheme, setActiveTheme] = useState('light');

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('creatorpulse_theme', themePreference);
      }
    } catch (e) {
      console.warn('localStorage write error:', e);
    }

    const updateTheme = () => {
      let isDark;
      try {
        if (themePreference === 'system' && typeof window !== 'undefined' && window.matchMedia) {
          isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        } else {
          isDark = themePreference === 'dark';
        }
      } catch (e) {
        console.warn('Theme matchMedia error:', e);
        isDark = false;
      }

      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        if (isDark) {
          root.classList.add('dark');
          setActiveTheme('dark');
        } else {
          root.classList.remove('dark');
          setActiveTheme('light');
        }
      }
    };

    updateTheme();

    if (themePreference === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      try {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const listener = () => updateTheme();
        mediaQuery.addEventListener('change', listener);
        return () => mediaQuery.removeEventListener('change', listener);
      } catch (e) {
        console.warn('Media query listener error:', e);
      }
    }
  }, [themePreference]);

  const toggleTheme = () => {
    setThemePreference((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider
      value={{
        themePreference,
        setThemePreference,
        activeTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
