import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative h-10 w-10 rounded-xl glass-chip flex items-center justify-center text-foreground transition-all duration-300 hover:scale-[1.03]",
        className
      )}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <Sun className={cn("h-4 w-4 absolute transition-all duration-300", isDark ? "opacity-0 rotate-45 scale-75" : "opacity-100 rotate-0 scale-100")} />
      <Moon className={cn("h-4 w-4 absolute transition-all duration-300", isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-45 scale-75")} />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
