import { RatingTier } from "../types";

export interface TierConfig {
  tier: RatingTier;
  minRating: number;
  maxRating: number | null;
  textColor: string;
  borderColor: string;
  bgColor: string;
  glowColor: string;
  badgeStyle: string;
  icon: string;
  description: string;
}

export const TIERS_CONFIG: Record<RatingTier, TierConfig> = {
  Beginner: {
    tier: "Beginner",
    minRating: 100,
    maxRating: 799,
    textColor: "text-zinc-400",
    borderColor: "border-zinc-700/60",
    bgColor: "bg-zinc-800/40",
    glowColor: "shadow-zinc-500/10",
    badgeStyle: "bg-zinc-800/60 text-zinc-300 border-zinc-700",
    icon: "🌱",
    description: "Taking first competitive steps",
  },
  Novice: {
    tier: "Novice",
    minRating: 800,
    maxRating: 999,
    textColor: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    bgColor: "bg-emerald-950/30",
    glowColor: "shadow-emerald-500/20",
    badgeStyle: "bg-emerald-950/60 text-emerald-300 border-emerald-500/40",
    icon: "⚡",
    description: "Gaining syntax and problem fluency",
  },
  Intermediate: {
    tier: "Intermediate",
    minRating: 1000,
    maxRating: 1199,
    textColor: "text-blue-400",
    borderColor: "border-blue-500/30",
    bgColor: "bg-blue-950/30",
    glowColor: "shadow-blue-500/20",
    badgeStyle: "bg-blue-950/60 text-blue-300 border-blue-500/40",
    icon: "🔷",
    description: "Solid programming foundations",
  },
  Advanced: {
    tier: "Advanced",
    minRating: 1200,
    maxRating: 1399,
    textColor: "text-purple-400",
    borderColor: "border-purple-500/30",
    bgColor: "bg-purple-950/30",
    glowColor: "shadow-purple-500/20",
    badgeStyle: "bg-purple-950/60 text-purple-300 border-purple-500/40",
    icon: "🔮",
    description: "Fast, accurate and competitive",
  },
  Expert: {
    tier: "Expert",
    minRating: 1400,
    maxRating: 1599,
    textColor: "text-pink-400",
    borderColor: "border-pink-500/30",
    bgColor: "bg-pink-950/30",
    glowColor: "shadow-pink-500/20",
    badgeStyle: "bg-pink-950/60 text-pink-300 border-pink-500/40",
    icon: "💎",
    description: "Dominant speed and sharp recall",
  },
  Master: {
    tier: "Master",
    minRating: 1600,
    maxRating: 1799,
    textColor: "text-amber-400",
    borderColor: "border-amber-500/30",
    bgColor: "bg-amber-950/30",
    glowColor: "shadow-amber-500/20",
    badgeStyle: "bg-amber-950/60 text-amber-300 border-amber-500/40",
    icon: "👑",
    description: "Outplays almost every bot with ease",
  },
  Grandmaster: {
    tier: "Grandmaster",
    minRating: 1800,
    maxRating: 1999,
    textColor: "text-rose-400",
    borderColor: "border-rose-500/40",
    bgColor: "bg-rose-950/40",
    glowColor: "shadow-rose-500/30",
    badgeStyle: "bg-rose-950/70 text-rose-300 border-rose-500/50",
    icon: "🔥",
    description: "Elite-tier duelist in the arena",
  },
  Legend: {
    tier: "Legend",
    minRating: 2000,
    maxRating: null,
    textColor: "text-yellow-300 font-extrabold",
    borderColor: "border-yellow-400/60",
    bgColor: "bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20",
    glowColor: "shadow-yellow-500/30",
    badgeStyle: "bg-gradient-to-r from-yellow-950/80 to-amber-950/80 text-yellow-300 border-yellow-400/60 shadow-md shadow-yellow-500/20",
    icon: "⭐",
    description: "Top echelon grand duelist",
  },
};

export function getTierFromRating(rating: number = 1000): RatingTier {
  if (rating < 800) return "Beginner";
  if (rating < 1000) return "Novice";
  if (rating < 1200) return "Intermediate";
  if (rating < 1400) return "Advanced";
  if (rating < 1600) return "Expert";
  if (rating < 1800) return "Master";
  if (rating < 2000) return "Grandmaster";
  return "Legend";
}

export function getTierConfig(rating: number = 1000): TierConfig {
  const tier = getTierFromRating(rating);
  return TIERS_CONFIG[tier];
}
