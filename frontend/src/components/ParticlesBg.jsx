import { motion } from "framer-motion";

export default function ParticlesBg() {
  const particles = Array.from({ length: 25 });

  return (
    <div className="absolute inset-0 pointer-events-none">
      {particles.map((_, i) => (
        <motion.span
          key={i}
          className="absolute w-2 h-2 bg-purple-500 rounded-full opacity-30"
          animate={{
            y: [0, -100, 0],
            x: [0, 50, -50, 0],
          }}
          transition={{
            duration: 8 + i,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
        />
      ))}
    </div>
  );
}
