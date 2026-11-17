import { useState } from 'react';
import { ArrowLeft, Pencil, UserPlus, LogOut, ShieldCheck, ShieldOff, UserMinus } from 'lucide-react';
import { groupApi } from '../../lib/api';
import { idOf } from '../../lib/format';
import { Avatar } from '../chat/ChatParts';
import UserPicker from '../chat/UserPicker';

export default function GroupInfo({ group, meId, token, onChanged, onLeft, onBack }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || '');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const adminIds = (group.admins || []).map(idOf);
  const iAmAdmin = adminIds.includes(meId);
  const members = [...group.participants].sort((a, b) => {
    if (a._id === meId) return -1;
    if (b._id === meId) return 1;
    return adminIds.includes(b._id) - adminIds.includes(a._id) || a.username.localeCompare(b.username);
  });

  const run = async (fn) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = (e) => {
    e.preventDefault();
    run(async () => {
      const { group: g } = await groupApi.update(token, group._id, { name, description });
      onChanged(g);
      setEditing(false);
    });
  };

  const leave = () => {
    if (!window.confirm(`Leave "${group.name}"?`)) return;
    run(async () => {
      await groupApi.removeMember(token, group._id, meId);
      onLeft(group._id);
    });
  };

  if (adding) {
    return (
      <UserPicker
        token={token}
        multi
        doneLabel="Add"
        excludeIds={group.participants.map(idOf)}
        onClose={() => setAdding(false)}
        onDone={async (ids) => {
          const { group: g } = await groupApi.addMembers(token, group._id, ids);
          onChanged(g);
          setAdding(false);
        }}
      />
    );
  }

  return (
    <div className="conversation">
      <div className="conversation-header">
        <button type="button" className="icon-btn" onClick={onBack} aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <div className="chat-name">Group info</div>
      </div>

      <div className="group-info">
        <div className="group-hero">
          <Avatar name={group.name} group size={72} />
          {editing ? (
            <form className="panel-form" onSubmit={saveEdit}>
              <input className="form-input plain" value={name} maxLength={50} onChange={(e) => setName(e.target.value)} />
              <textarea
                className="form-input plain"
                rows={2}
                maxLength={200}
                value={description}
                placeholder="Description"
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="row-actions">
                <button type="button" className="ghost-btn" onClick={() => setEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className="ghost-btn primary" disabled={!name.trim() || busy}>
                  Save
                </button>
              </div>
            </form>
          ) : (
            <>
              <h2 className="group-name">
                {group.name}
                {iAmAdmin && (
                  <button type="button" className="icon-btn small" onClick={() => setEditing(true)} aria-label="Edit group">
                    <Pencil size={14} />
                  </button>
                )}
              </h2>
              {group.description && <p className="group-desc">{group.description}</p>}
              <p className="chat-sub">Group · {group.participants.length} members</p>
            </>
          )}
        </div>

        {error && <div className="alert-box alert-error">{error}</div>}

        <div className="section-title">{group.participants.length} members</div>
        <ul className="chat-list">
          {iAmAdmin && (
            <li>
              <button type="button" className="chat-row" onClick={() => setAdding(true)}>
                <div className="chat-avatar action">
                  <UserPlus size={20} />
                </div>
                <div className="chat-row-body">
                  <span className="chat-name">Add members</span>
                </div>
              </button>
            </li>
          )}
          {members.map((m) => {
            const isMe = m._id === meId;
            const isAdmin = adminIds.includes(m._id);
            return (
              <li key={m._id} className="member-row">
                <Avatar name={m.username} online={m.isOnline} />
                <div className="chat-row-body">
                  <div className="chat-row-top">
                    <span className="chat-name">{isMe ? 'You' : m.username}</span>
                    {isAdmin && <span className="admin-badge">Admin</span>}
                  </div>
                  <div className="chat-preview">{m.about}</div>
                </div>
                {iAmAdmin && !isMe && (
                  <div className="member-actions">
                    <button
                      type="button"
                      className="icon-btn small"
                      disabled={busy}
                      title={isAdmin ? 'Dismiss as admin' : 'Make admin'}
                      onClick={() =>
                        run(async () => {
                          const fn = isAdmin ? groupApi.removeAdmin : groupApi.makeAdmin;
                          onChanged((await fn(token, group._id, m._id)).group);
                        })
                      }
                    >
                      {isAdmin ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
                    </button>
                    <button
                      type="button"
                      className="icon-btn small danger"
                      disabled={busy}
                      title="Remove from group"
                      onClick={() =>
                        window.confirm(`Remove ${m.username}?`) &&
                        run(async () => onChanged((await groupApi.removeMember(token, group._id, m._id)).group))
                      }
                    >
                      <UserMinus size={15} />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <button type="button" className="logout-btn leave-btn" onClick={leave} disabled={busy}>
          <LogOut size={16} /> Leave group
        </button>
      </div>
    </div>
  );
}
