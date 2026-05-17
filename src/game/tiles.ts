import type { TileType, Special } from "./engine";

/** Visual representation of each tile type. We use emoji for richness. */
export const TILE_EMOJI: Record<TileType, string> = {
  strawberry: "🍓",
  orange:     "🍊",
  blueberry:  "🫐",
  grapes:     "🍇",
  candy:      "🍬",
  star:       "⭐",
  jelly:      "🍮",
  bear:       "🐻",
};

export const TILE_BG: Record<TileType, string> = {
  strawberry: "radial-gradient(circle at 35% 30%, #ffaecb 0%, #ff5d6d 75%)",
  orange:     "radial-gradient(circle at 35% 30%, #ffd49a 0%, #ff9d57 75%)",
  blueberry:  "radial-gradient(circle at 35% 30%, #b0c8ff 0%, #7aa6ff 80%)",
  grapes:     "radial-gradient(circle at 35% 30%, #e2c4ff 0%, #c79bff 80%)",
  candy:      "radial-gradient(circle at 35% 30%, #ffe9f4 0%, #ff85c1 80%)",
  star:       "radial-gradient(circle at 35% 30%, #fff3a8 0%, #ffe17a 80%)",
  jelly:      "radial-gradient(circle at 35% 30%, #d6fff1 0%, #a8f5e2 80%)",
  bear:       "radial-gradient(circle at 35% 30%, #ffe1c2 0%, #ffb98a 80%)",
};

export const SPECIAL_OVERLAY: Record<Exclude<Special, null>, string> = {
  bomb:    "💥",
  row:     "↔️",
  col:     "↕️",
  rainbow: "🌈",
};

export const TILE_RING: Record<TileType, string> = {
  strawberry: "rgba(255,93,109,0.55)",
  orange:     "rgba(255,157,87,0.55)",
  blueberry:  "rgba(122,166,255,0.55)",
  grapes:     "rgba(199,155,255,0.55)",
  candy:      "rgba(255,133,193,0.55)",
  star:       "rgba(255,225,122,0.7)",
  jelly:      "rgba(168,245,226,0.6)",
  bear:       "rgba(255,185,138,0.6)",
};
