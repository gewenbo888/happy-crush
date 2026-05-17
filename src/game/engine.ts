/**
 * Happy Crush · Match-3 engine
 *
 * Pure functions over a Board state. The UI drives a sequence:
 *   swap → resolveAllCascades (returns ordered Steps) → render with animation
 */

export const TILE_TYPES = [
  "strawberry",
  "orange",
  "blueberry",
  "grapes",
  "candy",
  "star",
  "jelly",
  "bear",
] as const;

export type TileType = (typeof TILE_TYPES)[number];

export type Special =
  | null
  | "bomb"        // 3x3 area
  | "row"         // clear entire row
  | "col"         // clear entire column
  | "rainbow";    // clear all of one color

export interface Tile {
  id: number;
  type: TileType;
  special: Special;
}

export type Board = (Tile | null)[][]; // [row][col]

export const SIZE = 8;

let nextId = 1;
export function makeTile(type: TileType, special: Special = null): Tile {
  return { id: nextId++, type, special };
}

function randomType(exclude: TileType[] = []): TileType {
  const pool = TILE_TYPES.filter((t) => !exclude.includes(t));
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Generate an initial board with no existing matches. */
export function makeBoard(seed?: number): Board {
  let s = seed ?? Math.floor(Math.random() * 1e9);
  // deterministic-ish PRNG so that seeded boards are reproducible if seed passed
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
  const pick = (exclude: TileType[]) => {
    const pool = TILE_TYPES.filter((t) => !exclude.includes(t));
    return pool[Math.floor(rnd() * pool.length)];
  };

  const b: Board = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => null as Tile | null)
  );
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const exclude: TileType[] = [];
      if (c >= 2 && b[r][c - 1]?.type === b[r][c - 2]?.type)
        exclude.push(b[r][c - 1]!.type);
      if (r >= 2 && b[r - 1][c]?.type === b[r - 2][c]?.type)
        exclude.push(b[r - 1][c]!.type);
      b[r][c] = makeTile(pick(exclude));
    }
  }
  // ensure at least one valid move exists
  if (!hasAnyMove(b)) return makeBoard();
  return b;
}

export interface Coord {
  r: number;
  c: number;
}

export function inBounds({ r, c }: Coord) {
  return r >= 0 && c >= 0 && r < SIZE && c < SIZE;
}

export function areAdjacent(a: Coord, b: Coord) {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
}

export function cloneBoard(b: Board): Board {
  return b.map((row) => row.map((t) => (t ? { ...t } : null)));
}

export function swap(b: Board, a: Coord, c: Coord): Board {
  const out = cloneBoard(b);
  const tmp = out[a.r][a.c];
  out[a.r][a.c] = out[c.r][c.c];
  out[c.r][c.c] = tmp;
  return out;
}

export interface MatchGroup {
  coords: Coord[];
  type: TileType;
  orientation: "h" | "v" | "shape";
  length: number;
}

/**
 * Find all rows/columns of >=3 same-type tiles.
 * Overlapping match groups (forming L/T/+) are reported as separate
 * horizontal and vertical groups; the cleared-set is the union.
 */
export function findMatches(b: Board): MatchGroup[] {
  const groups: MatchGroup[] = [];

  for (let r = 0; r < SIZE; r++) {
    let runStart = 0;
    for (let c = 1; c <= SIZE; c++) {
      const prev = b[r][c - 1];
      const cur = c < SIZE ? b[r][c] : null;
      if (!cur || !prev || cur.type !== prev.type) {
        const runLen = c - runStart;
        if (runLen >= 3 && prev) {
          const coords: Coord[] = [];
          for (let cc = runStart; cc < c; cc++) coords.push({ r, c: cc });
          groups.push({
            coords,
            type: prev.type,
            orientation: "h",
            length: runLen,
          });
        }
        runStart = c;
      }
    }
  }

  for (let c = 0; c < SIZE; c++) {
    let runStart = 0;
    for (let r = 1; r <= SIZE; r++) {
      const prev = b[r - 1][c];
      const cur = r < SIZE ? b[r][c] : null;
      if (!cur || !prev || cur.type !== prev.type) {
        const runLen = r - runStart;
        if (runLen >= 3 && prev) {
          const coords: Coord[] = [];
          for (let rr = runStart; rr < r; rr++) coords.push({ r: rr, c });
          groups.push({
            coords,
            type: prev.type,
            orientation: "v",
            length: runLen,
          });
        }
        runStart = r;
      }
    }
  }

  return groups;
}

/** Test if any swap produces at least one match. */
export function hasAnyMove(b: Board): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (c + 1 < SIZE) {
        const sw = swap(b, { r, c }, { r, c: c + 1 });
        if (findMatches(sw).length) return true;
      }
      if (r + 1 < SIZE) {
        const sw = swap(b, { r, c }, { r: r + 1, c });
        if (findMatches(sw).length) return true;
      }
    }
  }
  return false;
}

/**
 * Given match groups, decide which coords are cleared and which become specials.
 * Promotion rules (Bejeweled-style):
 *   - 5 in a row  -> rainbow (color bomb)
 *   - 4 in a row  -> row clear (if horizontal) / col clear (if vertical)
 *   - L / T shape (multiple intersecting groups containing a shared tile) -> bomb
 */
export interface CrushPlan {
  cleared: Set<string>;                 // "r,c" of every removed tile
  promotions: { at: Coord; special: Exclude<Special, null>; type: TileType }[];
}

const keyOf = ({ r, c }: Coord) => `${r},${c}`;

export function planCrush(
  groups: MatchGroup[],
  swappedCoord?: Coord
): CrushPlan {
  const cleared = new Set<string>();
  const promotions: CrushPlan["promotions"] = [];

  // Step 1: tally cleared cells & detect "shape" intersections (L/T/+).
  const cellGroupCount = new Map<string, MatchGroup[]>();
  for (const g of groups) {
    for (const k of g.coords) {
      const kk = keyOf(k);
      cleared.add(kk);
      const arr = cellGroupCount.get(kk) ?? [];
      arr.push(g);
      cellGroupCount.set(kk, arr);
    }
  }

  // Pick promotion seats: prefer the swapped tile coord if it is in a group;
  // else pick the first coord of the (largest) group.
  const usedSeats = new Set<string>();
  // First pass: shape (L/T/+) — any cell belonging to both H and V groups → bomb
  for (const [k, gs] of cellGroupCount.entries()) {
    if (gs.length >= 2) {
      const hasH = gs.some((g) => g.orientation === "h");
      const hasV = gs.some((g) => g.orientation === "v");
      if (hasH && hasV) {
        const [r, c] = k.split(",").map(Number);
        promotions.push({
          at: { r, c },
          special: "bomb",
          type: gs[0].type,
        });
        usedSeats.add(k);
      }
    }
  }

  // Second pass: 4 / 5 in a single line
  for (const g of groups) {
    if (g.length < 4) continue;
    const seatPref = swappedCoord
      ? g.coords.find((x) => x.r === swappedCoord.r && x.c === swappedCoord.c)
      : undefined;
    const seat = seatPref ?? g.coords[Math.floor(g.coords.length / 2)];
    const sk = keyOf(seat);
    if (usedSeats.has(sk)) continue;
    promotions.push({
      at: seat,
      special: g.length >= 5 ? "rainbow" : g.orientation === "h" ? "row" : "col",
      type: g.type,
    });
    usedSeats.add(sk);
  }

  return { cleared, promotions };
}

/**
 * Apply a clear plan to the board (returns new board with cleared cells set
 * to null and promotion seats replaced with the special-typed tile).
 */
export function applyClear(b: Board, plan: CrushPlan): Board {
  const out = cloneBoard(b);
  for (const k of plan.cleared) {
    const [r, c] = k.split(",").map(Number);
    out[r][c] = null;
  }
  for (const p of plan.promotions) {
    out[p.at.r][p.at.c] = makeTile(p.type, p.special);
  }
  return out;
}

/** Drop tiles into gaps. Returns new board + a fall map (coord → distance dropped). */
export function applyGravity(
  b: Board
): { board: Board; fall: Map<string, number> } {
  const out = cloneBoard(b);
  const fall = new Map<string, number>();
  for (let c = 0; c < SIZE; c++) {
    let writeRow = SIZE - 1;
    for (let r = SIZE - 1; r >= 0; r--) {
      const t = out[r][c];
      if (t) {
        if (writeRow !== r) {
          out[writeRow][c] = t;
          out[r][c] = null;
          fall.set(keyOf({ r: writeRow, c }), writeRow - r);
        }
        writeRow--;
      }
    }
  }
  return { board: out, fall };
}

/** Spawn random tiles in all null cells. Returns new board + set of new-tile coords. */
export function refill(b: Board): { board: Board; spawned: Coord[] } {
  const out = cloneBoard(b);
  const spawned: Coord[] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!out[r][c]) {
        out[r][c] = makeTile(randomType());
        spawned.push({ r, c });
      }
    }
  }
  return { board: out, spawned };
}

/* ─── Specials ─── */

/** Return all coords a special tile clears, given its position and the board. */
export function specialAOE(
  b: Board,
  pos: Coord,
  targetType?: TileType
): Set<string> {
  const tile = b[pos.r][pos.c];
  const out = new Set<string>();
  if (!tile || !tile.special) return out;
  if (tile.special === "bomb") {
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const r = pos.r + dr,
          c = pos.c + dc;
        if (inBounds({ r, c })) out.add(keyOf({ r, c }));
      }
  } else if (tile.special === "row") {
    for (let c = 0; c < SIZE; c++) out.add(keyOf({ r: pos.r, c }));
  } else if (tile.special === "col") {
    for (let r = 0; r < SIZE; r++) out.add(keyOf({ r, c: pos.c }));
  } else if (tile.special === "rainbow") {
    const t = targetType ?? tile.type;
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++) {
        if (b[r][c]?.type === t) out.add(keyOf({ r, c }));
      }
    out.add(keyOf(pos)); // include the rainbow itself
  }
  return out;
}

/**
 * Trigger any specials that lie within the cleared set, recursively expanding
 * the cleared set with their AOEs. Returns the expanded cleared set.
 */
export function expandSpecials(
  b: Board,
  cleared: Set<string>,
  hintType?: TileType
): Set<string> {
  const out = new Set(cleared);
  let changed = true;
  while (changed) {
    changed = false;
    for (const k of Array.from(out)) {
      const [r, c] = k.split(",").map(Number);
      const t = b[r][c];
      if (!t || !t.special) continue;
      const aoe = specialAOE(b, { r, c }, hintType ?? t.type);
      for (const ak of aoe) {
        if (!out.has(ak)) {
          out.add(ak);
          changed = true;
        }
      }
    }
  }
  return out;
}

/* ─── High-level Step pipeline (consumed by the UI) ─── */

export interface SwapStep {
  kind: "swap";
  a: Coord;
  b: Coord;
  revert?: boolean;
}
export interface ClearStep {
  kind: "clear";
  cleared: Coord[];
  promotions: CrushPlan["promotions"];
  specialsTriggered: Coord[];
  comboLevel: number; // 1 = first cascade, 2 = second...
  pointsGained: number;
}
export interface FallStep {
  kind: "fall";
  fall: { r: number; c: number; dropFrom: number }[]; // dropFrom is how many rows the tile fell
  spawned: Coord[];
}

export type GameStep = SwapStep | ClearStep | FallStep;

export interface ResolveResult {
  finalBoard: Board;
  steps: GameStep[];
  totalCleared: number;
  totalPoints: number;
  highestCombo: number;
}

/**
 * Run a swap and resolve all cascades.
 * Returns the final board + a list of animation-friendly steps.
 */
export function resolveSwap(
  initial: Board,
  a: Coord,
  c: Coord,
  scoring = defaultScoring()
): ResolveResult | null {
  let board = swap(initial, a, c);

  // Trigger if either side was a special (handled even without a regular match)
  const aTile = board[c.r][c.c]; // the tile that ended up at c was originally at a
  const cTile = board[a.r][a.c];

  const triggeredSpecials: Coord[] = [];
  let cleared = new Set<string>();
  let hintType: TileType | undefined;

  if (aTile?.special) {
    triggeredSpecials.push({ r: c.r, c: c.c });
    cleared.add(keyOf({ r: c.r, c: c.c }));
    if (aTile.special === "rainbow") hintType = cTile?.type;
  }
  if (cTile?.special) {
    triggeredSpecials.push({ r: a.r, c: a.c });
    cleared.add(keyOf({ r: a.r, c: a.c }));
    if (cTile.special === "rainbow") hintType = aTile?.type;
  }
  if (triggeredSpecials.length) {
    cleared = expandSpecials(board, cleared, hintType);
  }

  const groups = findMatches(board);

  if (!triggeredSpecials.length && groups.length === 0) {
    return null; // illegal move
  }

  const steps: GameStep[] = [];
  steps.push({ kind: "swap", a, b: c });

  let combo = 0;
  let totalCleared = 0;
  let totalPoints = 0;
  let highestCombo = 0;

  // first crush iteration combines any pre-triggered specials with regular matches
  while (true) {
    combo++;
    highestCombo = Math.max(highestCombo, combo);

    let plan: CrushPlan;
    if (combo === 1 && (cleared.size || groups.length)) {
      const g0 = combo === 1 ? findMatches(board) : findMatches(board);
      plan = planCrush(g0, undefined);
      // merge pre-triggered specials AOE
      for (const k of cleared) plan.cleared.add(k);
    } else {
      const gs = findMatches(board);
      if (gs.length === 0) break;
      plan = planCrush(gs, undefined);
    }
    if (!plan.cleared.size) break;

    // expand by any specials in the cleared set
    plan.cleared = expandSpecials(board, plan.cleared);

    const points = scoring.points(plan, combo);
    totalPoints += points;
    totalCleared += plan.cleared.size;

    const clearedCoords: Coord[] = Array.from(plan.cleared).map((k) => {
      const [r, c2] = k.split(",").map(Number);
      return { r, c: c2 };
    });

    steps.push({
      kind: "clear",
      cleared: clearedCoords,
      promotions: plan.promotions,
      specialsTriggered: triggeredSpecials,
      comboLevel: combo,
      pointsGained: points,
    });

    board = applyClear(board, plan);

    const grav = applyGravity(board);
    board = grav.board;
    const ref = refill(board);
    board = ref.board;

    const fallList: FallStep["fall"] = [];
    for (const [k, dist] of grav.fall.entries()) {
      const [r, c2] = k.split(",").map(Number);
      fallList.push({ r, c: c2, dropFrom: dist });
    }
    steps.push({
      kind: "fall",
      fall: fallList,
      spawned: ref.spawned,
    });
  }

  return {
    finalBoard: board,
    steps,
    totalCleared,
    totalPoints,
    highestCombo,
  };
}

/* ─── Scoring ─── */

export function defaultScoring() {
  return {
    points(plan: CrushPlan, comboLevel: number): number {
      const base = plan.cleared.size * 30;
      const promotionBonus = plan.promotions.length * 80;
      const comboBonus = comboLevel > 1 ? (comboLevel - 1) * 50 : 0;
      return base + promotionBonus + comboBonus;
    },
  };
}

/** Optional: list of legal swap pairs (used to give a hint). */
export function findHint(b: Board): [Coord, Coord] | null {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (c + 1 < SIZE) {
        const sw = swap(b, { r, c }, { r, c: c + 1 });
        if (findMatches(sw).length || b[r][c]?.special || b[r][c + 1]?.special)
          return [{ r, c }, { r, c: c + 1 }];
      }
      if (r + 1 < SIZE) {
        const sw = swap(b, { r, c }, { r: r + 1, c });
        if (findMatches(sw).length || b[r][c]?.special || b[r + 1][c]?.special)
          return [{ r, c }, { r: r + 1, c }];
      }
    }
  }
  return null;
}

/** Re-shuffle the board until at least one move exists, preserving counts. */
export function reshuffle(b: Board): Board {
  const tiles: Tile[] = [];
  for (const row of b) for (const t of row) if (t) tiles.push(t);
  let attempts = 0;
  while (attempts++ < 50) {
    // Fisher-Yates
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    const nb: Board = Array.from({ length: SIZE }, () =>
      Array.from({ length: SIZE }, () => null as Tile | null)
    );
    let i = 0;
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++) nb[r][c] = tiles[i++];
    if (findMatches(nb).length === 0 && hasAnyMove(nb)) return nb;
  }
  return makeBoard();
}
