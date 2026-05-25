import React, { createContext, useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Create Auth Context
export const AuthContext = createContext(null);

// Configure axios base URL dynamically for easy deployment
export const API_URL = import.meta.env.VITE_API_URL || 'https://smart-habit-app.onrender.com/api';
axios.defaults.baseURL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') 
  : 'https://smart-habit-app.onrender.com';

// Custom Route Guard for Protected Pages
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Custom Route Guard for Guest Pages (prevent logged-in users from seeing login/register)
const GuestRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return null;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Explore from './pages/Explore';
import ProgressPage from './pages/ProgressPage';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Set up interceptor to automatically attach authorization header
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
    };
  }, [token]);

  // Load user profile on startup if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser({ ...data, token });
      } catch (err) {
        console.error('Failed to load user session', err.response?.data?.message || err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [token]);

  const login = (userData) => {
    localStorage.setItem('token', userData.token);
    setToken(userData.token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updatePoints = (newPoints) => {
    if (user) {
      setUser((prev) => ({ ...prev, points: newPoints }));
    }
  };

  // Complete zoom prevention (mobile pinch/double-tap, iOS gestures, desktop trackpad pinch, keyboard shortcuts)
  useEffect(() => {
    const handleTouchStart = (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const handleGesture = (e) => {
      e.preventDefault();
    };

    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e) => {
      if (
        e.ctrlKey &&
        (e.key === '=' ||
          e.key === '-' ||
          e.key === '0' ||
          e.keyCode === 187 ||
          e.keyCode === 189 ||
          e.keyCode === 48)
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('gesturestart', handleGesture, { passive: false });
    document.addEventListener('gesturechange', handleGesture, { passive: false });
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('gesturestart', handleGesture);
      document.removeEventListener('gesturechange', handleGesture);
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Auto logout user after 10 minutes of complete inactivity
  useEffect(() => {
    if (!user) return;

    let idleTimer;
    const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes session duration

    const performLogout = () => {
      logout();
      window.location.href = '/login?inactivity=true';
    };

    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(performLogout, INACTIVITY_TIMEOUT);
    };

    // Activity triggers that reset the idle session timer
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    // Start countdown
    resetIdleTimer();

    // Register active user listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetIdleTimer);
    });

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetIdleTimer);
      });
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updatePoints }}>
      <Router>
        <div className="d-flex flex-column min-vh-100">
          {user && <Navbar />}
          <main className="flex-grow-1">
            <Routes>
              {/* Authenticated Routes */}
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/explore" 
                element={
                  <ProtectedRoute>
                    <Explore />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/progress" 
                element={
                  <ProtectedRoute>
                    <ProgressPage />
                  </ProtectedRoute>
                } 
              />

              {/* Guest Routes */}
              <Route 
                path="/login" 
                element={
                  <GuestRoute>
                    <Login />
                  </GuestRoute>
                } 
              />
              <Route 
                path="/register" 
                element={
                  <GuestRoute>
                    <Register />
                  </GuestRoute>
                } 
              />

              {/* Catch-all Redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}
