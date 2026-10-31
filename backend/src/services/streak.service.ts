export interface StreakCalculationResult {
  currentStreak: number;
  longestStreak: number;
  lastDuelDate: string;
  isStreakIncremented: boolean;
}

/**
 * Returns today's date formatted as YYYY-MM-DD.
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculate the difference in calendar days between two YYYY-MM-DD dates.
 */
function getDayDifference(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1 + "T00:00:00Z").getTime();
  const d2 = new Date(dateStr2 + "T00:00:00Z").getTime();
  const diffMs = d2 - d1;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Computes the new streak state for a user completing a duel today.
 */
export function computeStreakUpdate(
  currentStreak: number,
  longestStreak: number,
  lastDuelDate: string | null,
  todayStr: string = getTodayDateString()
): StreakCalculationResult {
  if (!lastDuelDate) {
    // First duel ever
    return {
      currentStreak: 1,
      longestStreak: Math.max(1, longestStreak),
      lastDuelDate: todayStr,
      isStreakIncremented: true,
    };
  }

  if (lastDuelDate === todayStr) {
    // Already played today, streak remains unchanged
    return {
      currentStreak,
      longestStreak,
      lastDuelDate: todayStr,
      isStreakIncremented: false,
    };
  }

  const diffDays = getDayDifference(lastDuelDate, todayStr);

  if (diffDays === 1) {
    // Consecutive day
    const newCurrent = currentStreak + 1;
    return {
      currentStreak: newCurrent,
      longestStreak: Math.max(newCurrent, longestStreak),
      lastDuelDate: todayStr,
      isStreakIncremented: true,
    };
  } else if (diffDays > 1) {
    // Missed a day or more: streak resets to 1
    return {
      currentStreak: 1,
      longestStreak: Math.max(1, longestStreak),
      lastDuelDate: todayStr,
      isStreakIncremented: true,
    };
  } else {
    // Clock anomaly or edge case: preserve existing
    return {
      currentStreak,
      longestStreak,
      lastDuelDate: todayStr,
      isStreakIncremented: false,
    };
  }
}
