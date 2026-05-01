import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import EditorPage from './pages/EditorPage';
import HistoryPage from './pages/HistoryPage';
import Navbar from './components/Navbar';
import './styles/global.css';

// ProtectedRoute: if user is not logged in, redirect to /login
// Wraps any page that requires authentication
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Router>
      {user && <Navbar />}
      <Routes>
        {/* Public route — accessible without login */}
        <Route path="/login" element={<AuthPage />} />

        {/* Protected routes — require login */}
        <Route path="/" element={
          <ProtectedRoute><EditorPage /></ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute><HistoryPage /></ProtectedRoute>
        } />

        {/* Catch-all — redirect unknown URLs to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

// App wraps everything in AuthProvider so all child components can access auth
function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
