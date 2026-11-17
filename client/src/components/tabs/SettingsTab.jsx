import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { Avatar } from '../chat/ChatParts';
import { idOf } from '../../lib/format';

export default function SettingsTab({ user, onLogout }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem('chatapp_theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const userId = idOf(user?.id ?? user?._id);
  const username = user?.username || 'User';
  const email = user?.email || '';
  const about = user?.about || "Hey there! I am using ChatApp.";

  useEffect(() => {
    const theme = isDarkMode ? 'dark' : 'light';
    localStorage.setItem('chatapp_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [isDarkMode]);

  const handleThemeToggle = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <div className="settings-panel">
      <div className="settings-section profile-section">
        <div className="settings-title">Profile</div>
        <Avatar name={username} size={80} />
        <div className="profile-info-block">
          <div className="profile-name">{username}</div>
          <div className="profile-email">{email}</div>
          <div className="profile-about">{about}</div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-title">Appearance</div>
        <div className="settings-row">
          <span className="settings-label">Dark Mode</span>
          <button
            type="button"
            className={`toggle-switch ${isDarkMode ? 'on' : ''}`}
            onClick={handleThemeToggle}
            aria-label={`Toggle ${isDarkMode ? 'light' : 'dark'} mode`}
          />
        </div>
      </div>

      <div className="settings-footer">
        <button type="button" className="logout-btn" onClick={onLogout}>
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
