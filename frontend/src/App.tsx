import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Provider } from 'react-redux';
import { store } from './store/store';
import LandingPage from './Components/LandingPage';
import Auth from './pages/Auth';
import HomePage from './pages/HomePage';
import DocumentChat from './pages/DocumentChat';
import BrainToks from './pages/BrainToks';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-purple-400 text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Auth />} />

            {/* Protected routes */}
            <Route
              path="/home"
              element={
                <PrivateRoute>
                  <HomePage />
                </PrivateRoute>
              }
            />
            <Route
              path="/document-chat/:s3Key"
              element={
                <PrivateRoute>
                  <DocumentChat />
                </PrivateRoute>
              }
            />
            <Route
              path="/braintoks"
              element={
                <PrivateRoute>
                  <BrainToks />
                </PrivateRoute>
              }
            />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </Provider>
  );
}

export default App;
