"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Flame,
  Swords,
  Trophy,
  Calendar,
  Code2,
  Percent,
  Edit2,
  Check,
  AlertCircle,
  Loader2,
  Terminal,
  ListChecks,
  Keyboard,
  Zap,
  TrendingUp,
} from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { useAuth } from "../../lib/auth-context";
import { api } from "../../lib/api";
import { ProfileDetails, RatingHistoryPoint } from "../../types";
import { TierBadge } from "../../components/TierBadge";
import { XPProgressBar } from "../../components/XPProgressBar";
import { RatingHistoryChart } from "../../components/RatingHistoryChart";

const AVATAR_OPTIONS = [
  "avatar-neon",
  "avatar-cyber",
  "avatar-matrix",
  "avatar-retro",
  "avatar-ninja",
  "avatar-wizard",
];

export default function ProfilePage() {
  const { user, isLoading, refreshUser } = useAuth();
  const router = useRouter();

  const [profileData, setProfileData] = useState<ProfileDetails | null>(null);
  const [ratingHistory, setRatingHistory] = useState<RatingHistoryPoint[]>([]);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>("");
  const [selectedAvatar, setSelectedAvatar] = useState<string>("avatar-neon");
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    async function fetchProfileDetails() {
      try {
        const [pData, rHistory] = await Promise.all([
          api.getProfile(),
          api.getMyRatingHistory(),
        ]);
        if (pData) {
          setProfileData(pData);
        }
        if (rHistory && rHistory.history) {
          setRatingHistory(rHistory.history);
        }
      } catch (err) {
        console.error("Failed to load profile details:", err);
      }
    }

    if (user) {
      setNewUsername(user.username);
      setSelectedAvatar(user.avatar || "avatar-neon");
      fetchProfileDetails();
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMessage(null);

    if (!newUsername.trim()) {
      setSaveMessage({ type: "error", text: "Username cannot be empty" });
      return;
    }

    try {
      setSaveLoading(true);
      await api.updateProfile({
        username: newUsername.trim(),
        avatar: selectedAvatar,
      });
      await refreshUser();
      setIsEditing(false);
      setSaveMessage({ type: "success", text: "Profile updated successfully!" });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      setSaveMessage({ type: "error", text: err.message || "Failed to update profile" });
    } finally {
      setSaveLoading(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-arena-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const joinDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const overallDuels = profileData?.overall?.totalDuels ?? user.totalDuels;
  const overallWins = profileData?.overall?.totalWins ?? user.totalWins;
  const overallLosses = profileData?.overall?.totalLosses ?? user.totalLosses;
  const overallDraws = profileData?.overall?.totalDraws ?? 0;
  const winRate = overallDuels > 0 ? Math.round((overallWins / overallDuels) * 100) : 0;

  const currentRatings = {
    oneWord: profileData?.modes?.oneWord.rating ?? user.oneWordRating ?? 1000,
    mcq: profileData?.modes?.mcq.rating ?? user.mcqRating ?? 1000,
    typing: profileData?.modes?.typing.rating ?? user.typingRating ?? 1000,
  };

  return (
    <div className="min-h-screen bg-arena-950 flex flex-col selection:bg-purple-600 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Profile Card Header */}
        <div className="relative rounded-3xl bg-arena-900 border border-arena-800 p-6 sm:p-8 backdrop-blur-md overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          {saveMessage && (
            <div
              className={`mb-6 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                saveMessage.type === "success"
                  ? "bg-emerald-950/70 border border-emerald-500/40 text-emerald-300"
                  : "bg-red-950/70 border border-red-500/40 text-red-300"
              }`}
            >
              {saveMessage.type === "success" ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400" />
              )}
              <span>{saveMessage.text}</span>
            </div>
          )}

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Avatar circle */}
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 to-blue-500 p-[3px] shadow-xl shadow-purple-600/30 shrink-0">
                <div className="w-full h-full bg-arena-950 rounded-[21px] flex items-center justify-center font-black text-2xl text-white font-mono">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-black text-white">{user.username}</h1>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-purple-400 hover:bg-arena-800 transition-colors"
                    title="Edit Username or Avatar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-gray-400 font-mono mt-1 flex flex-wrap items-center gap-4">
                  <span>{user.email}</span>
                  <span className="flex items-center gap-1 text-gray-500">
                    <Calendar className="w-3.5 h-3.5" /> Joined {joinDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Streak Quick Badge & Level Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* Daily Streak Card */}
              <div className="flex items-center gap-3 bg-arena-950/80 border border-orange-500/30 px-5 py-3 rounded-2xl shrink-0">
                <Flame className="w-6 h-6 text-orange-500 fill-orange-500 animate-pulse" />
                <div>
                  <div className="text-[10px] uppercase font-mono text-orange-400 font-bold">
                    Daily Streak
                  </div>
                  <div className="text-xl font-black text-white font-mono">
                    {user.currentStreak} Days{" "}
                    <span className="text-xs font-normal text-gray-400">
                      (Best: {user.longestStreak})
                    </span>
                  </div>
                </div>
              </div>

              {/* XP & Level Indicator */}
              <div className="bg-arena-950/80 border border-purple-500/30 p-3 rounded-2xl min-w-[220px]">
                <XPProgressBar
                  levelInfo={profileData?.progression}
                  currentLevel={user.currentLevel || 1}
                  totalXP={user.totalXP || 0}
                />
              </div>
            </div>
          </div>

          {/* Edit Profile Panel */}
          {isEditing && (
            <form
              onSubmit={handleSaveProfile}
              className="mt-6 pt-6 border-t border-arena-800 space-y-4 animate-fade-in"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase font-mono">
                    New Username
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full bg-arena-850 border border-arena-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase font-mono">
                    Avatar Style
                  </label>
                  <select
                    value={selectedAvatar}
                    onChange={(e) => setSelectedAvatar(e.target.value)}
                    className="w-full bg-arena-850 border border-arena-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
                  >
                    {AVATAR_OPTIONS.map((av) => (
                      <option key={av} value={av}>
                        {av}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white bg-arena-850"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 flex items-center gap-1.5"
                >
                  {saveLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Detailed Overall Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-5 rounded-2xl bg-arena-900 border border-arena-800">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase font-mono">Completed</span>
              <Swords className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{overallDuels}</div>
            <div className="text-[11px] text-gray-400 mt-1 font-mono">Total battles</div>
          </div>

          <div className="p-5 rounded-2xl bg-arena-900 border border-arena-800">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase font-mono">Victories</span>
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">{overallWins}</div>
            <div className="text-[11px] text-gray-400 mt-1 font-mono">{winRate}% win rate</div>
          </div>

          <div className="p-5 rounded-2xl bg-arena-900 border border-arena-800">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase font-mono">Defeats</span>
              <Percent className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-black text-red-400 font-mono">{overallLosses}</div>
            <div className="text-[11px] text-gray-400 mt-1 font-mono">{overallDraws} draws</div>
          </div>

          <div className="p-5 rounded-2xl bg-arena-900 border border-arena-800">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase font-mono">Total XP</span>
              <Zap className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-2xl font-black text-yellow-400 font-mono">
              {profileData?.progression?.totalXP ?? user.totalXP ?? 0}
            </div>
            <div className="text-[11px] text-gray-400 mt-1 font-mono">
              Level {profileData?.progression?.currentLevel ?? user.currentLevel ?? 1}
            </div>
          </div>

          <div className="col-span-2 md:col-span-1 p-5 rounded-2xl bg-arena-900 border border-arena-800">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase font-mono">Favorite Lang</span>
              <Code2 className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white uppercase font-mono">
              {profileData?.favoriteLanguage || "—"}
            </div>
            <div className="text-[11px] text-gray-400 mt-1 font-mono">Most played arena</div>
          </div>
        </section>

        {/* 3 Independent Mode Ratings & Statistics Cards */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-purple-400" />
              Competitive Mode Ratings
            </h2>
            <span className="text-[11px] font-mono text-gray-500">
              Independent Elo ratings (Start at 1000)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* ONE-WORD MODE CARD */}
            <div className="p-5 rounded-3xl bg-arena-900 border border-purple-500/30 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                      <Terminal className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">One-Word</h3>
                      <p className="text-[11px] text-gray-400">Rapid recall typing</p>
                    </div>
                  </div>
                  <TierBadge rating={currentRatings.oneWord} size="xs" />
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-black text-white font-mono">
                    {currentRatings.oneWord}
                  </span>
                  <span className="text-xs font-mono text-purple-400 uppercase font-semibold">Elo Rating</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-arena-800">
                  <div className="p-2.5 rounded-xl bg-arena-850">
                    <div className="text-[10px] text-gray-400 uppercase font-mono">Duels</div>
                    <div className="text-base font-black text-white font-mono mt-0.5">
                      {profileData?.oneWordDuels ?? 0}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-arena-850">
                    <div className="text-[10px] text-gray-400 uppercase font-mono">Win Rate</div>
                    <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
                      {profileData?.modes?.oneWord.winRate ?? 0}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-arena-850">
                    <div className="text-[10px] text-gray-400 uppercase font-mono">Best Score</div>
                    <div className="text-base font-black text-purple-400 font-mono mt-0.5">
                      {profileData?.bestOneWordScore ?? 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MCQ MODE CARD */}
            <div className="p-5 rounded-3xl bg-arena-900 border border-blue-500/30 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <ListChecks className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">MCQ Duel</h3>
                      <p className="text-[11px] text-gray-400">4-option precision</p>
                    </div>
                  </div>
                  <TierBadge rating={currentRatings.mcq} size="xs" />
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-black text-white font-mono">
                    {currentRatings.mcq}
                  </span>
                  <span className="text-xs font-mono text-blue-400 uppercase font-semibold">Elo Rating</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-arena-800">
                  <div className="p-2.5 rounded-xl bg-arena-850">
                    <div className="text-[10px] text-gray-400 uppercase font-mono">Duels</div>
                    <div className="text-base font-black text-white font-mono mt-0.5">
                      {profileData?.mcqDuels ?? 0}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-arena-850">
                    <div className="text-[10px] text-gray-400 uppercase font-mono">Win Rate</div>
                    <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
                      {profileData?.modes?.mcq.winRate ?? 0}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-arena-850">
                    <div className="text-[10px] text-gray-400 uppercase font-mono">Best Score</div>
                    <div className="text-base font-black text-blue-400 font-mono mt-0.5">
                      {profileData?.bestMcqScore ?? 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TYPING MODE CARD */}
            <div className="p-5 rounded-3xl bg-arena-900 border border-emerald-500/30 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Keyboard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Typing Duel</h3>
                      <p className="text-[11px] text-gray-400">30s raw code race</p>
                    </div>
                  </div>
                  <TierBadge rating={currentRatings.typing} size="xs" />
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-black text-white font-mono">
                    {currentRatings.typing}
                  </span>
                  <span className="text-xs font-mono text-emerald-400 uppercase font-semibold">Elo Rating</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-arena-800">
                  <div className="p-2.5 rounded-xl bg-arena-850">
                    <div className="text-[10px] text-gray-400 uppercase font-mono">Best WPM</div>
                    <div className="text-base font-black text-cyan-400 font-mono mt-0.5">
                      {profileData?.bestWpm ?? 0}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-arena-850">
                    <div className="text-[10px] text-gray-400 uppercase font-mono">Avg WPM</div>
                    <div className="text-base font-black text-white font-mono mt-0.5">
                      {profileData?.avgWpm ?? 0}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-arena-850">
                    <div className="text-[10px] text-gray-400 uppercase font-mono">Accuracy</div>
                    <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
                      {profileData?.modes?.typing.avgAccuracy ?? profileData?.bestAccuracy ?? 0}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Rating Progression Chart */}
        <section>
          <RatingHistoryChart
            history={ratingHistory}
            currentRatings={currentRatings}
          />
        </section>

        {/* Language Performance Grid */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Code2 className="w-4 h-4 text-purple-400" />
            Language Performance
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(profileData?.languages || [
              { language: "cpp", totalDuels: 0, wins: 0, winRate: 0 },
              { language: "java", totalDuels: 0, wins: 0, winRate: 0 },
              { language: "python", totalDuels: 0, wins: 0, winRate: 0 },
            ]).map((lang) => {
              const langNames: Record<string, { name: string; icon: string; border: string }> = {
                cpp: { name: "C++", icon: "⚡", border: "border-blue-500/20" },
                java: { name: "Java", icon: "☕", border: "border-amber-500/20" },
                python: { name: "Python", icon: "🐍", border: "border-emerald-500/20" },
              };
              const info = langNames[lang.language] || { name: lang.language, icon: "💻", border: "border-arena-800" };

              return (
                <div
                  key={lang.language}
                  className={`p-4 rounded-2xl bg-arena-900 border ${info.border} flex items-center justify-between`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{info.icon}</span>
                    <div>
                      <h4 className="font-bold text-white text-sm">{info.name}</h4>
                      <p className="text-[11px] text-gray-400 font-mono">
                        {lang.totalDuels} duels played
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black font-mono text-emerald-400">
                      {lang.winRate}%
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono">
                      {lang.wins} wins
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent Matches with Rating Changes */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Swords className="w-4 h-4 text-purple-400" />
            Recent Arena Duels & Rating Adjustments
          </h2>

          {profileData?.recentMatches && profileData.recentMatches.length > 0 ? (
            <div className="space-y-2.5">
              {profileData.recentMatches.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl bg-arena-900 border border-arena-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:border-purple-500/30"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black font-mono text-sm shrink-0 ${
                        m.grade === "S"
                          ? "bg-amber-500/20 text-amber-400"
                          : m.grade === "A"
                          ? "bg-purple-500/20 text-purple-400"
                          : m.grade === "B"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-arena-800 text-gray-300"
                      }`}
                    >
                      {m.grade}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white flex flex-wrap items-center gap-2">
                        <span className="uppercase font-mono text-purple-400">{m.language}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-arena-800 text-gray-300 uppercase">
                          {m.duelType === "ONE_WORD" ? "One-Word" : m.duelType}
                        </span>
                        <span className="text-gray-400 font-normal">vs {m.botName}</span>
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                        {m.duelType === "TYPING" && m.userWpm != null
                          ? `${m.userWpm} WPM • ${m.userAccuracy}% acc`
                          : `Score: ${m.userScore} - ${m.botScore}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-arena-800">
                    {/* Rating change pill */}
                    {m.ratingChange != null && (
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg ${
                          m.ratingChange > 0
                            ? "bg-emerald-950/80 text-emerald-400 border border-emerald-500/30"
                            : m.ratingChange < 0
                            ? "bg-red-950/80 text-red-400 border border-red-500/30"
                            : "bg-zinc-800 text-gray-300"
                        }`}
                      >
                        {m.ratingChange > 0 ? `+${m.ratingChange}` : m.ratingChange} Elo
                      </span>
                    )}

                    {/* Result badge */}
                    <span
                      className={`text-xs font-mono font-bold uppercase px-2.5 py-1 rounded-full ${
                        m.result === "WIN"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                          : m.result === "LOSS"
                          ? "bg-red-950 text-red-400 border border-red-500/30"
                          : "bg-amber-950 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {m.result}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-arena-900/40 border border-arena-800 text-center text-xs text-gray-400 font-mono">
              No recent duels played yet.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
