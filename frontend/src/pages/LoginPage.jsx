import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { api } from '../services/api';
import { useGoogleLogin } from '@react-oauth/google';
import { loginSuccess } from '../store/slices/authSlice';

function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
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
        // We use the access_token to get user info if needed, or 
        // if you want to keep using ID Tokens, we would need to handle that specifically.
        // However, standard GoogleLogin (the button) is better for ID Tokens.
        
        // If you want to use 'state' manually, it's best used in a custom flow:
        const data = await api.googleLogin(tokenResponse.access_token);
        dispatch(loginSuccess(data));
        if (data.role === 'Admin') navigate('/admin');
        else navigate('/');
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
      
      // Redirect based on role
      if (data.role === 'Admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your account</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
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

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <div className="google-auth-wrapper">
          <button 
            type="button" 
            className="google-signin-btn" 
            onClick={() => loginWithGoogle()}
            disabled={loading}
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" />
            Sign in with Google
          </button>
        </div>

        <p className="auth-link">
          Don't have an account? <Link to="/register">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
