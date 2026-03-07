import { useState, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  onSend: (message: string) => void | Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled = false, placeholder = "Type your message..." }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    const next = message.trim();
    if (!next || disabled) return;
    onSend(next);
    setMessage("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="mx-auto flex items-center gap-2 p-2.5 rounded-[20px] border border-white/15 bg-white/[0.06] backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_22px_40px_-34px_rgba(0,0,0,1)]">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full h-11 bg-transparent border-none focus-visible:ring-0 px-3 text-sm placeholder:text-muted-foreground/90"
      />

      <Button
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        size="icon"
        className="w-10 h-10 rounded-xl border border-white/20 bg-white/85 text-slate-900 hover:bg-white shadow-[0_10px_22px_-14px_rgba(255,255,255,0.9)]"
      >
        <Send className="h-4.5 w-4.5" />
      </Button>
    </div>
  );
}
