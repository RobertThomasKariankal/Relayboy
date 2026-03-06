import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users, Shield, ArrowRight, LockKeyhole, Sparkles } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import AnimatedBackground from "@/components/AnimatedBackground";
import { motion } from "framer-motion";

const features = [
  {
    icon: Sparkles,
    title: "Realtime Workspace",
    desc: "Fluid, low-latency messaging for day-to-day teams.",
  },
  {
    icon: Users,
    title: "Presence Driven",
    desc: "Recent chats, online users, unread-first navigation.",
  },
  {
    icon: Shield,
    title: "Quantum Ready",
    desc: "Kyber-based key exchange with secure delivery flow.",
  },
];

export default function Index() {
  return (
    <PageTransition>
      <AnimatedBackground />
      <div className="min-h-screen relative z-10 px-4 sm:px-8 lg:px-12 py-4 sm:py-6">
        <header className="h-16 sm:h-20 px-4 sm:px-6 flex items-center justify-between rounded-3xl border border-border/70 glass-card">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 gradient-primary rounded-2xl flex items-center justify-center glow-primary">
              <MessageCircle className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-lg font-display font-bold">RelayBoy</p>
              <p className="text-xs text-muted-foreground uppercase tracking-[0.18em]">Secure Team Chat</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" className="rounded-xl">Sign in</Button>
            </Link>
            <Link to="/chat">
              <Button className="rounded-xl gradient-primary text-primary-foreground">Open Chat</Button>
            </Link>
          </div>
        </header>

        <main className="max-w-7xl mx-auto mt-5 sm:mt-8 grid lg:grid-cols-[1.28fr_1fr] gap-5">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-[2rem] border-border/70 p-7 sm:p-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-7 rounded-full clay-card border-border/70 text-xs font-bold uppercase tracking-[0.2em]">
              <LockKeyhole className="w-4 h-4 text-primary" />
              Professional Secure Messaging
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-tight">
              Redefined communication,
              <span className="block gradient-text">refined for real workdays.</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
              RelayBoy blends polished interface design with dependable secure messaging so teams can stay focused, readable, and fast in both light and dark themes.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/login">
                <Button className="h-12 px-6 rounded-xl gradient-primary text-primary-foreground font-bold">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Link to="/chat">
                <Button variant="outline" className="h-12 px-6 rounded-xl border-border/80 bg-card/60">
                  Launch Workspace
                </Button>
              </Link>
            </div>
          </motion.section>

          <section className="grid sm:grid-cols-3 lg:grid-cols-1 gap-4">
            {features.map((f, i) => (
              <motion.article
                key={f.title}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i }}
                className="glass-card clay-card rounded-3xl p-6 border-border/70"
              >
                <div className="w-11 h-11 rounded-xl gradient-primary text-primary-foreground flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.article>
            ))}
          </section>
        </main>
      </div>
    </PageTransition>
  );
}
