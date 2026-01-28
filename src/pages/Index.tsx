import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users, Zap, Shield, ArrowRight, Sparkles } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/15 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-60 -left-60 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 h-16 flex items-center justify-between px-6 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg">
            <MessageCircle className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-display font-bold gradient-text">RelayBoy</span>
        </div>
        <Link to="/login">
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
            Sign in
            <ArrowRight className="ml-1 w-4 h-4" />
          </Button>
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        <div className="text-center max-w-3xl animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Real-time messaging, reimagined</span>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
            Connect instantly with{" "}
            <span className="gradient-text">RelayBoy</span>
          </h1>

          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
            A beautifully crafted chat experience. Fast, secure, and designed 
            for the way you communicate.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link to="/login">
              <Button size="lg" className="gradient-primary hover:opacity-90 transition-opacity shadow-lg glow-primary h-14 px-8 text-base font-medium">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/chat">
              <Button size="lg" variant="outline" className="h-14 px-8 text-base font-medium border-border/50 hover:bg-secondary/50">
                Open Chat
              </Button>
            </Link>
          </div>

          {/* Feature cards */}
          <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="glass-card rounded-2xl p-6 text-left animate-slide-in-left" style={{ animationDelay: "0.1s" }}>
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Lightning Fast</h3>
              <p className="text-sm text-muted-foreground">Real-time WebSocket messaging with zero lag</p>
            </div>

            <div className="glass-card rounded-2xl p-6 text-left animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Live Presence</h3>
              <p className="text-sm text-muted-foreground">See who's online and available to chat</p>
            </div>

            <div className="glass-card rounded-2xl p-6 text-left animate-slide-in-right" style={{ animationDelay: "0.3s" }}>
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Secure & Private</h3>
              <p className="text-sm text-muted-foreground">End-to-end encrypted conversations</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center">
        <p className="text-xs text-muted-foreground/50">
          Built with ❤️ using WebSockets
        </p>
      </footer>
    </div>
  );
}
