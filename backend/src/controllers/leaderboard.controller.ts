import { Request, Response } from "express";
import { getLeaderboardData, LeaderboardCategory, LeaderboardPeriod } from "../services/rankingService";

export async function getLeaderboard(req: Request, res: Response): Promise<void> {
  try {
    const rawMode = (req.query.mode as string | undefined)?.toUpperCase();
    const rawPeriod = (req.query.period as string | undefined)?.toUpperCase();
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;

    let category: LeaderboardCategory = "OVERALL";
    if (rawMode === "ONE_WORD" || rawMode === "ONEWORD") category = "ONE_WORD";
    else if (rawMode === "MCQ") category = "MCQ";
    else if (rawMode === "TYPING") category = "TYPING";
    else if (rawMode === "OVERALL") category = "OVERALL";

    let period: LeaderboardPeriod = "ALL_TIME";
    if (rawPeriod === "WEEKLY" || rawPeriod === "WEEK") period = "WEEKLY";
    else if (rawPeriod === "MONTHLY" || rawPeriod === "MONTH") period = "MONTHLY";

    const result = await getLeaderboardData({
      category,
      period,
      page,
      limit,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("GetLeaderboard error:", error);
    res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
}
