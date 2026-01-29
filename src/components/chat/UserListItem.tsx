import { cn } from "@/lib/utils";
import { AvatarBadge } from "@/components/ui/avatar-badge";
import { motion } from "framer-motion";

interface UserListItemProps {
  username: string;
  isOnline?: boolean;
  isActive?: boolean;
  onClick: () => void;
}

export function UserListItem({ username, isOnline = true, isActive = false, onClick }: UserListItemProps) {
  return (
    <motion.button
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 border border-transparent group",
        isActive
          ? "bg-white/10 border-white/10 shadow-xl"
          : "hover:bg-white/5 hover:border-white/5"
      )}
    >
      <div className="relative">
        <AvatarBadge name={username} isOnline={isOnline} size="sm" />
        {isOnline && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-online border-2 border-background rounded-full animate-pulse" />
        )}
      </div>
      <div className="flex-1 text-left min-w-0">
        <span className={cn(
          "font-bold text-sm block truncate transition-colors",
          isActive ? "text-primary glow-text" : "text-foreground group-hover:text-primary"
        )}>
          {username}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
          {isOnline ? "Available" : "Offline"}
        </span>
      </div>
      {isActive && (
        <motion.div
          layoutId="active-indicator"
          className="w-1.5 h-1.5 rounded-full bg-primary glow-primary"
        />
      )}
    </motion.button>
  );
}
