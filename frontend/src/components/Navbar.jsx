import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

// Navbar — shown on all protected pages
// Displays: logo, nav links, username, logout button
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
        <span className="brand-icon">⚡</span>
        <span className="brand-name">SmartCloud Compiler</span>
      </div>

      <div className="navbar-links">
        {/* active class highlights the current page link */}
        <Link
          to="/"
          className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          Editor
        </Link>
        <Link
          to="/history"
          className={`nav-link ${location.pathname === '/history' ? 'active' : ''}`}
        >
          History
        </Link>
      </div>

      <div className="navbar-user">
        <span className="username">👤 {user?.username}</span>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
