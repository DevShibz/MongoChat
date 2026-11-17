import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { chatApi } from '../../lib/api';
import { EVENTS } from '../../lib/socketEvents';
import { idOf, formatTime } from '../../lib/format';
import { useSocket, useSocketEvent } from '../../context/SocketContext';
import { StatusTicks, Avatar } from './ChatParts';
import { useTypingSender } from '../../hooks/useTyping';

/**
 * Message thread used by both 1:1 chats and groups.
 *
 * props:
 *   conversationId, meId, token
 *   participantCount  – for read receipts (read = everyone else has read it)
 *   title, subtitle, avatar (node), onTitleClick?
 *   senderName?(userId) – shown above others' bubbles (groups)
 *   typingUserIds – who is typing right now (shown in the footer above the input)
 *   typingName?   – name to show for 1:1 chats (groups use senderName)
 *   onBack
 */
export default function ConversationView({
  conversationId,
  meId,
  token,
  participantCount = 2,
  title,
  subtitle,
  subtitleHighlight = false,
  avatar,
  onTitleClick,
  senderName,
  typingUserIds = [],
  typingName,
  onBack,
}) {
  const { socket } = useSocket();
  const [msgs, setMsgs] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const listRef = useRef(null);
  const typing = useTypingSender(conversationId);

  const scrollToBottom = () =>
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    });

  const markRead = useCallback(() => {
    socket?.emit(EVENTS.MESSAGE_READ, { conversationId });
  }, [socket, conversationId]);

  useEffect(() => {
    let cancelled = false;
    chatApi
      .getMessages(token, conversationId)
      .then((data) => {
        if (cancelled) return;
        setMsgs(data.messages);
        setHasMore(data.hasMore);
        scrollToBottom();
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [token, conversationId]);

  useEffect(() => {
    markRead();
  }, [markRead]);

  const loadOlder = async () => {
    if (!msgs.length) return;
    const el = listRef.current;
    const prevHeight = el?.scrollHeight ?? 0;
    try {
      const data = await chatApi.getMessages(token, conversationId, { before: msgs[0].createdAt });
      setMsgs((prev) => [...data.messages, ...prev]);
      setHasMore(data.hasMore);
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - prevHeight;
      });
    } catch (err) {
      setError(err.message);
    }
  };

  useSocketEvent(
    EVENTS.MESSAGE_NEW,
    useCallback(
      ({ message }) => {
        if (idOf(message.conversationId) !== conversationId) return;
        setMsgs((prev) => (prev.some((m) => m._id === message._id) ? prev : [...prev, message]));
        if (idOf(message.sender) !== meId && message.messageType !== 'system') markRead();
        scrollToBottom();
      },
      [conversationId, meId, markRead]
    )
  );

  // Someone read the thread: add them to readBy on my messages; 'read' once all others have.
  useSocketEvent(
    EVENTS.MESSAGES_READ,
    useCallback(
      ({ conversationId: cid, readerId }) => {
        if (cid !== conversationId || readerId === meId) return;
        setMsgs((prev) =>
          prev.map((m) => {
            if (idOf(m.sender) !== meId || m.messageType === 'system') return m;
            const readBy = (m.readBy || []).map(idOf);
            if (!readBy.includes(readerId)) readBy.push(readerId);
            return { ...m, readBy, status: readBy.length >= participantCount - 1 ? 'read' : m.status };
          })
        );
      },
      [conversationId, meId, participantCount]
    )
  );

  const handleChange = (e) => {
    let value = e.target.value;
    // Limit to 500 words
    const wordCount = value.trim().split(/\s+/).length;
    if (wordCount > 500) {
      const words = value.trim().split(/\s+/).slice(0, 500);
      value = words.join(' ');
    }
    setText(value);
    typing.onInput(value);
  };

  const handleKeyDown = (e) => {
    // Enter without Shift sends message, Shift+Enter adds newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  // "alex is typing" / "alex and sarah are typing" / "alex, sarah and 2 others are typing"
  const nameFor = (id) => (senderName ? senderName(id) : typingName) || 'Someone';
  const typingNames = typingUserIds.map(nameFor);
  let typingLabel = '';
  if (typingNames.length === 1) typingLabel = `${typingNames[0]} is typing`;
  else if (typingNames.length === 2) typingLabel = `${typingNames[0]} and ${typingNames[1]} are typing`;
  else if (typingNames.length > 2) {
    const rest = typingNames.length - 2;
    typingLabel = `${typingNames[0]}, ${typingNames[1]} and ${rest} other${rest > 1 ? 's' : ''} are typing`;
  }

  const handleSend = (e) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || !socket) return;
    const tempId = `temp-${Date.now()}`;
    setMsgs((prev) => [
      ...prev,
      {
        _id: tempId,
        conversationId,
        sender: meId,
        content,
        messageType: 'text',
        status: 'pending',
        readBy: [],
        createdAt: new Date().toISOString(),
      },
    ]);
    setText('');
    typing.stop();
    scrollToBottom();

    socket.timeout(10000).emit(EVENTS.MESSAGE_SEND, { conversationId, content }, (err, res) => {
      setMsgs((prev) => {
        if (err || !res?.ok) return prev.map((m) => (m._id === tempId ? { ...m, status: 'failed' } : m));
        const withoutTemp = prev.filter((m) => m._id !== tempId);
        return withoutTemp.some((m) => m._id === res.message._id) ? withoutTemp : [...withoutTemp, res.message];
      });
    });
  };

  return (
    <div className="conversation">
      <div className="conversation-header">
        <button type="button" className="icon-btn" onClick={onBack} aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <button
          type="button"
          className={`conversation-title ${onTitleClick ? 'clickable' : ''}`}
          onClick={onTitleClick}
          disabled={!onTitleClick}
        >
          {avatar}
          <div className="conversation-title-text">
            <div className="chat-name">{title}</div>
            <div className={`chat-sub ${subtitleHighlight ? 'typing' : ''}`}>{subtitle}</div>
          </div>
        </button>
      </div>

      <div className="message-list" ref={listRef}>
        {hasMore && (
          <button type="button" className="load-older" onClick={loadOlder}>
            Load older messages
          </button>
        )}
        {loading && <p className="list-note">Loading…</p>}
        {error && <p className="list-note error">{error}</p>}
        {msgs.map((m, i) => {
          if (m.messageType === 'system') {
            return (
              <div key={m._id} className="system-note">
                {m.content}
              </div>
            );
          }
          const mine = idOf(m.sender) === meId;
          const prev = msgs[i - 1];
          const showName =
            senderName && !mine && (!prev || idOf(prev.sender) !== idOf(m.sender) || prev.messageType === 'system');
          return (
            <div key={m._id} className={`bubble ${mine ? 'mine' : 'theirs'} ${m.status === 'failed' ? 'failed' : ''}`}>
              {showName && <span className="bubble-sender">{senderName(idOf(m.sender))}</span>}
              <p>{m.content}</p>
              <span className="bubble-meta">
                {m.status === 'failed' ? 'not sent' : formatTime(m.createdAt)}
                {mine && m.status !== 'failed' && <StatusTicks status={m.status} />}
              </span>
            </div>
          );
        })}
      </div>

      {/* Who is typing — fixed-height footer strip so the messages don't jump */}
      <div className={`typing-footer ${typingLabel ? 'on' : ''}`} aria-live="polite">
        {typingLabel && (
          <>
            <span className="typing-avatars">
              {typingNames.slice(0, 3).map((n, i) => (
                <Avatar key={typingUserIds[i]} name={n} size={20} />
              ))}
            </span>
            <span className="typing-label">{typingLabel}</span>
            <span className="typing-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </>
        )}
      </div>

      <form className="composer" onSubmit={handleSend}>
        <textarea className="form-input composer-input" placeholder="Type a message" value={text} onChange={handleChange} onKeyDown={handleKeyDown} />
        <button type="submit" className="send-btn" aria-label="Send" disabled={!text.trim() || !socket}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
