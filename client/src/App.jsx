import { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';

export default function App() {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Initialize theme from localStorage or system preference
    const storedTheme = localStorage.getItem('chatapp_theme');
    const theme = storedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  useEffect(() => {
    // Restore the saved session, but only if the server still accepts it
    // (the user may have been deleted or the token may have expired).
    const restore = async () => {
      try {
        const storedToken = localStorage.getItem('chatapp_token');
        const storedUser = localStorage.getItem('chatapp_user');
        if (!storedToken || !storedUser) return;

        const res = await fetch('https://mongochat.fly.dev/api/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        if (res.status === 401) {
          localStorage.removeItem('chatapp_token');
          localStorage.removeItem('chatapp_user');
          return;
        }
        // Server down or other error: keep the session and let the app retry.
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error loading stored session:', e);
      } finally {
        setInitializing(false);
      }
    };
    restore();
  }, []);

  const handleAuthSuccess = (data) => {
    setToken(data.token);
    setUser(data.user);
  };

  const handleLogout = () => {
    localStorage.removeItem('chatapp_token');
    localStorage.removeItem('chatapp_user');
    setToken(null);
    setUser(null);
    setActiveTab('login');
  };

  if (initializing) {
    return (
      <div className="app-container">
        <span className="spinner" style={{ width: 32, height: 32 }}></span>
      </div>
    );
  }

  const loggedIn = Boolean(user && token);

  return (
    <div className={loggedIn ? 'app-container app-full' : 'app-container'}>
      {/* Decorative ambient background glows */}
      {!loggedIn && <div className="ambient-glow glow-top" />}
      {!loggedIn && <div className="ambient-glow glow-bottom" />}

      <main className={loggedIn ? 'home-card' : 'auth-card'}>
        {loggedIn ? (
          <Home user={user} token={token} onLogout={handleLogout} />
        ) : (
          <>
            <div className="brand-header">
              <div className="brand-icon-wrapper">
                <MessageSquare size={28} />
              </div>
              <h1 className="brand-title">ChatApp</h1>
              <p className="brand-subtitle">
                {activeTab === 'login'
                  ? 'Sign in to access your conversations'
                  : 'Create an account to start chatting'}
              </p>
            </div>

            {/* Toggle Tabs */}
            <div className="auth-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'login'}
                className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => setActiveTab('login')}
              >
                Sign In
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'register'}
                className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => setActiveTab('register')}
              >
                Sign Up
              </button>
            </div>

            {activeTab === 'login' ? (
              <Login
                onLoginSuccess={handleAuthSuccess}
                switchToRegister={() => setActiveTab('register')}
              />
            ) : (
              <Register
                onRegisterSuccess={handleAuthSuccess}
                switchToLogin={() => setActiveTab('login')}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
