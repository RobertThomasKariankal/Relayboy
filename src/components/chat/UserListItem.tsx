import { cn } from "@/lib/utils";
import { AvatarBadge } from "@/components/ui/avatar-badge";
import { motion } from "framer-motion";

interface UserListItemProps {
  username: string;
  avatarUrl?: string;
  isOnline?: boolean;
  isActive?: boolean;
  unreadCount?: number;
  previewText?: string;
  messageTime?: string;
  onClick: () => void;
}

export function UserListItem({
  username,
  avatarUrl,
  isOnline = false,
  isActive = false,
  unreadCount = 0,
  previewText,
  messageTime,
  onClick,
}: UserListItemProps) {
  return (
    <motion.button
      whileHover={{ x: 4, y: -1 }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-200 border text-left clay-card shadow-sm",
        isActive
          ? "bg-primary/12 border-primary/35 shadow-md"
          : "border-border/65 hover:border-primary/30 hover:shadow-md"
      )}
    >
      <AvatarBadge name={username} avatarUrl={avatarUrl} isOnline={isOnline} size="sm" />

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <p className={cn("text-sm font-semibold truncate", isActive ? "text-primary" : "text-foreground")}>{username}</p>
          {messageTime ? <span className="text-[10px] text-muted-foreground shrink-0">{messageTime}</span> : null}
        </div>
        <p className="text-[11px] text-muted-foreground truncate">
          {previewText?.trim() ? previewText : "No messages yet"}
        </p>
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {isOnline ? "Online" : "Offline"}
        </p>
      </div>

      {unreadCount > 0 && !isActive ? (
        <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center shadow-lg">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </motion.button>
  );
}
