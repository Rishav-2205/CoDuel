"use client";

import React, { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import {
  Swords,
  Timer,
  Bot,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  SkipForward,
  Send,
  Flame,
  RotateCcw,
  LayoutDashboard,
  Trophy,
  Terminal,
  ListChecks,
  Keyboard,
  Zap,
  Target,
} from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { useAuth } from "../../lib/auth-context";
import { api } from "../../lib/api";
import { TierBadge } from "../../components/TierBadge";
import { XPProgressBar } from "../../components/XPProgressBar";
import {
  SanitizedQuestion,
  BotInfo,
  DuelGrade,
  DuelResult,
  DuelType,
  RatingUpdate,
  XpUpdate,
} from "../../types";

type DuelStage = "matchmaking" | "countdown" | "active" | "results";

function DuelArenaContent() {
  const { user, refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const language = searchParams.get("lang") || "python";
  const difficulty = searchParams.get("diff") || "medium";
  const modeParam = searchParams.get("mode") || "ONE_WORD";
  const duelType: DuelType =
    modeParam === "MCQ" ? "MCQ" : modeParam === "TYPING" ? "TYPING" : "ONE_WORD";

  const [stage, setStage] = useState<DuelStage>("matchmaking");
  const [countdown, setCountdown] = useState<number>(3);

  // Duel session state
  const [duelId, setDuelId] = useState<string | null>(null);
  const [bot, setBot] = useState<BotInfo | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<SanitizedQuestion | null>(null);
  const [totalQuestions, setTotalQuestions] = useState<number>(32);

  // Gameplay state (Q&A modes)
  const [userScore, setUserScore] = useState<number>(0);
  const [botScore, setBotScore] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [incorrectCount, setIncorrectCount] = useState<number>(0);
  const [answerInput, setAnswerInput] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submittedOption, setSubmittedOption] = useState<string | null>(null);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(60);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | "skipped" | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Typing Duel state
  const [typingPassage, setTypingPassage] = useState<string>("");
  const [typingInput, setTypingInput] = useState<string>("");
  const [typingCorrectChars, setTypingCorrectChars] = useState<number>(0);
  const [typingTotalChars, setTypingTotalChars] = useState<number>(0);
  const [typingWpm, setTypingWpm] = useState<number>(0);
  const [typingAccuracy, setTypingAccuracy] = useState<number>(100);
  // We estimate bot progress using its expected WPM from difficulty
  const [botWpmEstimate] = useState<number>(
    difficulty === "easy" ? 30 : difficulty === "hard" ? 70 : 47
  );
  const typingStartTimeRef = useRef<number | null>(null);
  const typingProgressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const typingAreaRef = useRef<HTMLTextAreaElement | null>(null);

  // Results state
  const [finalResult, setFinalResult] = useState<{
    grade: DuelGrade;
    result: DuelResult;
    userScore: number;
    botScore: number;
    correctAnswers: number;
    incorrectAnswers: number;
    accuracy: number;
    isStreakIncremented: boolean;
    currentStreak: number;
    // Typing-specific
    userWpm?: number;
    userAccuracy?: number;
    userCorrectChars?: number;
    botWpm?: number;
    botCorrectChars?: number;
    // Rating & XP v1.0
    ratingUpdate?: RatingUpdate;
    xpUpdate?: XpUpdate;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const duelTimerRef = useRef<NodeJS.Timeout | null>(null);
  const statusPollRef = useRef<NodeJS.Timeout | null>(null);
  const isFinishingRef = useRef<boolean>(false);
  const duelDurationSeconds = duelType === "TYPING" ? 30 : 60;

  // 1. Initialize duel session on mount
  useEffect(() => {
    let isCancelled = false;

    async function initDuel() {
      try {
        const data = await api.startDuel({ language, duelType, difficulty });
        if (isCancelled) return;

        setDuelId(data.duelId);
        setBot(data.bot);
        setCurrentQuestion(data.firstQuestion);
        setTotalQuestions(data.totalQuestions || 32);

        if (duelType === "TYPING" && data.passage) {
          setTypingPassage(data.passage);
        }

        // Matchmaking delay
        setTimeout(() => {
          if (isCancelled) return;
          setStage("countdown");
        }, 2200);
      } catch (err: any) {
        console.error("Failed to start duel:", err);
        router.push("/dashboard");
      }
    }

    initDuel();

    return () => {
      isCancelled = true;
    };
  }, [language, duelType, difficulty, router]);

  // 2. Handle 3-second countdown
  useEffect(() => {
    if (stage !== "countdown") return;

    if (countdown > 1) {
      const timer = setTimeout(() => {
        setCountdown((c) => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setStage("active");
        setTimeRemainingSeconds(duelDurationSeconds);
        if (duelType === "TYPING") {
          typingStartTimeRef.current = Date.now();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [stage, countdown, duelType, duelDurationSeconds]);

  // 3. Reset input/selection whenever question changes
  useEffect(() => {
    setAnswerInput("");
    setSelectedOption(null);
    setSubmittedOption(null);

    if (stage === "active" && duelType === "ONE_WORD" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [stage, currentQuestion, duelType]);

  // Focus typing area when active
  useEffect(() => {
    if (stage === "active" && duelType === "TYPING" && typingAreaRef.current) {
      typingAreaRef.current.focus();
    }
  }, [stage, duelType]);

  // Keyboard shortcut listener for MCQ: Enter submits selected option
  useEffect(() => {
    if (stage !== "active" || duelType !== "MCQ") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && selectedOption && !submitting) {
        handleOptionSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stage, duelType, selectedOption, submitting]);

  // 4. Timer interval & bot status polling during active duel
  useEffect(() => {
    if (stage !== "active" || !duelId) return;

    duelTimerRef.current = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Poll bot score (Q&A modes) or just check timer (typing)
    if (duelType !== "TYPING") {
      statusPollRef.current = setInterval(async () => {
        if (isFinishingRef.current) return;
        try {
          const status = await api.getDuelStatus(duelId);
          if (status) {
            setBotScore(status.botScore || 0);
            if (status.isFinished || status.timeRemainingMs <= 500) {
              handleTimeExpired();
            }
          }
        } catch {
          // ignore polling errors
        }
      }, 1500);
    }

    // Typing mode: send progress updates to server every 2s
    if (duelType === "TYPING") {
      typingProgressIntervalRef.current = setInterval(async () => {
        if (isFinishingRef.current || !duelId) return;
        try {
          await api.submitTypingProgress(duelId, typingTotalChars, typingCorrectChars);
        } catch {
          // ignore
        }
      }, 2000);
    }

    return () => {
      if (duelTimerRef.current) clearInterval(duelTimerRef.current);
      if (statusPollRef.current) clearInterval(statusPollRef.current);
      if (typingProgressIntervalRef.current) clearInterval(typingProgressIntervalRef.current);
    };
  }, [stage, duelId, duelType]);

  // Update WPM and accuracy for typing as user types
  useEffect(() => {
    if (duelType !== "TYPING" || !typingStartTimeRef.current) return;
    const elapsedMinutes = (Date.now() - typingStartTimeRef.current) / 60000;
    const wpm = elapsedMinutes > 0 ? Math.round((typingCorrectChars / 5) / elapsedMinutes) : 0;
    const accuracy = typingTotalChars > 0
      ? Math.round((typingCorrectChars / typingTotalChars) * 1000) / 10
      : 100;
    setTypingWpm(wpm);
    setTypingAccuracy(accuracy);
  }, [typingCorrectChars, typingTotalChars, duelType]);

  // Finish duel handler
  const handleTimeExpired = useCallback(async () => {
    if (isFinishingRef.current || !duelId) return;
    isFinishingRef.current = true;

    if (duelTimerRef.current) clearInterval(duelTimerRef.current);
    if (statusPollRef.current) clearInterval(statusPollRef.current);
    if (typingProgressIntervalRef.current) clearInterval(typingProgressIntervalRef.current);

    // For typing: send final progress before finishing
    if (duelType === "TYPING") {
      try {
        await api.submitTypingProgress(duelId, typingTotalChars, typingCorrectChars);
      } catch { /* ignore */ }
    }

    try {
      const res = await api.finishDuel(duelId);
      const match = res.match;

      if (duelType === "TYPING" && res.typingResult) {
        const tr = res.typingResult;
        setFinalResult({
          grade: match.grade,
          result: match.result,
          userScore: tr.userCorrectChars,
          botScore: tr.botCorrectChars,
          correctAnswers: tr.userCorrectChars,
          incorrectAnswers: (tr.userTotalChars || 0) - tr.userCorrectChars,
          accuracy: tr.userAccuracy,
          isStreakIncremented: res.streakUpdate?.isStreakIncremented || false,
          currentStreak: res.streakUpdate?.currentStreak || user?.currentStreak || 1,
          userWpm: tr.userWpm,
          userAccuracy: tr.userAccuracy,
          userCorrectChars: tr.userCorrectChars,
          botWpm: tr.botWpm,
          botCorrectChars: tr.botCorrectChars,
          ratingUpdate: res.ratingUpdate,
          xpUpdate: res.xpUpdate,
        });
      } else {
        const totalAttempted = match.correctAnswers + match.incorrectAnswers;
        const accuracy = totalAttempted > 0 ? Math.round((match.correctAnswers / totalAttempted) * 100) : 0;

        setFinalResult({
          grade: match.grade,
          result: match.result,
          userScore: match.userScore,
          botScore: match.botScore,
          correctAnswers: match.correctAnswers,
          incorrectAnswers: match.incorrectAnswers,
          accuracy,
          isStreakIncremented: res.streakUpdate?.isStreakIncremented || false,
          currentStreak: res.streakUpdate?.currentStreak || user?.currentStreak || 1,
          ratingUpdate: res.ratingUpdate,
          xpUpdate: res.xpUpdate,
        });
      }

      setStage("results");
      await refreshUser();

      if (match.result === "WIN") {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#a855f7", "#3b82f6", "#10b981", "#f59e0b"],
        });
      }
    } catch (err) {
      console.error("Failed to finish duel:", err);
      router.push("/dashboard");
    }
  }, [duelId, duelType, typingTotalChars, typingCorrectChars, refreshUser, router, user]);

  // Handle typing input changes
  const handleTypingInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    // Limit to passage length
    if (value.length > typingPassage.length) return;

    setTypingInput(value);

    // Count correct chars (char-by-char comparison)
    let correct = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === typingPassage[i]) correct++;
    }
    setTypingCorrectChars(correct);
    setTypingTotalChars(value.length);
  }, [typingPassage]);

  // Submit Answer for One-Word Mode
  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!duelId || submitting || stage !== "active") return;
    if (!answerInput.trim()) return;

    try {
      setSubmitting(true);
      const res = await api.answerQuestion(duelId, answerInput.trim());

      setUserScore(res.userScore);
      setBotScore(res.botScore);
      setCorrectCount(res.correctAnswers);
      setIncorrectCount(res.incorrectAnswers);

      setFeedback(res.isCorrect ? "correct" : "incorrect");
      setTimeout(() => {
        setFeedback(null);
        if (res.isFinished || !res.nextQuestion) {
          handleTimeExpired();
        } else {
          setCurrentQuestion(res.nextQuestion);
        }
      }, 700);
    } catch (err) {
      console.error("Answer submit error:", err);
    } finally {
      setSubmitting(false);
      inputRef.current?.focus();
    }
  };

  // Submit Selected Option for MCQ Mode
  const handleOptionSubmit = async () => {
    if (!duelId || submitting || stage !== "active" || !selectedOption) return;

    try {
      setSubmitting(true);
      setSubmittedOption(selectedOption);
      const res = await api.answerQuestion(duelId, selectedOption);

      setUserScore(res.userScore);
      setBotScore(res.botScore);
      setCorrectCount(res.correctAnswers);
      setIncorrectCount(res.incorrectAnswers);

      setFeedback(res.isCorrect ? "correct" : "incorrect");
      setTimeout(() => {
        setFeedback(null);
        if (res.isFinished || !res.nextQuestion) {
          handleTimeExpired();
        } else {
          setCurrentQuestion(res.nextQuestion);
        }
      }, 700);
    } catch (err) {
      console.error("MCQ submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Skip Question
  const handleSkip = async () => {
    if (!duelId || submitting || stage !== "active") return;

    try {
      setSubmitting(true);
      const res = await api.skipQuestion(duelId);

      setUserScore(res.userScore);
      setBotScore(res.botScore);
      setCorrectCount(res.correctAnswers);
      setIncorrectCount(res.incorrectAnswers);

      setFeedback("skipped");
      setTimeout(() => {
        setFeedback(null);
        if (res.isFinished || !res.nextQuestion) {
          handleTimeExpired();
        } else {
          setCurrentQuestion(res.nextQuestion);
        }
      }, 700);
    } catch (err) {
      console.error("Skip error:", err);
    } finally {
      setSubmitting(false);
      if (duelType === "ONE_WORD") {
        inputRef.current?.focus();
      }
    }
  };

  const optionLetters = ["A", "B", "C", "D"];

  // Calculate bot typing progress estimate for display
  const botTypedCharsEstimate = typingStartTimeRef.current
    ? Math.min(
        Math.round(
          (botWpmEstimate * 5 * (Date.now() - typingStartTimeRef.current)) / 60000
        ),
        typingPassage.length
      )
    : 0;

  // Render the typing passage with per-character coloring
  const renderPassage = () => {
    if (!typingPassage) return null;
    return (
      <span>
        {typingPassage.split("").map((char, i) => {
          let className = "text-gray-500"; // not yet typed
          if (i < typingInput.length) {
            className = typingInput[i] === char ? "text-emerald-400" : "bg-red-500/30 text-red-300";
          } else if (i === typingInput.length) {
            className = "bg-purple-500/40 text-white animate-pulse"; // cursor position
          }
          if (char === "\n") {
            return (
              <React.Fragment key={i}>
                <span className={className}>↵</span>
                <br />
              </React.Fragment>
            );
          }
          return (
            <span key={i} className={className}>
              {char}
            </span>
          );
        })}
      </span>
    );
  };

  const modeName =
    duelType === "ONE_WORD" ? "One-Word" : duelType === "MCQ" ? "MCQ" : "Typing";

  return (
    <div className="min-h-screen bg-arena-950 flex flex-col selection:bg-purple-600 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 flex flex-col justify-center">
        {/* ================= STAGE 1: MATCHMAKING ================= */}
        {stage === "matchmaking" && (
          <div className="flex flex-col items-center justify-center text-center py-16 space-y-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-2 border-purple-500/40 border-t-purple-400 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Swords className="w-8 h-8 text-purple-400 animate-pulse" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">FINDING OPPONENT...</h2>
              <p className="text-xs font-mono text-purple-400 mt-1 uppercase">
                {language} • {modeName} Duel • {difficulty} Bot • {duelDurationSeconds}s
              </p>
            </div>

            {bot && (
              <div className="flex items-center gap-6 mt-4 p-4 rounded-2xl bg-arena-900 border border-arena-800 animate-fade-in">
                <div className="text-right">
                  <div className="text-xs text-gray-400">Player</div>
                  <div className="text-sm font-bold text-white">{user?.username}</div>
                </div>
                <div className="text-xs font-black text-purple-400 px-2 py-1 rounded bg-arena-800">VS</div>
                <div className="text-left">
                  <div className="text-xs text-gray-400">Opponent</div>
                  <div className="text-sm font-bold text-purple-300">{bot.name}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= STAGE 2: 3-SECOND COUNTDOWN ================= */}
        {stage === "countdown" && (
          <div className="flex flex-col items-center justify-center text-center py-16 space-y-6">
            <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 p-[3px] shadow-2xl shadow-purple-600/40 animate-pulse">
              <div className="w-full h-full bg-arena-950 rounded-full flex items-center justify-center">
                <span className="text-6xl font-black text-white font-mono animate-bounce">
                  {countdown}
                </span>
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-extrabold text-white tracking-widest uppercase">
                PREPARE FOR BATTLE!
              </h2>
              <p className="text-xs font-mono text-gray-400 mt-1">
                {duelDurationSeconds} Seconds • Mode:{" "}
                <span className="text-purple-400 font-bold uppercase">{modeName}</span>{" "}
                • Language: <span className="text-purple-400 font-bold uppercase">{language}</span>
              </p>
              {duelType === "TYPING" && (
                <p className="text-xs font-mono text-emerald-400 mt-2">
                  Type the code passage as fast and accurately as possible!
                </p>
              )}
            </div>
          </div>
        )}

        {/* ================= STAGE 3a: ACTIVE — Q&A ARENA (ONE_WORD / MCQ) ================= */}
        {stage === "active" && duelType !== "TYPING" && (
          <div className="space-y-6">
            {/* Top Score & Timer Board */}
            <div className="grid grid-cols-3 items-center rounded-2xl bg-arena-900 border border-arena-800 p-4 shadow-xl">
              {/* User Player */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-medium truncate max-w-[120px]">
                    {user?.username} (You)
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono leading-none">
                    {userScore}
                  </div>
                </div>
              </div>

              {/* Central Countdown Timer */}
              <div className="flex flex-col items-center justify-center">
                <div
                  className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full font-mono text-sm sm:text-base font-black transition-colors ${
                    timeRemainingSeconds <= 10
                      ? "bg-red-950/80 border border-red-500 text-red-400 animate-pulse"
                      : "bg-arena-850 border border-arena-700 text-purple-300"
                  }`}
                >
                  <Timer className="w-4 h-4" />
                  <span>{timeRemainingSeconds}s</span>
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mt-1">
                  Time Remaining
                </div>
              </div>

              {/* Bot Opponent */}
              <div className="flex items-center justify-end gap-3 text-right">
                <div>
                  <div className="text-xs text-purple-300 font-medium truncate max-w-[120px]">
                    {bot?.name || "CodeBot"}
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-blue-400 font-mono leading-none">
                    {botScore}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-blue-400" />
                </div>
              </div>
            </div>

            {/* Live Progress Bar for Timer */}
            <div className="w-full h-1.5 bg-arena-900 rounded-full overflow-hidden border border-arena-800">
              <div
                className={`h-full transition-all duration-1000 ${
                  timeRemainingSeconds <= 10
                    ? "bg-red-500"
                    : "bg-gradient-to-r from-purple-500 to-blue-500"
                }`}
                style={{ width: `${(timeRemainingSeconds / 60) * 100}%` }}
              />
            </div>

            {/* Question Card */}
            <div
              className={`relative rounded-3xl bg-arena-900 border p-6 sm:p-10 shadow-2xl transition-all ${
                feedback === "correct"
                  ? "border-emerald-500/80 shadow-emerald-500/20 bg-emerald-950/10"
                  : feedback === "incorrect"
                  ? "border-red-500/80 shadow-red-500/20 animate-shake bg-red-950/10"
                  : feedback === "skipped"
                  ? "border-amber-500/80 shadow-amber-500/20 bg-amber-950/10"
                  : "border-arena-800"
              }`}
            >
              {/* Question Meta Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-arena-800 text-purple-300 border border-purple-500/30 uppercase flex items-center gap-1.5">
                    {duelType === "ONE_WORD" ? (
                      <Terminal className="w-3.5 h-3.5 text-purple-400" />
                    ) : (
                      <ListChecks className="w-3.5 h-3.5 text-blue-400" />
                    )}
                    {duelType === "ONE_WORD" ? "One-Word" : "MCQ"} • {language} #{currentQuestion?.index || 1}
                  </span>
                </div>

                {/* Feedback Indicator */}
                {feedback === "correct" && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 animate-fade-in font-mono">
                    <CheckCircle2 className="w-4 h-4" /> CORRECT! +1
                  </span>
                )}
                {feedback === "incorrect" && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-red-400 animate-fade-in font-mono">
                    <XCircle className="w-4 h-4" /> INCORRECT
                  </span>
                )}
                {feedback === "skipped" && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400 animate-fade-in font-mono">
                    <SkipForward className="w-4 h-4" /> SKIPPED
                  </span>
                )}
              </div>

              {/* The Question Text */}
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-snug min-h-[64px]">
                {currentQuestion?.question}
              </h3>

              {/* ================= ANSWER INPUT: ONE-WORD MODE ================= */}
              {duelType === "ONE_WORD" && (
                <form onSubmit={handleAnswerSubmit} className="mt-8 flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      ref={inputRef}
                      type="text"
                      autoFocus
                      disabled={submitting}
                      value={answerInput}
                      onChange={(e) => setAnswerInput(e.target.value)}
                      placeholder="Enter short answer (e.g. keyword, operator)..."
                      className="w-full bg-arena-950 border border-arena-700 rounded-2xl px-5 py-4 text-base sm:text-lg font-mono text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40 transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={submitting || !answerInput.trim()}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-7 py-4 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span>SUBMIT</span>
                      <Send className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={handleSkip}
                      disabled={submitting}
                      title="Skip to next question"
                      className="flex items-center justify-center gap-1.5 px-4 py-4 rounded-2xl text-xs font-semibold text-gray-400 bg-arena-850 border border-arena-700 hover:text-white hover:bg-arena-800 transition-colors"
                    >
                      <SkipForward className="w-4 h-4" />
                      <span>Skip</span>
                    </button>
                  </div>
                </form>
              )}

              {/* ================= ANSWER INPUT: MCQ MODE ================= */}
              {duelType === "MCQ" && currentQuestion?.options && (
                <div className="mt-8 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentQuestion.options.map((opt, idx) => {
                      const letter = optionLetters[idx] || String(idx + 1);
                      const isSelected = selectedOption === opt;
                      const isSubmitted = submittedOption === opt;

                      let cardStyle = "bg-arena-950 border-arena-750 hover:border-purple-500/60 text-gray-200";
                      let letterStyle = "bg-arena-850 text-gray-400 border-arena-700";

                      if (isSelected) {
                        cardStyle = "bg-purple-600/15 border-purple-500 text-white shadow-lg shadow-purple-600/20 ring-1 ring-purple-500";
                        letterStyle = "bg-purple-600 text-white border-purple-500";
                      }

                      if (isSubmitted && feedback === "correct") {
                        cardStyle = "bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500";
                        letterStyle = "bg-emerald-600 text-white border-emerald-500";
                      } else if (isSubmitted && feedback === "incorrect") {
                        cardStyle = "bg-red-950/80 border-red-500 text-red-200 ring-2 ring-red-500";
                        letterStyle = "bg-red-600 text-white border-red-500";
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={submitting}
                          onClick={() => setSelectedOption(opt)}
                          className={`p-4 rounded-2xl border text-left flex items-center gap-3.5 transition-all duration-150 ${cardStyle}`}
                        >
                          <span
                            className={`w-8 h-8 rounded-xl border flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-colors ${letterStyle}`}
                          >
                            {letter}
                          </span>
                          <span className="font-mono text-sm sm:text-base font-semibold leading-tight">
                            {opt}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Actions for MCQ */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={handleSkip}
                      disabled={submitting}
                      className="flex items-center gap-1.5 px-4 py-3 rounded-2xl text-xs font-semibold text-gray-400 bg-arena-850 border border-arena-700 hover:text-white hover:bg-arena-800 transition-colors"
                    >
                      <SkipForward className="w-4 h-4" />
                      <span>Skip Question</span>
                    </button>

                    <button
                      type="button"
                      disabled={submitting || !selectedOption}
                      onClick={handleOptionSubmit}
                      className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-40 shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span>SUBMIT ANSWER</span>
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Keyboard tip */}
              <div className="mt-4 text-[11px] text-gray-500 font-mono flex items-center gap-2">
                <span>Tip: Press</span>
                <kbd className="px-1.5 py-0.5 rounded bg-arena-800 border border-arena-700 text-gray-300 text-[10px]">
                  Enter ↵
                </kbd>
                <span>
                  {duelType === "ONE_WORD"
                    ? "to instantly submit typed answer"
                    : "to submit highlighted option"}
                </span>
              </div>
            </div>

            {/* Bottom Live Stats & Bot Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-400 font-mono px-2">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> Correct: <strong>{correctCount}</strong>
                </span>
                <span className="flex items-center gap-1.5 text-red-400">
                  <XCircle className="w-4 h-4" /> Incorrect: <strong>{incorrectCount}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-400">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                <span>
                  {bot?.name} ({bot?.difficulty}): <strong>{botScore} pts</strong>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ================= STAGE 3b: ACTIVE — TYPING ARENA ================= */}
        {stage === "active" && duelType === "TYPING" && (
          <div className="space-y-4">
            {/* Top Board: Player vs Bot */}
            <div className="grid grid-cols-3 items-center rounded-2xl bg-arena-900 border border-arena-800 p-4 shadow-xl">
              {/* User Stats */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-400 truncate max-w-[100px]">{user?.username} (You)</div>
                  <div className="text-lg font-black text-white font-mono leading-none">
                    {typingWpm} <span className="text-xs font-normal text-gray-400">WPM</span>
                  </div>
                </div>
              </div>

              {/* Timer */}
              <div className="flex flex-col items-center justify-center">
                <div
                  className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full font-mono text-sm font-black transition-colors ${
                    timeRemainingSeconds <= 10
                      ? "bg-red-950/80 border border-red-500 text-red-400 animate-pulse"
                      : "bg-arena-850 border border-arena-700 text-emerald-300"
                  }`}
                >
                  <Timer className="w-4 h-4" />
                  <span>{timeRemainingSeconds}s</span>
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mt-1">
                  Typing Duel
                </div>
              </div>

              {/* Bot Stats */}
              <div className="flex items-center justify-end gap-3 text-right">
                <div>
                  <div className="text-xs text-purple-300 truncate max-w-[100px]">{bot?.name}</div>
                  <div className="text-lg font-black text-blue-400 font-mono leading-none">
                    {botWpmEstimate} <span className="text-xs font-normal text-gray-400">WPM</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-blue-400" />
                </div>
              </div>
            </div>

            {/* Progress bars */}
            <div className="space-y-2">
              {/* Timer bar */}
              <div className="w-full h-1.5 bg-arena-900 rounded-full overflow-hidden border border-arena-800">
                <div
                  className={`h-full transition-all duration-1000 ${
                    timeRemainingSeconds <= 10 ? "bg-red-500" : "bg-gradient-to-r from-emerald-500 to-teal-500"
                  }`}
                  style={{ width: `${(timeRemainingSeconds / 30) * 100}%` }}
                />
              </div>
              {/* User typing progress */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-purple-400 w-6 shrink-0">You</span>
                <div className="flex-1 h-2 bg-arena-900 rounded-full overflow-hidden border border-arena-800">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-200"
                    style={{
                      width: typingPassage.length > 0
                        ? `${(typingCorrectChars / typingPassage.length) * 100}%`
                        : "0%",
                    }}
                  />
                </div>
                <span className="text-[10px] font-mono text-gray-400 w-10 text-right shrink-0">
                  {typingPassage.length > 0
                    ? Math.round((typingCorrectChars / typingPassage.length) * 100)
                    : 0}%
                </span>
              </div>
              {/* Bot progress estimate */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-blue-400 w-6 shrink-0">Bot</span>
                <div className="flex-1 h-2 bg-arena-900 rounded-full overflow-hidden border border-arena-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-1000"
                    style={{
                      width: typingPassage.length > 0
                        ? `${Math.min((botTypedCharsEstimate / typingPassage.length) * 100, 100)}%`
                        : "0%",
                    }}
                  />
                </div>
                <span className="text-[10px] font-mono text-gray-400 w-10 text-right shrink-0">
                  {typingPassage.length > 0
                    ? Math.min(Math.round((botTypedCharsEstimate / typingPassage.length) * 100), 100)
                    : 0}%
                </span>
              </div>
            </div>

            {/* Live Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-arena-900 border border-arena-800 text-center">
                <div className="text-[10px] text-gray-400 font-mono uppercase">WPM</div>
                <div className="text-xl font-black text-white font-mono">{typingWpm}</div>
              </div>
              <div className="p-3 rounded-xl bg-arena-900 border border-arena-800 text-center">
                <div className="text-[10px] text-gray-400 font-mono uppercase">Accuracy</div>
                <div className="text-xl font-black text-cyan-400 font-mono">{typingAccuracy}%</div>
              </div>
              <div className="p-3 rounded-xl bg-arena-900 border border-arena-800 text-center">
                <div className="text-[10px] text-gray-400 font-mono uppercase">Correct</div>
                <div className="text-xl font-black text-emerald-400 font-mono">{typingCorrectChars}</div>
              </div>
              <div className="p-3 rounded-xl bg-arena-900 border border-arena-800 text-center">
                <div className="text-[10px] text-gray-400 font-mono uppercase">Errors</div>
                <div className="text-xl font-black text-red-400 font-mono">
                  {typingTotalChars - typingCorrectChars}
                </div>
              </div>
            </div>

            {/* Passage Display */}
            <div className="rounded-2xl bg-arena-900 border border-arena-800 p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Keyboard className="w-3.5 h-3.5" /> Type this passage:
                </span>
                <span className="text-[11px] font-mono text-gray-500 uppercase">{language}</span>
              </div>
              <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap select-none p-3 rounded-xl bg-arena-950 border border-arena-800 min-h-[80px]">
                {renderPassage()}
              </div>
            </div>

            {/* Typing Input Textarea */}
            <div className="relative">
              <textarea
                ref={typingAreaRef}
                value={typingInput}
                onChange={handleTypingInput}
                onPaste={(e) => e.preventDefault()}
                onCopy={(e) => e.preventDefault()}
                autoFocus
                rows={4}
                placeholder="Start typing the passage above..."
                className="w-full bg-arena-950 border border-arena-700 rounded-2xl px-5 py-4 font-mono text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all resize-none"
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
              />
              <div className="absolute bottom-3 right-4 text-[10px] font-mono text-gray-600">
                {typingInput.length}/{typingPassage.length} chars
              </div>
            </div>

            <div className="text-[11px] text-gray-600 font-mono text-center">
              Paste disabled for fairness • Type naturally for best accuracy
            </div>
          </div>
        )}

        {/* ================= STAGE 4: RESULTS & GRADING SCREEN ================= */}
        {stage === "results" && finalResult && (
          <div className="rounded-3xl bg-arena-900 border border-arena-800 p-6 sm:p-10 shadow-2xl backdrop-blur-md relative overflow-hidden animate-fade-in">
            {/* Background Accent */}
            <div
              className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
                finalResult.result === "WIN"
                  ? "bg-emerald-600/10"
                  : finalResult.result === "LOSS"
                  ? "bg-red-600/10"
                  : "bg-purple-600/10"
              }`}
            />

            {/* Result Header */}
            <div className="text-center pb-8 border-b border-arena-800">
              <div
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono font-bold tracking-widest uppercase mb-3 ${
                  finalResult.result === "WIN"
                    ? "bg-emerald-950/80 border border-emerald-500/40 text-emerald-400"
                    : finalResult.result === "LOSS"
                    ? "bg-red-950/80 border border-red-500/40 text-red-400"
                    : "bg-amber-950/80 border border-amber-500/40 text-amber-400"
                }`}
              >
                {finalResult.result === "WIN" && <Trophy className="w-4 h-4" />}
                {finalResult.result === "WIN"
                  ? "VICTORY! YOU WON!"
                  : finalResult.result === "LOSS"
                  ? "DEFEAT — BOT OUTSCORED YOU"
                  : "DRAW — DEAD HEAT!"}
              </div>

              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                FINAL RESULT
              </h2>
              <div className="mt-2 text-xs font-mono text-purple-400 uppercase tracking-widest">
                Mode: {modeName} Duel • Language: {language}
              </div>
            </div>

            {/* Rating & XP Feedback Banner */}
            {finalResult.ratingUpdate && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
                {/* Elo Rating Card */}
                <div className="p-5 rounded-2xl bg-arena-950/80 border border-arena-800 shadow-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-gray-400 font-semibold">
                      {modeName} Rating
                    </span>
                    <TierBadge tier={finalResult.ratingUpdate.newTier} size="xs" />
                  </div>

                  <div className="flex items-baseline gap-3 my-2">
                    <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                      {finalResult.ratingUpdate.newRating}
                    </div>
                    <span className="text-xs text-gray-500 font-mono">
                      from {finalResult.ratingUpdate.previousRating}
                    </span>
                    <span
                      className={`font-mono font-bold text-xs sm:text-sm px-2.5 py-0.5 rounded-full ${
                        finalResult.ratingUpdate.ratingChange > 0
                          ? "bg-emerald-950/80 text-emerald-400 border border-emerald-500/30"
                          : finalResult.ratingUpdate.ratingChange < 0
                          ? "bg-red-950/80 text-red-400 border border-red-500/30"
                          : "bg-zinc-800 text-gray-300"
                      }`}
                    >
                      {finalResult.ratingUpdate.ratingChange > 0
                        ? `+${finalResult.ratingUpdate.ratingChange} Rating`
                        : finalResult.ratingUpdate.ratingChange === 0
                        ? "0 Rating"
                        : `${finalResult.ratingUpdate.ratingChange} Rating`}
                    </span>
                  </div>

                  <div className="text-[11px] text-gray-500 font-mono">
                    vs {bot?.name || "CodeBot"} ({finalResult.ratingUpdate.botRating} Bot Elo)
                  </div>
                </div>

                {/* XP & Level Card */}
                <div className="p-5 rounded-2xl bg-arena-950/80 border border-arena-800 shadow-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-purple-400 font-semibold flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 fill-purple-400" /> XP Earned
                    </span>
                    {finalResult.xpUpdate?.isLevelUp && (
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-extrabold animate-bounce">
                        ★ LEVEL UP!
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-2 my-2">
                    <span className="text-2xl sm:text-3xl font-black text-purple-300 font-mono">
                      +{finalResult.xpUpdate?.xpEarned || 0} XP
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      ({finalResult.xpUpdate?.breakdown.completionXp} match
                      {finalResult.xpUpdate?.breakdown.resultBonusXp ? ` + ${finalResult.xpUpdate.breakdown.resultBonusXp} win` : ""}
                      {finalResult.xpUpdate?.breakdown.dailyBonusXp ? ` + ${finalResult.xpUpdate.breakdown.dailyBonusXp} daily` : ""})
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-gray-400">
                      <span>Level {finalResult.xpUpdate?.currentLevel || 1}</span>
                      <span>{finalResult.xpUpdate?.totalXP} Total XP</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-arena-850 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-700"
                        style={{ width: `${finalResult.xpUpdate?.progressPercent || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Typing Duel Results */}
            {duelType === "TYPING" && finalResult.userWpm !== undefined && (
              <>
                {/* WPM Comparison */}
                <div className="grid grid-cols-2 gap-4 my-8">
                  <div className="p-6 rounded-2xl bg-arena-850 border border-purple-500/30 flex flex-col items-center text-center">
                    <span className="text-xs font-mono uppercase tracking-wider text-purple-400 font-semibold">
                      You ({user?.username})
                    </span>
                    <span className="text-4xl sm:text-6xl font-black text-white font-mono mt-1">
                      {finalResult.userWpm}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">WPM</span>
                    <span className="text-sm text-cyan-400 font-bold mt-1">{finalResult.userAccuracy}% accuracy</span>
                  </div>

                  <div className="p-6 rounded-2xl bg-arena-850 border border-blue-500/30 flex flex-col items-center text-center">
                    <span className="text-xs font-mono uppercase tracking-wider text-blue-400 font-semibold">
                      {bot?.name}
                    </span>
                    <span className="text-4xl sm:text-6xl font-black text-gray-200 font-mono mt-1">
                      {finalResult.botWpm}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">WPM</span>
                    <span className="text-sm text-gray-400 mt-1">Bot opponent</span>
                  </div>
                </div>

                {/* Typing Performance Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-8">
                  <div className="p-3.5 rounded-xl bg-arena-850 border border-arena-800">
                    <div className="text-xs text-gray-400">Correct Chars</div>
                    <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                      {finalResult.userCorrectChars}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-arena-850 border border-arena-800">
                    <div className="text-xs text-gray-400">Error Chars</div>
                    <div className="text-lg font-bold text-red-400 font-mono mt-0.5">
                      {finalResult.incorrectAnswers}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-arena-850 border border-arena-800">
                    <div className="text-xs text-gray-400">Accuracy</div>
                    <div className="text-lg font-bold text-cyan-400 font-mono mt-0.5">
                      {finalResult.userAccuracy}%
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-arena-850 border border-arena-800">
                    <div className="text-xs text-gray-400">Bot Chars</div>
                    <div className="text-lg font-bold text-blue-400 font-mono mt-0.5">
                      {finalResult.botCorrectChars}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Standard Q&A Results */}
            {duelType !== "TYPING" && (
              <>
                {/* Scoreboard Comparison */}
                <div className="grid grid-cols-2 gap-4 my-8">
                  <div className="p-6 rounded-2xl bg-arena-850 border border-purple-500/30 flex flex-col items-center text-center">
                    <span className="text-xs font-mono uppercase tracking-wider text-purple-400 font-semibold">
                      You ({user?.username})
                    </span>
                    <span className="text-4xl sm:text-6xl font-black text-white font-mono mt-1">
                      {finalResult.userScore}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">points scored</span>
                  </div>

                  <div className="p-6 rounded-2xl bg-arena-850 border border-blue-500/30 flex flex-col items-center text-center">
                    <span className="text-xs font-mono uppercase tracking-wider text-blue-400 font-semibold">
                      Opponent ({bot?.name})
                    </span>
                    <span className="text-4xl sm:text-6xl font-black text-gray-200 font-mono mt-1">
                      {finalResult.botScore}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">points scored</span>
                  </div>
                </div>

                {/* Performance Statistics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-8">
                  <div className="p-3.5 rounded-xl bg-arena-850 border border-arena-800">
                    <div className="text-xs text-gray-400">Correct</div>
                    <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                      {finalResult.correctAnswers}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-arena-850 border border-arena-800">
                    <div className="text-xs text-gray-400">Incorrect</div>
                    <div className="text-lg font-bold text-red-400 font-mono mt-0.5">
                      {finalResult.incorrectAnswers}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-arena-850 border border-arena-800">
                    <div className="text-xs text-gray-400">Attempted</div>
                    <div className="text-lg font-bold text-white font-mono mt-0.5">
                      {finalResult.correctAnswers + finalResult.incorrectAnswers}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-arena-850 border border-arena-800">
                    <div className="text-xs text-gray-400">Accuracy</div>
                    <div className="text-lg font-bold text-cyan-400 font-mono mt-0.5">
                      {finalResult.accuracy}%
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Grade & Streak Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {/* Grade Badge */}
              <div className="p-5 rounded-2xl bg-arena-950/80 border border-arena-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono uppercase text-gray-400 font-semibold">
                    Performance Grade
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {duelType === "TYPING"
                      ? `Based on ${finalResult.userWpm} WPM`
                      : `Based on ${finalResult.correctAnswers} correct answers`}
                  </div>
                </div>
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-3xl font-mono shadow-xl ${
                    finalResult.grade === "S"
                      ? "bg-gradient-to-br from-amber-400 to-yellow-600 text-black shadow-amber-500/30"
                      : finalResult.grade === "A"
                      ? "bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-purple-500/30"
                      : finalResult.grade === "B"
                      ? "bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-blue-500/30"
                      : finalResult.grade === "C"
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/30"
                      : "bg-arena-800 text-gray-300"
                  }`}
                >
                  {finalResult.grade}
                </div>
              </div>

              {/* Daily Streak Card */}
              <div className="p-5 rounded-2xl bg-arena-950/80 border border-orange-500/30 flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono uppercase text-orange-400 font-bold flex items-center gap-1.5">
                    <Flame className="w-4 h-4 fill-orange-500" />
                    Daily Streak
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {finalResult.isStreakIncremented
                      ? "+1 Day Streak Extended!"
                      : "Streak recorded for today!"}
                  </div>
                </div>
                <div className="text-2xl font-black text-white font-mono">
                  {finalResult.currentStreak} 🔥
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={() => {
                  window.location.reload();
                }}
                className="w-full sm:w-1/2 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-xl shadow-purple-600/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again ({modeName})</span>
              </button>

              <button
                onClick={() => router.push("/dashboard")}
                className="w-full sm:w-1/2 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-sm text-gray-300 bg-arena-850 border border-arena-700 hover:text-white hover:bg-arena-800 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function DuelPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-arena-950 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DuelArenaContent />
    </Suspense>
  );
}
