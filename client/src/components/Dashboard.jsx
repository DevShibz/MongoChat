import { useState, useEffect } from 'react';
import { LogOut, ShieldCheck, User, Mail, KeyRound, CheckCircle2, RefreshCw } from 'lucide-react';

export default function Dashboard({ user, token, onLogout }) {
  const [verifiedUser, setVerifiedUser] = useState(user);
  const [testingToken, setTestingToken] = useState(false);
  const [tokenStatus, setTokenStatus] = useState(null);

  useEffect(() => {
    // Validate token with backend /api/auth/me on mount
    validateCurrentToken();
  }, []);

  const validateCurrentToken = async () => {
    setTestingToken(true);
    setTokenStatus(null);
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVerifiedUser(data.user);
        setTokenStatus({ valid: true, message: 'JWT Token verified successfully by middleware!' });
      } else {
        setTokenStatus({ valid: false, message: data.message || 'Token verification failed.' });
      }
    } catch (err) {
      setTokenStatus({ valid: false, message: 'Server communication error.' });
    } finally {
      setTestingToken(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="profile-card">
      <div className="avatar-badge">
        {getInitials(verifiedUser?.username || user?.username)}
      </div>

      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
        Welcome, {verifiedUser?.username || user?.username}!
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        You are authenticated with JWT
      </p>

      {tokenStatus && (
        <div
          className={`alert-box ${tokenStatus.valid ? 'alert-success' : 'alert-error'}`}
          style={{ marginTop: '1rem', marginBottom: '0.5rem', textAlign: 'left' }}
        >
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{tokenStatus.message}</span>
        </div>
      )}

      <div className="profile-info">
        <div className="info-row">
          <span className="info-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={15} /> Username
          </span>
          <span className="info-value">{verifiedUser?.username || user?.username}</span>
        </div>
        <div className="info-row">
          <span className="info-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Mail size={15} /> Email
          </span>
          <span className="info-value">{verifiedUser?.email || user?.email}</span>
        </div>
        <div className="info-row">
          <span className="info-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <KeyRound size={15} /> User ID
          </span>
          <span className="info-value">{verifiedUser?._id || verifiedUser?.id || user?.id}</span>
        </div>
        <div className="info-row">
          <span className="info-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={15} /> Auth Method
          </span>
          <span className="info-value" style={{ color: '#4ade80' }}>Bearer JWT</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          type="button"
          className="submit-btn"
          style={{ margin: 0, minHeight: '44px', background: 'rgba(99, 102, 241, 0.2)', border: '1px solid var(--primary)' }}
          onClick={validateCurrentToken}
          disabled={testingToken}
        >
          <RefreshCw size={16} className={testingToken ? 'spinner' : ''} />
          <span>{testingToken ? 'Validating Token...' : 'Re-verify Token via Middleware'}</span>
        </button>

        <button type="button" className="logout-btn" onClick={onLogout}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
