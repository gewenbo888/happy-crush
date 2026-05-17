"use client";

import { motion } from "framer-motion";
import { useGame } from "@/game/store";
import { sfx } from "@/game/audio";

const FLOATERS = [
  { emoji: "🍓", x: 8,  y: 18, size: 64, delay: 0,   dur: 8 },
  { emoji: "🍊", x: 86, y: 22, size: 56, delay: 1.4, dur: 9 },
  { emoji: "🫐", x: 14, y: 78, size: 50, delay: 0.6, dur: 7.4 },
  { emoji: "🍇", x: 90, y: 70, size: 60, delay: 2.2, dur: 8.6 },
  { emoji: "🍬", x: 30, y: 12, size: 44, delay: 1.8, dur: 6.8 },
  { emoji: "⭐", x: 72, y: 12, size: 48, delay: 0.9, dur: 7.2 },
  { emoji: "🍮", x: 78, y: 86, size: 52, delay: 2.6, dur: 8.2 },
  { emoji: "🐻", x: 22, y: 88, size: 56, delay: 1.2, dur: 9.4 },
  { emoji: "🌈", x: 50, y: 8,  size: 38, delay: 0.4, dur: 10 },
  { emoji: "🍭", x: 50, y: 92, size: 42, delay: 3.0, dur: 9.8 },
  { emoji: "🧁", x: 6,  y: 50, size: 46, delay: 0.2, dur: 7.6 },
  { emoji: "🍰", x: 94, y: 48, size: 48, delay: 1.0, dur: 8.0 },
] as const;

export default function Landing() {
  const { lang, setLang, setScreen } = useGame();
  const t = (en: string, zh: string) => (lang === "zh" ? zh : en);

  const play = () => {
    sfx.click();
    setScreen("select");
  };

  return (
    <section className="relative min-h-[100dvh] w-full overflow-hidden flex items-center justify-center px-5">
      {/* Lang toggle */}
      <div className="absolute top-5 right-5 z-30 flex gap-1 glass rounded-full px-1 py-1">
        <button
          onClick={() => { sfx.hover(); setLang("en"); }}
          className={`px-3 py-1 rounded-full text-sm font-display font-semibold ${
            lang === "en" ? "bg-white/25 text-white" : "text-white/55"
          }`}
        >EN</button>
        <button
          onClick={() => { sfx.hover(); setLang("zh"); }}
          className={`px-3 py-1 rounded-full text-sm font-han ${
            lang === "zh" ? "bg-white/25 text-white" : "text-white/55"
          }`}
        >中文</button>
      </div>

      {/* Animated floating candies */}
      {FLOATERS.map((f, i) => (
        <motion.div
          key={i}
          className="deco select-none"
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            fontSize: f.size,
          }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{
            opacity: 0.9,
            scale: 1,
            y: [0, -16, 0, 14, 0],
            x: [0, 10, 0, -10, 0],
            rotate: [0, 8, -8, 5, 0],
          }}
          transition={{
            opacity: { duration: 0.8, delay: f.delay * 0.1 },
            scale:   { duration: 0.8, delay: f.delay * 0.1 },
            y:       { duration: f.dur, delay: f.delay, repeat: Infinity, ease: "easeInOut" },
            x:       { duration: f.dur * 1.2, delay: f.delay, repeat: Infinity, ease: "easeInOut" },
            rotate:  { duration: f.dur, delay: f.delay, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          {f.emoji}
        </motion.div>
      ))}

      {/* Bubble particles (CSS-only div soup) */}
      <Bubbles />

      {/* Big rainbow glow blob */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[80vw] h-[80vw] max-w-[900px] max-h-[900px] rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,225,122,0.6) 0%, rgba(255,111,174,0.45) 25%, rgba(123,232,255,0.35) 55%, transparent 75%)",
          filter: "blur(28px)",
        }}
      />

      {/* Center */}
      <div className="relative z-10 text-center max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mb-3 inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-display tracking-wide"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-candy-yellow shadow-glow-yellow" />
          {t("Match-3 · Casual · Cinematic", "三消 · 休闲 · 电影感")}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.86, filter: "blur(8px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.0, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-bold leading-[0.95] tracking-tight"
        >
          <span className="block text-[16vw] md:text-[10vw] logo-rainbow">
            Happy&nbsp;Crush
          </span>
          <span className="block text-[12vw] md:text-[7.5vw] font-han text-white drop-shadow-[0_6px_18px_rgba(255,111,174,0.6)] mt-1">
            开心消消乐
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5 }}
          className="mt-4 text-white/85 text-lg md:text-2xl"
        >
          {t("Connect Joy, Eliminate Stress.", "连接快乐，消除压力。")}
          <span className="ml-2 text-white/55 text-base">
            {t("连接快乐，消除压力。", "Connect Joy, Eliminate Stress.")}
          </span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.8 }}
          className="mt-10 flex items-center justify-center gap-3 flex-wrap"
        >
          <button onClick={play} className="btn-primary ring-glow">
            <span className="text-xl">▶</span>
            {t("Play Now", "开始游戏")}
            <span className="font-han ml-1 text-base font-medium opacity-90">
              {t("/ 开始", "/ Play")}
            </span>
          </button>
          <button
            onClick={() => { sfx.click(); setScreen("leaderboard"); }}
            className="btn-secondary"
          >
            🏆 {t("Leaderboard", "排行榜")}
          </button>
        </motion.div>

        {/* Tile preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.2 }}
          className="mt-12 flex flex-wrap justify-center gap-3 max-w-md mx-auto"
        >
          {["🍓","🍊","🫐","🍇","🍬","⭐","🍮","🐻"].map((e, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -6, 0], rotate: [0, 6, -4, 0] }}
              transition={{
                duration: 2.4,
                delay: i * 0.12,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="text-3xl md:text-4xl w-12 h-12 md:w-14 md:h-14 rounded-2xl glass-strong grid place-items-center"
            >
              {e}
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.5 }}
          className="mt-10 text-white/45 text-xs md:text-sm font-mono"
        >
          50 levels · 5 worlds · cascading combos · power-ups · leaderboard
          <span className="block font-han text-white/40 mt-1">
            50 关 · 5 世界 · 连击瀑布 · 道具系统 · 全球排行
          </span>
        </motion.p>
      </div>

      {/* psyverse footer pin */}
      <div className="absolute bottom-3 left-0 right-0 text-center text-white/40 text-[11px] font-mono tracking-widest">
        PSYVERSE · happy-crush.psyverse.fun
      </div>
    </section>
  );
}

function Bubbles() {
  const bubbles = Array.from({ length: 18 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {bubbles.map((i) => {
        const left = (i * 37) % 100;
        const size = 18 + ((i * 53) % 36);
        const dur = 8 + ((i * 7) % 8);
        const delay = (i * 0.6) % 6;
        return (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${left}%`,
              bottom: `-${size + 20}px`,
              width: size,
              height: size,
              background:
                "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.1) 70%)",
              boxShadow: "0 0 18px rgba(255,255,255,0.25)",
            }}
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: -1400, opacity: [0, 1, 1, 0] }}
            transition={{
              duration: dur,
              delay,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        );
      })}
    </div>
  );
}
