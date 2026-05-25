import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, API_URL } from '../App';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      return setError('Please fill in all fields');
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters long');
    }

    setError('');
    setLoading(true);

    try {
      await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password
      });
      navigate('/login?registered=true');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Registration failed. Email might already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container d-flex align-items-center justify-content-center py-5">
      <div className="auth-page-content d-flex align-items-center justify-content-center">
        <div className="w-100" style={{ maxWidth: '480px' }}>
        
        {/* Visual Brand Float */}
        <div className="text-center mb-4">
          <h2 className="brand-font fs-1 text-white">Join SmartHabit</h2>
          <p className="text-secondary">Start tracking habits, build streaks, earn rewards.</p>
        </div>

        {/* Register Card */}
        <div className="card glass-card p-4 p-md-5">
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
            {/* Name Field */}
            <div className="mb-3">
              <label className="form-label text-secondary small fw-medium mb-2">FULL NAME</label>
              <div className="input-group">
                <span className="input-group-text bg-transparent border-end-0 text-secondary glass-input px-3">
                  <i className="bi bi-person"></i>
                </span>
                <input
                  type="text"
                  className="form-control glass-input border-start-0 ps-0"
                  placeholder="Alex Coder"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="mb-3">
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
            <div className="mb-3">
              <label className="form-label text-secondary small fw-medium mb-2">PASSWORD</label>
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

            {/* Confirm Password Field */}
            <div className="mb-4">
              <label className="form-label text-secondary small fw-medium mb-2">CONFIRM PASSWORD</label>
              <div className="input-group">
                <span className="input-group-text bg-transparent border-end-0 text-secondary glass-input px-3">
                  <i className="bi bi-lock-fill"></i>
                </span>
                <input
                  type="password"
                  className="form-control glass-input border-start-0 ps-0"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <i className="bi bi-rocket-takeoff-fill"></i>
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center mt-4">
            <span className="text-secondary small">Already have an account? </span>
            <Link to="/login" className="text-gradient-purple fw-semibold small text-decoration-none hover-underline">
              Sign In
            </Link>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
}
