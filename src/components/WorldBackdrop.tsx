"use client";

import { motion } from "framer-motion";
import type { Level } from "@/game/levels";

const FALLERS: Record<Level["world"], string[]> = {
  "candy-meadow":  ["🌸", "🌷", "🍓"],
  "candy-rain":    ["🍬", "🍭", "🍰"],
  "rainbow-storm": ["🌈", "⭐", "✨"],
  "crystal-cave":  ["💎", "❄️", "🔮"],
  "candy-kingdom": ["👑", "🍰", "🧁"],
};

const BG: Record<Level["world"], string> = {
  "candy-meadow":
    "radial-gradient(80% 60% at 20% 10%, #ff9ed1 0%, transparent 55%), radial-gradient(80% 70% at 90% 20%, #ffd1a4 0%, transparent 50%), linear-gradient(180deg, #5b2e9b 0%, #1e0c3a 100%)",
  "candy-rain":
    "radial-gradient(80% 60% at 30% 0%, #7be8ff 0%, transparent 55%), radial-gradient(80% 70% at 90% 30%, #7aa6ff 0%, transparent 50%), linear-gradient(180deg, #1a276b 0%, #1e0c3a 100%)",
  "rainbow-storm":
    "conic-gradient(from 0deg at 50% 30%, #ff5d6d, #ffe17a, #a8f5e2, #7be8ff, #c79bff, #ff85c1, #ff5d6d), linear-gradient(180deg, transparent 0%, #1e0c3a 80%)",
  "crystal-cave":
    "radial-gradient(80% 60% at 50% 10%, #a8f5e2 0%, transparent 55%), radial-gradient(80% 70% at 80% 50%, #7be8ff 0%, transparent 60%), linear-gradient(180deg, #0e2a4b 0%, #0b0b30 100%)",
  "candy-kingdom":
    "radial-gradient(80% 60% at 30% 10%, #ffe17a 0%, transparent 55%), radial-gradient(80% 70% at 90% 30%, #ff9d57 0%, transparent 50%), linear-gradient(180deg, #5b2e9b 0%, #1e0c3a 100%)",
};

export default function WorldBackdrop({ world }: { world: Level["world"] }) {
  const items = FALLERS[world];
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        background: BG[world],
        backgroundBlendMode: world === "rainbow-storm" ? "overlay" : "normal",
      }}
    >
      {/* falling decorations */}
      {Array.from({ length: 14 }).map((_, i) => {
        const left = (i * 37) % 100;
        const size = 18 + ((i * 11) % 22);
        const dur = 9 + ((i * 5) % 8);
        const delay = (i * 0.7) % 8;
        const emoji = items[i % items.length];
        return (
          <motion.span
            key={i}
            className="absolute"
            style={{
              left: `${left}%`,
              top: -40,
              fontSize: size,
              opacity: 0.55,
              filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.25))",
            }}
            initial={{ y: -40 }}
            animate={{ y: 1400, rotate: [0, 30, -30, 0] }}
            transition={{
              y: { duration: dur, delay, repeat: Infinity, ease: "linear" },
              rotate: { duration: dur, delay, repeat: Infinity, ease: "linear" },
            }}
          >
            {emoji}
          </motion.span>
        );
      })}
      {/* subtle vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 50%, transparent 0%, rgba(10,4,40,0.55) 85%)",
        }}
      />
    </div>
  );
}
