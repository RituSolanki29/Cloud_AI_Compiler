import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser } from '../api/services';

// Create a context — this is like a global state store for auth
const AuthContext = createContext(null);

// AuthProvider wraps the entire app so any component can access auth state
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // Current logged-in user object
  const [loading, setLoading] = useState(true); // True while checking localStorage

  // On app load, check if a token already exists in localStorage
  // This keeps the user logged in after page refresh
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // login: calls API, saves token + user to localStorage, updates state
  const login = async (credentials) => {
    const response = await loginUser(credentials);
    const { token, user: userData } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  // register: calls API then auto-logs in
  const register = async (userData) => {
    await registerUser(userData);
    return login({ username: userData.username, password: userData.password });
  };

  // logout: wipes localStorage and resets state
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook — any component can do: const { user, login } = useAuth();
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};