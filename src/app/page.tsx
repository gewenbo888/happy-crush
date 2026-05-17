"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Landing from "@/components/Landing";
import LevelSelect from "@/components/LevelSelect";
import GameScreen from "@/components/GameScreen";
import Leaderboard from "@/components/Leaderboard";
import { useGame } from "@/game/store";
import { setMuted } from "@/game/audio";

export default function Page() {
  const { screen, muted } = useGame();

  // sync audio mute on first mount
  useEffect(() => {
    setMuted(muted);
  }, [muted]);

  return (
    <main className="relative min-h-[100dvh] w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          {screen === "landing" && <Landing />}
          {screen === "select" && <LevelSelect />}
          {screen === "game" && <GameScreen />}
          {screen === "leaderboard" && <Leaderboard />}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
