import { useEffect, useRef, useState } from 'react';
import { LogOut } from 'lucide-react';
import { Avatar } from './chat/ChatParts';

// Logged-in user's avatar (top right). Click to see who you are and sign out.
export default function UserMenu({ user, connected, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const name = user?.username || 'Me';

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className="user-menu-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={`Signed in as ${name}`}
      >
        <span className="user-menu-name">{name}</span>
        <Avatar name={name} online={connected} size={36} />
      </button>

      {open && (
        <div className="user-menu-panel" role="menu">
          <div className="user-menu-head">
            <Avatar name={name} online={connected} size={48} />
            <div className="user-menu-id">
              <div className="chat-name">{name}</div>
              {user?.email && <div className="chat-sub">{user.email}</div>}
              <div className={`chat-sub ${connected ? 'typing' : ''}`}>{connected ? 'Online' : 'Connecting…'}</div>
            </div>
          </div>
          <button type="button" role="menuitem" className="user-menu-item danger" onClick={onLogout}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
