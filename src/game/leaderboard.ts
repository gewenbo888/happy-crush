/** Faux global leaderboard — deterministic, no network. */
export interface LBEntry {
  rank: number;
  name: string;
  emoji: string;
  country: string; // flag emoji
  score: number;
  combo: number;
  tier: "diamond" | "gold" | "silver" | "bronze";
}

const NAMES = [
  "SugarQueen 糖糖",  "Bobo 小波波",      "Mochi 麻吉",       "Nori 海苔",
  "RainbowBoy 彩虹哥","Hana 花花",        "Pichu 皮丘",        "Latte 拿铁",
  "Yuyu 鱼鱼",        "Cookie 饼干",      "Pop 啵啵",          "Pudding 布丁",
  "Maple 枫枫",       "Honey 蜜蜜",       "TwinStar 双星",    "Cha 茶茶",
  "Bobo 波波",        "Luna 露娜",        "Riko 莉子",         "Aki 阿吉",
];
const FLAGS = ["🇨🇳","🇯🇵","🇰🇷","🇸🇬","🇺🇸","🇬🇧","🇨🇦","🇫🇷","🇩🇪","🇧🇷","🇦🇺","🇪🇸","🇮🇹","🇮🇳","🇲🇽","🇹🇭","🇹🇼","🇮🇩","🇵🇭","🇻🇳"];
const EMOJIS = ["🍓","🍊","🫐","🍇","🍬","⭐","🍮","🐻","🌈","🍭","🍩","🍪","🦄","🍰","🧁","🍯","🍡","🍵","🍒","🍑"];

const tierOf = (rank: number): LBEntry["tier"] =>
  rank === 1 ? "diamond" : rank <= 3 ? "gold" : rank <= 10 ? "silver" : "bronze";

export function buildLeaderboard(yourScore = 0, yourName = "You · 你"): LBEntry[] {
  const baseList: LBEntry[] = NAMES.map((n, i) => {
    const score = 240000 - i * (8000 + (i % 5) * 500) - (i * i * 90);
    return {
      rank: 0,
      name: n,
      emoji: EMOJIS[i % EMOJIS.length],
      country: FLAGS[i % FLAGS.length],
      score: Math.max(2000, score),
      combo: 32 - Math.floor(i / 2),
      tier: "bronze",
    };
  });
  if (yourScore > 0) {
    baseList.push({
      rank: 0,
      name: yourName,
      emoji: "🎮",
      country: "🌍",
      score: yourScore,
      combo: 0,
      tier: "bronze",
    });
  }
  baseList.sort((a, b) => b.score - a.score);
  return baseList.map((e, i) => ({ ...e, rank: i + 1, tier: tierOf(i + 1) }));
}
