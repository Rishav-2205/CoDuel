import { Response } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { getUserComprehensiveProfile } from "../services/profileStatsService";

const UpdateProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .optional(),
  avatar: z.string().min(1).max(50).optional(),
});

export async function getUserProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;

    const profile = await getUserComprehensiveProfile(userId);
    if (!profile) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Determine favorite language
    const langCounts = await prisma.match.groupBy({
      by: ["language"],
      where: { userId },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 1,
    });
    const favoriteLanguage = langCounts[0]?.language || "None yet";

    // Legacy fields maintained for backward compatibility
    res.status(200).json({
      ...profile,
      user: {
        ...profile.user,
        totalDuels: profile.overall.totalDuels,
        totalWins: profile.overall.totalWins,
        totalLosses: profile.overall.totalLosses,
        totalCorrectAnswers: profile.overall.totalCorrectAnswers,
        currentStreak: profile.user.currentStreak,
        longestStreak: profile.user.longestStreak,
        lastDuelDate: profile.user.lastDuelDate,
        oneWordRating: profile.modes.oneWord.rating,
        mcqRating: profile.modes.mcq.rating,
        typingRating: profile.modes.typing.rating,
        totalXP: profile.progression.totalXP,
        currentLevel: profile.progression.currentLevel,
      },
      favoriteLanguage,
      accuracy: profile.overall.winRate,
      totalAttempted: profile.overall.totalDuels,
      oneWordDuels: profile.modes.oneWord.totalDuels,
      mcqDuels: profile.modes.mcq.totalDuels,
      typingDuels: profile.modes.typing.totalDuels,
      oneWordWins: profile.modes.oneWord.wins,
      mcqWins: profile.modes.mcq.wins,
      typingWins: profile.modes.typing.wins,
      bestOneWordScore: profile.modes.oneWord.bestScore || 0,
      bestMcqScore: profile.modes.mcq.bestScore || 0,
      bestWpm: profile.modes.typing.bestWpm || 0,
      avgWpm: profile.modes.typing.avgWpm || 0,
      bestAccuracy: profile.modes.typing.avgAccuracy || 0,
      avgAccuracy: profile.modes.typing.avgAccuracy || 0,
      totalCharsTyped: 0,
      recentMatches: profile.recentMatches,
    });
  } catch (error) {
    console.error("GetUserProfile error:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
}

export async function updateUserProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const parseResult = UpdateProfileSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        message: parseResult.error.errors[0]?.message || "Validation failed",
      });
      return;
    }

    const { username, avatar } = parseResult.data;
    const updateData: { username?: string; avatar?: string } = {};

    if (username) {
      const existing = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: userId },
        },
      });
      if (existing) {
        res.status(409).json({ message: "Username already taken" });
        return;
      }
      updateData.username = username;
    }

    if (avatar) {
      updateData.avatar = avatar;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        currentStreak: true,
        longestStreak: true,
        totalDuels: true,
        totalWins: true,
        totalLosses: true,
        totalCorrectAnswers: true,
        oneWordRating: true,
        mcqRating: true,
        typingRating: true,
        totalXP: true,
        currentLevel: true,
      },
    });

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("UpdateUserProfile error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
}

export async function getUserMatchHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const duelType = req.query.duelType as string | undefined;
    const language = req.query.language as string | undefined;

    const whereClause: any = { userId };
    if (duelType && ["ONE_WORD", "MCQ", "TYPING"].includes(duelType)) {
      whereClause.duelType = duelType;
    }
    if (language && ["cpp", "java", "python"].includes(language)) {
      whereClause.language = language;
    }

    const matches = await prisma.match.findMany({
      where: whereClause,
      orderBy: { completedAt: "desc" },
      take: 100,
      select: {
        id: true,
        userId: true,
        botName: true,
        language: true,
        duelType: true,
        difficulty: true,
        userScore: true,
        botScore: true,
        correctAnswers: true,
        incorrectAnswers: true,
        grade: true,
        result: true,
        duration: true,
        startedAt: true,
        completedAt: true,
        userWpm: true,
        userAccuracy: true,
        userCorrectChars: true,
        userTotalChars: true,
        botWpm: true,
        botCorrectChars: true,
        botRating: true,
        ratingChange: true,
        previousRating: true,
        newRating: true,
        xpEarned: true,
      },
    });

    res.status(200).json({ matches });
  } catch (error) {
    console.error("GetUserMatchHistory error:", error);
    res.status(500).json({ message: "Failed to fetch match history" });
  }
}
