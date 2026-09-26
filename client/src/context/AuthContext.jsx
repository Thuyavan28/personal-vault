import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_PATHS } from '../utils/apiPath';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('securevault_token'));
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('securevault_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isSessionLocked, setIsSessionLocked] = useState(false);
  const [autoLockMinutes, setAutoLockMinutes] = useState(() => {
    return parseInt(localStorage.getItem('securevault_autolock') || '5', 10);
  });
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Save token/user to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('securevault_token', token);
    } else {
      localStorage.removeItem('securevault_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('securevault_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('securevault_user');
    }
  }, [user]);

  // Refresh user profile and verify token on load
  useEffect(() => {
    if (!token) return;

    fetch(API_PATHS.AUTH.GET_USER_INFO, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Token expired or invalid');
        return res.json();
      })
      .then(data => {
        setUser(prev => ({ ...prev, ...data.user }));
      })
      .catch(() => {
        // Logout if token invalid
        setToken(null);
        setUser(null);
      });
  }, [token]);

  // Auto-lock inactivity listener
  const resetInactivityTimer = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  useEffect(() => {
    if (!token || !user?.hasPin || autoLockMinutes <= 0) return;

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    const handleActivity = () => resetInactivityTimer();

    events.forEach(e => window.addEventListener(e, handleActivity));

    const checkInterval = setInterval(() => {
      const elapsed = Date.now() - lastActivity;
      if (elapsed > autoLockMinutes * 60 * 1000 && !isSessionLocked) {
        setIsSessionLocked(true);
      }
    }, 10000);

    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      clearInterval(checkInterval);
    };
  }, [token, user?.hasPin, autoLockMinutes, lastActivity, isSessionLocked, resetInactivityTimer]);

  const login = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    setIsSessionLocked(false);
    setLastActivity(Date.now());
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsSessionLocked(false);
    localStorage.removeItem('securevault_token');
    localStorage.removeItem('securevault_user');
  };

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const setAutoLockPreference = (minutes) => {
    setAutoLockMinutes(minutes);
    localStorage.setItem('securevault_autolock', String(minutes));
  };

  const unlockSession = () => {
    setIsSessionLocked(false);
    setLastActivity(Date.now());
  };

  const lockSession = () => {
    if (user?.hasPin) {
      setIsSessionLocked(true);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        hasPin: !!user?.hasPin,
        profileCompleted: !!user?.profileCompleted,
        isSessionLocked,
        autoLockMinutes,
        login,
        logout,
        updateUser,
        setAutoLockPreference,
        unlockSession,
        lockSession,
        resetInactivityTimer
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
