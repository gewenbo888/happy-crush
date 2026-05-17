"use client";

import { useEffect, useRef, useState } from "react";
import {
  Board as BoardT,
  Coord,
  SIZE,
  Tile,
  resolveSwap,
  areAdjacent,
  cloneBoard,
  hasAnyMove,
  reshuffle,
} from "@/game/engine";
import { TILE_BG, TILE_EMOJI, SPECIAL_OVERLAY } from "@/game/tiles";
import { sfx } from "@/game/audio";

type BoardEvent =
  | { kind: "clear"; coords: Coord[]; comboLevel: number; pointsGained: number; types: string[] }
  | { kind: "settled" };

export interface BoardProps {
  initial: BoardT;
  /** Called when the user's swap was rejected (illegal). */
  onIllegal?: () => void;
  /** Notification stream of cascades — UI uses this to update score / combo / particles. */
  onEvent?: (e: BoardEvent) => void;
  /** Disable input (e.g. after a level ends). */
  locked?: boolean;
  /** Notifies the parent of board updates so it can keep its own ref. */
  onBoardChange?: (b: BoardT) => void;
}

const ANIM = {
  swap: 0.18,
  pop: 0.28,
  fall: 0.32,
  pause: 0.05,
};

export default function Board(props: BoardProps) {
  const { initial, onIllegal, onEvent, locked, onBoardChange } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const [board, setBoard] = useState<BoardT>(initial);
  const [selected, setSelected] = useState<Coord | null>(null);
  const [busy, setBusy] = useState(false);
  /** Per-tile transient FX: tile id → "popping" | "falling" */
  const [fx, setFx] = useState<Record<number, "pop" | "spawn">>({});
  /** Pointer state for drag-to-swap */
  const drag = useRef<{ start: Coord; pointerId: number } | null>(null);
  /** After a successful drag-swap, suppress the synthesized click event. */
  const suppressNextClick = useRef(false);

  // sync on reset (e.g. level switch)
  useEffect(() => {
    setBoard(initial);
    onBoardChange?.(initial);
    setSelected(null);
    setBusy(false);
    setFx({});
  }, [initial]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Grid coords helpers ─── */
  const cellSize = () => {
    const el = containerRef.current;
    if (!el) return 64;
    return el.clientWidth / SIZE;
  };

  function coordFromPoint(clientX: number, clientY: number): Coord | null {
    const el = containerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null;
    const c = Math.floor((x / rect.width) * SIZE);
    const r = Math.floor((y / rect.height) * SIZE);
    if (r < 0 || c < 0 || r >= SIZE || c >= SIZE) return null;
    return { r, c };
  }

  /* ─── Attempt swap ─── */
  async function attemptSwap(a: Coord, b: Coord) {
    if (busy || locked) return;
    if (!areAdjacent(a, b)) return;
    setBusy(true);
    sfx.swap();

    const result = resolveSwap(board, a, b);
    if (!result) {
      sfx.illegal();
      onIllegal?.();
      // visual jiggle: swap state forward then back
      // Easiest: temporarily swap, then revert
      const swapped = cloneBoard(board);
      const tmp = swapped[a.r][a.c];
      swapped[a.r][a.c] = swapped[b.r][b.c];
      swapped[b.r][b.c] = tmp;
      setBoard(swapped);
      await sleep(ANIM.swap * 1000);
      setBoard(board);
      await sleep(ANIM.swap * 1000);
      setBusy(false);
      return;
    }

    // animate each step in order
    let live = cloneBoard(board);
    // first: show the swap on screen by stepping the swap step
    for (const step of result.steps) {
      if (step.kind === "swap") {
        const swapped = cloneBoard(live);
        const tmp = swapped[step.a.r][step.a.c];
        swapped[step.a.r][step.a.c] = swapped[step.b.r][step.b.c];
        swapped[step.b.r][step.b.c] = tmp;
        live = swapped;
        setBoard(live);
        await sleep(ANIM.swap * 1000);
      } else if (step.kind === "clear") {
        sfx.match(step.comboLevel);
        // mark popping fx
        const popping: Record<number, "pop"> = {};
        const types: string[] = [];
        for (const k of step.cleared) {
          const t = live[k.r][k.c];
          if (t) {
            popping[t.id] = "pop";
            types.push(t.type);
          }
        }
        setFx((prev) => ({ ...prev, ...popping }));
        onEvent?.({
          kind: "clear",
          coords: step.cleared,
          comboLevel: step.comboLevel,
          pointsGained: step.pointsGained,
          types,
        });
        await sleep(ANIM.pop * 1000);

        // After pop animation: remove cleared and add promotions
        const next = cloneBoard(live);
        for (const k of step.cleared) next[k.r][k.c] = null;
        for (const p of step.promotions) {
          next[p.at.r][p.at.c] = {
            id: Math.floor(Math.random() * 1e9),
            type: p.type,
            special: p.special,
          };
          // mark promotion as spawn-fx
          // (will animate in below via React key change)
        }
        live = next;
        setBoard(live);
        if (step.promotions.length) sfx.power();
        await sleep(ANIM.pause * 1000);
      } else if (step.kind === "fall") {
        // For animation we just commit the new board state. The motion.div
        // y-transform from layout=true OR via key+initial handles the fall.
        // Build the new live snapshot from the engine's projected state:
        // Re-derive by walking the original step structure isn't trivial here,
        // so we instead simulate gravity+refill again from `live`.
        const newSpawns: Record<number, "spawn"> = {};
        const after = simulateGravityAndRefillFromVisible(live);
        // Mark each tile that wasn't present before as a spawn
        const prevIds = new Set<number>();
        for (const row of live) for (const t of row) if (t) prevIds.add(t.id);
        for (const row of after) for (const t of row) {
          if (t && !prevIds.has(t.id)) newSpawns[t.id] = "spawn";
        }
        setFx((prev) => ({ ...prev, ...newSpawns }));
        live = after;
        setBoard(live);
        await sleep(ANIM.fall * 1000);
      }
    }

    // settle
    onEvent?.({ kind: "settled" });
    // clear FX
    setFx({});
    // sync with engine's *real* final board (specials may have advanced ids etc)
    setBoard(result.finalBoard);
    onBoardChange?.(result.finalBoard);

    // safety: if no moves exist, reshuffle silently
    if (!hasAnyMove(result.finalBoard)) {
      await sleep(280);
      const re = reshuffle(result.finalBoard);
      setBoard(re);
      onBoardChange?.(re);
    }

    setBusy(false);
  }

  /* ─── Click / tap to select ─── */
  function onCellClick(c: Coord) {
    if (busy || locked) return;
    if (suppressNextClick.current) {
      suppressNextClick.current = false;
      return;
    }
    if (!selected) {
      sfx.hover();
      setSelected(c);
      return;
    }
    if (selected.r === c.r && selected.c === c.c) {
      setSelected(null);
      return;
    }
    if (areAdjacent(selected, c)) {
      const a = selected;
      setSelected(null);
      attemptSwap(a, c);
    } else {
      sfx.hover();
      setSelected(c);
    }
  }

  /* ─── Drag-to-swap (does NOT touch `selected`; click handles that) ─── */
  function onPointerDown(e: React.PointerEvent) {
    if (busy || locked) return;
    const c = coordFromPoint(e.clientX, e.clientY);
    if (!c) return;
    drag.current = { start: c, pointerId: e.pointerId };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const c = coordFromPoint(e.clientX, e.clientY);
    if (!c) return;
    if (c.r === d.start.r && c.c === d.start.c) return;
    if (!areAdjacent(d.start, c)) return;
    drag.current = null; // consume so the subsequent click is suppressed
    suppressNextClick.current = true;
    setSelected(null);
    attemptSwap(d.start, c);
  }
  function onPointerUp() {
    drag.current = null;
  }

  /* ─── Render ─── */
  return (
    <div
      ref={containerRef}
      className="board relative aspect-square w-full max-w-[min(92vw,560px)] mx-auto select-none touch-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {board.flat().map((tile, idx) => {
        if (!tile) return null;
        const r = Math.floor(idx / SIZE);
        const c = idx % SIZE;
        const isSelected =
          selected && selected.r === r && selected.c === c;
        const fxKind = fx[tile.id];
        return (
          <TileSprite
            key={tile.id}
            tile={tile}
            row={r}
            col={c}
            cellPercent={100 / SIZE}
            selected={!!isSelected}
            fx={fxKind}
            onClick={() => onCellClick({ r, c })}
          />
        );
      })}
    </div>
  );
}

function TileSprite({
  tile,
  row,
  col,
  cellPercent,
  selected,
  fx,
  onClick,
}: {
  tile: Tile;
  row: number;
  col: number;
  cellPercent: number;
  selected: boolean;
  fx: "pop" | "spawn" | undefined;
  onClick: () => void;
}) {
  const left = `${col * cellPercent}%`;
  const top  = `${row * cellPercent}%`;
  const size = `${cellPercent}%`;
  const specialCls = tile.special ? ` special-${tile.special}` : "";

  return (
    <div
      role="button"
      onClick={onClick}
      className={`tile${selected ? " selected" : ""}${specialCls}`}
      style={{
        left,
        top,
        width: size,
        height: size,
        background: TILE_BG[tile.type],
        boxShadow: selected
          ? "0 0 0 3px rgba(255,225,122,0.85), 0 8px 18px rgba(0,0,0,0.25), inset 0 2px 0 rgba(255,255,255,0.5)"
          : "0 6px 12px rgba(0,0,0,0.18), inset 0 2px 0 rgba(255,255,255,0.45)",
        transform:
          fx === "pop"
            ? "scale(1.45)"
            : fx === "spawn"
            ? "scale(0.4)"
            : "scale(1)",
        opacity: fx === "pop" ? 0 : 1,
        transition:
          fx === "pop"
            ? "transform 0.26s cubic-bezier(0.34,1.56,0.64,1), opacity 0.26s"
            : fx === "spawn"
            ? "transform 0.34s cubic-bezier(0.34,1.56,0.64,1), left 0.32s ease, top 0.32s ease"
            : "left 0.20s cubic-bezier(0.34,1.56,0.64,1), top 0.32s cubic-bezier(0.34,1.56,0.64,1), transform 0.18s",
        animation: tile.special === "rainbow" ? "wiggle 1.4s ease-in-out infinite" : undefined,
      }}
    >
      <span
        style={{
          fontSize: "min(7vw, 2.3rem)",
          filter:
            "drop-shadow(0 1px 0 rgba(0,0,0,0.18)) drop-shadow(0 3px 6px rgba(0,0,0,0.22))",
        }}
      >
        {TILE_EMOJI[tile.type]}
      </span>
      {tile.special && (
        <span
          className="absolute -top-1.5 -right-1.5 text-base md:text-lg pointer-events-none drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]"
        >
          {SPECIAL_OVERLAY[tile.special]}
        </span>
      )}
    </div>
  );
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * Mirrors engine.applyGravity + refill, operating on whichever tiles are present
 * in `live`. New tiles get fresh ids. Used so the React render can keyed-animate
 * the fall + spawn without us re-fetching from the original engine state.
 */
import { TILE_TYPES, TileType } from "@/game/engine";
function simulateGravityAndRefillFromVisible(b: BoardT): BoardT {
  const out: BoardT = b.map((row) => row.map((t) => (t ? { ...t } : null)));
  for (let c = 0; c < SIZE; c++) {
    let write = SIZE - 1;
    for (let r = SIZE - 1; r >= 0; r--) {
      const t = out[r][c];
      if (t) {
        if (write !== r) {
          out[write][c] = t;
          out[r][c] = null;
        }
        write--;
      }
    }
    for (let r = write; r >= 0; r--) {
      out[r][c] = {
        id: Math.floor(Math.random() * 1e9),
        type: TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)] as TileType,
        special: null,
      };
    }
  }
  return out;
}
