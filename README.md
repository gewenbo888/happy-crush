# Happy Crush · 开心消消乐

A polished bilingual (English + 中文) Match-3 puzzle game in the browser. Cinematic UI, cascading combos, power-ups, 50 levels across 5 worlds, and a global leaderboard.

> "Connect Joy, Eliminate Stress."
> 「连接快乐，消除压力。」

## What works

- **Real playable engine** — 8×8 board, drag-or-tap swap, match-detection (3/4/5/L/T), cascading gravity + refill, no-move auto-reshuffle.
- **Power-ups** — match 4 → row/col clear, match 5 → rainbow color bomb, L/T → 3×3 bomb. Swapping power-ups triggers combos.
- **Dopamine FX** — canvas particle bursts, shockwaves, screen shake, combo popups (Nice! → LEGENDARY!!), bilingual.
- **Progression** — XP, coins, daily-rewardable star ratings (1/2/3), per-level best score, level unlocks (per-world), saved in localStorage.
- **Adaptive difficulty** — a lightweight heuristic grants bonus moves after consecutive losses.
- **5 worlds** — Candy Meadow, Candy Rain, Rainbow Storm, Crystal Cave, Candy Kingdom — each with its own animated backdrop and falling decoration.
- **50 levels** — increasing move limits, score targets, and collection objectives.
- **Leaderboard** — diamond / gold / silver / bronze tiers with your global rank rolled in.
- **WebAudio SFX** — synth-generated click / swap / match / combo / power / win / lose. No audio files needed.
- **Bilingual everywhere** — instant EN ↔ 中文 toggle, every label translated.

## Links

- **Live:** [happy-crush.psyverse.fun](https://happy-crush.psyverse.fun)
- **GitHub:** [github.com/gewenbo888/happy-crush](https://github.com/gewenbo888/happy-crush)

## Stack

- Next.js 14 (App Router) · TypeScript · TailwindCSS
- Framer Motion (transitions, modal, combo popup)
- Zustand (progression + settings store, persisted to localStorage)
- Canvas 2D (particle / shockwave / confetti)
- WebAudio API (synth SFX)

## About

Part of the [Psyverse](https://psyverse.fun) portfolio by [Gewenbo](https://psyverse.fun).
