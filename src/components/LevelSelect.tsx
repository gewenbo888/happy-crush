"use client";

import { motion } from "framer-motion";
import { LEVELS } from "@/game/levels";
import { useGame } from "@/game/store";
import { sfx } from "@/game/audio";

const WORLD_THEME: Record<string, { en: string; zh: string; color: string; emoji: string }> = {
  "candy-meadow":  { en: "Candy Meadow",   zh: "糖果草原", color: "from-candy-pink to-candy-rose",     emoji: "🌷" },
  "candy-rain":    { en: "Candy Rain",     zh: "糖果雨",   color: "from-candy-cyan to-candy-blue",     emoji: "🌧️" },
  "rainbow-storm": { en: "Rainbow Storm",  zh: "彩虹风暴", color: "from-candy-yellow to-candy-violet", emoji: "🌈" },
  "crystal-cave":  { en: "Crystal Cave",   zh: "水晶洞",   color: "from-candy-mint to-candy-cyan",     emoji: "💎" },
  "candy-kingdom": { en: "Candy Kingdom",  zh: "糖果王国", color: "from-candy-orange to-candy-pink",   emoji: "👑" },
};

export default function LevelSelect() {
  const { lang, records, setCurrentLevel, setScreen, xp, coins } = useGame();
  const t = (en: string, zh: string) => (lang === "zh" ? zh : en);

  const grouped: Record<string, typeof LEVELS> = {};
  for (const L of LEVELS) {
    grouped[L.world] = grouped[L.world] ?? [];
    grouped[L.world].push(L);
  }

  return (
    <section className="relative min-h-[100dvh] w-full px-4 md:px-10 py-10 md:py-14">
      <header className="max-w-5xl mx-auto flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={() => { sfx.click(); setScreen("landing"); }}
          className="btn-secondary !py-2"
        >
          ← {t("Back", "返回")}
        </button>
        <h1 className="font-display text-3xl md:text-4xl text-white drop-shadow flex items-center gap-3">
          🍭 {t("Select Level", "选择关卡")}
          <span className="font-han text-2xl md:text-3xl text-white/70">
            {t("/ 选择关卡", "/ Select Level")}
          </span>
        </h1>
        <div className="flex gap-2">
          <span className="hud-chip"><span className="text-candy-yellow">💎</span> {xp} XP</span>
          <span className="hud-chip"><span className="text-candy-yellow">🪙</span> {coins}</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto mt-10 space-y-12">
        {Object.entries(grouped).map(([world, levels]) => {
          const theme = WORLD_THEME[world];
          return (
            <div key={world}>
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-3xl">{theme.emoji}</span>
                <h2 className={`font-display text-2xl md:text-3xl bg-clip-text text-transparent bg-gradient-to-r ${theme.color}`}>
                  {lang === "zh" ? theme.zh : theme.en}
                </h2>
                <span className="font-han text-white/55">
                  {lang === "zh" ? `/ ${theme.en}` : `/ ${theme.zh}`}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
                {levels.map((L, i) => {
                  const rec = records[L.id];
                  const stars = rec?.stars ?? 0;
                  const locked = i === 0 ? false : !records[L.id - 1]?.stars && L.id > 1;
                  return (
                    <motion.button
                      key={L.id}
                      whileHover={!locked ? { y: -3, scale: 1.03 } : {}}
                      whileTap={!locked ? { scale: 0.97 } : {}}
                      onClick={() => {
                        if (locked) return;
                        sfx.click();
                        setCurrentLevel(L.id);
                        setScreen("game");
                      }}
                      disabled={locked}
                      className={`relative aspect-[5/4] rounded-2xl p-3 text-left transition ${
                        locked
                          ? "glass opacity-50 cursor-not-allowed"
                          : "glass-strong cursor-pointer"
                      } overflow-hidden`}
                    >
                      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${theme.color}`} />
                      <div className="font-mono text-[10px] tracking-widest text-white/55">
                        LV {String(L.id).padStart(2, "0")}
                      </div>
                      <div className="mt-1 font-display text-lg leading-snug text-white">
                        {lang === "zh" ? L.name.zh : L.name.en}
                      </div>
                      <div className="font-han text-xs text-white/55 leading-tight">
                        {lang === "zh" ? L.name.en : L.name.zh}
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                        <div className="text-base">
                          {[0, 1, 2].map((j) => (
                            <span key={j} className={j < stars ? "star-on" : "star-off"}>
                              ★
                            </span>
                          ))}
                        </div>
                        {rec?.bestScore ? (
                          <div className="font-mono text-[10px] text-white/70">
                            {rec.bestScore}
                          </div>
                        ) : null}
                      </div>
                      {locked && (
                        <div className="absolute inset-0 grid place-items-center text-2xl">
                          🔒
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </main>
    </section>
  );
}
