import { cn } from "@/lib/utils";
import { AvatarBadge } from "@/components/ui/avatar-badge";
import { motion } from "framer-motion";

interface UserListItemProps {
  username: string;
  avatarUrl?: string;
  isOnline?: boolean;
  isActive?: boolean;
  unreadCount?: number;
  onClick: () => void;
}

export function UserListItem({
  username,
  avatarUrl,
  isOnline = false,
  isActive = false,
  unreadCount = 0,
  onClick,
}: UserListItemProps) {
  return (
    <motion.button
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-200 border text-left",
        isActive
          ? "bg-white/14 border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
          : "bg-white/[0.04] border-white/10 hover:bg-white/[0.09]"
      )}
    >
      <AvatarBadge name={username} avatarUrl={avatarUrl} isOnline={isOnline} size="sm" />

      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-semibold truncate", isActive ? "text-foreground" : "text-foreground/90")}>{username}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.14em]">{isOnline ? "Online" : "Offline"}</p>
      </div>

      {unreadCount > 0 && !isActive ? (
        <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-white/90 text-slate-900 text-[11px] font-bold flex items-center justify-center shadow-[0_8px_18px_-10px_rgba(255,255,255,0.95)]">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </motion.button>
  );
}
