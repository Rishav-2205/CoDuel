"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Swords, Trophy, History, User as UserIcon, LogOut, Flame } from "lucide-react";
import { useAuth } from "../lib/auth-context";

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const navLinks = [
    { href: "/dashboard", label: "Arena", icon: Swords },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/history", label: "History", icon: History },
    { href: "/profile", label: "Profile", icon: UserIcon },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-arena-800 bg-arena-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 p-[2px] transition-transform group-hover:scale-105">
            <div className="w-full h-full bg-arena-900 rounded-[10px] flex items-center justify-center">
              <Swords className="w-5 h-5 text-purple-400 group-hover:text-blue-400 transition-colors" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-wider text-white flex items-center gap-1">
              CODING<span className="text-purple-400 font-mono font-bold">DUEL</span>
            </span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-gray-400 -mt-1">
              v1.0 Arena
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        {user && (
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-arena-800 text-purple-400 border border-purple-500/30"
                      : "text-gray-400 hover:text-gray-200 hover:bg-arena-850"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-purple-400" : "text-gray-400"}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* User Stats Pill & Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Daily Streak Pill */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-950/40 border border-orange-500/30 text-orange-400 text-xs font-semibold">
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
                <span>{user.currentStreak} DAY STREAK</span>
              </div>

              {/* User Avatar & Name */}
              <Link
                href="/profile"
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full bg-arena-900 border border-arena-800 hover:border-purple-500/40 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center font-bold text-xs text-white">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-gray-200 max-w-[100px] truncate">
                  {user.username}
                </span>
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                title="Log Out"
                className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs font-medium text-gray-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-arena-850 transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="text-xs font-medium text-white px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-md transition-all"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile nav bar at bottom if logged in */}
      {user && (
        <div className="md:hidden flex items-center justify-around border-t border-arena-800/80 bg-arena-950 py-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-1 text-[11px] font-medium ${
                  isActive ? "text-purple-400" : "text-gray-400"
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
