import { useState, KeyboardEvent } from "react";
import { Send, Plus, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled = false, placeholder = "Type your message..." }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-[2.5rem] shadow-2xl focus-within:border-primary/30 transition-all duration-300">
      <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 text-muted-foreground transition-colors hidden sm:flex">
        <Plus className="w-5 h-5" />
      </button>

      <div className="flex-1 relative group">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full h-12 glass-input border-none focus-visible:ring-0 px-4 text-sm font-medium placeholder:text-muted-foreground/40 rounded-full"
        />
        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
          <Smile className="w-5 h-5" />
        </button>
      </div>

      <motion.div
        whileTap={{ scale: 0.9 }}
      >
        <Button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          size="icon"
          className="w-12 h-12 rounded-full gradient-primary hover:opacity-90 transition-all shadow-lg glow-primary border-none"
        >
          <Send className="h-5 w-5" />
        </Button>
      </motion.div>
    </div>
  );
}
