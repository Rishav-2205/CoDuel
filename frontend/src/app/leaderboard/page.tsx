"use client";

import React, { useEffect, useState } from "react";
import {
  Trophy,
  Flame,
  Swords,
  CheckCircle2,
  Medal,
  Filter,
  Terminal,
  ListChecks,
  Keyboard,
  Zap,
  Info,
  Calendar,
} from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { api } from "../../lib/api";
import { LeaderboardEntry } from "../../types";
import { TierBadge } from "../../components/TierBadge";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [category, setCategory] = useState<"OVERALL" | "ONE_WORD" | "MCQ" | "TYPING">("OVERALL");
  const [period, setPeriod] = useState<"ALL_TIME" | "MONTHLY" | "WEEKLY">("ALL_TIME");

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        const data = await api.getLeaderboard({
          category,
          period,
        });
        if (data && data.leaderboard) {
          setEntries(data.leaderboard);
        } else {
          setEntries([]);
        }
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [category, period]);

  const categories = [
    { id: "OVERALL", label: "Overall XP", icon: <Zap className="w-3.5 h-3.5 text-yellow-400" /> },
    { id: "ONE_WORD", label: "One-Word Rating", icon: <Terminal className="w-3.5 h-3.5 text-purple-400" /> },
    { id: "MCQ", label: "MCQ Rating", icon: <ListChecks className="w-3.5 h-3.5 text-blue-400" /> },
    { id: "TYPING", label: "Typing Rating", icon: <Keyboard className="w-3.5 h-3.5 text-emerald-400" /> },
  ];

  const periods = [
    { id: "ALL_TIME", label: "All-Time" },
    { id: "MONTHLY", label: "Monthly" },
    { id: "WEEKLY", label: "Weekly" },
  ];

  const topThree = entries.slice(0, 3);
  const remaining = entries.slice(3);

  return (
    <div className="min-h-screen bg-arena-950 flex flex-col selection:bg-purple-600 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-arena-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-arena-900 border border-arena-800 text-xs font-mono text-amber-400 mb-2">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>COMPETITIVE ARENA RANKINGS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Duelist Leaderboard
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Mode-specific Elo ratings and overall activity rankings across all verified players.
            </p>
          </div>

          {/* Time Period Filter Pills */}
          <div className="flex items-center gap-1.5 bg-arena-900 border border-arena-800 p-1 rounded-xl self-start md:self-auto">
            {periods.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as any)}
                className={`text-xs font-mono px-3 py-1.5 rounded-lg transition-all ${
                  period === p.id
                    ? "bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-arena-850">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold font-mono transition-all whitespace-nowrap ${
                category === c.id
                  ? "bg-arena-850 text-white border border-purple-500/50 shadow-lg shadow-purple-600/10"
                  : "bg-arena-900/60 text-gray-400 border border-arena-800 hover:text-white"
              }`}
            >
              {c.icon}
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        {/* Bot Transparency Disclaimer Banner */}
        <div className="p-3.5 rounded-2xl bg-arena-900/70 border border-blue-500/20 flex items-center gap-3 text-xs text-gray-400">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            <strong className="text-gray-300">Bot Rating Notice:</strong> Current ratings are provisional Elo ratings calculated against simulated AI opponents (Easy: 800, Medium: 1200, Hard: 1600).
          </span>
        </div>

        {/* Podium for Top 3 (if 3+ entries exist) */}
        {!loading && topThree.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* 2nd Place */}
            <div className="order-2 md:order-1 p-6 rounded-3xl bg-arena-900 border border-slate-400/30 flex flex-col items-center text-center shadow-lg relative">
              <span className="w-8 h-8 rounded-full bg-slate-300 text-black font-black text-xs flex items-center justify-center font-mono mb-3 shadow-md">
                2
              </span>
              <div className="text-base font-bold text-white mb-1">{topThree[1].username}</div>
              {category === "OVERALL" ? (
                <div className="text-xl font-black font-mono text-yellow-400">
                  {topThree[1].xp} <span className="text-xs text-gray-500">XP</span>
                </div>
              ) : (
                <div className="text-xl font-black font-mono text-white">
                  {topThree[1].rating} <span className="text-xs text-gray-500">Elo</span>
                </div>
              )}
              <div className="mt-2">
                <TierBadge rating={topThree[1].rating || 1000} size="xs" />
              </div>
              <div className="text-[11px] text-gray-400 font-mono mt-3">
                {topThree[1].wins} wins ({topThree[1].winRate}%)
              </div>
            </div>

            {/* 1st Place */}
            <div className="order-1 md:order-2 p-7 rounded-3xl bg-gradient-to-b from-amber-500/10 via-arena-900 to-arena-900 border border-amber-500/50 flex flex-col items-center text-center shadow-xl shadow-amber-500/10 relative -translate-y-1">
              <div className="flex items-center gap-1 text-amber-400 font-mono font-bold text-xs uppercase mb-2">
                <Medal className="w-4 h-4 fill-amber-400" /> Grand Duelist
              </div>
              <span className="w-10 h-10 rounded-full bg-amber-400 text-black font-black text-sm flex items-center justify-center font-mono mb-3 shadow-lg shadow-amber-500/30">
                1
              </span>
              <div className="text-lg font-black text-white mb-1">{topThree[0].username}</div>
              {category === "OVERALL" ? (
                <div className="text-2xl font-black font-mono text-yellow-400">
                  {topThree[0].xp} <span className="text-xs text-gray-500">XP</span>
                </div>
              ) : (
                <div className="text-2xl font-black font-mono text-amber-300">
                  {topThree[0].rating} <span className="text-xs text-gray-500">Elo</span>
                </div>
              )}
              <div className="mt-2">
                <TierBadge rating={topThree[0].rating || 1000} size="sm" />
              </div>
              <div className="text-[11px] text-gray-400 font-mono mt-3">
                {topThree[0].wins} wins ({topThree[0].winRate}%)
              </div>
            </div>

            {/* 3rd Place */}
            <div className="order-3 p-6 rounded-3xl bg-arena-900 border border-amber-700/30 flex flex-col items-center text-center shadow-lg relative">
              <span className="w-8 h-8 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center font-mono mb-3 shadow-md">
                3
              </span>
              <div className="text-base font-bold text-white mb-1">{topThree[2].username}</div>
              {category === "OVERALL" ? (
                <div className="text-xl font-black font-mono text-yellow-400">
                  {topThree[2].xp} <span className="text-xs text-gray-500">XP</span>
                </div>
              ) : (
                <div className="text-xl font-black font-mono text-white">
                  {topThree[2].rating} <span className="text-xs text-gray-500">Elo</span>
                </div>
              )}
              <div className="mt-2">
                <TierBadge rating={topThree[2].rating || 1000} size="xs" />
              </div>
              <div className="text-[11px] text-gray-400 font-mono mt-3">
                {topThree[2].wins} wins ({topThree[2].winRate}%)
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="py-20 text-center rounded-3xl bg-arena-900/50 border border-arena-800 p-8">
            <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No duelist records found</h3>
            <p className="text-xs text-gray-400 mt-1">
              Complete a duel in {category} mode to claim your spot on the leaderboard!
            </p>
          </div>
        ) : (
          <div className="rounded-3xl bg-arena-900/80 border border-arena-800 overflow-hidden shadow-2xl backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-arena-950/80 text-[11px] font-mono uppercase tracking-wider text-gray-400 border-b border-arena-800">
                  <tr>
                    <th className="py-4 px-6 text-center w-20">Rank</th>
                    <th className="py-4 px-6">Duelist</th>
                    <th className="py-4 px-6 text-center">Tier</th>
                    <th className="py-4 px-6 text-center">
                      {category === "OVERALL" ? "Total XP" : "Rating"}
                    </th>
                    <th className="py-4 px-6 text-center">Duels</th>
                    <th className="py-4 px-6 text-center">Wins</th>
                    <th className="py-4 px-6 text-center">Win Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-arena-800/60 font-mono">
                  {entries.map((entry) => {
                    const isGold = entry.rank === 1;
                    const isSilver = entry.rank === 2;
                    const isBronze = entry.rank === 3;

                    return (
                      <tr
                        key={entry.userId}
                        className={`transition-colors hover:bg-arena-850/50 ${
                          isGold
                            ? "bg-amber-500/5"
                            : isSilver
                            ? "bg-slate-300/5"
                            : isBronze
                            ? "bg-amber-700/5"
                            : ""
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-4 px-6 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${
                              isGold
                                ? "bg-amber-400 text-black shadow-md shadow-amber-400/30"
                                : isSilver
                                ? "bg-slate-300 text-black shadow-md shadow-slate-300/30"
                                : isBronze
                                ? "bg-amber-700 text-white shadow-md shadow-amber-700/30"
                                : "text-gray-400 bg-arena-800"
                            }`}
                          >
                            {entry.rank}
                          </span>
                        </td>

                        {/* Duelist Avatar & Username */}
                        <td className="py-4 px-6 font-sans">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 p-[2px]">
                              <div className="w-full h-full bg-arena-950 rounded-full flex items-center justify-center font-bold text-xs text-white">
                                {entry.username.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm">{entry.username}</div>
                              {entry.level && (
                                <div className="text-[10px] text-purple-400 font-mono">
                                  Level {entry.level}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Tier Badge */}
                        <td className="py-4 px-6 text-center">
                          <TierBadge
                            tier={entry.tier}
                            rating={entry.rating || 1000}
                            size="xs"
                          />
                        </td>

                        {/* Score / Rating / XP */}
                        <td className="py-4 px-6 text-center">
                          {category === "OVERALL" ? (
                            <span className="font-black text-yellow-400 text-base">
                              {entry.xp} <span className="text-xs font-normal text-gray-500">XP</span>
                            </span>
                          ) : (
                            <span className="font-black text-white text-base">
                              {entry.rating}{" "}
                              <span className="text-xs font-normal text-gray-500">Elo</span>
                            </span>
                          )}
                        </td>

                        {/* Duels */}
                        <td className="py-4 px-6 text-center text-gray-300">
                          {entry.totalDuels}
                        </td>

                        {/* Wins */}
                        <td className="py-4 px-6 text-center text-emerald-400 font-bold">
                          {entry.wins}
                        </td>

                        {/* Win Rate */}
                        <td className="py-4 px-6 text-center text-cyan-400 font-bold">
                          {entry.winRate}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
