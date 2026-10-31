import { Response } from "express";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../db";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { duelManager, QuestionData, DuelType } from "../game/duelManager";
import { BotDifficulty } from "../game/bot";
import { computeStreakUpdate, getTodayDateString } from "../services/streak.service";
import { calculateElo, getBotRating, getRatingFieldForMode } from "../services/ratingService";
import { calculateXpReward, calculateLevelInfo } from "../services/xpService";

const StartDuelSchema = z.object({
  language: z.enum(["cpp", "java", "python"]),
  duelType: z.enum(["ONE_WORD", "MCQ", "TYPING"]).optional().default("ONE_WORD"),
  difficulty: z.enum(["easy", "medium", "hard"]).optional().default("medium"),
});

const AnswerSchema = z.object({
  answer: z.string(),
});

const TypingProgressSchema = z.object({
  charsTyped: z.number().int().min(0),
  charsCorrect: z.number().int().min(0),
});

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function startDuel(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parseResult = StartDuelSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ message: "Invalid language, duel type, or difficulty" });
      return;
    }

    const { language, duelType, difficulty } = parseResult.data;
    const userId = req.userId!;

    const duelId = crypto.randomUUID();

    // ─── TYPING DUEL ────────────────────────────────────────────────────────────
    if (duelType === "TYPING") {
      const passages = await prisma.question.findMany({
        where: { language, duelType: "TYPING" },
      });

      if (passages.length === 0) {
        res.status(404).json({ message: `No typing passages found for ${language}` });
        return;
      }

      const passage = passages[Math.floor(Math.random() * passages.length)];

      const duel = duelManager.createDuel({
        id: duelId,
        userId,
        language,
        duelType: "TYPING",
        difficulty: difficulty as BotDifficulty,
        questions: [],
        durationMs: 30000,
        typingPassage: { id: passage.id, text: passage.question },
      });

      res.status(201).json({
        duelId: duel.id,
        language: duel.language,
        duelType: duel.duelType,
        difficulty: duel.difficulty,
        bot: {
          name: duel.bot.name,
          avatar: duel.bot.avatar,
          difficulty: duel.bot.difficulty,
          botRating: getBotRating(duel.difficulty),
        },
        durationMs: duel.durationMs,
        startedAt: duel.startedAt,
        passage: passage.question,
        passageId: passage.id,
        totalQuestions: 0,
        firstQuestion: null,
      });
      return;
    }

    // ─── ONE_WORD / MCQ DUEL ─────────────────────────────────────────────────────
    const dbQuestions = await prisma.question.findMany({
      where: { language, duelType },
    });

    if (dbQuestions.length === 0) {
      res.status(404).json({ message: `No questions found for ${language} in ${duelType} mode` });
      return;
    }

    const shuffled = shuffleArray(dbQuestions);

    const questionData: QuestionData[] = shuffled.map((q) => {
      let aliases: string[] = [];
      if (Array.isArray(q.acceptedAliases)) {
        aliases = q.acceptedAliases as string[];
      }
      let options: string[] = [];
      if (Array.isArray(q.options)) {
        options = q.options as string[];
      }
      return {
        id: q.id,
        question: q.question,
        language: q.language,
        duelType: (q.duelType as DuelType) || "ONE_WORD",
        correctAnswer: q.correctAnswer,
        acceptedAliases: aliases,
        options,
      };
    });

    const duel = duelManager.createDuel({
      id: duelId,
      userId,
      language,
      duelType: duelType as DuelType,
      difficulty: difficulty as BotDifficulty,
      questions: questionData,
      durationMs: 60000,
    });

    const firstQuestion = duelManager.getSanitizedCurrentQuestion(duel);

    res.status(201).json({
      duelId: duel.id,
      language: duel.language,
      duelType: duel.duelType,
      difficulty: duel.difficulty,
      bot: {
        name: duel.bot.name,
        avatar: duel.bot.avatar,
        difficulty: duel.bot.difficulty,
        botRating: getBotRating(duel.difficulty),
      },
      durationMs: duel.durationMs,
      startedAt: duel.startedAt,
      firstQuestion,
      totalQuestions: questionData.length,
    });
  } catch (error) {
    console.error("StartDuel error:", error);
    res.status(500).json({ message: "Failed to initialize duel" });
  }
}

export async function answerQuestion(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const parseResult = AnswerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ message: "Answer string required" });
      return;
    }

    const duel = duelManager.getDuel(id);
    if (!duel) {
      res.status(404).json({ message: "Duel session not found" });
      return;
    }

    if (duel.userId !== req.userId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const result = duelManager.answerQuestion(id, parseResult.data.answer);
    res.status(200).json(result);
  } catch (error: any) {
    console.error("AnswerQuestion error:", error);
    res.status(500).json({ message: error.message || "Failed to submit answer" });
  }
}

export async function skipQuestion(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const duel = duelManager.getDuel(id);
    if (!duel) {
      res.status(404).json({ message: "Duel session not found" });
      return;
    }

    if (duel.userId !== req.userId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const result = duelManager.skipQuestion(id);
    res.status(200).json(result);
  } catch (error: any) {
    console.error("SkipQuestion error:", error);
    res.status(500).json({ message: error.message || "Failed to skip question" });
  }
}

export async function getDuelStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const duel = duelManager.getDuel(id);
    if (!duel) {
      res.status(404).json({ message: "Duel session not found" });
      return;
    }

    const timeRemainingMs = duelManager.getTimeRemainingMs(duel);
    const { botScore, botAttempted } = duelManager.getBotScore(duel);

    res.status(200).json({
      duelId: duel.id,
      duelType: duel.duelType,
      userScore: duel.userScore,
      botScore,
      botAttempted,
      correctAnswers: duel.correctAnswers,
      incorrectAnswers: duel.incorrectAnswers,
      timeRemainingMs,
      isFinished: duel.isFinished || timeRemainingMs === 0,
    });
  } catch (error) {
    console.error("GetDuelStatus error:", error);
    res.status(500).json({ message: "Failed to get duel status" });
  }
}

export async function submitTypingProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const parseResult = TypingProgressSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ message: "charsTyped and charsCorrect required" });
      return;
    }

    const duel = duelManager.getDuel(id);
    if (!duel) {
      res.status(404).json({ message: "Duel session not found" });
      return;
    }

    if (duel.userId !== req.userId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    if (duel.duelType !== "TYPING") {
      res.status(400).json({ message: "Not a typing duel" });
      return;
    }

    const { charsTyped, charsCorrect } = parseResult.data;
    const result = duelManager.submitTypingProgress(id, charsTyped, charsCorrect);
    res.status(200).json(result);
  } catch (error: any) {
    console.error("SubmitTypingProgress error:", error);
    res.status(500).json({ message: error.message || "Failed to update typing progress" });
  }
}

export async function finishDuel(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const userId = req.userId!;

    const existingDuel = duelManager.getDuel(id);
    if (!existingDuel || existingDuel.isFinished) {
      // Check if already persisted (idempotent response)
      const persistedMatch = await prisma.match.findUnique({
        where: { id },
      });
      if (persistedMatch && persistedMatch.userId === userId) {
        const persistedUser = await prisma.user.findUnique({ where: { id: userId } });
        res.status(200).json({
          match: persistedMatch,
          updatedUser: persistedUser,
          alreadyFinished: true,
        });
        return;
      }
      if (!existingDuel) {
        res.status(404).json({ message: "Duel session not found or already closed" });
        return;
      }
    }

    if (existingDuel.userId !== userId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    // Finish duel on duelManager
    const { duel, finalBotScore, grade, result, typingResult } = duelManager.finishDuel(id);

    // Fetch user for rating, XP, and streak calculation
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // ─── 1. ELO RATING CALCULATION ──────────────────────────────────────────────
    const ratingField = getRatingFieldForMode(duel.duelType);
    const playerRating = user[ratingField] ?? 1000;
    const botRating = getBotRating(duel.difficulty);

    const eloResult = calculateElo({
      playerRating,
      botRating,
      result,
    });

    // ─── 2. XP & LEVEL CALCULATION ──────────────────────────────────────────────
    const todayStr = getTodayDateString();
    const isFirstDuelOfDay = user.lastDuelDate !== todayStr;
    const xpBreakdown = calculateXpReward({
      result,
      isFirstDuelOfDay,
    });

    const newTotalXp = user.totalXP + xpBreakdown.totalXpEarned;
    const levelInfo = calculateLevelInfo(newTotalXp, user.currentLevel);

    // ─── 3. STREAK CALCULATION ──────────────────────────────────────────────────
    const streakUpdate = computeStreakUpdate(
      user.currentStreak,
      user.longestStreak,
      user.lastDuelDate,
      todayStr
    );

    // ─── 4. ASSEMBLE MATCH RECORD ───────────────────────────────────────────────
    const matchData: any = {
      id: duel.id,
      userId: user.id,
      botName: duel.bot.name,
      language: duel.language,
      duelType: duel.duelType,
      difficulty: duel.difficulty,
      userScore: duel.duelType === "TYPING" ? (typingResult?.userCorrectChars ?? 0) : duel.userScore,
      botScore: finalBotScore,
      correctAnswers: duel.duelType === "TYPING" ? (typingResult?.userCorrectChars ?? 0) : duel.correctAnswers,
      incorrectAnswers: duel.duelType === "TYPING" ? (typingResult?.userTotalChars ?? 0) - (typingResult?.userCorrectChars ?? 0) : duel.incorrectAnswers,
      grade,
      result,
      duration: Math.round(duel.durationMs / 1000),
      startedAt: new Date(duel.startedAt),
      completedAt: new Date(),
      botRating,
      ratingChange: eloResult.ratingChange,
      previousRating: playerRating,
      newRating: eloResult.newRating,
      xpEarned: xpBreakdown.totalXpEarned,
    };

    if (typingResult) {
      matchData.userWpm = typingResult.userWpm;
      matchData.userAccuracy = typingResult.userAccuracy;
      matchData.userCorrectChars = typingResult.userCorrectChars;
      matchData.userTotalChars = typingResult.userTotalChars;
      matchData.botWpm = typingResult.botWpm;
      matchData.botCorrectChars = typingResult.botCorrectChars;
      matchData.referencePassageId = typingResult.passageId;
    }

    // ─── 5. ATOMIC DATABASE TRANSACTION ─────────────────────────────────────────
    const userUpdateData: any = {
      totalDuels: { increment: 1 },
      totalCompletedMatches: { increment: 1 },
      totalWins: { increment: result === "WIN" ? 1 : 0 },
      totalLosses: { increment: result === "LOSS" ? 1 : 0 },
      totalCorrectAnswers: {
        increment: duel.duelType === "TYPING" ? (typingResult?.userCorrectChars ?? 0) : duel.correctAnswers,
      },
      currentStreak: streakUpdate.currentStreak,
      longestStreak: streakUpdate.longestStreak,
      lastDuelDate: streakUpdate.lastDuelDate,
      totalXP: newTotalXp,
      currentLevel: levelInfo.currentLevel,
      [ratingField]: eloResult.newRating,
    };

    const [savedMatch, updatedUser, ratingHistoryRecord] = await prisma.$transaction([
      prisma.match.create({ data: matchData }),
      prisma.user.update({
        where: { id: user.id },
        data: userUpdateData,
        select: {
          id: true,
          username: true,
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
          totalCompletedMatches: true,
        },
      }),
      prisma.ratingHistory.create({
        data: {
          userId: user.id,
          matchId: duel.id,
          duelType: duel.duelType,
          previousRating: playerRating,
          newRating: eloResult.newRating,
          ratingChange: eloResult.ratingChange,
          botRating,
          botDifficulty: duel.difficulty,
          result,
        },
      }),
    ]);

    res.status(200).json({
      match: savedMatch,
      updatedUser,
      ratingUpdate: {
        duelType: duel.duelType,
        previousRating: playerRating,
        newRating: eloResult.newRating,
        ratingChange: eloResult.ratingChange,
        previousTier: eloResult.previousTier,
        newTier: eloResult.newTier,
        botRating,
      },
      xpUpdate: {
        xpEarned: xpBreakdown.totalXpEarned,
        breakdown: xpBreakdown,
        totalXP: newTotalXp,
        currentLevel: levelInfo.currentLevel,
        isLevelUp: levelInfo.isLevelUp,
        currentLevelXp: levelInfo.currentLevelXp,
        xpForCurrentLevel: levelInfo.xpForCurrentLevel,
        xpToNextLevel: levelInfo.xpToNextLevel,
        progressPercent: levelInfo.progressPercent,
      },
      typingResult: typingResult ?? null,
      streakUpdate: {
        currentStreak: streakUpdate.currentStreak,
        longestStreak: streakUpdate.longestStreak,
        isStreakIncremented: streakUpdate.isStreakIncremented,
      },
    });
  } catch (error) {
    console.error("FinishDuel error:", error);
    res.status(500).json({ message: "Failed to persist duel results" });
  }
}
