export interface XpBreakdown {
  completionXp: number;
  resultBonusXp: number;
  dailyBonusXp: number;
  totalXpEarned: number;
}

export interface LevelInfo {
  currentLevel: number;
  totalXP: number;
  currentLevelXp: number;     // XP gained within this level
  xpForCurrentLevel: number;  // total XP needed to complete current level
  xpToNextLevel: number;      // remaining XP needed to reach next level
  progressPercent: number;    // 0 - 100
  isLevelUp: boolean;
}

/**
 * Calculates XP reward for a completed match.
 * Base completion: +10 XP
 * Victory: +15 XP
 * Draw: +5 XP
 * Defeat: 0 XP
 * First duel of the day: +5 XP
 */
export function calculateXpReward(params: {
  result: "WIN" | "LOSS" | "DRAW";
  isFirstDuelOfDay: boolean;
}): XpBreakdown {
  const completionXp = 10;
  let resultBonusXp = 0;
  if (params.result === "WIN") {
    resultBonusXp = 15;
  } else if (params.result === "DRAW") {
    resultBonusXp = 5;
  }

  const dailyBonusXp = params.isFirstDuelOfDay ? 5 : 0;
  const totalXpEarned = completionXp + resultBonusXp + dailyBonusXp;

  return {
    completionXp,
    resultBonusXp,
    dailyBonusXp,
    totalXpEarned,
  };
}

/**
 * Cumulative XP required to reach Level L:
 * Level 1: 0 XP
 * Level 2: 100 XP (delta 100)
 * Level 3: 250 XP (delta 150)
 * Level 4: 450 XP (delta 200)
 * Level 5: 700 XP (delta 250)
 * Level 6: 1000 XP (delta 300)
 * Formula: Cumulative XP for Level L = 25 * (L - 1) * (L + 2)
 */
export function getCumulativeXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return 25 * (level - 1) * (level + 2);
}

/**
 * Calculates current level and progression details given total XP.
 */
export function calculateLevelInfo(totalXP: number, previousLevel: number = 1): LevelInfo {
  // Find current level (largest L where cumulative XP <= totalXP)
  let level = 1;
  while (getCumulativeXpForLevel(level + 1) <= totalXP) {
    level++;
  }

  const levelFloor = getCumulativeXpForLevel(level);
  const levelCeiling = getCumulativeXpForLevel(level + 1);
  const xpForCurrentLevel = levelCeiling - levelFloor;
  const currentLevelXp = Math.max(0, totalXP - levelFloor);
  const xpToNextLevel = Math.max(0, levelCeiling - totalXP);
  const progressPercent =
    xpForCurrentLevel > 0
      ? Math.min(100, Math.round((currentLevelXp / xpForCurrentLevel) * 1000) / 10)
      : 0;

  return {
    currentLevel: level,
    totalXP,
    currentLevelXp,
    xpForCurrentLevel,
    xpToNextLevel,
    progressPercent,
    isLevelUp: level > previousLevel,
  };
}
