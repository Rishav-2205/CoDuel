"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Flame,
  Swords,
  Trophy,
  CheckCircle2,
  Zap,
  Target,
  BrainCircuit,
  ArrowRight,
  Terminal,
  ListChecks,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { useAuth } from "../../lib/auth-context";
import { Language, BotDifficulty, DuelType } from "../../types";
import { TierBadge } from "../../components/TierBadge";
import { XPProgressBar } from "../../components/XPProgressBar";

export default function DashboardPage() {
  const { user, isLoading, refreshUser } = useAuth();
  const router = useRouter();

  // Dueling flow state: Step 1: select mode, Step 2: select language & difficulty
  const [selectedMode, setSelectedMode] = useState<DuelType | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<BotDifficulty>("medium");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      refreshUser();
    }
  }, []);

  const handleStartDuel = (language: Language) => {
    if (!selectedMode) return;
    router.push(`/duel?lang=${language}&diff=${selectedDifficulty}&mode=${selectedMode}`);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-arena-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const languages: Array<{
    id: Language;
    name: string;
    icon: string;
    tag: string;
    description: string;
    color: string;
    borderColor: string;
    glowColor: string;
    accentBg: string;
  }> = [
    {
      id: "cpp",
      name: "C++",
      icon: "⚡",
      tag: "SYSTEMS & SPEED",
      description: "Pointers, memory allocation, keywords, templates, and high-performance syntax.",
      color: "from-blue-600 to-cyan-500",
      borderColor: "hover:border-blue-500/50",
      glowColor: "group-hover:shadow-blue-500/20",
      accentBg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    {
      id: "java",
      name: "Java",
      icon: "☕",
      tag: "ENTERPRISE & OOP",
      description: "Class inheritance, interface contracts, access modifiers, packages, and JVM fundamentals.",
      color: "from-amber-600 to-orange-500",
      borderColor: "hover:border-amber-500/50",
      glowColor: "group-hover:shadow-amber-500/20",
      accentBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    {
      id: "python",
      name: "Python",
      icon: "🐍",
      tag: "RAPID SYNTAX & LOGIC",
      description: "Lists, dicts, generators, indentation, decorators, and core dynamic language keywords.",
      color: "from-emerald-600 to-teal-500",
      borderColor: "hover:border-emerald-500/50",
      glowColor: "group-hover:shadow-emerald-500/20",
      accentBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
  ];

  const winRate = user.totalDuels > 0 ? Math.round((user.totalWins / user.totalDuels) * 100) : 0;

  return (
    <div className="min-h-screen bg-arena-950 flex flex-col selection:bg-purple-600 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome & Streak Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-arena-900 via-arena-850 to-arena-900 border border-arena-800 p-6 sm:p-8 backdrop-blur-sm">
          <div className="absolute right-0 top-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-arena-800 border border-arena-700/60 text-xs font-mono text-gray-300 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>ONLINE DUELIST</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Ready for another duel,{" "}
                <span className="text-gradient-purple-blue">{user.username}</span>?
              </h1>
              <p className="mt-2 text-sm text-gray-400 max-w-xl">
                Choose your battle style: rapid-fire One-Word answers, four-option MCQ challenges, or a 30-second Typing Speed race against the bot.
              </p>
            </div>

            {/* Streak & Level Cards */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              {/* Streak Hero Card */}
              <div className="flex items-center gap-4 bg-arena-950/70 border border-orange-500/30 rounded-2xl p-4 sm:p-5 shadow-xl shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <Flame className="w-6 h-6 text-white fill-white animate-bounce" />
                </div>
                <div>
                  <div className="text-[10px] font-mono tracking-widest text-orange-400 font-bold uppercase">
                    Current Streak
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-white">
                    {user.currentStreak}{" "}
                    <span className="text-xs font-semibold text-gray-300 font-sans">
                      {user.currentStreak === 1 ? "DAY" : "DAYS"}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Best: <span className="text-gray-200 font-semibold">{user.longestStreak} days</span>
                  </div>
                </div>
              </div>

              {/* Level & XP Card */}
              <div className="bg-arena-950/70 border border-purple-500/30 rounded-2xl p-4 shadow-xl min-w-[200px] flex flex-col justify-center">
                <XPProgressBar
                  currentLevel={user.currentLevel || 1}
                  totalXP={user.totalXP || 0}
                />
              </div>
            </div>
          </div>
        </div>

        {/* User Statistics Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Top Rating */}
          <div className="p-4 sm:p-5 rounded-2xl bg-arena-900 border border-arena-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Rating</span>
              <Trophy className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono">
                {Math.max(user.oneWordRating || 1000, user.mcqRating || 1000, user.typingRating || 1000)}
              </div>
              <div className="mt-1">
                <TierBadge
                  rating={Math.max(user.oneWordRating || 1000, user.mcqRating || 1000, user.typingRating || 1000)}
                  size="xs"
                />
              </div>
            </div>
          </div>

          {/* Total Duels */}
          <div className="p-4 sm:p-5 rounded-2xl bg-arena-900 border border-arena-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Duels</span>
              <Swords className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono">{user.totalDuels}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">Matches played</div>
            </div>
          </div>

          {/* Wins */}
          <div className="p-4 sm:p-5 rounded-2xl bg-arena-900 border border-arena-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Victories</span>
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono">{user.totalWins}</div>
              <div className="text-[11px] text-emerald-400 mt-0.5">{winRate}% Win Rate</div>
            </div>
          </div>

          {/* Total XP & Level */}
          <div className="p-4 sm:p-5 rounded-2xl bg-arena-900 border border-arena-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Total XP</span>
              <Sparkles className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-yellow-400 font-mono">
                {user.totalXP || 0}
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5 font-mono">
                Level {user.currentLevel || 1} Duelist
              </div>
            </div>
          </div>

          {/* Daily Streak */}
          <div className="col-span-2 lg:col-span-1 p-4 sm:p-5 rounded-2xl bg-arena-900 border border-arena-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Streak</span>
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-orange-400 font-mono">
                {user.currentStreak} 🔥
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">Keep the flame active</div>
            </div>
          </div>
        </section>

        {/* ================= STEP 1: DUEL TYPE SELECTION ================= */}
        {!selectedMode ? (
          <section className="space-y-6 animate-fade-in">
            <div className="border-b border-arena-800 pb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-xs font-mono text-purple-300 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>STEP 1 OF 2</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                <Target className="w-6 h-6 text-purple-400" />
                Select Duel Type
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Choose how you want to battle the AI opponent. Test your pure typing reflex or four-option multiple choice speed.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-2">
              {/* CARD 1: ONE-WORD DUEL */}
              <div className="group relative rounded-3xl bg-arena-900 border border-arena-800 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:border-purple-500/60 hover:shadow-2xl hover:shadow-purple-600/20 hover:-translate-y-1">
                <div>
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-16 h-16 rounded-2xl bg-purple-600/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner group-hover:scale-110 transition-transform">
                      <Terminal className="w-8 h-8" />
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full border bg-purple-500/10 text-purple-400 border-purple-500/30">
                        RAPID TYPING
                      </span>
                      <span className="text-[10px] font-mono text-gray-500">60 seconds</span>
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-white tracking-tight">One-Word Duel</h3>
                  <p className="mt-2 text-xs text-gray-400 leading-relaxed min-h-[40px]">
                    Test your programming knowledge by answering short coding questions. Type the correct answer before time runs out.
                  </p>

                  {/* Interactive Example Box */}
                  <div className="mt-5 p-4 rounded-2xl bg-arena-950/80 border border-arena-800 font-mono text-xs space-y-2">
                    <div className="text-gray-400 text-[11px] uppercase tracking-wider">Example:</div>
                    <div className="text-gray-200">
                      Q: Which keyword is used to define a function in Python?
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400 font-bold pt-1">
                      <span className="text-gray-500">Answer:</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/30">
                        def
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-arena-800/80">
                  <button
                    onClick={() => setSelectedMode("ONE_WORD")}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/30 transition-all group-hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Play One-Word</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>

              {/* CARD 2: MCQ DUEL */}
              <div className="group relative rounded-3xl bg-arena-900 border border-arena-800 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:border-blue-500/60 hover:shadow-2xl hover:shadow-blue-600/20 hover:-translate-y-1">
                <div>
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner group-hover:scale-110 transition-transform">
                      <ListChecks className="w-8 h-8" />
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/30">
                        4 OPTIONS
                      </span>
                      <span className="text-[10px] font-mono text-gray-500">60 seconds</span>
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-white tracking-tight">MCQ Duel</h3>
                  <p className="mt-2 text-xs text-gray-400 leading-relaxed min-h-[40px]">
                    Challenge your programming knowledge with four-option multiple-choice questions. Choose the correct answer before your opponent does.
                  </p>

                  {/* Interactive Example Box */}
                  <div className="mt-5 p-4 rounded-2xl bg-arena-950/80 border border-arena-800 font-mono text-xs space-y-2">
                    <div className="text-gray-400 text-[11px] uppercase tracking-wider">Example:</div>
                    <div className="text-gray-200">
                      Q: Which keyword is used to create an object in Java?
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                      <span className="text-gray-400 px-2 py-0.5 rounded bg-arena-900">A. class</span>
                      <span className="text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/30">
                        B. new ✓
                      </span>
                      <span className="text-gray-400 px-2 py-0.5 rounded bg-arena-900">C. static</span>
                      <span className="text-gray-400 px-2 py-0.5 rounded bg-arena-900">D. void</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-arena-800/80">
                  <button
                    onClick={() => setSelectedMode("MCQ")}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-600/30 transition-all group-hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Play MCQ</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>

              {/* CARD 3: TYPING DUEL */}
              <div className="group relative rounded-3xl bg-arena-900 border border-arena-800 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:border-emerald-500/60 hover:shadow-2xl hover:shadow-emerald-600/20 hover:-translate-y-1 md:col-span-2 xl:col-span-1">
                <div>
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-600/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner group-hover:scale-110 transition-transform">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full border bg-emerald-500/20 text-emerald-300 border-emerald-400/40 animate-pulse">
                        ✦ NEW
                      </span>
                      <span className="text-[10px] font-mono text-gray-500">30 seconds</span>
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-white tracking-tight">Typing Duel</h3>
                  <p className="mt-2 text-xs text-gray-400 leading-relaxed min-h-[40px]">
                    Race against a bot by typing programming code passages as fast and accurately as possible. Beat their WPM in 30 seconds.
                  </p>

                  {/* Interactive Example Box */}
                  <div className="mt-5 p-4 rounded-2xl bg-arena-950/80 border border-arena-800 font-mono text-xs space-y-2">
                    <div className="text-gray-400 text-[11px] uppercase tracking-wider">You type:</div>
                    <div className="text-gray-200 leading-relaxed">
                      <span className="text-emerald-400">def calculate</span>
                      <span className="text-gray-200">_sum(a, b):</span>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] pt-1">
                      <span className="text-cyan-400 font-bold">42 WPM</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-purple-400 font-bold">96% accuracy</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-arena-800/80">
                  <button
                    onClick={() => setSelectedMode("TYPING")}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/30 transition-all group-hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Play Typing Duel</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* ================= STEP 2: LANGUAGE & BOT DIFFICULTY SELECTION ================= */
          <section className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-arena-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setSelectedMode(null)}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-arena-800 hover:bg-arena-750 text-[11px] font-mono text-purple-400 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Change Mode
                  </button>
                  <span className="text-xs font-mono text-gray-500">•</span>
                  <span className="text-xs font-mono font-bold text-white px-2 py-0.5 rounded bg-arena-900 border border-purple-500/30 uppercase">
                    Mode: {selectedMode === "ONE_WORD" ? "One-Word Duel" : selectedMode === "MCQ" ? "MCQ Duel" : "Typing Duel"}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <Target className="w-6 h-6 text-purple-400" />
                  Select Programming Language
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Choose your arena. {selectedMode === "TYPING" ? "30-second" : "60-second"} timer begins upon matchup.
                </p>
              </div>

              {/* Bot Difficulty Selector */}
              <div className="flex items-center gap-2 bg-arena-900 border border-arena-800 p-1 rounded-xl self-start sm:self-auto">
                <span className="text-[11px] font-mono text-gray-400 px-2 flex items-center gap-1">
                  <BrainCircuit className="w-3.5 h-3.5 text-purple-400" /> Bot:
                </span>
                {(["easy", "medium", "hard"] as BotDifficulty[]).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setSelectedDifficulty(diff)}
                    className={`text-xs capitalize font-semibold px-3 py-1 rounded-lg transition-all ${
                      selectedDifficulty === diff
                        ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {languages.map((lang) => (
                <div
                  key={lang.id}
                  className={`group relative rounded-3xl bg-arena-900 border border-arena-800 p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${lang.borderColor} ${lang.glowColor}`}
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-arena-850 border border-arena-750 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                        {lang.icon}
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${lang.accentBg}`}>
                        {lang.tag}
                      </span>
                    </div>

                    <h3 className="text-2xl font-black text-white tracking-tight">{lang.name}</h3>
                    <p className="mt-2 text-xs text-gray-400 leading-relaxed min-h-[48px]">
                      {lang.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-5 border-t border-arena-800/80">
                    <button
                      onClick={() => handleStartDuel(lang.id)}
                      className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r ${lang.color} hover:opacity-95 shadow-lg transition-all group-hover:scale-[1.02] active:scale-[0.98]`}
                    >
                      <span>Start {lang.name} Duel</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
