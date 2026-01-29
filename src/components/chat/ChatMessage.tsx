import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ChatMessageProps {
  message: string;
  timestamp: string;
  isSent: boolean;
  senderName?: string;
}

export function ChatMessage({ message, timestamp, isSent, senderName }: ChatMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, x: isSent ? 20 : -20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "flex flex-col max-w-[75%]",
        isSent ? "items-end self-end" : "items-start self-start"
      )}
    >
      {!isSent && senderName && (
        <span className="text-xs text-muted-foreground mb-1 ml-3 font-medium">{senderName}</span>
      )}
      <div
        className={cn(
          "px-4 py-3 rounded-2xl shadow-xl border border-white/5",
          isSent
            ? "bg-chat-sent text-primary-foreground rounded-br-md glow-primary"
            : "bg-chat-received text-foreground rounded-bl-md glass-card"
        )}
      >
        <p className="text-sm leading-relaxed">{message}</p>
      </div>
      <span className="text-[10px] text-muted-foreground mt-1 px-2 opacity-60">
        {timestamp}
      </span>
    </motion.div>
  );
}
