import type { TileType } from "./engine";

export interface LevelObjective {
  kind: "score" | "collect";
  target: number;
  // for collect:
  collectType?: TileType;
}

export interface Level {
  id: number;
  name: { en: string; zh: string };
  moves: number;
  starThresholds: [number, number, number]; // 1, 2, 3 star scores
  objectives: LevelObjective[];
  world: "candy-meadow" | "candy-rain" | "rainbow-storm" | "crystal-cave" | "candy-kingdom";
}

const WORLDS: Level["world"][] = [
  "candy-meadow",
  "candy-rain",
  "rainbow-storm",
  "crystal-cave",
  "candy-kingdom",
];

const NAMES_EN = [
  "Sugar Meadow", "First Bite", "Lemon Drop", "Bubble Pop", "Honey Hop",
  "Berry Bounce", "Jelly Jam", "Mint Burst", "Star Shower", "Rainbow Rush",
  "Toffee Trail", "Caramel Cove", "Fizz Fountain", "Cookie Cliffs", "Marshmallow Mesa",
  "Sherbet Slopes", "Cotton Cloud", "Lollipop Lake", "Choco Channel", "Fudge Field",
  "Bonbon Bay", "Donut Dunes", "Tart Tower", "Praline Path", "Sugar Storm",
  "Crystal Cave", "Geode Grove", "Sparkle Spire", "Diamond Drift", "Amber Arch",
  "Opal Outpost", "Quartz Quay", "Topaz Trail", "Garnet Gate", "Ruby Ridge",
  "Sapphire Slide", "Emerald Edge", "Onyx Oasis", "Pearl Pier", "Aurora Aisle",
  "Candy Kingdom", "Royal Roast", "Sweet Citadel", "Sugar Throne", "Sticky Spires",
  "Honey Hall", "Treacle Tower", "Comfit Court", "Sherbet Senate", "Sweet Eternity",
];

const NAMES_ZH = [
  "糖果草原", "初次咬", "柠檬糖", "泡泡爆", "蜂蜜跳",
  "莓果蹦", "果冻酱", "薄荷爆", "星星雨", "彩虹潮",
  "太妃径", "焦糖湾", "气泡泉", "饼干崖", "棉花山",
  "雪芭坡", "棉花云", "棒棒湖", "巧克水道", "软糖田",
  "邦邦湾", "甜甜圈丘", "果挞塔", "果仁径", "糖暴",
  "水晶洞", "晶簇林", "闪耀塔", "钻石漂", "琥珀拱",
  "蛋白前哨", "石英港", "黄玉径", "石榴门", "红宝石脊",
  "蓝宝石滑", "翡翠角", "玛瑙绿洲", "珍珠码头", "极光街",
  "糖果王国", "皇家烤", "甜蜜城堡", "糖之御座", "黏黏尖塔",
  "蜂蜜厅", "糖蜜塔", "糖衣朝", "雪芭议会", "甜蜜永恒",
];

function pickWorld(i: number): Level["world"] {
  return WORLDS[Math.min(WORLDS.length - 1, Math.floor(i / 10))];
}

function objectiveFor(i: number): LevelObjective[] {
  const list: LevelObjective[] = [];
  const scoreTarget = 500 + i * 600;
  list.push({ kind: "score", target: scoreTarget });
  if (i % 4 === 1) {
    list.push({ kind: "collect", target: 6 + Math.floor(i / 3), collectType: "strawberry" });
  } else if (i % 4 === 2) {
    list.push({ kind: "collect", target: 6 + Math.floor(i / 3), collectType: "star" });
  } else if (i % 4 === 3) {
    list.push({ kind: "collect", target: 6 + Math.floor(i / 3), collectType: "blueberry" });
  }
  return list;
}

export const LEVELS: Level[] = Array.from({ length: 50 }, (_, i) => {
  const scoreTarget = 500 + i * 600;
  return {
    id: i + 1,
    name: { en: NAMES_EN[i], zh: NAMES_ZH[i] },
    moves: 18 + Math.floor(i / 3),
    starThresholds: [
      scoreTarget,
      Math.round(scoreTarget * 1.5),
      Math.round(scoreTarget * 2.2),
    ],
    objectives: objectiveFor(i),
    world: pickWorld(i),
  };
});

export function getLevel(id: number): Level {
  return LEVELS[Math.max(0, Math.min(LEVELS.length - 1, id - 1))];
}
