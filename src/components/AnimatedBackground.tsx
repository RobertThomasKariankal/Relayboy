import { useMemo } from "react";
import { motion } from "framer-motion";

const AnimatedBackground = () => {
  const particles = useMemo(
    () =>
      [...Array(10)].map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 2,
        opacity: Math.random() * 0.35 + 0.15,
        duration: Math.random() * 12 + 12,
        drift: Math.random() * 22 - 11,
      })),
    []
  );

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-background">
      <div className="absolute -top-28 -left-20 h-[48vh] w-[52vw] rounded-full bg-primary/20 blur-[90px]" />
      <div className="absolute -bottom-20 -right-16 h-[45vh] w-[48vw] rounded-full bg-accent/18 blur-[100px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_22%,hsl(var(--primary)/0.12),transparent_32%),radial-gradient(circle_at_84%_76%,hsl(var(--accent)/0.12),transparent_36%)]" />

      <div className="absolute inset-0 opacity-40">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-foreground"
            initial={{ x: `${p.x}vw`, y: `${p.y}vh`, opacity: p.opacity }}
            animate={{
              y: [`${p.y}vh`, `${p.y - 10}vh`],
              x: [`${p.x}vw`, `${p.x + p.drift}vw`],
            }}
            transition={{ duration: p.duration, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            style={{ width: `${p.size}px`, height: `${p.size}px` }}
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(transparent_30px,hsl(var(--border)/0.2)_31px),linear-gradient(90deg,transparent_30px,hsl(var(--border)/0.2)_31px)] bg-[size:31px_31px] opacity-[0.08]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-transparent opacity-[0.06] animate-scan" />
    </div>
  );
};

export default AnimatedBackground;
