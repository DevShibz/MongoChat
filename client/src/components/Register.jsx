import { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

export default function Register({ onRegisterSuccess, switchToLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { username, email, password, confirmPassword } = formData;

    if (!username.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      setSuccessMsg('Account created successfully!');

      // Save token and user info
      localStorage.setItem('chatapp_token', data.token);
      localStorage.setItem('chatapp_user', JSON.stringify(data.user));

      setTimeout(() => {
        onRegisterSuccess(data);
      }, 700);
    } catch (err) {
      setError(err.message || 'Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && (
        <div className="alert-box alert-error">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="alert-box alert-success">
          <CheckCircle size={18} style={{ flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="form-group">
        <label className="form-label" htmlFor="reg-username">
          Username
        </label>
        <div className="input-wrapper">
          <div className="input-icon">
            <User size={18} />
          </div>
          <input
            id="reg-username"
            name="username"
            type="text"
            className="form-input"
            placeholder="Choose a username"
            autoComplete="username"
            value={formData.username}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="reg-email">
          Email Address
        </label>
        <div className="input-wrapper">
          <div className="input-icon">
            <Mail size={18} />
          </div>
          <input
            id="reg-email"
            name="email"
            type="email"
            className="form-input"
            placeholder="you@example.com"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="reg-password">
          Password
        </label>
        <div className="input-wrapper">
          <div className="input-icon">
            <Lock size={18} />
          </div>
          <input
            id="reg-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            className="form-input has-toggle"
            placeholder="At least 6 characters"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
            required
          />
          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="reg-confirmPassword">
          Confirm Password
        </label>
        <div className="input-wrapper">
          <div className="input-icon">
            <Lock size={18} />
          </div>
          <input
            id="reg-confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            className="form-input has-toggle"
            placeholder="Re-enter your password"
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={loading}
            required
          />
          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? (
          <>
            <span className="spinner"></span>
            <span>Creating account...</span>
          </>
        ) : (
          <>
            <UserPlus size={18} />
            <span>Create Account</span>
          </>
        )}
      </button>

      <div className="auth-footer">
        Already have an account?
        <button
          type="button"
          className="link-btn"
          onClick={switchToLogin}
        >
          Sign In
        </button>
      </div>
    </form>
  );
}
