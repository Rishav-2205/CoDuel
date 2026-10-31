import React from "react";
import { Zap, Sparkles } from "lucide-react";
import { LevelInfo } from "../types";

interface XPProgressBarProps {
  levelInfo?: LevelInfo;
  currentLevel?: number;
  totalXP?: number;
  showLabels?: boolean;
  className?: string;
}

export function XPProgressBar({
  levelInfo,
  currentLevel: propLevel,
  totalXP: propXP,
  showLabels = true,
  className = "",
}: XPProgressBarProps) {
  // If full levelInfo object provided, use it; otherwise compute simple fallback
  const level = levelInfo?.currentLevel ?? propLevel ?? 1;
  const xp = levelInfo?.totalXP ?? propXP ?? 0;
  const progressPercent = levelInfo?.progressPercent ?? Math.min(100, (xp % 100));
  const currentLevelXp = levelInfo?.currentLevelXp ?? (xp % 100);
  const xpForCurrentLevel = levelInfo?.xpForCurrentLevel ?? 100;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {showLabels && (
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5 text-purple-400 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>LEVEL {level}</span>
          </div>
          <div className="text-gray-400 text-[11px]">
            <span className="text-white font-bold">{currentLevelXp}</span>
            <span className="text-gray-500"> / </span>
            <span>{xpForCurrentLevel} XP</span>
            <span className="text-purple-400 font-semibold ml-2">({xp} Total XP)</span>
          </div>
        </div>
      )}

      {/* Bar container */}
      <div className="w-full h-2 rounded-full bg-arena-950 border border-arena-800 overflow-hidden relative">
        <div
          className="h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400 rounded-full transition-all duration-700 ease-out shadow-sm shadow-purple-500/50"
          style={{ width: `${Math.max(3, progressPercent)}%` }}
        />
      </div>
    </div>
  );
}
