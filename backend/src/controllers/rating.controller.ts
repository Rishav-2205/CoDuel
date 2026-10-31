import { Response } from "express";
import { prisma } from "../db";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { getTier, getTierInfo } from "../services/ratingService";
import { getUserRatingHistory } from "../services/profileStatsService";

export async function getMyRatings(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        oneWordRating: true,
        mcqRating: true,
        typingRating: true,
        totalXP: true,
        currentLevel: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      ratings: {
        oneWord: {
          rating: user.oneWordRating,
          tier: getTier(user.oneWordRating),
          tierInfo: getTierInfo(user.oneWordRating),
        },
        mcq: {
          rating: user.mcqRating,
          tier: getTier(user.mcqRating),
          tierInfo: getTierInfo(user.mcqRating),
        },
        typing: {
          rating: user.typingRating,
          tier: getTier(user.typingRating),
          tierInfo: getTierInfo(user.typingRating),
        },
      },
      progression: {
        totalXP: user.totalXP,
        currentLevel: user.currentLevel,
      },
    });
  } catch (error) {
    console.error("GetMyRatings error:", error);
    res.status(500).json({ message: "Failed to fetch ratings" });
  }
}

export async function getMyRatingHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const mode = req.query.mode as string | undefined;

    const history = await getUserRatingHistory(userId, mode);
    res.status(200).json({ history });
  } catch (error) {
    console.error("GetMyRatingHistory error:", error);
    res.status(500).json({ message: "Failed to fetch rating history" });
  }
}
