import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import EditorPage from './pages/EditorPage';
import HistoryPage from './pages/HistoryPage';
import Navbar from './components/Navbar';
import './styles/global.css';

// ProtectedRoute: redirects unauthenticated users to /login
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;
  return user ? children : <Navigate to="/login" replace />;
};

// BUG FIX: Router must wrap Navbar — original had Router inside AppRoutes which is fine,
// but Navbar (which uses useNavigate, useLocation) MUST be inside BrowserRouter.
// Now Navbar is inside the Router as part of AppRoutes, not outside it.
function AppRoutes() {
  const { user } = useAuth();
  return (
    <Router>
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/" element={
          <ProtectedRoute><EditorPage /></ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute><HistoryPage /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;