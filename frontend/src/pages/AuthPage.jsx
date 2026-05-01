import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login({ username: formData.username, password: formData.password });
      } else {
        if (!formData.email) { setError('Email is required'); setLoading(false); return; }
        // BUG FIX: register() now handles token storage directly — no second login call
        await register(formData);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background grid */}
      <div className="auth-bg">
        <div className="bg-grid" />
        <div className="bg-glow" />
      </div>

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo-wrap">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path d="M18 4L30 11V25L18 32L6 25V11L18 4Z" stroke="var(--accent)" strokeWidth="1.5" fill="none"/>
            <path d="M18 11L25 15V23L18 27L11 23V15L18 11Z" fill="var(--accent)" opacity="0.2"/>
            <circle cx="18" cy="18" r="4" fill="var(--accent)"/>
          </svg>
        </div>

        <div className="auth-header">
          <h1 className="auth-title">SmartCloud Compiler</h1>
          <p className="auth-subtitle">Cloud-native AI code execution platform</p>
        </div>

        {/* Tab toggle */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            Create Account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="your_username"
              autoComplete="username"
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              required
            />
          </div>

          {error && (
            <div className="auth-error">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="var(--red)" strokeWidth="1.2"/>
                <path d="M7 4.5V7.5M7 9.5V10" stroke="var(--red)" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? (
              <span className="btn-loading">
                <span className="btn-spinner" />
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="auth-features">
          <span>🐍 Python</span>
          <span>☕ Java</span>
          <span>⚙️ C++</span>
          <span>🤖 AI Analysis</span>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;