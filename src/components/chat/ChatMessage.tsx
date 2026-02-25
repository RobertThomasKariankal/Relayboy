import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { AvatarBadge } from "@/components/ui/avatar-badge";

interface ChatMessageProps {
  message: string;
  timestamp: string;
  isSent: boolean;
  senderName?: string;
  isSeen?: boolean;
}

export function ChatMessage({ message, timestamp, isSent, senderName, isSeen }: ChatMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-3 max-w-[86%]", isSent ? "self-end flex-row-reverse" : "self-start")}
    >
      {!isSent ? (
        <div className="shrink-0 self-end mb-5">
          <AvatarBadge name={senderName || "?"} size="sm" className="w-8 h-8" />
        </div>
      ) : null}

      <div className={cn("flex flex-col", isSent ? "items-end" : "items-start")}>
        <div
          className={cn(
            "px-4 py-3 rounded-2xl border text-sm leading-relaxed",
            isSent
              ? "bg-chat-sent text-primary-foreground border-primary/40 rounded-br-sm"
              : "bg-chat-received text-foreground border-border/80 rounded-bl-sm"
          )}
        >
          {message}
        </div>

        <div className="mt-1 px-1.5 text-[10px] text-muted-foreground font-semibold flex items-center gap-1.5">
          <span>{timestamp}</span>
          {isSent ? <span>{isSeen ? "Seen" : "Sent"}</span> : null}
        </div>
      </div>
    </motion.div>
  );
}
