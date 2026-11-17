import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { chatApi } from '../../lib/api';
import { EVENTS } from '../../lib/socketEvents';
import { idOf, formatTime } from '../../lib/format';
import { useSocketEvent } from '../../context/SocketContext';
import { Avatar, StatusTicks } from '../chat/ChatParts';
import ConversationView from '../chat/ConversationView';
import UserPicker from '../chat/UserPicker';
import { useTypingIndicators } from '../../hooks/useTyping';

export default function ChatsTab({ user, token, onViewChange }) {
  const meId = idOf(user?.id ?? user?._id);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);
  const [picking, setPicking] = useState(false);
  const typersIn = useTypingIndicators(meId);
  const openIdRef = useRef(null);
  useEffect(() => {
    openIdRef.current = openId;
  }, [openId]);

  useEffect(() => {
    onViewChange?.(Boolean(openId || picking));
  }, [openId, picking, onViewChange]);

  const load = useCallback(
    () =>
      chatApi
        .listConversations(token)
        .then((d) => {
          setConversations(d.conversations);
          setError('');
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false)),
    [token]
  );

  useEffect(() => {
    load();
  }, [load]);

  useSocketEvent(
    EVENTS.MESSAGE_NEW,
    useCallback(
      ({ message, isGroup }) => {
        if (isGroup) return; // handled by the Groups tab
        const convId = idOf(message.conversationId);
        setConversations((prev) => {
          const conv = prev.find((c) => c._id === convId);
          if (!conv) {
            load(); // someone started a new chat with us
            return prev;
          }
          const fromOther = idOf(message.sender) !== meId;
          const updated = {
            ...conv,
            lastMessage: message,
            updatedAt: message.createdAt,
            unread: fromOther && openIdRef.current !== convId ? conv.unread + 1 : conv.unread,
          };
          return [updated, ...prev.filter((c) => c._id !== convId)];
        });
      },
      [meId, load]
    )
  );

  useSocketEvent(
    EVENTS.MESSAGES_READ,
    useCallback(
      ({ conversationId, readerId }) => {
        setConversations((prev) =>
          prev.map((c) => {
            if (c._id !== conversationId) return c;
            if (readerId === meId) return { ...c, unread: 0 };
            if (c.lastMessage && idOf(c.lastMessage.sender) === meId) {
              return { ...c, lastMessage: { ...c.lastMessage, status: 'read' } };
            }
            return c;
          })
        );
      },
      [meId]
    )
  );

  useSocketEvent(
    EVENTS.PRESENCE_UPDATE,
    useCallback(({ userId, isOnline, lastSeen }) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.otherUser?._id === userId
            ? { ...c, otherUser: { ...c.otherUser, isOnline, lastSeen: lastSeen || c.otherUser.lastSeen } }
            : c
        )
      );
    }, [])
  );

  const openChat = (id) => {
    setConversations((prev) => prev.map((c) => (c._id === id ? { ...c, unread: 0 } : c)));
    setOpenId(id);
  };

  const startChat = async (userId) => {
    try {
      const { conversation } = await chatApi.startConversation(token, userId);
      setConversations((prev) => [conversation, ...prev.filter((c) => c._id !== conversation._id)]);
      setPicking(false);
      setOpenId(conversation._id);
    } catch (err) {
      setError(err.message);
    }
  };

  const open = conversations.find((c) => c._id === openId);
  if (open) {
    const other = open.otherUser;
    const typingIds = typersIn(open._id);
    const isTyping = typingIds.length > 0;
    return (
      <ConversationView
        key={open._id}
        conversationId={open._id}
        meId={meId}
        token={token}
        participantCount={2}
        title={other?.username}
        subtitle={isTyping ? 'typing…' : other?.isOnline ? 'online' : `last seen ${formatTime(other?.lastSeen)}`}
        subtitleHighlight={isTyping}
        typingUserIds={typingIds}
        typingName={other?.username}
        avatar={<Avatar name={other?.username} online={other?.isOnline} />}
        onBack={() => setOpenId(null)}
      />
    );
  }
  if (picking) return <UserPicker token={token} onPick={startChat} onClose={() => setPicking(false)} />;

  return (
    <div className="chats-tab">
      {loading && <p className="list-note">Loading chats…</p>}
      {error && <p className="list-note error">{error}</p>}
      {!loading && !error && !conversations.length && <p className="list-note">No chats yet. Start one below.</p>}

      <ul className="chat-list">
        {conversations.map((c) => {
          const last = c.lastMessage;
          const lastIsMine = last && idOf(last.sender) === meId;
          const isTyping = typersIn(c._id).length > 0;
          return (
            <li key={c._id}>
              <button type="button" className="chat-row" onClick={() => openChat(c._id)}>
                <Avatar name={c.otherUser?.username} online={c.otherUser?.isOnline} />
                <div className="chat-row-body">
                  <div className="chat-row-top">
                    <span className="chat-name">{c.otherUser?.username}</span>
                    <span className={`chat-time ${c.unread ? 'has-unread' : ''}`}>
                      {formatTime(last?.createdAt || c.updatedAt)}
                    </span>
                  </div>
                  <div className="chat-row-bottom">
                    <span className={`chat-preview ${isTyping ? 'typing' : ''}`}>
                      {isTyping ? (
                        'typing…'
                      ) : (
                        <>
                          {lastIsMine && <StatusTicks status={last.status} />}
                          {last?.content}
                        </>
                      )}
                    </span>
                    {c.unread > 0 && <span className="unread-badge">{c.unread}</span>}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <button type="button" className="fab" onClick={() => setPicking(true)} aria-label="New chat" title="New chat">
        <MessageSquarePlus size={22} />
      </button>
    </div>
  );
}
