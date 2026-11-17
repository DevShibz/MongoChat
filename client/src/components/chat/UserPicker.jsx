import { useEffect, useState } from 'react';
import { X, Check } from 'lucide-react';
import { chatApi } from '../../lib/api';
import { Avatar } from './ChatParts';

/**
 * Searchable user list.
 *   single: onPick(userId)
 *   multi:  onDone([userIds]) with a confirm button labelled `doneLabel`
 * excludeIds hides users (e.g. existing group members).
 */
export default function UserPicker({ token, multi = false, excludeIds = [], doneLabel = 'Done', onPick, onDone, onClose }) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      chatApi
        .searchUsers(token, search)
        .then((d) => setUsers(d.users))
        .catch((err) => setError(err.message));
    }, 250);
    return () => clearTimeout(t);
  }, [token, search]);

  const visible = users.filter((u) => !excludeIds.includes(u._id));

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const confirm = async () => {
    setBusy(true);
    setError('');
    try {
      await onDone(selected);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="conversation">
      <div className="conversation-header">
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        <input
          className="form-input composer-input"
          placeholder="Search users"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>
      {error && <p className="list-note error">{error}</p>}
      <ul className="chat-list picker-list">
        {visible.map((u) => {
          const isSel = selected.includes(u._id);
          return (
            <li key={u._id}>
              <button
                type="button"
                className={`chat-row ${isSel ? 'selected' : ''}`}
                onClick={() => (multi ? toggle(u._id) : onPick(u._id))}
              >
                <Avatar name={u.username} online={u.isOnline} />
                <div className="chat-row-body">
                  <span className="chat-name">{u.username}</span>
                  <div className="chat-preview">{u.about}</div>
                </div>
                {multi && <span className={`check-box ${isSel ? 'on' : ''}`}>{isSel && <Check size={14} />}</span>}
              </button>
            </li>
          );
        })}
        {!visible.length && !error && <p className="list-note">No users found.</p>}
      </ul>
      {multi && (
        <div className="picker-footer">
          <button type="button" className="submit-btn" disabled={!selected.length || busy} onClick={confirm}>
            {busy ? 'Saving…' : `${doneLabel}${selected.length ? ` (${selected.length})` : ''}`}
          </button>
        </div>
      )}
    </div>
  );
}
