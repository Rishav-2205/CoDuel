export type BotDifficulty = "easy" | "medium" | "hard";

export interface BotProfile {
  name: string;
  avatar: string;
  difficulty: BotDifficulty;
  accuracyRate: number;
}

export interface BotTimelineEvent {
  scheduledAtMs: number; // millisecond offset from duel start (0 to 60000)
  isCorrect: boolean;
}

export interface TypingBotResult {
  wpm: number;
  accuracy: number; // 0-100
  correctChars: number;
}

const BOT_NAMES = [
  "CodeBot_07",
  "ByteViper_99",
  "SyntaxSlayer",
  "NullPointer_X",
  "Algoritmix",
  "LoopMaster_42",
  "BinaryGhost",
  "DevZero_01",
  "BitBuster",
  "CompilerKing",
  "CyberNinja",
  "QuantumDev",
];

const BOT_AVATARS = [
  "bot-cyber",
  "bot-retro",
  "bot-neon",
  "bot-matrix",
  "bot-plasma",
  "bot-titan",
];

export function createRandomBot(difficulty: BotDifficulty = "medium"): BotProfile {
  const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
  const avatar = BOT_AVATARS[Math.floor(Math.random() * BOT_AVATARS.length)];
  
  let accuracyRate = 0.65;
  if (difficulty === "easy") accuracyRate = 0.45;
  if (difficulty === "hard") accuracyRate = 0.85;

  return {
    name,
    avatar,
    difficulty,
    accuracyRate,
  };
}

/**
 * Pre-computes a randomized answer timeline for the bot throughout the duel.
 * Bot answers at realistic intervals according to difficulty.
 */
export function generateBotTimeline(difficulty: BotDifficulty, totalDurationMs: number = 60000): BotTimelineEvent[] {
  let minDelayMs: number;
  let maxDelayMs: number;
  let accuracy: number;

  switch (difficulty) {
    case "easy":
      minDelayMs = 4200;
      maxDelayMs = 7000;
      accuracy = 0.45;
      break;
    case "hard":
      minDelayMs = 2000;
      maxDelayMs = 3800;
      accuracy = 0.85;
      break;
    case "medium":
    default:
      minDelayMs = 3000;
      maxDelayMs = 5200;
      accuracy = 0.65;
      break;
  }

  const events: BotTimelineEvent[] = [];
  let currentMs = 2500 + Math.random() * 2000; // Initial delay before 1st question answer

  while (currentMs < totalDurationMs - 1500) {
    const isCorrect = Math.random() < accuracy;
    events.push({
      scheduledAtMs: Math.round(currentMs),
      isCorrect,
    });

    const nextDelay = minDelayMs + Math.random() * (maxDelayMs - minDelayMs);
    currentMs += nextDelay;
  }

  return events;
}

/**
 * Pre-computes a bot's final typing statistics for a Typing Duel.
 * Called at duel finish time to determine the bot's WPM, accuracy, and chars typed.
 */
export function generateTypingBotResult(difficulty: BotDifficulty, durationMs: number, passageLength: number): TypingBotResult {
  let minWpm: number;
  let maxWpm: number;
  let minAccuracy: number;
  let maxAccuracy: number;

  switch (difficulty) {
    case "easy":
      minWpm = 25;
      maxWpm = 35;
      minAccuracy = 80;
      maxAccuracy = 88;
      break;
    case "hard":
      minWpm = 60;
      maxWpm = 80;
      minAccuracy = 95;
      maxAccuracy = 99;
      break;
    case "medium":
    default:
      minWpm = 40;
      maxWpm = 55;
      minAccuracy = 89;
      maxAccuracy = 94;
      break;
  }

  const wpm = Math.round(minWpm + Math.random() * (maxWpm - minWpm));
  const accuracy = Math.round((minAccuracy + Math.random() * (maxAccuracy - minAccuracy)) * 10) / 10;

  // Calculate chars typed: wpm * 5 chars/word * (durationMs / 60000 minutes)
  const durationMinutes = durationMs / 60000;
  const totalCharsAttempted = Math.round(wpm * 5 * durationMinutes);

  // Correct chars = total chars adjusted by accuracy, capped at passage length
  const correctChars = Math.min(
    Math.round(totalCharsAttempted * (accuracy / 100)),
    passageLength
  );

  return { wpm, accuracy, correctChars };
}
