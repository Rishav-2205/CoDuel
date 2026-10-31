"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  History as HistoryIcon,
  Swords,
  Calendar,
  ChevronRight,
  Filter,
  Terminal,
  ListChecks,
  Keyboard,
  Zap,
} from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { useAuth } from "../../lib/auth-context";
import { api } from "../../lib/api";
import { Match } from "../../types";

export default function HistoryPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterMode, setFilterMode] = useState<string>("all");
  const [filterLang, setFilterLang] = useState<string>("all");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        const data = await api.getMatchHistory({
          duelType: filterMode,
          language: filterLang,
        });
        if (data && data.matches) {
          setMatches(data.matches);
        }
      } catch (err) {
        console.error("Failed to load match history:", err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchHistory();
    }
  }, [user, filterMode, filterLang]);

  const getModeInfo = (duelType: string) => {
    if (duelType === "ONE_WORD") return { label: "One-Word", icon: <Terminal className="w-3 h-3 text-purple-400" />, style: "bg-purple-500/10 text-purple-300 border-purple-500/30" };
    if (duelType === "MCQ") return { label: "MCQ", icon: <ListChecks className="w-3 h-3 text-blue-400" />, style: "bg-blue-500/10 text-blue-300 border-blue-500/30" };
    return { label: "Typing", icon: <Keyboard className="w-3 h-3 text-emerald-400" />, style: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" };
  };

  return (
    <div className="min-h-screen bg-arena-950 flex flex-col selection:bg-purple-600 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-arena-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-arena-900 border border-arena-800 text-xs font-mono text-purple-400 mb-2">
              <HistoryIcon className="w-3.5 h-3.5" />
              <span>BATTLE LOGS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Duel Match History
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Persistent record of all your One-Word, MCQ, and Typing duels.
            </p>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Mode Filter */}
            <div className="flex items-center gap-1 bg-arena-900 border border-arena-800 p-1 rounded-xl">
              <span className="text-[11px] font-mono text-gray-400 px-2 flex items-center gap-1">
                <Filter className="w-3 h-3 text-purple-400" /> Mode:
              </span>
              {[
                { id: "all", label: "All" },
                { id: "ONE_WORD", label: "One-Word" },
                { id: "MCQ", label: "MCQ" },
                { id: "TYPING", label: "Typing" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setFilterMode(m.id)}
                  className={`text-xs font-mono px-3 py-1 rounded-lg transition-all ${
                    filterMode === m.id
                      ? "bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Language Filter */}
            <div className="flex items-center gap-1 bg-arena-900 border border-arena-800 p-1 rounded-xl">
              <span className="text-[11px] font-mono text-gray-400 px-2">Lang:</span>
              {["all", "cpp", "java", "python"].map((l) => (
                <button
                  key={l}
                  onClick={() => setFilterLang(l)}
                  className={`text-xs uppercase font-mono px-2.5 py-1 rounded-lg transition-all ${
                    filterLang === l
                      ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : matches.length === 0 ? (
          <div className="py-20 text-center rounded-3xl bg-arena-900/50 border border-arena-800 p-8">
            <Swords className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No duels recorded for these filters</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Jump into the arena to test your skills in One-Word, MCQ, or Typing mode!
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors"
            >
              Start Duel
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => {
              const isWin = match.result === "WIN";
              const isLoss = match.result === "LOSS";
              const isTyping = match.duelType === "TYPING";
              const modeInfo = getModeInfo(match.duelType);
              const dateStr = new Date(match.completedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={match.id}
                  onClick={() => setSelectedMatch(match)}
                  className="cursor-pointer group rounded-2xl bg-arena-900 border border-arena-800 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-purple-500/40 hover:bg-arena-850"
                >
                  <div className="flex items-center gap-4">
                    {/* Grade Badge */}
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl font-mono shrink-0 shadow-md ${
                        match.grade === "S"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                          : match.grade === "A"
                          ? "bg-purple-500/20 text-purple-400 border border-purple-500/40"
                          : match.grade === "B"
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                          : match.grade === "C"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-arena-800 text-gray-400 border border-arena-700"
                      }`}
                    >
                      {match.grade}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Mode badge */}
                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border flex items-center gap-1 ${modeInfo.style}`}
                        >
                          {modeInfo.icon}
                          {modeInfo.label}
                        </span>

                        <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-arena-800 text-gray-200 border border-arena-700">
                          {match.language}
                        </span>
                        <span className="text-xs text-gray-400">vs {match.botName}</span>
                      </div>

                      <div className="text-xs text-gray-500 font-mono mt-1 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        <span>{dateStr}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-arena-800 pt-3 sm:pt-0">
                    {/* Score comparison */}
                    <div className="text-right">
                      {isTyping && match.userWpm != null ? (
                        <>
                          <div className="text-sm sm:text-base font-black font-mono text-white flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="text-cyan-400">{match.userWpm}</span>
                            <span className="text-gray-500 text-xs">WPM</span>
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono">
                            {match.userAccuracy != null ? `${match.userAccuracy}% accuracy` : ""}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm sm:text-base font-black font-mono text-white">
                            <span className="text-purple-400">{match.userScore}</span> :{" "}
                            <span className="text-gray-400">{match.botScore}</span>
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono">
                            {match.correctAnswers} correct / {match.incorrectAnswers} incorrect
                          </div>
                        </>
                      )}
                    </div>

                    {/* Rating change & Result pill */}
                    <div className="flex items-center gap-2">
                      {match.ratingChange != null && (
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold shrink-0 ${
                            match.ratingChange > 0
                              ? "bg-emerald-950/80 text-emerald-400 border border-emerald-500/30"
                              : match.ratingChange < 0
                              ? "bg-red-950/80 text-red-400 border border-red-500/30"
                              : "bg-zinc-800 text-gray-300"
                          }`}
                        >
                          {match.ratingChange > 0 ? `+${match.ratingChange}` : match.ratingChange} Elo
                        </span>
                      )}

                      <div
                        className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider shrink-0 ${
                          isWin
                            ? "bg-emerald-950/80 text-emerald-400 border border-emerald-500/30"
                            : isLoss
                            ? "bg-red-950/80 text-red-400 border border-red-500/30"
                            : "bg-amber-950/80 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {match.result}
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors hidden sm:block" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Match Detail Modal */}
        {selectedMatch && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-arena-900 border border-arena-800 rounded-3xl p-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-arena-800">
                <div className="flex items-center gap-2">
                  <Swords className="w-4 h-4 text-purple-400" />
                  <h3 className="font-bold text-white text-base">Duel Details</h3>
                </div>
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="py-5 space-y-4 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Duel Mode</span>
                  <span className="font-mono font-bold text-purple-400 uppercase">
                    {selectedMatch.duelType === "ONE_WORD"
                      ? "One-Word Duel"
                      : selectedMatch.duelType === "MCQ"
                      ? "MCQ Duel"
                      : "Typing Duel"}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Result</span>
                  <span
                    className={`font-mono font-bold uppercase px-2 py-0.5 rounded text-xs ${
                      selectedMatch.result === "WIN"
                        ? "text-emerald-400 bg-emerald-950/60"
                        : "text-red-400 bg-red-950/60"
                    }`}
                  >
                    {selectedMatch.result}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Language</span>
                  <span className="font-mono uppercase text-white font-bold">{selectedMatch.language}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Opponent Bot</span>
                  <span className="text-purple-300 font-bold">{selectedMatch.botName} ({selectedMatch.difficulty})</span>
                </div>

                {selectedMatch.duelType === "TYPING" && selectedMatch.userWpm != null ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Your WPM</span>
                      <span className="font-mono font-bold text-cyan-400">{selectedMatch.userWpm} WPM</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Bot WPM</span>
                      <span className="font-mono font-bold text-blue-400">{selectedMatch.botWpm} WPM</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Your Accuracy</span>
                      <span className="font-mono font-bold text-emerald-400">{selectedMatch.userAccuracy}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Chars Typed Correctly</span>
                      <span className="font-mono font-bold text-white">{selectedMatch.userCorrectChars}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Final Score</span>
                      <span className="font-mono font-bold text-sm text-white">
                        You {selectedMatch.userScore} - {selectedMatch.botScore} Bot
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Performance Grade</span>
                      <span className="font-mono font-bold text-sm text-purple-400">
                        Grade {selectedMatch.grade}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Correct Answers</span>
                      <span className="text-emerald-400 font-bold font-mono">
                        {selectedMatch.correctAnswers}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Incorrect Answers</span>
                      <span className="text-red-400 font-bold font-mono">
                        {selectedMatch.incorrectAnswers}
                      </span>
                    </div>
                  </>
                )}

                {selectedMatch.ratingChange != null && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Rating Adjustment</span>
                    <span
                      className={`font-mono font-bold ${
                        selectedMatch.ratingChange > 0
                          ? "text-emerald-400"
                          : selectedMatch.ratingChange < 0
                          ? "text-red-400"
                          : "text-gray-300"
                      }`}
                    >
                      {selectedMatch.ratingChange > 0
                        ? `+${selectedMatch.ratingChange}`
                        : selectedMatch.ratingChange}{" "}
                      Elo ({selectedMatch.previousRating ?? 1000} → {selectedMatch.newRating ?? 1000})
                    </span>
                  </div>
                )}

                {selectedMatch.xpEarned != null && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">XP Earned</span>
                    <span className="font-mono font-bold text-yellow-400">
                      +{selectedMatch.xpEarned} XP
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Duel Duration</span>
                  <span className="font-mono text-white">
                    {selectedMatch.duration} seconds
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedMatch(null)}
                className="w-full py-2.5 rounded-xl bg-arena-850 hover:bg-arena-800 text-gray-200 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
