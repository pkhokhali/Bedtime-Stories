import { useState, useCallback, useEffect } from 'react';
import { DEFAULT_API_BASE_URL, setStoredAdminSecret, getStoredAdminSecret } from '../utils/api';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check initial token
  useEffect(() => {
    const token = getStoredAdminSecret();
    if (token) {
      // We could ideally verify the token with the backend here, but for now we'll just trust it
      // and let API calls fail with 401 if it's invalid.
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${DEFAULT_API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error('Invalid email or password');
      }

      const data = await res.json();
      if (data.token) {
        setStoredAdminSecret(data.token);
        setIsAuthenticated(true);
      } else {
        throw new Error('No token received from server');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setStoredAdminSecret('');
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, login, logout, loading, error };
};
