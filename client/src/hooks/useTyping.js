import { useCallback, useEffect, useRef, useState } from 'react';
import { EVENTS } from '../lib/socketEvents';
import { idOf } from '../lib/format';
import { useSocket, useSocketEvent } from '../context/SocketContext';

// While typing, the sender resends "typing:start" every HEARTBEAT_MS.
// Receivers drop a typer they haven't heard from in EXPIRE_MS,
// so a lost "typing:stop" (crash, network drop) can't stick forever.
export const TYPING_HEARTBEAT_MS = 3000;
export const TYPING_IDLE_MS = 3000; // stop after this long without a keystroke
const EXPIRE_MS = 6000;

/**
 * Receiving side: who is typing where.
 * Returns typersIn(conversationId) -> [userId, ...] (never includes me).
 */
export function useTypingIndicators(meId) {
  const [typing, setTyping] = useState({}); // { [conversationId]: { [userId]: expiresAt } }

  const setTyper = useCallback((conversationId, userId, on) => {
    setTyping((prev) => {
      const cur = { ...(prev[conversationId] || {}) };
      if (on) cur[userId] = Date.now() + EXPIRE_MS;
      else if (cur[userId]) delete cur[userId];
      else return prev;
      return { ...prev, [conversationId]: cur };
    });
  }, []);

  useSocketEvent(
    EVENTS.TYPING,
    useCallback(
      ({ conversationId, userId, isTyping }) => {
        if (userId !== meId) setTyper(conversationId, userId, isTyping);
      },
      [meId, setTyper]
    )
  );

  // Their message arrived -> they're done typing it.
  useSocketEvent(
    EVENTS.MESSAGE_NEW,
    useCallback(
      ({ message }) => setTyper(idOf(message.conversationId), idOf(message.sender), false),
      [setTyper]
    )
  );

  // Expire stale entries.
  useEffect(() => {
    const t = setInterval(() => {
      setTyping((prev) => {
        const now = Date.now();
        let changed = false;
        const next = {};
        for (const [cid, users] of Object.entries(prev)) {
          const live = Object.fromEntries(Object.entries(users).filter(([, exp]) => exp > now));
          if (Object.keys(live).length !== Object.keys(users).length) changed = true;
          if (Object.keys(live).length) next[cid] = live;
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return useCallback((conversationId) => Object.keys(typing[conversationId] || {}), [typing]);
}

/**
 * Sending side: call onInput(text) on every change, stop() after sending.
 * Emits start (with heartbeat) while typing and stop when idle, cleared or unmounted.
 */
export function useTypingSender(conversationId) {
  const { socket } = useSocket();
  const lastSent = useRef(0);
  const idleTimer = useRef(null);
  const socketRef = useRef(socket);
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  const stop = useCallback(() => {
    clearTimeout(idleTimer.current);
    idleTimer.current = null;
    if (lastSent.current) {
      socketRef.current?.emit(EVENTS.TYPING_STOP, { conversationId });
      lastSent.current = 0;
    }
  }, [conversationId]);

  const onInput = useCallback(
    (text) => {
      if (!socketRef.current) return;
      if (!text.trim()) {
        stop();
        return;
      }
      const now = Date.now();
      if (now - lastSent.current > TYPING_HEARTBEAT_MS) {
        socketRef.current.emit(EVENTS.TYPING_START, { conversationId });
        lastSent.current = now;
      }
      clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(stop, TYPING_IDLE_MS);
    },
    [conversationId, stop]
  );

  // Leaving the conversation counts as stopping.
  useEffect(() => stop, [stop]);

  return { onInput, stop };
}
