import { cn } from "@/lib/utils";
import { Wifi, WifiOff, Loader2 } from "lucide-react";

type ConnectionState = "connecting" | "connected" | "disconnected";

interface ConnectionStatusProps {
  status: ConnectionState;
  username?: string;
}

export function ConnectionStatus({ status, username }: ConnectionStatusProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium">
      {status === "connecting" && (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
          <span className="text-muted-foreground">Connecting...</span>
        </>
      )}
      {status === "connected" && (
        <>
          <Wifi className="h-3 w-3 text-online" />
          <span className="text-foreground">
            {username ? `Connected as ${username}` : "Connected"}
          </span>
        </>
      )}
      {status === "disconnected" && (
        <>
          <WifiOff className="h-3 w-3 text-destructive" />
          <span className="text-muted-foreground">Disconnected</span>
        </>
      )}
    </div>
  );
}
