import { BotDifficulty, BotProfile, BotTimelineEvent, createRandomBot, generateBotTimeline } from "./bot";

export type DuelType = "ONE_WORD" | "MCQ" | "TYPING";

export interface SanitizedQuestion {
  id: string;
  question: string;
  language: string;
  duelType: DuelType;
  index: number;
  options?: string[];
}

export interface QuestionData {
  id: string;
  question: string;
  language: string;
  duelType: DuelType;
  correctAnswer: string;
  acceptedAliases: string[];
  options: string[];
}

export interface TypingStats {
  passageText: string;
  passageId: string;
  userTotalChars: number;
  userCorrectChars: number;
  lastUpdateMs: number;
}

export interface ActiveDuel {
  id: string;
  userId: string;
  language: string;
  duelType: DuelType;
  difficulty: BotDifficulty;
  bot: BotProfile;
  botTimeline: BotTimelineEvent[];
  startedAt: number; // Unix timestamp ms
  durationMs: number;
  questions: QuestionData[];
  currentQuestionIndex: number;
  userScore: number;
  correctAnswers: number;
  incorrectAnswers: number;
  isFinished: boolean;
  typingStats?: TypingStats;
  history: Array<{
    questionId: string;
    question: string;
    submittedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
}

export class DuelManager {
  private activeDuels: Map<string, ActiveDuel> = new Map();

  createDuel(params: {
    id: string;
    userId: string;
    language: string;
    duelType: DuelType;
    difficulty: BotDifficulty;
    questions: QuestionData[];
    durationMs?: number;
    typingPassage?: { id: string; text: string };
  }): ActiveDuel {
    const bot = createRandomBot(params.difficulty);
    const durationMs = params.durationMs ?? 60000;
    const botTimeline = generateBotTimeline(params.difficulty, durationMs);

    const duel: ActiveDuel = {
      id: params.id,
      userId: params.userId,
      language: params.language,
      duelType: params.duelType,
      difficulty: params.difficulty,
      bot,
      botTimeline,
      startedAt: Date.now(),
      durationMs,
      questions: params.questions,
      currentQuestionIndex: 0,
      userScore: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      isFinished: false,
      history: [],
    };

    if (params.duelType === "TYPING" && params.typingPassage) {
      duel.typingStats = {
        passageText: params.typingPassage.text,
        passageId: params.typingPassage.id,
        userTotalChars: 0,
        userCorrectChars: 0,
        lastUpdateMs: 0,
      };
    }

    this.activeDuels.set(duel.id, duel);
    return duel;
  }

  getDuel(id: string): ActiveDuel | undefined {
    return this.activeDuels.get(id);
  }

  getSanitizedCurrentQuestion(duel: ActiveDuel): SanitizedQuestion | null {
    if (duel.currentQuestionIndex >= duel.questions.length) {
      return null;
    }
    const q = duel.questions[duel.currentQuestionIndex];
    return {
      id: q.id,
      question: q.question,
      language: q.language,
      duelType: duel.duelType,
      index: duel.currentQuestionIndex + 1,
      options: duel.duelType === "MCQ" ? q.options : undefined,
    };
  }

  getBotScore(duel: ActiveDuel, currentMs?: number): { botScore: number; botAttempted: number } {
    const elapsed = (currentMs ?? Date.now()) - duel.startedAt;
    let score = 0;
    let attempted = 0;

    for (const evt of duel.botTimeline) {
      if (evt.scheduledAtMs <= elapsed) {
        attempted++;
        if (evt.isCorrect) score++;
      } else {
        break;
      }
    }

    return { botScore: score, botAttempted: attempted };
  }

  getTimeRemainingMs(duel: ActiveDuel): number {
    const elapsed = Date.now() - duel.startedAt;
    const remaining = duel.durationMs - elapsed;
    return Math.max(0, remaining);
  }

  isDuelExpired(duel: ActiveDuel, gracePeriodMs: number = 2000): boolean {
    const elapsed = Date.now() - duel.startedAt;
    return elapsed >= duel.durationMs + gracePeriodMs;
  }

  validateAnswer(q: QuestionData, rawInput: string): boolean {
    const normalizedInput = rawInput.trim().toLowerCase();
    const normalizedCorrect = q.correctAnswer.trim().toLowerCase();

    // Direct match (case-insensitive & trimmed)
    if (normalizedInput === normalizedCorrect) return true;

    // For MCQ, support letter choice (e.g. "A", "B", "C", "D")
    if (q.duelType === "MCQ" && q.options && q.options.length >= 4) {
      const letters = ["a", "b", "c", "d"];
      const letterIndex = letters.indexOf(normalizedInput);
      if (letterIndex !== -1 && q.options[letterIndex]) {
        if (q.options[letterIndex].trim().toLowerCase() === normalizedCorrect) {
          return true;
        }
      }
    }

    // Check accepted aliases (primarily for One-Word)
    for (const alias of q.acceptedAliases) {
      if (typeof alias === "string" && normalizedInput === alias.trim().toLowerCase()) {
        return true;
      }
    }

    return false;
  }

  /**
   * Update typing progress for a Typing Duel (called periodically from client).
   */
  submitTypingProgress(
    duelId: string,
    charsTyped: number,
    charsCorrect: number
  ): { success: boolean; timeRemainingMs: number; isFinished: boolean } {
    const duel = this.activeDuels.get(duelId);
    if (!duel || duel.duelType !== "TYPING") {
      throw new Error("Typing duel not found");
    }

    if (duel.isFinished || this.isDuelExpired(duel)) {
      duel.isFinished = true;
      return { success: false, timeRemainingMs: 0, isFinished: true };
    }

    if (duel.typingStats) {
      duel.typingStats.userTotalChars = Math.max(duel.typingStats.userTotalChars, charsTyped);
      duel.typingStats.userCorrectChars = Math.max(duel.typingStats.userCorrectChars, charsCorrect);
      duel.typingStats.lastUpdateMs = Date.now() - duel.startedAt;
    }

    const timeRemainingMs = this.getTimeRemainingMs(duel);
    return { success: true, timeRemainingMs, isFinished: timeRemainingMs === 0 };
  }

  answerQuestion(
    duelId: string,
    rawAnswer: string
  ): {
    success: boolean;
    isCorrect: boolean;
    userScore: number;
    correctAnswers: number;
    incorrectAnswers: number;
    nextQuestion: SanitizedQuestion | null;
    botScore: number;
    timeRemainingMs: number;
    isFinished: boolean;
  } {
    const duel = this.activeDuels.get(duelId);
    if (!duel) {
      throw new Error("Duel not found");
    }

    if (duel.isFinished || this.isDuelExpired(duel)) {
      duel.isFinished = true;
      const { botScore } = this.getBotScore(duel);
      return {
        success: false,
        isCorrect: false,
        userScore: duel.userScore,
        correctAnswers: duel.correctAnswers,
        incorrectAnswers: duel.incorrectAnswers,
        nextQuestion: null,
        botScore,
        timeRemainingMs: 0,
        isFinished: true,
      };
    }

    const currentQ = duel.questions[duel.currentQuestionIndex];
    if (!currentQ) {
      duel.isFinished = true;
      const { botScore } = this.getBotScore(duel);
      return {
        success: true,
        isCorrect: false,
        userScore: duel.userScore,
        correctAnswers: duel.correctAnswers,
        incorrectAnswers: duel.incorrectAnswers,
        nextQuestion: null,
        botScore,
        timeRemainingMs: this.getTimeRemainingMs(duel),
        isFinished: true,
      };
    }

    const isCorrect = this.validateAnswer(currentQ, rawAnswer);

    if (isCorrect) {
      duel.userScore += 1;
      duel.correctAnswers += 1;
    } else {
      duel.incorrectAnswers += 1;
    }

    duel.history.push({
      questionId: currentQ.id,
      question: currentQ.question,
      submittedAnswer: rawAnswer.trim(),
      correctAnswer: currentQ.correctAnswer,
      isCorrect,
    });

    duel.currentQuestionIndex += 1;
    const nextQuestion = this.getSanitizedCurrentQuestion(duel);
    const { botScore } = this.getBotScore(duel);
    const timeRemainingMs = this.getTimeRemainingMs(duel);

    return {
      success: true,
      isCorrect,
      userScore: duel.userScore,
      correctAnswers: duel.correctAnswers,
      incorrectAnswers: duel.incorrectAnswers,
      nextQuestion,
      botScore,
      timeRemainingMs,
      isFinished: nextQuestion === null || timeRemainingMs === 0,
    };
  }

  skipQuestion(
    duelId: string
  ): {
    success: boolean;
    userScore: number;
    correctAnswers: number;
    incorrectAnswers: number;
    nextQuestion: SanitizedQuestion | null;
    botScore: number;
    timeRemainingMs: number;
    isFinished: boolean;
  } {
    const duel = this.activeDuels.get(duelId);
    if (!duel) {
      throw new Error("Duel not found");
    }

    if (duel.isFinished || this.isDuelExpired(duel)) {
      duel.isFinished = true;
      const { botScore } = this.getBotScore(duel);
      return {
        success: false,
        userScore: duel.userScore,
        correctAnswers: duel.correctAnswers,
        incorrectAnswers: duel.incorrectAnswers,
        nextQuestion: null,
        botScore,
        timeRemainingMs: 0,
        isFinished: true,
      };
    }

    const currentQ = duel.questions[duel.currentQuestionIndex];
    if (currentQ) {
      duel.incorrectAnswers += 1;
      duel.history.push({
        questionId: currentQ.id,
        question: currentQ.question,
        submittedAnswer: "(skipped)",
        correctAnswer: currentQ.correctAnswer,
        isCorrect: false,
      });
      duel.currentQuestionIndex += 1;
    }

    const nextQuestion = this.getSanitizedCurrentQuestion(duel);
    const { botScore } = this.getBotScore(duel);
    const timeRemainingMs = this.getTimeRemainingMs(duel);

    return {
      success: true,
      userScore: duel.userScore,
      correctAnswers: duel.correctAnswers,
      incorrectAnswers: duel.incorrectAnswers,
      nextQuestion,
      botScore,
      timeRemainingMs,
      isFinished: nextQuestion === null || timeRemainingMs === 0,
    };
  }

  calculateGrade(correctAnswers: number): "F" | "D" | "C" | "B" | "A" | "S" {
    if (correctAnswers <= 2) return "F";
    if (correctAnswers <= 5) return "D";
    if (correctAnswers <= 8) return "C";
    if (correctAnswers <= 11) return "B";
    if (correctAnswers <= 14) return "A";
    return "S";
  }

  calculateTypingGrade(wpm: number): "F" | "D" | "C" | "B" | "A" | "S" {
    if (wpm < 15) return "F";
    if (wpm < 25) return "D";
    if (wpm < 35) return "C";
    if (wpm < 50) return "B";
    if (wpm < 70) return "A";
    return "S";
  }

  finishDuel(duelId: string): {
    duel: ActiveDuel;
    finalBotScore: number;
    grade: "F" | "D" | "C" | "B" | "A" | "S";
    result: "WIN" | "LOSS" | "DRAW";
    typingResult?: {
      userWpm: number;
      userAccuracy: number;
      userCorrectChars: number;
      userTotalChars: number;
      botWpm: number;
      botAccuracy: number;
      botCorrectChars: number;
      passageId: string;
    };
  } {
    const duel = this.activeDuels.get(duelId);
    if (!duel) {
      throw new Error("Duel not found");
    }

    duel.isFinished = true;

    // Keep duel in map for a brief window so post-finish lookups work, then clean up
    setTimeout(() => {
      this.activeDuels.delete(duelId);
    }, 120000);

    if (duel.duelType === "TYPING" && duel.typingStats) {
      // Server-authoritative typing stats calculation
      const elapsedMinutes = duel.durationMs / 60000;
      const userCorrectChars = duel.typingStats.userCorrectChars;
      const userTotalChars = duel.typingStats.userTotalChars;
      const userWpm = elapsedMinutes > 0 ? Math.round((userCorrectChars / 5) / elapsedMinutes) : 0;
      const userAccuracy = userTotalChars > 0 ? Math.round((userCorrectChars / userTotalChars) * 1000) / 10 : 0;

      // Generate bot result at finish time
      const { generateTypingBotResult } = require("./bot");
      const passageLength = duel.typingStats.passageText.length;
      const botResult = generateTypingBotResult(duel.difficulty, duel.durationMs, passageLength);

      // Determine result: most correct chars wins; tiebreak: accuracy; tiebreak: WPM
      let result: "WIN" | "LOSS" | "DRAW";
      if (userCorrectChars > botResult.correctChars) {
        result = "WIN";
      } else if (userCorrectChars < botResult.correctChars) {
        result = "LOSS";
      } else if (userAccuracy > botResult.accuracy) {
        result = "WIN";
      } else if (userAccuracy < botResult.accuracy) {
        result = "LOSS";
      } else if (userWpm > botResult.wpm) {
        result = "WIN";
      } else if (userWpm < botResult.wpm) {
        result = "LOSS";
      } else {
        result = "DRAW";
      }

      const grade = this.calculateTypingGrade(userWpm);

      return {
        duel,
        finalBotScore: botResult.correctChars,
        grade,
        result,
        typingResult: {
          userWpm,
          userAccuracy,
          userCorrectChars,
          userTotalChars,
          botWpm: botResult.wpm,
          botAccuracy: botResult.accuracy,
          botCorrectChars: botResult.correctChars,
          passageId: duel.typingStats.passageId,
        },
      };
    }

    // Standard Q&A mode (ONE_WORD / MCQ)
    const { botScore: finalBotScore } = this.getBotScore(duel, duel.startedAt + duel.durationMs);

    let result: "WIN" | "LOSS" | "DRAW";
    if (duel.userScore > finalBotScore) {
      result = "WIN";
    } else if (duel.userScore < finalBotScore) {
      result = "LOSS";
    } else {
      result = "DRAW";
    }

    const grade = this.calculateGrade(duel.correctAnswers);

    return {
      duel,
      finalBotScore,
      grade,
      result,
    };
  }
}

export const duelManager = new DuelManager();
