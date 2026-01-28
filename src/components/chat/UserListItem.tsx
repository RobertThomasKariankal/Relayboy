import { cn } from "@/lib/utils";
import { AvatarBadge } from "@/components/ui/avatar-badge";

interface UserListItemProps {
  username: string;
  isOnline?: boolean;
  isActive?: boolean;
  onClick: () => void;
}

export function UserListItem({ username, isOnline = true, isActive = false, onClick }: UserListItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
        "hover:bg-secondary/80 group",
        isActive && "bg-secondary shadow-md"
      )}
    >
      <AvatarBadge name={username} isOnline={isOnline} size="sm" />
      <span className={cn(
        "font-medium text-sm truncate",
        isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
      )}>
        {username}
      </span>
    </button>
  );
}
