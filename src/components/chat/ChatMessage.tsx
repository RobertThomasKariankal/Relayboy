import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: string;
  timestamp: string;
  isSent: boolean;
  senderName?: string;
}

export function ChatMessage({ message, timestamp, isSent, senderName }: ChatMessageProps) {
  return (
    <div
      className={cn(
        "flex flex-col max-w-[75%] animate-fade-in",
        isSent ? "items-end self-end" : "items-start self-start"
      )}
    >
      {!isSent && senderName && (
        <span className="text-xs text-muted-foreground mb-1 ml-3">{senderName}</span>
      )}
      <div
        className={cn(
          "px-4 py-3 rounded-2xl shadow-md",
          isSent
            ? "bg-chat-sent text-primary-foreground rounded-br-md"
            : "bg-chat-received text-foreground rounded-bl-md"
        )}
      >
        <p className="text-sm leading-relaxed">{message}</p>
      </div>
      <span className="text-[10px] text-muted-foreground mt-1 px-2">
        {timestamp}
      </span>
    </div>
  );
}
