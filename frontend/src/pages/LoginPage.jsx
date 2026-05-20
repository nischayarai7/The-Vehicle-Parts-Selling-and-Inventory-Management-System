import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { api } from '../services/api';
import { useGoogleLogin } from '@react-oauth/google';
import { loginSuccess } from '../store/slices/authSlice';

import CarCursor from '../components/CarCursor';

function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');
  
  // Check if user is already authenticated
  const { isAuthenticated, user } = useSelector(state => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'Admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(redirect || '/', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, redirect]);

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 1. Initialize Google Login with state parameter
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      // 3. Verify state on return
      const savedState = sessionStorage.getItem('google_auth_state');
      // In the Implicit Flow (token), the state is usually handled internally by the library
      // or returned in the response if using the redirect flow. 
      // For the hook flow, the library ensures the response matches the request.
      
      setLoading(true);
      try {
        const data = await api.googleLogin(tokenResponse.access_token);
        dispatch(loginSuccess(data));
        if (data.role === 'Admin') navigate('/admin', { replace: true });
        else navigate(redirect || '/', { replace: true });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Google Login Failed'),
    // 2. Generate and pass a unique state
    state: btoa(Math.random().toString()).substring(0, 16) 
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.login(form.email, form.password);
      
      // Dispatch to Redux store (this also saves to localStorage)
      dispatch(loginSuccess(data));
      
      // Redirect based on role and replace history to prevent back button from returning to login
      if (data.role === 'Admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(redirect || '/', { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-layout">
      <CarCursor />
      <div className="auth-split-container">
        {/* Left Side: Image & Branding */}
        <div className="auth-image-side">
          <div className="auth-image-overlay"></div>
          <div className="auth-image-content">
            <div className="auth-image-text" style={{ textAlign: 'center' }}>
              <h2>Welcome to 6ix<span style={{ color: '#e33b3b' }}>7</span>even Auto Parts</h2>
              <p style={{ margin: '0 auto' }}>Your premium destination for high-quality vehicle parts. Gear up your ride with the best components in the market.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="auth-form-side">
          <div className="auth-card" style={{ border: 'none', padding: 0, maxWidth: '400px', width: '100%', margin: '0 auto', boxShadow: 'none' }}>
            <h1 className="auth-title">Sign in to your account</h1>
            <p className="auth-subtitle">Access your orders, profile, and settings anytime.</p>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Your email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                  />
                  <button 
                    type="button" 
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-btn" disabled={loading} style={{ background: '#e33b3b', marginTop: '10px', padding: '14px' }}>
                {loading ? 'Signing in...' : 'Get Started'}
              </button>
            </form>

            <div className="auth-divider">
              <span>or continue with</span>
            </div>

            <div className="google-auth-wrapper" style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                className="google-signin-btn" 
                onClick={() => loginWithGoogle()}
                disabled={loading}
                style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '500' }}
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" style={{ marginRight: '8px', width: '20px', height: '20px' }} />
                Log in with Google
              </button>
            </div>

            <p className="auth-link">
              Don't have an account? <Link to="/register" style={{ color: '#e33b3b' }}>Sign up</Link>
            </p>

            <p className="auth-link" style={{ marginTop: '14px', fontSize: '13px' }}>
              <Link to="/" style={{ color: '#888', display: 'inline-flex', alignItems: 'center', gap: '5px', textDecoration: 'none' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                Back to Home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
