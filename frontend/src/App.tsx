import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Provider } from 'react-redux';
import { store } from './store/store';
import LandingPage from './Components/LandingPage';
import Auth from './pages/Auth';
import HomePage from './pages/HomePage';
import DocumentChat from './pages/DocumentChat';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
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
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/home"
              element={
                <PrivateRoute>
                  <HomePage />
                </PrivateRoute>
              }
            />
            <Route path="/document-chat/:s3Key" element={<DocumentChat />} />
          </Routes>
        </Router>
      </AuthProvider>
    </Provider>
  );
}

export default App;
