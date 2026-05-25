import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, API_URL } from '../App';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const wasInactive = new URLSearchParams(location.search).get('inactivity') === 'true';
  const isRegistered = new URLSearchParams(location.search).get('registered') === 'true';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return setError('Please fill in all fields');
    }
    
    setError('');
    setLoading(true);
    
    try {
      const { data } = await axios.post(`${API_URL}/auth/login`, { email, password });
      login(data);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container d-flex align-items-center justify-content-center py-5">
      <div className="auth-page-content d-flex align-items-center justify-content-center">
        <div className="w-100" style={{ maxWidth: '440px' }}>
        
        {/* Visual Brand Float */}
        <div className="text-center mb-4 float-animation">
          <div className="d-inline-flex align-items-center justify-content-center bg-primary-subtle text-gradient-rainbow rounded-circle p-3 mb-2 fs-2 shadow-lg">
            <i className="bi bi-lightning-charge-fill"></i>
          </div>
          <h2 className="brand-font mt-2 fs-1 text-white">Welcome Back</h2>
          <p className="text-secondary">Keep the momentum. Sign in to your habits.</p>
        </div>

        {/* Login Card */}
        <div className="card glass-card p-4 p-md-5">
          {isRegistered && (
            <div 
              className="d-flex align-items-center gap-2.5 py-3 px-3.5 mb-4 rounded-3 border small" 
              style={{ 
                background: 'rgba(16, 185, 129, 0.15)', 
                borderColor: 'rgba(16, 185, 129, 0.35)', 
                color: '#a7f3d0' 
              }}
              role="alert"
            >
              <i className="bi bi-patch-check-fill text-success fs-5"></i>
              <div className="fw-medium">Account created successfully! Please sign in.</div>
            </div>
          )}

          {wasInactive && (
            <div 
              className="d-flex align-items-center gap-2.5 py-3 px-3.5 mb-4 rounded-3 border small" 
              style={{ 
                background: 'rgba(245, 158, 11, 0.15)', 
                borderColor: 'rgba(245, 158, 11, 0.35)', 
                color: '#fde047' 
              }}
              role="alert"
            >
              <i className="bi bi-clock-history text-warning fs-5"></i>
              <div className="fw-medium">Session expired due to inactivity. Please sign in again.</div>
            </div>
          )}

          {error && (
            <div 
              className="d-flex align-items-center gap-2.5 py-3 px-3.5 mb-4 rounded-3 border small" 
              style={{ 
                background: 'rgba(239, 68, 68, 0.15)', 
                borderColor: 'rgba(239, 68, 68, 0.35)', 
                color: '#fca5a5' 
              }}
              role="alert"
            >
              <i className="bi bi-exclamation-triangle-fill text-danger fs-5"></i>
              <div className="fw-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="mb-4">
              <label className="form-label text-secondary small fw-medium mb-2">EMAIL ADDRESS</label>
              <div className="input-group">
                <span className="input-group-text bg-transparent border-end-0 text-secondary glass-input px-3">
                  <i className="bi bi-envelope"></i>
                </span>
                <input
                  type="email"
                  className="form-control glass-input border-start-0 ps-0"
                  placeholder="alex@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="mb-4">
              <div className="d-flex justify-content-between mb-2">
                <label className="form-label text-secondary small fw-medium mb-0">PASSWORD</label>
              </div>
              <div className="input-group">
                <span className="input-group-text bg-transparent border-end-0 text-secondary glass-input px-3">
                  <i className="bi bi-lock"></i>
                </span>
                <input
                  type="password"
                  className="form-control glass-input border-start-0 ps-0"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary w-100 py-2.5 rounded-3 fw-semibold mt-2 d-flex align-items-center justify-content-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <i className="bi bi-arrow-right-short fs-5"></i>
                </>
              )}
            </button>
          </form>

          {/* Registration Link */}
          <div className="text-center mt-4">
            <span className="text-secondary small">Don't have an account? </span>
            <Link to="/register" className="text-gradient-purple fw-semibold small text-decoration-none hover-underline">
              Create an account
            </Link>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
}
