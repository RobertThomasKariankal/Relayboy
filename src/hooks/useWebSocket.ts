import { useState, useEffect, useCallback, useRef } from "react";
import { CryptoSession, isEncryptedMessage, wrapEncrypted } from "@/lib/crypto";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export interface ChatMessage {
  id?: string | number;
  from: string;
  message: string;
  timestamp: string;
  is_seen?: boolean;
  encrypted?: boolean;
}

interface WSMessage {
  type: string;
  id?: string | number;
  username?: string;
  avatar_url?: string;
  users?: ChatUser[];
  from?: string;
  message?: string;
  timestamp?: string;
  error?: string;
  shared_secret?: string;
  with?: string;
  messages?: any[];
  counts?: { [user: string]: number };
  encrypted?: boolean;
}

export interface ChatUser {
  username: string;
  avatar_url?: string;
  is_online?: boolean;
}

export function useWebSocket() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [username, setUsername] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [error, setError] = useState<string>("");
  const [incomingMessage, setIncomingMessage] = useState<ChatMessage | null>(null);
  const [history, setHistory] = useState<{ with: string; messages: ChatMessage[]; shared_secret?: string } | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<{ [user: string]: number }>({});

  const socketRef = useRef<WebSocket | null>(null);
  const sessionsRef = useRef<Map<string, CryptoSession>>(new Map());
  const pendingSessionsRef = useRef<Map<string, Promise<CryptoSession | null>>>(new Map());
  const processedMessageIds = useRef<Set<string | number>>(new Set());
  const usernameRef = useRef<string>("");

  const getOrCreateSession = async (peer: string, sharedSecret?: string) => {
    const peerKey = peer.toLowerCase();

    // 1. Check existing sessions
    if (sessionsRef.current.has(peerKey)) return sessionsRef.current.get(peerKey)!;

    // 2. Check if initialization is already in progress
    if (pendingSessionsRef.current.has(peerKey)) {
      return await pendingSessionsRef.current.get(peerKey)!;
    }

    // If no shared secret is provided, and no session exists or is pending, we can't create one.
    // This might happen when trying to decrypt an incoming message for a peer we haven't exchanged secrets with yet.
    if (!sharedSecret) return null;

    // 3. Start initialization
    console.log(`🔐 Initializing new CryptoSession for ${peerKey}`);
    const initPromise = (async () => {
      try {
        const session = await CryptoSession.create(sharedSecret, usernameRef.current, peerKey);
        sessionsRef.current.set(peerKey, session);
        return session;
      } finally {
        pendingSessionsRef.current.delete(peerKey);
      }
    })();

    pendingSessionsRef.current.set(peerKey, initPromise);
    return await initPromise;
  };

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN || socketRef.current?.readyState === WebSocket.CONNECTING) return;

    const protocol = window.location.hostname === "localhost" ? "ws" : "wss";
    const socket = new WebSocket(`${protocol}://${window.location.host}/ws`);
    socketRef.current = socket;

    setStatus("connecting");
    setError("");

    socket.onopen = () => {
      setStatus("connected");
    };

    socket.onmessage = async (e) => {
      const data: WSMessage = JSON.parse(e.data);

      if (data.type === "error") {
        setError(data.error || "Connection error");
        socket.close();
      }

      if (data.type === "connected" && data.username) {
        setUsername(data.username);
        usernameRef.current = data.username;
        setAvatarUrl(data.avatar_url || "");
        setStatus("connected");
      }

      if (data.type === "users" && data.users) {
        setUsers(data.users);
      }

      if (data.type === "message" && data.from && data.message) {
        // De-duplicate message processing
        if (data.id && processedMessageIds.current.has(data.id)) {
          console.debug(`⏩ Skipping duplicate real-time message ${data.id}`);
          return;
        }
        if (data.id) processedMessageIds.current.add(data.id);

        let displayMessage = data.message;

        if (isEncryptedMessage(data.message)) {
          const session = await getOrCreateSession(data.from);
          if (session) {
            try {
              // Strip prefix "QE1:"
              const payload = data.message.slice(4);
              displayMessage = await session.decrypt(payload);
            } catch (err) {
              console.error("Failed to decrypt incoming message:", err);
              displayMessage = "🔒 [Decryption Failed]";
            }
          } else {
            displayMessage = "🔒 [Encrypted - Open chat to decrypt]";
          }
        }

        setIncomingMessage({
          id: data.id,
          from: data.from,
          message: displayMessage,
          timestamp: new Date(data.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          encrypted: !!data.encrypted || isEncryptedMessage(data.message)
        });
      }

      if (data.type === "unread_counts") {
        setUnreadCounts(data.counts || {});
      }

      if (data.type === "history" && data.with && data.messages) {
        const peerKey = data.with.toLowerCase();
        let processedMessages: ChatMessage[] = data.messages.map(m => {
          if (m.id) processedMessageIds.current.add(m.id);
          return {
            id: m.id,
            from: m.from_user || m.from,
            message: m.message,
            is_seen: !!m.is_seen,
            timestamp: new Date(m.created_at || m.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            encrypted: !!m.encrypted
          };
        });

        if (data.shared_secret && usernameRef.current) {
          console.log(`🔐 Resyncing CryptoSession for ${peerKey} as ${usernameRef.current}`);

          const resyncPromise = (async () => {
            try {
              const session = await CryptoSession.create(data.shared_secret!, usernameRef.current, peerKey);
              const decrypted = await session.decryptHistory(processedMessages);
              sessionsRef.current.set(peerKey, session);
              return { decrypted, session };
            } finally {
              pendingSessionsRef.current.delete(peerKey);
            }
          })();

          pendingSessionsRef.current.set(peerKey, resyncPromise.then(r => r.session));
          const { decrypted } = await resyncPromise;
          processedMessages = decrypted;
        }

        setHistory({
          with: data.with,
          shared_secret: data.shared_secret,
          messages: processedMessages
        });
      }
    };

    socket.onclose = () => {
      setStatus("disconnected");
    };

    socket.onerror = () => {
      setStatus("disconnected");
      setError("WebSocket connection failed");
    };
  }, []); // Break the loop! (Dependencies moved to refs)

  const sendMessage = useCallback(async (to: string, message: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      let finalMessage = message;

      const session = await getOrCreateSession(to);
      if (session) {
        try {
          const encrypted = await session.encrypt(message);
          finalMessage = wrapEncrypted(encrypted);
        } catch (err) {
          console.error("Encryption failed:", err);
          return false;
        }
      }

      socketRef.current.send(JSON.stringify({ type: "message", to, message: finalMessage }));
      return true;
    }
    return false;
  }, []);

  const getHistory = useCallback((to: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "get_history", to }));
    }
  }, []);

  const sendSeen = useCallback((to: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "seen", to }));
    }
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.close();
  }, []);

  useEffect(() => {
    return () => {
      socketRef.current?.close();
    };
  }, []);

  return {
    status,
    username,
    avatarUrl,
    setAvatarUrl,
    users,
    error,
    incomingMessage,
    history,
    unreadCounts,
    setUnreadCounts,
    connect,
    sendMessage,
    getHistory,
    sendSeen,
    disconnect,
  };
}
