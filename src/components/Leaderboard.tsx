"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useGame } from "@/game/store";
import { buildLeaderboard } from "@/game/leaderboard";
import { sfx } from "@/game/audio";

const TIER: Record<string, { ring: string; medal: string; label: string }> = {
  diamond: { ring: "from-cyan-300 to-violet-300",   medal: "🥇", label: "DIAMOND" },
  gold:    { ring: "from-yellow-300 to-orange-300", medal: "🥇", label: "GOLD" },
  silver:  { ring: "from-slate-200 to-slate-400",   medal: "🥈", label: "SILVER" },
  bronze:  { ring: "from-orange-300 to-amber-700",  medal: "🥉", label: "BRONZE" },
};

export default function Leaderboard() {
  const { lang, setScreen, records } = useGame();
  const t = (en: string, zh: string) => (lang === "zh" ? zh : en);
  const yourTotal = useMemo(
    () => Object.values(records).reduce((sum, r) => sum + (r.bestScore || 0), 0),
    [records]
  );
  const lb = useMemo(() => buildLeaderboard(yourTotal), [yourTotal]);
  const yourRow = lb.find((e) => e.name === "You · 你");

  return (
    <section className="relative min-h-[100dvh] w-full px-4 md:px-8 py-8 md:py-12">
      <header className="max-w-4xl mx-auto flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={() => { sfx.click(); setScreen("landing"); }}
          className="btn-secondary !py-2"
        >
          ← {t("Back", "返回")}
        </button>
        <h1 className="font-display text-3xl md:text-4xl text-white drop-shadow flex items-center gap-3">
          🏆 {t("Leaderboard", "排行榜")}
          <span className="font-han text-2xl md:text-3xl text-white/70">
            {t("/ 排行榜", "/ Leaderboard")}
          </span>
        </h1>
        <div />
      </header>

      {/* Podium */}
      <div className="max-w-4xl mx-auto mt-10 grid grid-cols-3 gap-3 md:gap-6 items-end">
        {[lb[1], lb[0], lb[2]].map((e, i) => {
          if (!e) return null;
          const podiumH = [
            "h-32 md:h-40",
            "h-40 md:h-56",
            "h-28 md:h-36",
          ][i];
          const order = [2, 1, 3][i];
          return (
            <motion.div
              key={e.rank}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 * i }}
              className="flex flex-col items-center"
            >
              <div className="relative mb-2">
                <div className={`absolute -inset-1 rounded-full bg-gradient-to-br ${TIER[e.tier].ring} blur-md opacity-80`} />
                <div className="relative w-14 h-14 md:w-20 md:h-20 rounded-full glass-strong grid place-items-center text-2xl md:text-4xl">
                  {e.emoji}
                </div>
                <div className="absolute -bottom-2 -right-2 text-xl md:text-2xl">
                  {TIER[e.tier].medal}
                </div>
              </div>
              <div className="font-display text-white text-sm md:text-base text-center leading-tight">
                {e.name}
              </div>
              <div className="font-mono text-[10px] text-white/65 tracking-widest">
                {e.country}
              </div>
              <div className={`w-full mt-3 ${podiumH} rounded-t-xl bg-gradient-to-b ${TIER[e.tier].ring} grid place-items-start justify-center pt-3 text-white font-display`}>
                #{order}
                <div className="text-xs font-mono text-white/85 mt-1">
                  {e.score.toLocaleString()}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Full list */}
      <div className="max-w-4xl mx-auto mt-8 glass-strong rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[42px_1fr_92px_72px_42px] md:grid-cols-[60px_2fr_120px_100px_60px] gap-2 px-4 py-3 border-b border-white/10 text-xs font-mono tracking-widest text-white/55">
          <div>#</div>
          <div>{t("Player", "玩家")}</div>
          <div className="text-right">{t("Score", "得分")}</div>
          <div className="text-right">{t("Combo", "连击")}</div>
          <div className="text-right">{t("Country", "国")}</div>
        </div>
        {lb.slice(0, 18).map((e) => {
          const isYou = e.name === "You · 你";
          return (
            <motion.div
              key={e.rank}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`grid grid-cols-[42px_1fr_92px_72px_42px] md:grid-cols-[60px_2fr_120px_100px_60px] gap-2 px-4 py-3 items-center text-sm border-b border-white/5 ${
                isYou ? "bg-candy-yellow/15" : ""
              }`}
            >
              <div className={`font-mono ${e.rank <= 3 ? "text-candy-yellow font-bold" : "text-white/70"}`}>
                {e.rank}
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-full glass grid place-items-center text-base shrink-0">
                  {e.emoji}
                </div>
                <div className="min-w-0">
                  <div className="font-display text-white truncate">{e.name}</div>
                  <div className="font-mono text-[10px] text-white/55 uppercase tracking-widest">
                    {TIER[e.tier].label}
                  </div>
                </div>
              </div>
              <div className="text-right font-mono text-white/90 tabular-nums">
                {e.score.toLocaleString()}
              </div>
              <div className="text-right font-mono text-candy-cyan">
                ×{e.combo}
              </div>
              <div className="text-right text-base">{e.country}</div>
            </motion.div>
          );
        })}
      </div>

      {yourRow && (
        <div className="max-w-4xl mx-auto mt-3 text-center text-white/70 text-sm">
          {t(
            `Your global rank: #${yourRow.rank}. Keep crushing!`,
            `你的全球排名：第 ${yourRow.rank} 位。继续连消！`
          )}
        </div>
      )}
    </section>
  );
}
