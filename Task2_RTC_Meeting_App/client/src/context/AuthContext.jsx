import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    return token && username ? { token, username } : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUserToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        await axios.get('http://localhost:5000/api/auth/verify', {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Token validation failed:', err.response?.data || err.message);
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    verifyUserToken();
  }, []);

  const login = async (username, password) => {
    const res = await axios.post('http://localhost:5000/api/auth/login', { username, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('username', res.data.username);
    setUser({ token: res.data.token, username: res.data.username });
  };

  const register = async (username, password) => {
    await axios.post('http://localhost:5000/api/auth/register', { username, password });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
