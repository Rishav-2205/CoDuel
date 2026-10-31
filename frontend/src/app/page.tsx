"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Swords, Zap, Trophy, ShieldCheck, Flame, ArrowRight } from "lucide-react";
import { useAuth } from "../lib/auth-context";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-arena-950 flex flex-col justify-between selection:bg-purple-600 selection:text-white">
      {/* Top Bar */}
      <header className="border-b border-arena-800/60 bg-arena-950/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-500 p-[2px]">
              <div className="w-full h-full bg-arena-900 rounded-[10px] flex items-center justify-center">
                <Swords className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <span className="font-extrabold text-lg tracking-wider text-white">
              CODING<span className="text-purple-400 font-mono">DUEL</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-300 hover:text-white px-4 py-2 rounded-lg hover:bg-arena-850 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold text-white px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-600/20 transition-all"
            >
              Play Now
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-16 flex-1 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/50 border border-purple-500/30 text-purple-300 text-xs font-mono font-medium mb-8">
          <Zap className="w-3.5 h-3.5 text-purple-400 fill-purple-400" />
          <span>60-SECOND RAPID-FIRE CODING BATTLES</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.1]">
          Prove Your Syntax. <br />
          <span className="text-gradient-purple-blue">Crush the Clock.</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-gray-400 max-w-2xl font-normal leading-relaxed">
          Inspired by competitive arithmetic duels, <span className="text-gray-200 font-medium">Coding Duel</span> throws you into a blistering 1-minute showdown against an intelligent bot. Answer fast, hold your streak, and dominate the leaderboard.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:opacity-95 shadow-xl shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Enter the Arena</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-gray-300 bg-arena-900 border border-arena-800 hover:border-arena-700 hover:text-white transition-all"
          >
            Sign In with Email
          </Link>
        </div>

        {/* Feature Pills */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl w-full">
          <div className="p-5 rounded-2xl bg-arena-900/60 border border-arena-800/80 text-left">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-bold text-white text-sm">60-Second Duels</h3>
            <p className="text-xs text-gray-400 mt-1">
              Pure speed and knowledge. No waiting around—30 questions per language, 60 seconds.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-arena-900/60 border border-arena-800/80 text-left">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-3">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <h3 className="font-bold text-white text-sm">Daily Streaks</h3>
            <p className="text-xs text-gray-400 mt-1">
              Build your streak daily. Keep the fire burning and test your reflexes every day.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-arena-900/60 border border-arena-800/80 text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
              <Trophy className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-bold text-white text-sm">Global Rankings</h3>
            <p className="text-xs text-gray-400 mt-1">
              Climb the ranks across C++, Java, and Python. Every correct answer counts.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-arena-800/40 py-6 text-center text-xs text-gray-500 font-mono">
        Coding Duel v1.0 • Built with Next.js, Express & PostgreSQL
      </footer>
    </div>
  );
}
