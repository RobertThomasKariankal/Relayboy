import { useState, useEffect, useRef, ChangeEvent, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useWebSocket, ChatMessage } from "@/hooks/useWebSocket";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { ConnectionStatus } from "@/components/chat/ConnectionStatus";
import { UserListItem } from "@/components/chat/UserListItem";
import { ChatMessage as ChatBubble } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { AvatarBadge } from "@/components/ui/avatar-badge";
import {
  MessageCircle,
  Users,
  LogOut,
  Search,
  Moon,
  Sun,
  Monitor,
  Trash2,
  Upload,
  Shield,
  PanelLeft,
  Settings,
  MessageSquare,
} from "lucide-react";
import PageTransition from "@/components/PageTransition";
import AnimatedBackground from "@/components/AnimatedBackground";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface ChatHistory {
  [user: string]: ChatMessage[];
}

interface RecentChat {
  username: string;
  last_message: string;
  last_message_at?: string;
  last_message_from?: string;
  avatar_url: string | null;
  is_online?: boolean;
}

const normalizeName = (name: string) => name.toLowerCase();

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function formatRecentTime(timestamp?: string) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay = now.toDateString() === date.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatRecentPreview(entry: RecentChat | undefined, myUsername?: string) {
  if (!entry) return "";
  const raw = entry.last_message || "";
  const sender = entry.last_message_from || entry.username;
  const senderLabel = normalizeName(sender) === normalizeName(myUsername || "") ? "You" : sender;
  if (!raw.trim()) return `${senderLabel}: No message`;
  if (raw.startsWith("QE1:")) return `${senderLabel}: Encrypted message`;
  return `${senderLabel}: ${raw}`;
}

type SidebarTab = "recent" | "online" | "settings";

export default function ChatPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { theme, setTheme } = useTheme();

  const {
    status,
    username,
    avatarUrl,
    setAvatarUrl,
    users,
    error,
    incomingMessage,
    history,
    seenBy,
    unreadCounts,
    reconnectAttempt,
    setUnreadCounts,
    connect,
    sendMessage,
    getHistory,
    sendSeen,
    disconnect,
  } = useWebSocket();

  const [currentChat, setCurrentChat] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistory>({});
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUsersSheetOpen, setIsUsersSheetOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("recent");
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ username: string; avatar_url?: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentChatRef = useRef<string | null>(null);
  const lastIncomingKeyRef = useRef<string>("");

  const unreadByUser = useMemo(() => {
    const acc: Record<string, number> = {};
    Object.entries(unreadCounts).forEach(([userKey, count]) => {
      const normalized = normalizeName(userKey);
      acc[normalized] = (acc[normalized] || 0) + count;
    });
    return acc;
  }, [unreadCounts]);

  const getUnreadFor = (user: string) => unreadByUser[normalizeName(user)] || 0;

  const userMap = useMemo(() => {
    const map = new Map<string, { username: string; avatar_url?: string; is_online?: boolean }>();
    users.forEach((u) => map.set(normalizeName(u.username), u));
    return map;
  }, [users]);

  const fetchRecentChats = async () => {
    try {
      const res = await fetch("/users/recent-chats");
      if (res.ok) {
        const data = await res.json();
        setRecentChats(data);
      }
    } catch (err) {
      console.error("Failed to fetch recent chats:", err);
    }
  };

  useEffect(() => {
    connect();
    fetchRecentChats();
  }, [connect]);

  useEffect(() => {
    currentChatRef.current = currentChat;
  }, [currentChat]);

  useEffect(() => {
    if (incomingMessage) {
      const dedupeKey = String(incomingMessage.id ?? `${incomingMessage.from}|${incomingMessage.timestamp}|${incomingMessage.message}`);
      if (lastIncomingKeyRef.current === dedupeKey) return;
      lastIncomingKeyRef.current = dedupeKey;
      const fromName = incomingMessage.from;
      const fromKey = normalizeName(fromName);

      setChatHistory((prev) => ({
        ...prev,
        [fromName]: [...(prev[fromName] || []), incomingMessage],
      }));

      if (currentChatRef.current && normalizeName(currentChatRef.current) === fromKey) {
        sendSeen(fromName);
        setUnreadCounts((prev) => {
          const next = { ...prev };
          delete next[fromName];
          delete next[fromKey];
          return next;
        });
      } else {
        setUnreadCounts((prev) => ({
          ...prev,
          [fromKey]: (prev[fromKey] || 0) + 1,
        }));
      }

      fetchRecentChats();
    }
  }, [incomingMessage, sendSeen, setUnreadCounts]);

  useEffect(() => {
    if (history) {
      setChatHistory((prev) => ({
        ...prev,
        [history.with]: history.messages.map((m) => {
          const isMine = m.from === username;
          return {
            ...m,
            delivery_status: isMine ? (m.is_seen ? "seen" : "delivered") : m.delivery_status,
          };
        }),
      }));
    }
  }, [history, username]);

  useEffect(() => {
    if (!seenBy || !username) return;
    setChatHistory((prev) => {
      const peerMessages = prev[seenBy.from] || [];
      if (peerMessages.length === 0) return prev;

      const nextPeerMessages = peerMessages.map((m) => {
        if (m.from !== username) return m;
        return {
          ...m,
          is_seen: true,
          delivery_status: "seen" as const,
        };
      });

      return {
        ...prev,
        [seenBy.from]: nextPeerMessages,
      };
    });
  }, [seenBy, username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, currentChat]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        setIsSearching(true);
        const res = await fetch(`/users/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/logout", { method: "POST" });
      if (res.ok) {
        disconnect();
        navigate("/login");
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split(".").pop();
      const filePath = `${username}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file);
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: publicUrl }),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      setAvatarUrl(publicUrl);
      toast.success("Profile photo updated");
    } catch (err: unknown) {
      console.error("Upload error:", err);
      toast.error(getErrorMessage(err, "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarDelete = async () => {
    try {
      setUploading(true);
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: "" }),
      });

      if (!res.ok) throw new Error("Failed to delete profile photo");

      setAvatarUrl("");
      toast.success("Profile photo removed");
    } catch (err: unknown) {
      console.error("Delete error:", err);
      toast.error(getErrorMessage(err, "Delete failed"));
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!currentChat || !username) return;

    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      from: username,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      is_seen: false,
      delivery_status: "sending",
    };

    setChatHistory((prev) => ({
      ...prev,
      [currentChat]: [...(prev[currentChat] || []), optimisticMessage],
    }));

    const success = await sendMessage(currentChat, message);
    setChatHistory((prev) => ({
      ...prev,
      [currentChat]: (prev[currentChat] || []).map((m) => {
        if (m.id !== tempId) return m;
        return {
          ...m,
          delivery_status: success ? "delivered" : "failed",
        };
      }),
    }));
  };

  const openChat = (user: string) => {
    const key = normalizeName(user);

    setCurrentChat(user);
    getHistory(user);
    sendSeen(user);
    setIsUsersSheetOpen(false);

    setUnreadCounts((prev) => {
      const next = { ...prev };
      delete next[user];
      delete next[key];
      return next;
    });
  };

  const otherUsers = users.filter((u) => normalizeName(u.username) !== normalizeName(username || ""));
  const currentMessages = currentChat ? chatHistory[currentChat] || [] : [];

  const recentListWithUnread = useMemo(() => {
    const list = [...recentChats];
    const known = new Set(list.map((c) => normalizeName(c.username)));

    Object.entries(unreadByUser).forEach(([normalizedUser, count]) => {
      if (count <= 0) return;
      if (normalizedUser === normalizeName(username || "")) return;
      if (known.has(normalizedUser)) return;

      const onlineUser = userMap.get(normalizedUser);
      if (onlineUser) {
        list.unshift({
          username: onlineUser.username,
          last_message: "",
          last_message_at: "",
          last_message_from: onlineUser.username,
          avatar_url: onlineUser.avatar_url || null,
          is_online: onlineUser.is_online,
        });
      }
    });

    return list;
  }, [recentChats, unreadByUser, userMap, username]);

  const activeList = searchQuery.trim()
    ? searchResults
    : sidebarTab === "online"
      ? otherUsers
      : recentListWithUnread;

  const currentChatUser = currentChat ? userMap.get(normalizeName(currentChat)) : undefined;

  const railButtons: { id: SidebarTab; label: string; icon: typeof MessageSquare }[] = [
    { id: "recent", label: "Recent chats", icon: MessageSquare },
    { id: "online", label: "Online users", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const SidebarPanel = (
    <div className="h-full flex flex-col">
      {sidebarTab !== "settings" ? (
        <>
          <div className="p-4 border-b border-border/70">
            <div className="mb-3">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground font-semibold">
                {sidebarTab === "online" ? "Users available" : "Recent activity"}
              </p>
              <h2 className="text-lg font-semibold mt-1">{sidebarTab === "online" ? "Online users" : "Recent chats"}</h2>
            </div>

            <div className="clay-card rounded-2xl p-3 border border-border/70">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-2">Search</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={sidebarTab === "online" ? "Search online users" : "Search chats"}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-3 rounded-xl glass-input text-sm focus:outline-none focus:ring-2 focus:ring-ring/25"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
            {isSearching ? (
              <div className="h-32 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : activeList.length === 0 ? (
              <div className="h-36 flex items-center justify-center text-sm text-muted-foreground">No users found</div>
            ) : (
              activeList.map((user) => {
                const normalized = normalizeName(user.username);
                const recentEntry = recentListWithUnread.find((entry) => normalizeName(entry.username) === normalized);
                return (
                  <UserListItem
                    key={user.username}
                    username={user.username}
                    avatarUrl={user.avatar_url}
                    isOnline={!!userMap.get(normalized)?.is_online}
                    isActive={currentChat ? normalizeName(currentChat) === normalized : false}
                    unreadCount={getUnreadFor(user.username)}
                    previewText={formatRecentPreview(recentEntry, username || "")}
                    messageTime={formatRecentTime(recentEntry?.last_message_at)}
                    onClick={() => openChat(user.username)}
                  />
                );
              })
            )}
          </div>
        </>
      ) : (
        <div className="p-4 space-y-4">
          <div className="clay-card rounded-3xl p-4 border border-border/70">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground font-semibold">Profile</p>
            <div className="mt-3 flex items-center gap-3">
              <AvatarBadge name={username || "?"} avatarUrl={avatarUrl} isOnline size="md" />
              <div className="min-w-0">
                <p className="font-semibold truncate">{username || "Anonymous"}</p>
                <p className="text-xs text-muted-foreground">Manage account and display settings</p>
              </div>
            </div>
            <Button className="w-full mt-4" variant="outline" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Open settings
            </Button>
          </div>

          <div className="clay-card rounded-3xl p-4 border border-border/70">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground font-semibold mb-3">Theme</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: "light", icon: Sun },
                { name: "dark", icon: Moon },
                { name: "system", icon: Monitor },
              ].map((t) => (
                <button
                  key={t.name}
                  onClick={() => setTheme(t.name)}
                  className={cn(
                    "h-11 rounded-xl border text-xs font-semibold uppercase tracking-wide flex items-center justify-center gap-1.5",
                    theme === t.name
                      ? "bg-primary/14 text-primary border-primary/40"
                      : "bg-card/70 text-muted-foreground border-border/70"
                  )}
                >
                  <t.icon className="w-4 h-4" />
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <Button variant="destructive" className="w-full" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <PageTransition>
      <AnimatedBackground />
      <div className="h-screen flex flex-col relative z-10">
        <header className="h-16 md:h-[74px] px-4 md:px-6 flex items-center justify-between border-b border-border/70 glass">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl gradient-primary text-primary-foreground flex items-center justify-center shadow-sm">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-display font-bold text-base md:text-lg truncate">RelayBoy</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {reconnectAttempt > 0 ? `Reconnecting (${reconnectAttempt})` : "Secure Workspace"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isMobile ? (
              <Button variant="outline" size="icon" className="rounded-xl" onClick={() => setIsUsersSheetOpen(true)}>
                <PanelLeft className="w-4 h-4" />
              </Button>
            ) : null}
            <ConnectionStatus status={status} username={username} />
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden p-2 md:p-3 gap-3 relative">
          <div className="pointer-events-none absolute left-[21%] top-[14%] h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute right-[10%] bottom-[10%] h-60 w-60 rounded-full bg-accent/10 blur-3xl" />

          <aside className="hidden md:flex w-[78px] rounded-3xl glass-card clay-card border border-border/70 p-2 flex-col items-stretch gap-2">
            {railButtons.map((item) => (
              <button
                key={item.id}
                onClick={() => setSidebarTab(item.id)}
                aria-label={item.label}
                className={cn(
                  "h-12 rounded-2xl border flex items-center justify-center transition shadow-sm",
                  sidebarTab === item.id
                    ? "bg-primary/16 border-primary/45 text-primary shadow-md"
                    : "clay-card border-border/70 text-muted-foreground hover:text-foreground hover:shadow-md"
                )}
              >
                <item.icon className="w-[18px] h-[18px]" />
              </button>
            ))}
          </aside>

          <aside className="hidden md:flex w-[340px] rounded-3xl glass-card clay-card border border-border/70 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={sidebarTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="h-full w-full"
              >
                {SidebarPanel}
              </motion.div>
            </AnimatePresence>
          </aside>

          <main className="flex-1 rounded-3xl glass-card clay-card border border-border/70 overflow-hidden flex flex-col">
            {currentChat ? (
              <>
                <div className="h-16 px-4 md:px-6 border-b border-border/70 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <AvatarBadge
                      name={currentChat}
                      avatarUrl={currentChatUser?.avatar_url}
                      isOnline={!!currentChatUser?.is_online}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{currentChat}</p>
                      <p className="text-xs text-muted-foreground">{currentChatUser?.is_online ? "Online" : "Offline"}</p>
                    </div>
                  </div>
                  <div className="text-[11px] px-3 py-1 rounded-full border border-border/80 clay-card text-muted-foreground">
                    End-to-end secure
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4 scrollbar-thin">
                  {currentMessages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <MessageCircle className="w-12 h-12 text-primary mb-4" />
                      <p className="font-semibold">No messages yet</p>
                      <p className="text-sm text-muted-foreground">Start a secure conversation with @{currentChat}</p>
                    </div>
                  ) : (
                    currentMessages.map((msg, index) => (
                      <ChatBubble
                        key={String(msg.id ?? `${msg.from}-${msg.timestamp}-${index}`)}
                        message={msg.message}
                        timestamp={msg.timestamp}
                        isSent={msg.from === username}
                        isSeen={msg.is_seen}
                        deliveryStatus={msg.delivery_status}
                        senderName={msg.from !== username ? msg.from : undefined}
                      />
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-3 md:p-4 border-t border-border/70">
                  <ChatInput onSend={handleSendMessage} disabled={status !== "connected"} placeholder={`Message ${currentChat}`} />
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <Users className="w-12 h-12 text-primary mb-4" />
                <p className="font-semibold text-lg mb-1">Select a conversation</p>
                <p className="text-sm text-muted-foreground mb-5">Use recent chats, online users, or settings from the side panel.</p>
                <Button className="md:hidden" onClick={() => setIsUsersSheetOpen(true)}>
                  Browse panel
                </Button>
              </div>
            )}
          </main>
        </div>

        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="max-w-md rounded-3xl border-border/70 glass-card p-0 overflow-hidden">
            <div className="h-24 gradient-primary" />
            <div className="px-6 pb-6 -mt-10">
              <div className="flex items-end justify-between gap-4 mb-6">
                <div className="relative group">
                  <AvatarBadge name={username || "?"} avatarUrl={avatarUrl} size="lg" className="w-20 h-20 ring-4 ring-background" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                  >
                    <Upload className="w-5 h-5 text-white" />
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                </div>
                <Button variant="destructive" size="sm" onClick={handleAvatarDelete} disabled={!avatarUrl || uploading}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              </div>

              <h3 className="font-bold text-lg">{username}</h3>
              <p className="text-xs text-muted-foreground mb-6 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Profile and theme preferences
              </p>

              <div className="grid grid-cols-3 gap-2 mb-6">
                {[
                  { name: "light", icon: Sun },
                  { name: "dark", icon: Moon },
                  { name: "system", icon: Monitor },
                ].map((t) => (
                  <button
                    key={t.name}
                    onClick={() => setTheme(t.name)}
                    className={cn(
                      "h-12 rounded-xl border text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-1.5",
                      theme === t.name
                        ? "bg-primary/12 text-primary border-primary/40"
                        : "bg-card/70 text-muted-foreground border-border/70"
                    )}
                  >
                    <t.icon className="w-4 h-4" />
                    {t.name}
                  </button>
                ))}
              </div>

              <Button variant="destructive" className="w-full" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Sheet open={isUsersSheetOpen} onOpenChange={setIsUsersSheetOpen}>
          <SheetContent side="left" className="w-[92vw] sm:max-w-sm p-0 border-border/70 glass-card">
            <SheetHeader className="px-4 pt-4 pb-2">
              <SheetTitle>Workspace</SheetTitle>
              <SheetDescription>Recent chats, online users, and settings</SheetDescription>
            </SheetHeader>

            <div className="px-4 pb-3 grid grid-cols-3 gap-2">
              {railButtons.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSidebarTab(item.id)}
                  className={cn(
                    "h-10 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold",
                    sidebarTab === item.id
                      ? "bg-primary/16 border-primary/45 text-primary"
                      : "border-border/70 text-muted-foreground"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.id}
                </button>
              ))}
            </div>

            <div className="h-[calc(100%-8.8rem)] overflow-hidden">{SidebarPanel}</div>
          </SheetContent>
        </Sheet>

        <AnimatePresence>
          {error ? (
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="fixed bottom-4 right-4 left-4 md:left-auto md:w-auto bg-destructive text-destructive-foreground px-4 py-3 rounded-xl text-sm font-semibold"
            >
              {error}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
