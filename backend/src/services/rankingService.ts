import { prisma } from "../db";
import { getTier, RatingTier } from "./ratingService";

export type LeaderboardCategory = "OVERALL" | "ONE_WORD" | "MCQ" | "TYPING";
export type LeaderboardPeriod = "ALL_TIME" | "MONTHLY" | "WEEKLY";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  rating?: number;
  xp?: number;
  level?: number;
  tier?: RatingTier;
  totalDuels: number;
  wins: number;
  winRate: number;
  duelType?: string;
}

export interface LeaderboardResponse {
  category: LeaderboardCategory;
  period: LeaderboardPeriod;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  leaderboard: LeaderboardEntry[];
}

function getPeriodStartDate(period: LeaderboardPeriod): Date | null {
  const now = new Date();
  if (period === "WEEKLY") {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  if (period === "MONTHLY") {
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  return null;
}

export async function getLeaderboardData(params: {
  category: LeaderboardCategory;
  period?: LeaderboardPeriod;
  page?: number;
  limit?: number;
}): Promise<LeaderboardResponse> {
  const category = params.category || "OVERALL";
  const period = params.period || "ALL_TIME";
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  const startDate = getPeriodStartDate(period);

  // ─── 1. OVERALL XP LEADERBOARD ─────────────────────────────────────────────
  if (category === "OVERALL") {
    if (startDate) {
      // Time-filtered XP leaderboard: sum matches completed within period
      const matchAgg = await prisma.match.groupBy({
        by: ["userId"],
        where: { completedAt: { gte: startDate } },
        _sum: { xpEarned: true },
        _count: { id: true },
        orderBy: { _sum: { xpEarned: "desc" } },
      });

      const total = matchAgg.length;
      const paginatedAgg = matchAgg.slice(skip, skip + limit);
      const userIds = paginatedAgg.map((m) => m.userId);

      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, username: true, avatar: true, currentLevel: true },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));

      // Count wins within period
      const winsAgg = await prisma.match.groupBy({
        by: ["userId"],
        where: { completedAt: { gte: startDate }, result: "WIN", userId: { in: userIds } },
        _count: { id: true },
      });
      const winsMap = new Map(winsAgg.map((w) => [w.userId, w._count.id]));

      const leaderboard: LeaderboardEntry[] = paginatedAgg.map((item, idx) => {
        const u = userMap.get(item.userId);
        const wins = winsMap.get(item.userId) || 0;
        const totalDuels = item._count.id;
        const winRate = totalDuels > 0 ? Math.round((wins / totalDuels) * 100) : 0;
        return {
          rank: skip + idx + 1,
          userId: item.userId,
          username: u?.username || "Unknown Duelist",
          avatar: u?.avatar || "code-ninja",
          xp: item._sum.xpEarned || 0,
          level: u?.currentLevel || 1,
          totalDuels,
          wins,
          winRate,
        };
      });

      return {
        category,
        period,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        leaderboard,
      };
    }

    // ALL_TIME OVERALL XP LEADERBOARD
    const [total, users] = await Promise.all([
      prisma.user.count({ where: { totalDuels: { gt: 0 } } }),
      prisma.user.findMany({
        where: { totalDuels: { gt: 0 } },
        orderBy: [{ totalXP: "desc" }, { totalCompletedMatches: "desc" }, { totalWins: "desc" }],
        skip,
        take: limit,
        select: {
          id: true,
          username: true,
          avatar: true,
          totalXP: true,
          currentLevel: true,
          totalDuels: true,
          totalWins: true,
        },
      }),
    ]);

    const leaderboard: LeaderboardEntry[] = users.map((u, idx) => {
      const winRate = u.totalDuels > 0 ? Math.round((u.totalWins / u.totalDuels) * 100) : 0;
      return {
        rank: skip + idx + 1,
        userId: u.id,
        username: u.username,
        avatar: u.avatar,
        xp: u.totalXP,
        level: u.currentLevel,
        totalDuels: u.totalDuels,
        wins: u.totalWins,
        winRate,
      };
    });

    return {
      category,
      period,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      leaderboard,
    };
  }

  // ─── 2. MODE-SPECIFIC LEADERBOARDS (ONE_WORD, MCQ, TYPING) ─────────────────
  const modeKey = category; // "ONE_WORD" | "MCQ" | "TYPING"
  const ratingField =
    category === "ONE_WORD"
      ? "oneWordRating"
      : category === "MCQ"
      ? "mcqRating"
      : "typingRating";

  if (startDate) {
    // Active players in period for this duelType
    const activeMatches = await prisma.match.groupBy({
      by: ["userId"],
      where: { duelType: modeKey, completedAt: { gte: startDate } },
      _count: { id: true },
    });

    const activeUserIds = activeMatches.map((m) => m.userId);
    const duelCountMap = new Map(activeMatches.map((m) => [m.userId, m._count.id]));

    if (activeUserIds.length === 0) {
      return {
        category,
        period,
        total: 0,
        page,
        limit,
        totalPages: 1,
        leaderboard: [],
      };
    }

    const winsAgg = await prisma.match.groupBy({
      by: ["userId"],
      where: {
        duelType: modeKey,
        completedAt: { gte: startDate },
        result: "WIN",
        userId: { in: activeUserIds },
      },
      _count: { id: true },
    });
    const winsMap = new Map(winsAgg.map((w) => [w.userId, w._count.id]));

    const users = await prisma.user.findMany({
      where: { id: { in: activeUserIds } },
      select: {
        id: true,
        username: true,
        avatar: true,
        oneWordRating: true,
        mcqRating: true,
        typingRating: true,
      },
      orderBy: { [ratingField]: "desc" },
    });

    const total = users.length;
    const paginatedUsers = users.slice(skip, skip + limit);

    const leaderboard: LeaderboardEntry[] = paginatedUsers.map((u, idx) => {
      const rating = (u as any)[ratingField] || 1000;
      const totalDuels = duelCountMap.get(u.id) || 0;
      const wins = winsMap.get(u.id) || 0;
      const winRate = totalDuels > 0 ? Math.round((wins / totalDuels) * 100) : 0;
      return {
        rank: skip + idx + 1,
        userId: u.id,
        username: u.username,
        avatar: u.avatar,
        rating,
        tier: getTier(rating),
        totalDuels,
        wins,
        winRate,
        duelType: category,
      };
    });

    return {
      category,
      period,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      leaderboard,
    };
  }

  // ALL_TIME MODE LEADERBOARD
  // Find users who have completed at least one match in this mode
  const modeUsersAgg = await prisma.match.groupBy({
    by: ["userId"],
    where: { duelType: modeKey },
    _count: { id: true },
  });
  const modeUserIds = modeUsersAgg.map((m) => m.userId);
  const duelCountMap = new Map(modeUsersAgg.map((m) => [m.userId, m._count.id]));

  if (modeUserIds.length === 0) {
    return {
      category,
      period,
      total: 0,
      page,
      limit,
      totalPages: 1,
      leaderboard: [],
    };
  }

  const winsAgg = await prisma.match.groupBy({
    by: ["userId"],
    where: { duelType: modeKey, result: "WIN", userId: { in: modeUserIds } },
    _count: { id: true },
  });
  const winsMap = new Map(winsAgg.map((w) => [w.userId, w._count.id]));

  const [total, users] = await Promise.all([
    prisma.user.count({ where: { id: { in: modeUserIds } } }),
    prisma.user.findMany({
      where: { id: { in: modeUserIds } },
      orderBy: { [ratingField]: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        username: true,
        avatar: true,
        oneWordRating: true,
        mcqRating: true,
        typingRating: true,
      },
    }),
  ]);

  const leaderboard: LeaderboardEntry[] = users.map((u, idx) => {
    const rating = (u as any)[ratingField] || 1000;
    const totalDuels = duelCountMap.get(u.id) || 0;
    const wins = winsMap.get(u.id) || 0;
    const winRate = totalDuels > 0 ? Math.round((wins / totalDuels) * 100) : 0;
    return {
      rank: skip + idx + 1,
      userId: u.id,
      username: u.username,
      avatar: u.avatar,
      rating,
      tier: getTier(rating),
      totalDuels,
      wins,
      winRate,
      duelType: category,
    };
  });

  return {
    category,
    period,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    leaderboard,
  };
}
