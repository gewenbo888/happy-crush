export type Lang = "en" | "zh";

export const T = {
  title:       { en: "Happy Crush",                                   zh: "开心消消乐" },
  subtitle:    { en: "Connect Joy, Eliminate Stress",                  zh: "连接快乐，消除压力" },
  playNow:     { en: "Play Now",                                      zh: "开始游戏" },
  selectLevel: { en: "Select Level",                                  zh: "选择关卡" },
  level:       { en: "Level",                                         zh: "关卡" },
  moves:       { en: "Moves",                                         zh: "步数" },
  score:       { en: "Score",                                         zh: "得分" },
  target:      { en: "Target",                                        zh: "目标" },
  combo:       { en: "Combo",                                         zh: "连击" },
  collect:     { en: "Collect",                                       zh: "收集" },
  leaderboard: { en: "Leaderboard",                                   zh: "排行榜" },
  howToPlay:   { en: "How to Play",                                   zh: "玩法" },
  back:        { en: "Back",                                          zh: "返回" },
  restart:     { en: "Restart",                                       zh: "重玩" },
  next:        { en: "Next Level",                                    zh: "下一关" },
  quit:        { en: "Quit",                                          zh: "退出" },
  victory:     { en: "Victory!",                                      zh: "胜利！" },
  defeat:      { en: "Out of Moves",                                  zh: "步数耗尽" },
  stars:       { en: "Stars",                                         zh: "星级" },
  xp:          { en: "XP",                                            zh: "经验" },
  coins:       { en: "Coins",                                         zh: "金币" },
  hint:        { en: "Hint",                                          zh: "提示" },
  shuffle:     { en: "Shuffle",                                       zh: "重排" },
  legendary:   { en: "LEGENDARY!!",                                   zh: "无敌连击！！" },
  unbelievable:{ en: "Unbelievable!",                                 zh: "难以置信！" },
  amazing:     { en: "Amazing!",                                      zh: "太棒了！" },
  great:       { en: "Great!",                                        zh: "厉害！" },
  nice:        { en: "Nice!",                                         zh: "不错！" },

  /* worlds */
  world_candyMeadow:  { en: "Candy Meadow",   zh: "糖果草原" },
  world_candyRain:    { en: "Candy Rain",     zh: "糖果雨" },
  world_rainbowStorm: { en: "Rainbow Storm",  zh: "彩虹风暴" },
  world_crystalCave:  { en: "Crystal Cave",   zh: "水晶洞" },
  world_candyKingdom: { en: "Candy Kingdom",  zh: "糖果王国" },

  /* tile names */
  strawberry: { en: "Strawberry", zh: "草莓" },
  orange:     { en: "Orange",     zh: "橙子" },
  blueberry:  { en: "Blueberry",  zh: "蓝莓" },
  grapes:     { en: "Grapes",     zh: "葡萄" },
  candy:      { en: "Candy",      zh: "糖果" },
  star:       { en: "Star",       zh: "星星" },
  jelly:      { en: "Jelly",      zh: "果冻" },
  bear:       { en: "Bear",       zh: "小熊" },

  /* leaderboard */
  rank:       { en: "Rank",       zh: "排名" },
  player:     { en: "Player",     zh: "玩家" },
  country:    { en: "Country",    zh: "国家" },
  bestCombo:  { en: "Best Combo", zh: "最高连击" },

  /* tutorial */
  tut_swap:   { en: "Drag a candy onto a neighbour to swap.",  zh: "拖动糖果到相邻位置进行交换。" },
  tut_match:  { en: "Match 3 or more of the same kind to crush them.", zh: "三个或更多相同糖果即可消除。" },
  tut_combo:  { en: "Chained matches build a combo. Bigger combos = more points.", zh: "连续消除组成连击，连击越大分数越高。" },
  tut_power4: { en: "Match 4 in a line → row / column clear.", zh: "一行/一列连消 4 个 → 整行整列清除。" },
  tut_power5: { en: "Match 5 in a line → rainbow color bomb.", zh: "连消 5 个 → 彩虹色弹。" },
  tut_powerL: { en: "L / T shape → tile bomb (3×3 area).",     zh: "L/T 形 → 炸弹（3×3 范围）。" },

  /* combo tiers */
  comboTier: [
    { at: 1, t: { en: "Nice!",          zh: "不错！" } },
    { at: 2, t: { en: "Great!",         zh: "厉害！" } },
    { at: 3, t: { en: "Amazing!",       zh: "太棒了！" } },
    { at: 4, t: { en: "Unbelievable!",  zh: "难以置信！" } },
    { at: 5, t: { en: "LEGENDARY!!",    zh: "无敌连击！！" } },
  ] as { at: number; t: { en: string; zh: string } }[],
} as const;

export function tx<K extends keyof typeof T>(key: K, lang: Lang): string {
  const v = T[key] as any;
  if (v && typeof v === "object" && "en" in v) return v[lang];
  return String(key);
}
