import { BotDifficulty } from "../game/bot";
import { DuelType } from "../game/duelManager";

export type RatingTier =
  | "Beginner"
  | "Novice"
  | "Intermediate"
  | "Advanced"
  | "Expert"
  | "Master"
  | "Grandmaster"
  | "Legend";

export interface TierInfo {
  tier: RatingTier;
  minRating: number;
  maxRating: number | null;
  color: string;
  badge: string;
  description: string;
}

export const TIERS: TierInfo[] = [
  { tier: "Beginner", minRating: 100, maxRating: 799, color: "text-zinc-400 border-zinc-500/30 bg-zinc-500/10", badge: "Beginner", description: "Taking first competitive steps" },
  { tier: "Novice", minRating: 800, maxRating: 999, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", badge: "Novice", description: "Gaining syntax and problem fluency" },
  { tier: "Intermediate", minRating: 1000, maxRating: 1199, color: "text-blue-400 border-blue-500/30 bg-blue-500/10", badge: "Intermediate", description: "Solid programming foundations" },
  { tier: "Advanced", minRating: 1200, maxRating: 1399, color: "text-purple-400 border-purple-500/30 bg-purple-500/10", badge: "Advanced", description: "Fast, accurate and competitive" },
  { tier: "Expert", minRating: 1400, maxRating: 1599, color: "text-pink-400 border-pink-500/30 bg-pink-500/10", badge: "Expert", description: "Dominant speed and sharp recall" },
  { tier: "Master", minRating: 1600, maxRating: 1799, color: "text-amber-400 border-amber-500/30 bg-amber-500/10", badge: "Master", description: "Outplays almost every bot with ease" },
  { tier: "Grandmaster", minRating: 1800, maxRating: 1999, color: "text-rose-400 border-rose-500/30 bg-rose-500/10", badge: "Grandmaster", description: "Elite-tier duelist in the arena" },
  { tier: "Legend", minRating: 2000, maxRating: null, color: "text-yellow-300 border-yellow-400/50 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 shadow-yellow-500/20", badge: "Legend", description: "Top echelon grand duelist" },
];

export const BOT_RATINGS: Record<BotDifficulty, number> = {
  easy: 800,
  medium: 1200,
  hard: 1600,
};

export const K_FACTOR = 24;
export const MIN_RATING = 100;
export const INITIAL_RATING = 1000;

export function getBotRating(difficulty: BotDifficulty | string): number {
  if (difficulty === "easy") return BOT_RATINGS.easy;
  if (difficulty === "hard") return BOT_RATINGS.hard;
  return BOT_RATINGS.medium;
}

export function getTier(rating: number): RatingTier {
  if (rating < 800) return "Beginner";
  if (rating < 1000) return "Novice";
  if (rating < 1200) return "Intermediate";
  if (rating < 1400) return "Advanced";
  if (rating < 1600) return "Expert";
  if (rating < 1800) return "Master";
  if (rating < 2000) return "Grandmaster";
  return "Legend";
}

export function getTierInfo(rating: number): TierInfo {
  const tierName = getTier(rating);
  return TIERS.find((t) => t.tier === tierName) || TIERS[0];
}

/**
 * Calculates Elo rating change for a match.
 *
 * Expected score:
 * E_A = 1 / (1 + 10 ^ ((R_B - R_A) / 400))
 *
 * Rating adjustment:
 * R_A_new = R_A + K * (S_A - E_A)
 *
 * S_A: Win = 1, Draw = 0.5, Loss = 0
 * Minimum rating is 100.
 */
export function calculateElo(params: {
  playerRating: number;
  botRating: number;
  result: "WIN" | "LOSS" | "DRAW";
}): {
  expectedScore: number;
  ratingChange: number;
  newRating: number;
  previousTier: RatingTier;
  newTier: RatingTier;
} {
  const { playerRating, botRating, result } = params;

  // Expected score for player A
  const expectedScore = 1 / (1 + Math.pow(10, (botRating - playerRating) / 400));

  // Actual outcome
  const actualScore = result === "WIN" ? 1 : result === "DRAW" ? 0.5 : 0;

  // Unbounded delta with integer rounding
  const rawDelta = Math.round(K_FACTOR * (actualScore - expectedScore));

  // New rating constrained by MIN_RATING floor
  const newRating = Math.max(MIN_RATING, playerRating + rawDelta);
  const ratingChange = newRating - playerRating;

  return {
    expectedScore,
    ratingChange,
    newRating,
    previousTier: getTier(playerRating),
    newTier: getTier(newRating),
  };
}

/**
 * Selects the rating field name for a given DuelType on the User model.
 */
export function getRatingFieldForMode(duelType: DuelType): "oneWordRating" | "mcqRating" | "typingRating" {
  if (duelType === "MCQ") return "mcqRating";
  if (duelType === "TYPING") return "typingRating";
  return "oneWordRating";
}
