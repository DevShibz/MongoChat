import { useCallback, useEffect, useRef, useState } from 'react';
import { UsersRound } from 'lucide-react';
import { groupApi } from '../../lib/api';
import { EVENTS } from '../../lib/socketEvents';
import { idOf, formatTime } from '../../lib/format';
import { useSocketEvent } from '../../context/SocketContext';
import { Avatar, StatusTicks } from '../chat/ChatParts';
import ConversationView from '../chat/ConversationView';
import CreateGroup from '../groups/CreateGroup';
import GroupInfo from '../groups/GroupInfo';
import { useTypingIndicators } from '../../hooks/useTyping';

export default function GroupsTab({ user, token, onViewChange }) {
  const meId = idOf(user?.id ?? user?._id);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);
  const [view, setView] = useState('list'); // list | create | chat | info
  const typersIn = useTypingIndicators(meId);
  const openIdRef = useRef(null);
  useEffect(() => {
    openIdRef.current = view === 'chat' ? openId : null;
  }, [openId, view]);

  useEffect(() => {
    onViewChange?.(view === 'chat' || view === 'create' || view === 'info');
  }, [view, onViewChange]);

  const load = useCallback(
    () =>
      groupApi
        .list(token)
        .then((d) => {
          setGroups(d.groups);
          setError('');
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false)),
    [token]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Merge a server copy of a group, keeping our own unread count.
  const upsert = useCallback((g, { toTop = false } = {}) => {
    setGroups((prev) => {
      const old = prev.find((x) => x._id === g._id);
      const merged = { ...old, ...g, unread: old?.unread ?? g.unread ?? 0 };
      const rest = prev.filter((x) => x._id !== g._id);
      if (toTop || !old) return [merged, ...rest];
      return prev.map((x) => (x._id === g._id ? merged : x));
    });
  }, []);

  /* ---------------- realtime ---------------- */
  useSocketEvent(
    EVENTS.MESSAGE_NEW,
    useCallback(
      ({ message, isGroup }) => {
        if (!isGroup) return;
        const gid = idOf(message.conversationId);
        setGroups((prev) => {
          const g = prev.find((x) => x._id === gid);
          if (!g) {
            load();
            return prev;
          }
          const counts =
            idOf(message.sender) !== meId && message.messageType !== 'system' && openIdRef.current !== gid;
          const updated = {
            ...g,
            lastMessage: message,
            updatedAt: message.createdAt,
            unread: counts ? g.unread + 1 : g.unread,
          };
          return [updated, ...prev.filter((x) => x._id !== gid)];
        });
      },
      [meId, load]
    )
  );

  useSocketEvent(EVENTS.GROUP_UPSERT, useCallback(({ group }) => upsert(group), [upsert]));

  useSocketEvent(
    EVENTS.GROUP_REMOVED,
    useCallback(({ groupId }) => {
      setGroups((prev) => prev.filter((g) => g._id !== groupId));
      if (openIdRef.current === groupId || openId === groupId) {
        setOpenId(null);
        setView('list');
      }
    }, [openId])
  );

  useSocketEvent(
    EVENTS.MESSAGES_READ,
    useCallback(
      ({ conversationId, readerId }) => {
        if (readerId !== meId) return;
        setGroups((prev) => prev.map((g) => (g._id === conversationId ? { ...g, unread: 0 } : g)));
      },
      [meId]
    )
  );

  useSocketEvent(
    EVENTS.PRESENCE_UPDATE,
    useCallback(({ userId, isOnline, lastSeen }) => {
      setGroups((prev) =>
        prev.map((g) =>
          g.participants.some((p) => p._id === userId)
            ? {
                ...g,
                participants: g.participants.map((p) =>
                  p._id === userId ? { ...p, isOnline, lastSeen: lastSeen || p.lastSeen } : p
                ),
              }
            : g
        )
      );
    }, [])
  );

  /* ---------------- helpers ---------------- */
  const nameOf = (group, userId) =>
    userId === meId ? 'You' : group.participants.find((p) => p._id === userId)?.username || 'Former member';

  const typingText = (group) => {
    const ids = typersIn(group._id);
    if (!ids.length) return '';
    const names = ids.map((id) => nameOf(group, id));
    return `${names.slice(0, 2).join(', ')}${names.length > 2 ? ` +${names.length - 2}` : ''} typing…`;
  };

  const memberLine = (group) => {
    const names = group.participants.map((p) => (p._id === meId ? 'You' : p.username));
    return names.join(', ');
  };

  const preview = (group) => {
    const last = group.lastMessage;
    if (!last) return group.description || 'No messages yet';
    if (last.messageType === 'system') return last.content;
    const sender = idOf(last.sender);
    return (
      <>
        {sender === meId && <StatusTicks status={last.status} />}
        <span className="preview-sender">{nameOf(group, sender)}:</span> {last.content}
      </>
    );
  };

  const openGroup = (id) => {
    setGroups((prev) => prev.map((g) => (g._id === id ? { ...g, unread: 0 } : g)));
    setOpenId(id);
    setView('chat');
  };

  const closeToList = () => {
    setOpenId(null);
    setView('list');
  };

  /* ---------------- views ---------------- */
  const open = groups.find((g) => g._id === openId);

  if (view === 'create') {
    return (
      <CreateGroup
        token={token}
        onClose={() => setView('list')}
        onCreated={(g) => {
          upsert(g, { toTop: true });
          setOpenId(g._id);
          setView('chat');
        }}
      />
    );
  }

  if (open && view === 'info') {
    return (
      <GroupInfo
        key={`${open._id}-${open.updatedAt}`}
        group={open}
        meId={meId}
        token={token}
        onChanged={(g) => upsert(g)}
        onLeft={(gid) => {
          setGroups((prev) => prev.filter((g) => g._id !== gid));
          closeToList();
        }}
        onBack={() => setView('chat')}
      />
    );
  }

  if (open && view === 'chat') {
    const tt = typingText(open);
    return (
      <ConversationView
        key={open._id}
        conversationId={open._id}
        meId={meId}
        token={token}
        participantCount={open.participants.length}
        title={open.name}
        subtitle={tt || memberLine(open)}
        subtitleHighlight={!!tt}
        avatar={<Avatar name={open.name} group />}
        onTitleClick={() => setView('info')}
        senderName={(id) => nameOf(open, id)}
        typingUserIds={typersIn(open._id)}
        onBack={closeToList}
      />
    );
  }

  return (
    <div className="chats-tab">
      {loading && <p className="list-note">Loading groups…</p>}
      {error && <p className="list-note error">{error}</p>}
      {!loading && !error && !groups.length && <p className="list-note">No groups yet. Create one below.</p>}

      <ul className="chat-list">
        {groups.map((g) => {
          const tt = typingText(g);
          return (
            <li key={g._id}>
              <button type="button" className="chat-row" onClick={() => openGroup(g._id)}>
                <Avatar name={g.name} group />
                <div className="chat-row-body">
                  <div className="chat-row-top">
                    <span className="chat-name">{g.name}</span>
                    <span className={`chat-time ${g.unread ? 'has-unread' : ''}`}>
                      {formatTime(g.lastMessage?.createdAt || g.updatedAt)}
                    </span>
                  </div>
                  <div className="chat-row-bottom">
                    <span className={`chat-preview ${tt ? 'typing' : ''}`}>{tt || preview(g)}</span>
                    {g.unread > 0 && <span className="unread-badge">{g.unread}</span>}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <button type="button" className="fab" onClick={() => setView('create')} aria-label="New group" title="New group">
        <UsersRound size={22} />
      </button>
    </div>
  );
}
