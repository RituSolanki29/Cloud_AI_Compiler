import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="brand-mark">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2L17 6V14L10 18L3 14V6L10 2Z" stroke="var(--accent)" strokeWidth="1.5" fill="none"/>
            <path d="M10 6L14 8.5V13.5L10 16L6 13.5V8.5L10 6Z" fill="var(--accent)" opacity="0.3"/>
            <circle cx="10" cy="10" r="2" fill="var(--accent)"/>
          </svg>
        </div>
        <span className="brand-name">SmartCloud</span>
        <span className="brand-tag">AI Compiler</span>
      </div>

      <div className="navbar-center">
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
            <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
            <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
            <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
          Editor
        </Link>
        <Link to="/history" className={`nav-link ${location.pathname === '/history' ? 'active' : ''}`}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M7 4V7L9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          History
        </Link>
      </div>

      <div className="navbar-user">
        <div className="user-chip">
          <div className="user-avatar">{user?.username?.[0]?.toUpperCase()}</div>
          <span className="username">{user?.username}</span>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M9 10l3-3-3-3M12 7H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Sign out
        </button>
      </div>
    </nav>
  );
};

export default Navbar;