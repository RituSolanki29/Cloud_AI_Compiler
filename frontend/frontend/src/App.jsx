import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';

import AuthPage from './pages/AuthPage';
import EditorPage from './pages/EditorPage';
import HistoryPage from './pages/HistoryPage';

import Navbar from './components/Navbar';

import './styles/global.css';

// Default starter code
const DEFAULT_CODE = {
  python: `# Write your Python code here
def main():
    print("Hello from SmartCloud!")

main()`,

  java: `// Write your Java code here
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from SmartCloud!");
    }
}`,

  cpp: `// Write your C++ code here
#include <iostream>
using namespace std;

int main() {
    cout << "Hello from SmartCloud!" << endl;
    return 0;
}`,
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

function AppRoutes() {
  const { user, logout } = useAuth();

  // Persistent editor state
  const [editorState, setEditorState] = useState(() => {
    // Restore from localStorage if available
    const saved = localStorage.getItem('editorState');

    return saved
      ? JSON.parse(saved)
      : {
          language: 'python',
          code: DEFAULT_CODE.python,
          stdin: '',
        };
  });

  // Save editor state whenever it changes
  useEffect(() => {
    localStorage.setItem('editorState', JSON.stringify(editorState));
  }, [editorState]);

  // Always clear session on app load
  useEffect(() => {
    logout();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Router>
      {user && <Navbar />}

      <Routes>
        <Route path="/login" element={<AuthPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <EditorPage
                editorState={editorState}
                setEditorState={setEditorState}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
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