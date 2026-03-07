import { useMemo } from "react";
import { motion } from "framer-motion";

const AnimatedBackground = () => {
  const particles = useMemo(
    () =>
      [...Array(10)].map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.24 + 0.08,
        duration: Math.random() * 12 + 16,
        drift: Math.random() * 18 - 9,
      })),
    []
  );

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_14%_-10%,rgba(131,164,255,0.22),transparent_46%),radial-gradient(900px_circle_at_88%_108%,rgba(105,187,172,0.18),transparent_46%),linear-gradient(160deg,#060910_0%,#090d17_42%,#070a12_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.08),transparent_35%),radial-gradient(circle_at_80%_75%,rgba(255,255,255,0.05),transparent_42%)]" />
      <div className="absolute top-[14%] left-[8%] w-56 h-56 rounded-full border border-white/10 opacity-25 animate-orbit" />
      <div className="absolute bottom-[12%] right-[10%] w-64 h-64 rounded-full border border-white/10 opacity-20 animate-orbit" />

      <div className="absolute inset-0 opacity-25">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-white"
            initial={{ x: `${p.x}vw`, y: `${p.y}vh`, opacity: p.opacity }}
            animate={{
              y: [`${p.y}vh`, `${p.y - 6}vh`],
              x: [`${p.x}vw`, `${p.x + p.drift}vw`],
            }}
            transition={{ duration: p.duration, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            style={{ width: `${p.size}px`, height: `${p.size}px` }}
          />
        ))}
      </div>

      <div className="absolute inset-0 opacity-[0.07] mix-blend-soft-light bg-noise-pattern" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-black/25" />
    </div>
  );
};

export default AnimatedBackground;
