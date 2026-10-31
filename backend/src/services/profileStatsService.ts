import { prisma } from "../db";
import { getTier, RatingTier, TierInfo, getTierInfo } from "./ratingService";
import { calculateLevelInfo, LevelInfo } from "./xpService";

export interface ModeStats {
  duelType: "ONE_WORD" | "MCQ" | "TYPING";
  rating: number;
  tier: RatingTier;
  tierInfo: TierInfo;
  totalDuels: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  bestScore?: number;
  avgWpm?: number;
  bestWpm?: number;
  avgAccuracy?: number;
}

export interface LanguageStats {
  language: "cpp" | "java" | "python";
  totalDuels: number;
  wins: number;
  winRate: number;
}

export interface RatingHistoryPoint {
  id: string;
  matchId: string;
  duelType: string;
  previousRating: number;
  newRating: number;
  ratingChange: number;
  botRating: number;
  botDifficulty: string;
  result: string;
  createdAt: string;
}

export interface ComprehensiveProfile {
  user: {
    id: string;
    username: string;
    email: string;
    avatar: string;
    createdAt: string;
    currentStreak: number;
    longestStreak: number;
    lastDuelDate: string | null;
  };
  progression: LevelInfo;
  overall: {
    totalDuels: number;
    totalWins: number;
    totalLosses: number;
    totalDraws: number;
    winRate: number;
    totalCorrectAnswers: number;
  };
  modes: {
    oneWord: ModeStats;
    mcq: ModeStats;
    typing: ModeStats;
  };
  languages: LanguageStats[];
  recentMatches: any[];
}

export async function getUserComprehensiveProfile(userId: string): Promise<ComprehensiveProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      avatar: true,
      createdAt: true,
      currentStreak: true,
      longestStreak: true,
      lastDuelDate: true,
      totalDuels: true,
      totalWins: true,
      totalLosses: true,
      totalCorrectAnswers: true,
      oneWordRating: true,
      mcqRating: true,
      typingRating: true,
      totalXP: true,
      currentLevel: true,
      totalCompletedMatches: true,
    },
  });

  if (!user) return null;

  const progression = calculateLevelInfo(user.totalXP, user.currentLevel);

  // Overall Match result counts
  const [winCount, lossCount, drawCount] = await Promise.all([
    prisma.match.count({ where: { userId, result: "WIN" } }),
    prisma.match.count({ where: { userId, result: "LOSS" } }),
    prisma.match.count({ where: { userId, result: "DRAW" } }),
  ]);
  const totalCompleted = winCount + lossCount + drawCount;
  const overallWinRate = totalCompleted > 0 ? Math.round((winCount / totalCompleted) * 100) : 0;

  // Mode: ONE_WORD
  const [owTotal, owWins, owLosses, owDraws, owBest] = await Promise.all([
    prisma.match.count({ where: { userId, duelType: "ONE_WORD" } }),
    prisma.match.count({ where: { userId, duelType: "ONE_WORD", result: "WIN" } }),
    prisma.match.count({ where: { userId, duelType: "ONE_WORD", result: "LOSS" } }),
    prisma.match.count({ where: { userId, duelType: "ONE_WORD", result: "DRAW" } }),
    prisma.match.aggregate({ where: { userId, duelType: "ONE_WORD" }, _max: { userScore: true } }),
  ]);
  const oneWord: ModeStats = {
    duelType: "ONE_WORD",
    rating: user.oneWordRating,
    tier: getTier(user.oneWordRating),
    tierInfo: getTierInfo(user.oneWordRating),
    totalDuels: owTotal,
    wins: owWins,
    losses: owLosses,
    draws: owDraws,
    winRate: owTotal > 0 ? Math.round((owWins / owTotal) * 100) : 0,
    bestScore: owBest._max.userScore || 0,
  };

  // Mode: MCQ
  const [mcqTotal, mcqWins, mcqLosses, mcqDraws, mcqBest] = await Promise.all([
    prisma.match.count({ where: { userId, duelType: "MCQ" } }),
    prisma.match.count({ where: { userId, duelType: "MCQ", result: "WIN" } }),
    prisma.match.count({ where: { userId, duelType: "MCQ", result: "LOSS" } }),
    prisma.match.count({ where: { userId, duelType: "MCQ", result: "DRAW" } }),
    prisma.match.aggregate({ where: { userId, duelType: "MCQ" }, _max: { userScore: true } }),
  ]);
  const mcq: ModeStats = {
    duelType: "MCQ",
    rating: user.mcqRating,
    tier: getTier(user.mcqRating),
    tierInfo: getTierInfo(user.mcqRating),
    totalDuels: mcqTotal,
    wins: mcqWins,
    losses: mcqLosses,
    draws: mcqDraws,
    winRate: mcqTotal > 0 ? Math.round((mcqWins / mcqTotal) * 100) : 0,
    bestScore: mcqBest._max.userScore || 0,
  };

  // Mode: TYPING
  const [typingTotal, typingWins, typingLosses, typingDraws, typingWpmAgg, typingAccAgg] = await Promise.all([
    prisma.match.count({ where: { userId, duelType: "TYPING" } }),
    prisma.match.count({ where: { userId, duelType: "TYPING", result: "WIN" } }),
    prisma.match.count({ where: { userId, duelType: "TYPING", result: "LOSS" } }),
    prisma.match.count({ where: { userId, duelType: "TYPING", result: "DRAW" } }),
    prisma.match.aggregate({
      where: { userId, duelType: "TYPING", userWpm: { not: null } },
      _max: { userWpm: true },
      _avg: { userWpm: true },
    }),
    prisma.match.aggregate({
      where: { userId, duelType: "TYPING", userAccuracy: { not: null } },
      _avg: { userAccuracy: true },
    }),
  ]);
  const typing: ModeStats = {
    duelType: "TYPING",
    rating: user.typingRating,
    tier: getTier(user.typingRating),
    tierInfo: getTierInfo(user.typingRating),
    totalDuels: typingTotal,
    wins: typingWins,
    losses: typingLosses,
    draws: typingDraws,
    winRate: typingTotal > 0 ? Math.round((typingWins / typingTotal) * 100) : 0,
    bestWpm: typingWpmAgg._max.userWpm || 0,
    avgWpm: typingWpmAgg._avg.userWpm ? Math.round(typingWpmAgg._avg.userWpm) : 0,
    avgAccuracy: typingAccAgg._avg.userAccuracy ? Math.round(typingAccAgg._avg.userAccuracy * 10) / 10 : 0,
  };

  // Languages Breakdown
  const supportedLangs: Array<"cpp" | "java" | "python"> = ["cpp", "java", "python"];
  const languages: LanguageStats[] = await Promise.all(
    supportedLangs.map(async (lang) => {
      const [total, wins] = await Promise.all([
        prisma.match.count({ where: { userId, language: lang } }),
        prisma.match.count({ where: { userId, language: lang, result: "WIN" } }),
      ]);
      return {
        language: lang,
        totalDuels: total,
        wins,
        winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
      };
    })
  );

  // Recent 10 Matches with rating change & XP
  const recentMatches = await prisma.match.findMany({
    where: { userId },
    orderBy: { completedAt: "desc" },
    take: 10,
    select: {
      id: true,
      botName: true,
      language: true,
      duelType: true,
      difficulty: true,
      userScore: true,
      botScore: true,
      result: true,
      grade: true,
      duration: true,
      completedAt: true,
      userWpm: true,
      userAccuracy: true,
      ratingChange: true,
      previousRating: true,
      newRating: true,
      xpEarned: true,
    },
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt.toISOString(),
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastDuelDate: user.lastDuelDate,
    },
    progression,
    overall: {
      totalDuels: totalCompleted,
      totalWins: winCount,
      totalLosses: lossCount,
      totalDraws: drawCount,
      winRate: overallWinRate,
      totalCorrectAnswers: user.totalCorrectAnswers,
    },
    modes: {
      oneWord,
      mcq,
      typing,
    },
    languages,
    recentMatches,
  };
}

export async function getUserRatingHistory(userId: string, duelType?: string): Promise<RatingHistoryPoint[]> {
  const whereClause: any = { userId };
  if (duelType && ["ONE_WORD", "MCQ", "TYPING"].includes(duelType)) {
    whereClause.duelType = duelType;
  }

  const history = await prisma.ratingHistory.findMany({
    where: whereClause,
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  return history.map((h) => ({
    id: h.id,
    matchId: h.matchId,
    duelType: h.duelType,
    previousRating: h.previousRating,
    newRating: h.newRating,
    ratingChange: h.ratingChange,
    botRating: h.botRating,
    botDifficulty: h.botDifficulty,
    result: h.result,
    createdAt: h.createdAt.toISOString(),
  }));
}
