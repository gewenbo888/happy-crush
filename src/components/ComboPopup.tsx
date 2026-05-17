"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Lang } from "@/game/i18n";

const TIER = [
  { at: 1, en: "Nice!",          zh: "不错！",       cls: "text-candy-cyan",  size: "text-3xl md:text-4xl" },
  { at: 2, en: "Great!",         zh: "厉害！",       cls: "text-candy-yellow", size: "text-4xl md:text-5xl" },
  { at: 3, en: "Amazing!",       zh: "太棒了！",     cls: "text-candy-pink",  size: "text-5xl md:text-6xl" },
  { at: 4, en: "Unbelievable!",  zh: "难以置信！",   cls: "text-candy-violet", size: "text-5xl md:text-6xl" },
  { at: 5, en: "LEGENDARY!!",    zh: "无敌连击！！", cls: "text-rainbow",     size: "text-6xl md:text-7xl" },
];

export default function ComboPopup({
  combo,
  lang,
}: {
  combo: number | null;
  lang: Lang;
}) {
  const tier = TIER.slice().reverse().find((t) => combo != null && combo >= t.at);
  return (
    <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center">
      <AnimatePresence mode="popLayout">
        {combo != null && tier && (
          <motion.div
            key={`${combo}-${tier.at}`}
            initial={{ opacity: 0, scale: 0.4, y: 0 }}
            animate={{ opacity: 1, scale: 1.05, y: -10 }}
            exit={{ opacity: 0, scale: 1.2, y: -40 }}
            transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
            className={`combo-badge ${tier.size} font-display font-bold ${tier.cls}`}
          >
            <span className="mr-2 text-white/85">×{combo}</span>
            {lang === "zh" ? tier.zh : tier.en}
            <span className="ml-2 text-base md:text-xl font-han text-white/65 align-middle">
              {lang === "zh" ? tier.en : tier.zh}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
