import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef(null);

  // Custom Logout Confirmation states
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutConfirmed, setLogoutConfirmed] = useState(false);

  // Theme state: defaults to saved choice or system default ('dark')
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  // Trigger HTML theme switches
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Click/touch outside to auto-hide mobile navbar
  useEffect(() => {
    const handleClickOutside = (e) => {
      const collapseEl = document.getElementById('navbarNav');
      if (collapseEl && collapseEl.classList.contains('show')) {
        const toggler = document.querySelector('.navbar-toggler');
        if (toggler && !toggler.contains(e.target)) {
          // Close if click is outside the nav or if it's on a nav-link or logout button
          if (navRef.current && !navRef.current.contains(e.target)) {
            toggler.click();
          } else if (e.target.closest('.nav-link') || e.target.closest('.btn-outline-danger')) {
            toggler.click();
          }
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleConfirmLogout = () => {
    setLogoutConfirmed(true);
    setTimeout(() => {
      logout();
      setShowLogoutModal(false);
      setLogoutConfirmed(false);
      navigate('/login');
    }, 1500);
  };

  if (!user) return null;

  return (
    <nav ref={navRef} className="navbar navbar-expand-lg navbar-dark navbar-glass sticky-top py-3">
      <div className="container">
        {/* Brand Logo */}
        <Link className="navbar-brand d-flex align-items-center gap-2 text-gradient-rainbow brand-font fs-3" to="/">
          <i className="bi bi-lightning-charge-fill"></i>
          <span>SmartHabit</span>
        </Link>

        {/* Collapsible toggle */}
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navbar Links */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-1 mt-2 mt-lg-0">
            <li className="nav-item">
              <Link
                className={`nav-link px-3 rounded-pill transition-all ${
                  location.pathname === '/' ? 'active bg-dark-subtle text-white' : 'text-secondary'
                }`}
                to="/"
              >
                <i className="bi bi-grid-fill me-2"></i>Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link px-3 rounded-pill transition-all ${
                  location.pathname === '/explore' ? 'active bg-dark-subtle text-white' : 'text-secondary'
                }`}
                to="/explore"
              >
                <i className="bi bi-compass-fill me-2"></i>Explore
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link px-3 rounded-pill transition-all ${
                  location.pathname === '/progress' ? 'active bg-dark-subtle text-white' : 'text-secondary'
                }`}
                to="/progress"
              >
                <i className="bi bi-bar-chart-line-fill me-2"></i>Progress
              </Link>
            </li>
          </ul>

          {/* Minimalist User HUD - Theme Switcher & Logout */}
          <div className="d-flex align-items-center gap-2 mt-3 mt-lg-0">
            {/* Theme Toggle Button */}
            <button
              className="btn btn-outline-secondary d-flex align-items-center justify-content-center rounded-circle border-0"
              style={{ width: '40px', height: '40px', padding: 0 }}
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? (
                <i className="bi bi-sun-fill text-warning fs-5"></i>
              ) : (
                <i className="bi bi-moon-stars-fill text-primary fs-5"></i>
              )}
            </button>

            {/* Logout Button */}
            <button
              className="btn btn-outline-danger d-flex align-items-center justify-content-center rounded-circle border-0"
              style={{ width: '40px', height: '40px', padding: 0 }}
              onClick={() => setShowLogoutModal(true)}
              title="Logout"
            >
              <i className="bi bi-box-arrow-right fs-5"></i>
            </button>
          </div>
        </div>
      </div>

      {/* CUSTOM DYNAMIC LOGOUT CONFIRMATION MODAL OVERLAY */}
      {showLogoutModal && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center z-3" 
          style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }}
        >
          <div 
            className="card p-4 text-center shadow-lg border-0 float-animation"
            style={{ 
              maxWidth: '380px', 
              borderRadius: '20px',
              background: logoutConfirmed ? 'rgba(239, 68, 68, 0.95)' : 'rgba(245, 158, 11, 0.95)',
              color: logoutConfirmed ? '#ffffff' : '#0f172a',
              transition: 'all 0.3s ease',
              boxShadow: logoutConfirmed ? '0 10px 40px rgba(239, 68, 68, 0.4)' : '0 10px 40px rgba(245, 158, 11, 0.3)',
              border: logoutConfirmed ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(15, 23, 42, 0.1)'
            }}
          >
            {!logoutConfirmed ? (
              <>
                <div className="fs-1 mb-3"><i className="bi bi-exclamation-triangle-fill"></i></div>
                <h4 className="fw-bold mb-2">Are you sure want to exit?</h4>
                <p className="mb-4 small opacity-75">Your daily habits are waiting for consistency. Don't break your streak!</p>
                <div className="d-flex justify-content-center gap-3">
                  <button 
                    className="btn btn-dark px-4 py-2 rounded-pill fw-semibold border-0 text-white" 
                    onClick={() => setShowLogoutModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn px-4 py-2 rounded-pill fw-semibold text-white" 
                    style={{ background: '#0f172a' }}
                    onClick={handleConfirmLogout}
                  >
                    Yes, Exit
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="fs-1 mb-3"><i className="bi bi-check-circle-fill"></i></div>
                <h4 className="fw-bold mb-2">Logged out successfully!</h4>
                <p className="mb-0 small opacity-75">Redirecting you back to SmartHabit login...</p>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
