import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { groupApi } from '../../lib/api';
import UserPicker from '../chat/UserPicker';

// Two steps: 1) pick members  2) name + description
export default function CreateGroup({ token, onCreated, onClose }) {
  const [memberIds, setMemberIds] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!memberIds) {
    return <UserPicker token={token} multi doneLabel="Next" onDone={setMemberIds} onClose={onClose} />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { group } = await groupApi.create(token, { name, description, memberIds });
      onCreated(group);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="conversation">
      <div className="conversation-header">
        <button type="button" className="icon-btn" onClick={() => setMemberIds(null)} aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <div className="chat-name">New group · {memberIds.length + 1} members</div>
      </div>
      <form className="panel-form" onSubmit={submit}>
        {error && <div className="alert-box alert-error">{error}</div>}
        <div className="form-group">
          <label className="form-label" htmlFor="group-name">
            Group name
          </label>
          <input
            id="group-name"
            className="form-input plain"
            value={name}
            maxLength={50}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Weekend Hangouts"
            autoFocus
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="group-desc">
            Description (optional)
          </label>
          <textarea
            id="group-desc"
            className="form-input plain"
            rows={3}
            maxLength={200}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this group about?"
          />
        </div>
        <button type="submit" className="submit-btn" disabled={!name.trim() || busy}>
          {busy ? 'Creating…' : 'Create group'} <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
}
