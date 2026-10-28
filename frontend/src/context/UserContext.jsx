import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

const DEFAULT_USER = {
  name: 'Alex Rivera',
  channelName: 'DevPulse with Alex',
  handle: '@devpulse_alex',
  workspace: 'Prototype Workspace',
  initials: 'CP',
  avatarUrl: null,
};

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('creatorpulse_user_profile');
      if (saved) {
        return { ...DEFAULT_USER, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load user profile from storage:', e);
    }
    return DEFAULT_USER;
  });

  const updateAvatar = (dataUrl) => {
    setUser((prev) => {
      const updated = { ...prev, avatarUrl: dataUrl };
      try {
        localStorage.setItem('creatorpulse_user_profile', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save avatar to localStorage:', e);
      }
      return updated;
    });
  };

  const removeAvatar = () => {
    setUser((prev) => {
      const updated = { ...prev, avatarUrl: null };
      try {
        localStorage.setItem('creatorpulse_user_profile', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save user profile:', e);
      }
      return updated;
    });
  };

  const updateProfile = (updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem('creatorpulse_user_profile', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save profile updates:', e);
      }
      return updated;
    });
  };

  return (
    <UserContext.Provider value={{ user, updateAvatar, removeAvatar, updateProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    return {
      user: DEFAULT_USER,
      updateAvatar: () => {},
      removeAvatar: () => {},
      updateProfile: () => {},
    };
  }
  return context;
}
