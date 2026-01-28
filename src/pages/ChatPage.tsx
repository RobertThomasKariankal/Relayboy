import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useWebSocket, ChatMessage } from "@/hooks/useWebSocket";
import { ConnectionStatus } from "@/components/chat/ConnectionStatus";
import { UserListItem } from "@/components/chat/UserListItem";
import { ChatMessage as ChatBubble } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { AvatarBadge } from "@/components/ui/avatar-badge";
import { MessageCircle, Users, LogOut, MessageSquare } from "lucide-react";

interface ChatHistory {
  [user: string]: ChatMessage[];
}

export default function ChatPage() {
  const { status, username, users, error, incomingMessage, connect, sendMessage } = useWebSocket();
  const [currentChat, setCurrentChat] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistory>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    connect();
  }, [connect]);

  // Handle incoming messages
  useEffect(() => {
    if (incomingMessage) {
      setChatHistory((prev) => ({
        ...prev,
        [incomingMessage.from]: [...(prev[incomingMessage.from] || []), incomingMessage],
      }));
    }
  }, [incomingMessage]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, currentChat]);

  const handleSendMessage = (message: string) => {
    if (!currentChat || !username) return;

    const success = sendMessage(currentChat, message);
    if (success) {
      const newMessage: ChatMessage = {
        from: username,
        message,
        timestamp: new Date().toLocaleTimeString(),
      };
      setChatHistory((prev) => ({
        ...prev,
        [currentChat]: [...(prev[currentChat] || []), newMessage],
      }));
    }
  };

  const openChat = (user: string) => {
    setCurrentChat(user);
    if (!chatHistory[user]) {
      setChatHistory((prev) => ({ ...prev, [user]: [] }));
    }
  };

  const otherUsers = users.filter((u) => u !== username);
  const currentMessages = currentChat ? chatHistory[currentChat] || [] : [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-16 border-b border-border/50 glass flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-md">
            <MessageCircle className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-display font-bold gradient-text">RelayBoy</h1>
        </div>

        <div className="flex items-center gap-4">
          <ConnectionStatus status={status} username={username} />
          <Link
            to="/login"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </Link>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-2 text-sm text-center">
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Users Sidebar */}
        <aside className="w-64 border-r border-border/50 bg-sidebar flex flex-col">
          <div className="p-4 border-b border-border/50">
            <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="w-4 h-4" />
              Online Users
              <span className="ml-auto bg-online/20 text-online px-2 py-0.5 rounded-full text-xs font-medium">
                {otherUsers.length}
              </span>
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
            {otherUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                  <Users className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No one else is online</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Wait for others to join</p>
              </div>
            ) : (
              <div className="space-y-1">
                {otherUsers.map((user) => (
                  <UserListItem
                    key={user}
                    username={user}
                    isOnline
                    isActive={currentChat === user}
                    onClick={() => openChat(user)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Current User */}
          {username && (
            <div className="p-4 border-t border-border/50">
              <div className="flex items-center gap-3">
                <AvatarBadge name={username} isOnline size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{username}</p>
                  <p className="text-xs text-muted-foreground">You</p>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col min-w-0">
          {currentChat ? (
            <>
              {/* Chat Header */}
              <div className="h-16 border-b border-border/50 glass-card flex items-center gap-3 px-6">
                <AvatarBadge name={currentChat} isOnline size="md" />
                <div>
                  <h2 className="font-semibold">{currentChat}</h2>
                  <p className="text-xs text-online flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-online rounded-full" />
                    Online
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
                {currentMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                      <MessageSquare className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No messages yet</p>
                    <p className="text-sm text-muted-foreground/60 mt-1">
                      Start the conversation with {currentChat}
                    </p>
                  </div>
                ) : (
                  currentMessages.map((msg, i) => (
                    <ChatBubble
                      key={i}
                      message={msg.message}
                      timestamp={msg.timestamp}
                      isSent={msg.from === username}
                      senderName={msg.from !== username ? msg.from : undefined}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border/50">
                <ChatInput
                  onSend={handleSendMessage}
                  disabled={status !== "connected"}
                  placeholder={`Message ${currentChat}...`}
                />
              </div>
            </>
          ) : (
            /* No chat selected */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-24 h-24 gradient-primary rounded-3xl flex items-center justify-center mb-6 shadow-lg glow-primary animate-float">
                <MessageCircle className="w-12 h-12 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-2">Welcome to RelayBoy</h2>
              <p className="text-muted-foreground max-w-sm">
                Select a user from the sidebar to start a private conversation
              </p>
              {status !== "connected" && (
                <p className="text-sm text-muted-foreground/60 mt-4">
                  Waiting for connection...
                </p>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
