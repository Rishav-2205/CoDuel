export type Language = "cpp" | "java" | "python";
export type DuelType = "ONE_WORD" | "MCQ" | "TYPING";
export type BotDifficulty = "easy" | "medium" | "hard";
export type DuelGrade = "F" | "D" | "C" | "B" | "A" | "S";
export type DuelResult = "WIN" | "LOSS" | "DRAW";

export type RatingTier =
  | "Beginner"
  | "Novice"
  | "Intermediate"
  | "Advanced"
  | "Expert"
  | "Master"
  | "Grandmaster"
  | "Legend";

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  currentStreak: number;
  longestStreak: number;
  lastDuelDate?: string | null;
  totalDuels: number;
  totalWins: number;
  totalLosses: number;
  totalCorrectAnswers: number;
  // Rating & Progression v1.0
  oneWordRating?: number;
  mcqRating?: number;
  typingRating?: number;
  totalXP?: number;
  currentLevel?: number;
  totalCompletedMatches?: number;
  createdAt: string;
}

export interface SanitizedQuestion {
  id: string;
  question: string;
  language: string;
  duelType: DuelType;
  index: number;
  options?: string[];
}

export interface BotInfo {
  name: string;
  avatar: string;
  difficulty: BotDifficulty;
  botRating?: number;
}

export interface Match {
  id: string;
  userId: string;
  botName: string;
  language: Language;
  duelType: DuelType;
  difficulty: BotDifficulty;
  userScore: number;
  botScore: number;
  correctAnswers: number;
  incorrectAnswers: number;
  grade: DuelGrade;
  result: DuelResult;
  duration: number;
  startedAt: string;
  completedAt: string;
  // Typing-specific fields (nullable)
  userWpm?: number | null;
  userAccuracy?: number | null;
  userCorrectChars?: number | null;
  userTotalChars?: number | null;
  botWpm?: number | null;
  botCorrectChars?: number | null;
  // Rating & Progression v1.0
  botRating?: number;
  ratingChange?: number | null;
  previousRating?: number | null;
  newRating?: number | null;
  xpEarned?: number | null;
}

export interface RatingUpdate {
  duelType: DuelType;
  previousRating: number;
  newRating: number;
  ratingChange: number;
  previousTier: RatingTier;
  newTier: RatingTier;
  botRating: number;
}

export interface XpBreakdown {
  completionXp: number;
  resultBonusXp: number;
  dailyBonusXp: number;
  totalXpEarned: number;
}

export interface XpUpdate {
  xpEarned: number;
  breakdown: XpBreakdown;
  totalXP: number;
  currentLevel: number;
  isLevelUp: boolean;
  currentLevelXp: number;
  xpForCurrentLevel: number;
  xpToNextLevel: number;
  progressPercent: number;
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

export interface ModeStats {
  duelType: "ONE_WORD" | "MCQ" | "TYPING";
  rating: number;
  tier: RatingTier;
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

export interface LevelInfo {
  currentLevel: number;
  totalXP: number;
  currentLevelXp: number;
  xpForCurrentLevel: number;
  xpToNextLevel: number;
  progressPercent: number;
  isLevelUp?: boolean;
}

export interface ProfileDetails {
  user: User;
  favoriteLanguage: string;
  accuracy: number;
  totalAttempted: number;
  oneWordDuels: number;
  mcqDuels: number;
  typingDuels: number;
  oneWordWins: number;
  mcqWins: number;
  typingWins: number;
  bestOneWordScore: number;
  bestMcqScore: number;
  bestWpm: number;
  avgWpm: number;
  bestAccuracy: number;
  avgAccuracy: number;
  totalCharsTyped: number;
  recentMatches: Match[];
  progression?: LevelInfo;
  overall?: {
    totalDuels: number;
    totalWins: number;
    totalLosses: number;
    totalDraws: number;
    winRate: number;
    totalCorrectAnswers: number;
  };
  modes?: {
    oneWord: ModeStats;
    mcq: ModeStats;
    typing: ModeStats;
  };
  languages?: LanguageStats[];
}

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
  streak?: number;
  totalCorrectAnswers?: number;
}
