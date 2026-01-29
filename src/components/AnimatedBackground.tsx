import { motion } from "framer-motion";

const AnimatedBackground = () => {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-background">
            {/* Deep Space Gradients */}
            <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-primary/20 rounded-full blur-[120px] mix-blend-screen opacity-30 animate-pulse-slow" />
            <div className="absolute bottom-0 left-0 w-[50vw] h-[50vh] bg-secondary/20 rounded-full blur-[120px] mix-blend-screen opacity-30 animate-pulse-slow" style={{ animationDelay: "2s" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vh] bg-accent/10 rounded-full blur-[140px] mix-blend-screen opacity-20" />

            {/* Floating Particles */}
            <div className="absolute inset-0 opacity-20">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full bg-white"
                        initial={{
                            x: Math.random() * window.innerWidth,
                            y: Math.random() * window.innerHeight,
                            scale: Math.random() * 0.5 + 0.5,
                            opacity: Math.random() * 0.5 + 0.1,
                        }}
                        animate={{
                            y: [null, Math.random() * -100],
                            x: [null, Math.random() * 50 - 25],
                        }}
                        transition={{
                            duration: Math.random() * 10 + 10,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut",
                        }}
                        style={{
                            width: Math.random() * 4 + 1 + "px",
                            height: Math.random() * 4 + 1 + "px",
                        }}
                    />
                ))}
            </div>

            {/* Grid overlay for texture */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        </div>
    );
};

export default AnimatedBackground;
