"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Board from "./Board";
import ComboPopup from "./ComboPopup";
import Particles, { ParticlesHandle } from "./Particles";
import WorldBackdrop from "./WorldBackdrop";
import { adaptiveMoveBonus, useGame } from "@/game/store";
import { getLevel, Level } from "@/game/levels";
import { makeBoard, TileType, SIZE } from "@/game/engine";
import { sfx, setMuted } from "@/game/audio";

export default function GameScreen() {
  const {
    lang,
    currentLevel,
    setScreen,
    setCurrentLevel,
    setRecord,
    addXp,
    addCoins,
    muted,
    toggleMuted,
    recordOutcome,
  } = useGame();

  const level: Level = useMemo(() => getLevel(currentLevel), [currentLevel]);
  const t = (en: string, zh: string) => (lang === "zh" ? zh : en);

  const bonusMoves = adaptiveMoveBonus(useGame.getState());
  const baseMoves = level.moves + bonusMoves;

  const [board, setBoard] = useState(() => makeBoard());
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(baseMoves);
  const [combo, setCombo] = useState<number | null>(null);
  const [shake, setShake] = useState(false);
  const [outcome, setOutcome] = useState<null | "win" | "lose">(null);
  const [collected, setCollected] = useState<Record<string, number>>({});

  // refs that mirror the latest state — onEvent fires from inside an async
  // cascade, so we cannot rely on closure-captured state values.
  const scoreRef = useRef(0);
  const movesRef = useRef(baseMoves);
  const collectedRef = useRef<Record<string, number>>({});
  const outcomeRef = useRef<null | "win" | "lose">(null);

  const particlesRef = useRef<ParticlesHandle>(null);
  const boardWrap = useRef<HTMLDivElement>(null);

  // sync audio muted on mount + when toggled
  useEffect(() => {
    setMuted(muted);
  }, [muted]);

  // reset on level change
  useEffect(() => {
    setBoard(makeBoard());
    setScore(0);
    setMovesLeft(baseMoves);
    setCombo(null);
    setOutcome(null);
    setCollected({});
    scoreRef.current = 0;
    movesRef.current = baseMoves;
    collectedRef.current = {};
    outcomeRef.current = null;
  }, [currentLevel]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Compute world theme & background variant */
  const objectives = level.objectives;
  const scoreObjective = objectives.find((o) => o.kind === "score");
  const collectObjectives = objectives.filter((o) => o.kind === "collect");

  /** Check if level is complete after each move/cascade. */
  function checkOutcome(scoreNow: number, collectedNow: Record<string, number>, movesNow: number) {
    const scoreOk = scoreObjective ? scoreNow >= scoreObjective.target : true;
    const collectOk = collectObjectives.every(
      (o) => (collectedNow[o.collectType!] ?? 0) >= o.target
    );
    if (scoreOk && collectOk) {
      finishLevel(true, scoreNow);
      return;
    }
    if (movesNow <= 0) {
      finishLevel(false, scoreNow);
    }
  }

  function finishLevel(win: boolean, finalScore: number) {
    if (outcomeRef.current) return;
    outcomeRef.current = win ? "win" : "lose";
    setOutcome(win ? "win" : "lose");
    recordOutcome(win);
    if (win) {
      const [s1, s2, s3] = level.starThresholds;
      const stars: 0 | 1 | 2 | 3 =
        finalScore >= s3 ? 3 : finalScore >= s2 ? 2 : finalScore >= s1 ? 1 : 0;
      setRecord(level.id, { bestScore: finalScore, stars: Math.max(stars, 1) as 1 | 2 | 3 });
      addXp(50 + stars * 30);
      addCoins(20 + stars * 15);
      sfx.win();
      particlesRef.current?.confetti();
    } else {
      sfx.lose();
    }
  }

  /** Board emits a clear event per cascade. We accumulate score, fire FX. */
  function onEvent(e: any) {
    if (e.kind === "clear") {
      const cleared: { r: number; c: number }[] = e.coords;
      const newScore = scoreRef.current + e.pointsGained;
      scoreRef.current = newScore;
      setScore(newScore);
      setCombo(e.comboLevel);

      // Collect tracking
      const update = { ...collectedRef.current };
      for (const ty of e.types as TileType[]) {
        update[ty] = (update[ty] ?? 0) + 1;
      }
      collectedRef.current = update;
      setCollected(update);

      // Spawn particles at every cleared cell (centered)
      const wrap = boardWrap.current;
      if (wrap) {
        const rect = wrap.getBoundingClientRect();
        const cell = rect.width / SIZE;
        for (const { r, c } of cleared) {
          const x = rect.left + c * cell + cell / 2;
          const y = rect.top  + r * cell + cell / 2;
          particlesRef.current?.burst(x, y, {
            count: 8 + Math.min(e.comboLevel * 2, 14),
            color:
              ["rgba(255,93,109,0.9)","rgba(255,157,87,0.9)","rgba(123,232,255,0.9)",
               "rgba(199,155,255,0.9)","rgba(255,225,122,0.9)","rgba(255,133,193,0.9)",
               "rgba(168,245,226,0.9)","rgba(255,185,138,0.9)"][(r + c) % 8],
            force: 4 + Math.min(e.comboLevel, 4),
          });
        }
        if (e.comboLevel >= 2) {
          particlesRef.current?.shockwave(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2
          );
          setShake(true);
          setTimeout(() => setShake(false), 450);
          sfx.combo(e.comboLevel);
        }
      }

      // sometimes pop a tile-shaped confetti for fun
      if (e.comboLevel >= 3) {
        const wrap2 = boardWrap.current;
        if (wrap2) {
          const rect = wrap2.getBoundingClientRect();
          particlesRef.current?.burst(
            rect.left + rect.width / 2,
            rect.top + rect.height * 0.3,
            { count: 14, emoji: "✨", force: 6 }
          );
        }
      }
    } else if (e.kind === "settled") {
      setTimeout(() => setCombo(null), 700);
      const m = movesRef.current - 1;
      movesRef.current = m;
      setMovesLeft(m);
      checkOutcome(scoreRef.current, collectedRef.current, m);
    }
  }

  function onIllegal() {
    setShake(true);
    setTimeout(() => setShake(false), 450);
  }

  const scoreProgress = scoreObjective
    ? Math.min(100, (score / scoreObjective.target) * 100)
    : 100;

  return (
    <section className="relative min-h-[100dvh] w-full px-3 md:px-8 py-4 md:py-8">
      <WorldBackdrop world={level.world} />

      {/* Header */}
      <header className="relative z-10 max-w-3xl mx-auto flex items-center justify-between gap-2">
        <button
          onClick={() => { sfx.click(); setScreen("select"); }}
          className="btn-secondary !py-2"
        >
          ← {t("Back", "返回")}
        </button>
        <div className="text-center leading-tight">
          <div className="font-mono text-[10px] tracking-[0.3em] text-white/55">
            {t("LEVEL", "关卡")} · {String(level.id).padStart(2, "0")}
          </div>
          <div className="font-display text-xl md:text-2xl text-white">
            {lang === "zh" ? level.name.zh : level.name.en}
          </div>
        </div>
        <button
          onClick={() => { sfx.click(); toggleMuted(); }}
          className="btn-secondary !py-2"
          title="audio"
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </header>

      {/* HUD */}
      <div className="relative z-10 max-w-3xl mx-auto mt-5 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <HudStat
          label={t("Score", "得分")}
          value={score.toLocaleString()}
          accent="from-candy-pink to-candy-rose"
          extra={
            scoreObjective ? (
              <div className="mt-1 h-1.5 rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-candy-yellow to-candy-orange transition-all"
                  style={{ width: `${scoreProgress}%` }}
                />
              </div>
            ) : null
          }
        />
        <HudStat
          label={t("Target", "目标")}
          value={scoreObjective?.target.toLocaleString() ?? "—"}
          accent="from-candy-yellow to-candy-orange"
        />
        <HudStat
          label={t("Moves", "步数")}
          value={String(movesLeft)}
          accent="from-candy-cyan to-candy-blue"
          warn={movesLeft <= 3}
        />
        <HudStat
          label={t("Combo", "连击")}
          value={combo ? `×${combo}` : "—"}
          accent="from-candy-violet to-candy-pink"
        />
      </div>

      {/* Collect chips */}
      {collectObjectives.length > 0 && (
        <div className="relative z-10 max-w-3xl mx-auto mt-3 flex items-center gap-2 justify-center flex-wrap">
          {collectObjectives.map((o) => {
            const have = collected[o.collectType!] ?? 0;
            const done = have >= o.target;
            return (
              <div
                key={o.collectType!}
                className={`hud-chip ${done ? "bg-candy-yellow/20 border-candy-yellow/60" : ""}`}
              >
                <span className="text-lg">
                  {
                    {
                      strawberry: "🍓",
                      orange: "🍊",
                      blueberry: "🫐",
                      grapes: "🍇",
                      candy: "🍬",
                      star: "⭐",
                      jelly: "🍮",
                      bear: "🐻",
                    }[o.collectType!]
                  }
                </span>
                <span className="font-mono tabular-nums text-sm">
                  {Math.min(have, o.target)}/{o.target}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Board + FX */}
      <div className="relative z-10 mt-6 md:mt-8 max-w-[min(92vw,560px)] mx-auto">
        <div
          ref={boardWrap}
          className={`relative ${shake ? "shake" : ""}`}
        >
          <Board
            initial={board}
            onEvent={onEvent}
            onIllegal={onIllegal}
            onBoardChange={() => {}}
            locked={!!outcome}
          />
          <Particles ref={particlesRef} />
          <ComboPopup combo={combo} lang={lang} />
        </div>
      </div>

      {/* Action row */}
      <div className="relative z-10 max-w-3xl mx-auto mt-6 flex justify-center gap-3">
        <button
          onClick={() => {
            sfx.click();
            setBoard(makeBoard());
            setScore(0);
            setMovesLeft(baseMoves);
            setCombo(null);
            setOutcome(null);
            setCollected({});
            scoreRef.current = 0;
            movesRef.current = baseMoves;
            collectedRef.current = {};
            outcomeRef.current = null;
          }}
          className="btn-secondary"
        >
          ↻ {t("Restart", "重玩")}
        </button>
        {bonusMoves > 0 && (
          <div className="hud-chip text-candy-yellow">
            🎁 +{bonusMoves} {t("bonus moves", "补偿步数")}
          </div>
        )}
      </div>

      {/* Tutorial / legend strip */}
      <div className="relative z-10 max-w-3xl mx-auto mt-6 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
        <Hint emoji="🧩" en="Match 3+ of the same kind." zh="三个或更多相同糖果即可消除。" />
        <Hint emoji="↔️" en="Match 4 in a line → row/col clear." zh="连消 4 个 → 整行/整列清除。" />
        <Hint emoji="🌈" en="Match 5 → rainbow color bomb." zh="连消 5 个 → 彩虹色弹。" />
      </div>

      <AnimatePresence>
        {outcome && (
          <ResultModal
            win={outcome === "win"}
            score={score}
            stars={
              outcome === "win"
                ? (score >= level.starThresholds[2]
                    ? 3
                    : score >= level.starThresholds[1]
                    ? 2
                    : 1) as 1 | 2 | 3
                : 0
            }
            level={level}
            lang={lang}
            onNext={() => {
              sfx.click();
              setCurrentLevel(Math.min(50, level.id + 1));
            }}
            onRetry={() => {
              sfx.click();
              setBoard(makeBoard());
              setScore(0);
              setMovesLeft(baseMoves);
              setCombo(null);
              setOutcome(null);
              setCollected({});
            }}
            onQuit={() => {
              sfx.click();
              setScreen("select");
            }}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function HudStat({
  label,
  value,
  accent,
  extra,
  warn,
}: {
  label: string;
  value: string;
  accent: string;
  extra?: React.ReactNode;
  warn?: boolean;
}) {
  return (
    <div className={`glass rounded-2xl px-4 py-3 ${warn ? "animate-pulse" : ""}`}>
      <div className={`text-[10px] font-mono tracking-[0.25em] uppercase bg-clip-text text-transparent bg-gradient-to-r ${accent}`}>
        {label}
      </div>
      <div className="font-display text-xl md:text-2xl text-white mt-0.5 tabular-nums">
        {value}
      </div>
      {extra}
    </div>
  );
}

function Hint({ emoji, en, zh }: { emoji: string; en: string; zh: string }) {
  return (
    <div className="glass rounded-xl px-3 py-2 flex items-center gap-2">
      <span className="text-lg">{emoji}</span>
      <div className="leading-tight">
        <div className="text-white/85">{en}</div>
        <div className="font-han text-white/55 text-[11px]">{zh}</div>
      </div>
    </div>
  );
}

function ResultModal({
  win, score, stars, level, lang, onNext, onRetry, onQuit,
}: {
  win: boolean;
  score: number;
  stars: 0 | 1 | 2 | 3;
  level: Level;
  lang: "en" | "zh";
  onNext: () => void;
  onRetry: () => void;
  onQuit: () => void;
}) {
  const t = (en: string, zh: string) => (lang === "zh" ? zh : en);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center px-4 bg-black/55 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.7, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 8, opacity: 0 }}
        transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
        className="glass-strong rounded-3xl px-6 py-8 md:px-10 md:py-12 max-w-md w-full text-center relative overflow-hidden"
      >
        <div className="text-6xl md:text-7xl mb-3">
          {win ? (stars >= 3 ? "🏆" : stars >= 2 ? "🌟" : "🎉") : "💔"}
        </div>
        <h3 className={`font-display text-3xl md:text-4xl ${win ? "logo-rainbow" : "text-white/80"}`}>
          {win ? t("Victory!", "胜利！") : t("Out of Moves", "步数耗尽")}
        </h3>
        <p className="font-han text-white/70 mt-1 text-lg">
          {win ? t("胜利！", "Victory!") : t("Out of Moves", "步数耗尽")}
        </p>

        <div className="mt-6 flex items-center justify-center gap-2 text-4xl md:text-5xl">
          {[0, 1, 2].map((j) => (
            <motion.span
              key={j}
              initial={{ scale: 0.4, opacity: 0, rotate: -30 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.15 + j * 0.15, type: "spring", stiffness: 280 }}
              className={j < stars ? "star-on" : "star-off"}
            >
              ★
            </motion.span>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="glass rounded-2xl px-3 py-2">
            <div className="text-[10px] font-mono tracking-widest text-white/55">SCORE</div>
            <div className="font-display text-xl text-white tabular-nums">{score.toLocaleString()}</div>
          </div>
          <div className="glass rounded-2xl px-3 py-2">
            <div className="text-[10px] font-mono tracking-widest text-white/55">+XP</div>
            <div className="font-display text-xl text-white">{win ? 50 + stars * 30 : 5}</div>
          </div>
          <div className="glass rounded-2xl px-3 py-2">
            <div className="text-[10px] font-mono tracking-widest text-white/55">+🪙</div>
            <div className="font-display text-xl text-white">{win ? 20 + stars * 15 : 0}</div>
          </div>
        </div>

        <div className="mt-7 flex flex-col items-center gap-3">
          {win ? (
            <button onClick={onNext} className="btn-primary ring-glow">
              {t("Next Level", "下一关")} →
            </button>
          ) : (
            <button onClick={onRetry} className="btn-primary ring-glow">
              ↻ {t("Retry", "重玩")}
            </button>
          )}
          <button onClick={onQuit} className="btn-secondary">
            {t("Level Select", "关卡选择")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
