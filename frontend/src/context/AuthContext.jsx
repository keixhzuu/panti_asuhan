import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('donasi_token');
    if (!token) {
      setLoading(false);
      return;
    }

    api.get('/auth/me')
      .then((response) => setUser(response.data.data))
      .catch(() => {
        localStorage.removeItem('donasi_token');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (payload) => {
    const response = await api.post('/auth/login', payload);
    const { token, user: nextUser } = response.data.data;
    localStorage.setItem('donasi_token', token);
    setUser(nextUser);
    return nextUser;
  };

  const register = async (payload) => {
    const response = await api.post('/auth/register', payload);
    const { token, user: nextUser } = response.data.data;
    localStorage.setItem('donasi_token', token);
    setUser(nextUser);
    return nextUser;
  };

  const logout = () => {
    localStorage.removeItem('donasi_token');
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
