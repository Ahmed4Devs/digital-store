import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check current session on initial render
  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      try {
        const res = await api.get('/auth/me');
        if (isMounted && res.user) {
          setUser(res.user);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.user) {
      setUser(res.user);
    }
    return res;
  };

  const register = async (username, email, password, preferred_lang = 'ar') => {
    const res = await api.post('/auth/register', { username, email, password, preferred_lang });
    if (res.user) {
      setUser(res.user);
    }
    return res;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout', {});
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
