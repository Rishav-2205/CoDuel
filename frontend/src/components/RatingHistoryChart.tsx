import React, { useState } from "react";
import { TrendingUp, Terminal, ListChecks, Keyboard } from "lucide-react";
import { RatingHistoryPoint, DuelType } from "../types";
import { TierBadge } from "./TierBadge";

interface RatingHistoryChartProps {
  history: RatingHistoryPoint[];
  currentRatings?: {
    oneWord: number;
    mcq: number;
    typing: number;
  };
}

export function RatingHistoryChart({ history = [], currentRatings }: RatingHistoryChartProps) {
  const [selectedMode, setSelectedMode] = useState<DuelType>("ONE_WORD");
  const [hoveredPoint, setHoveredPoint] = useState<RatingHistoryPoint | null>(null);

  // Filter history by selected mode
  const modeHistory = history.filter((h) => h.duelType === selectedMode);

  // If there are points, prepend a starting point at 1000 rating if needed
  const points = modeHistory.map((h, index) => ({
    x: index,
    y: h.newRating,
    point: h,
  }));

  // SVG Chart Dimensions
  const width = 600;
  const height = 200;
  const padding = { top: 20, right: 30, bottom: 30, left: 45 };

  // Calculate min & max ratings for scaling
  const allRatings = points.map((p) => p.y);
  const minRating = allRatings.length > 0 ? Math.max(0, Math.min(...allRatings) - 50) : 900;
  const maxRating = allRatings.length > 0 ? Math.max(...allRatings) + 50 : 1100;

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Scale functions
  const getX = (index: number) => {
    if (points.length <= 1) return padding.left + innerWidth / 2;
    return padding.left + (index / (points.length - 1)) * innerWidth;
  };

  const getY = (rating: number) => {
    const range = maxRating - minRating || 1;
    return padding.top + innerHeight - ((rating - minRating) / range) * innerHeight;
  };

  // Generate SVG path string
  let pathD = "";
  let areaD = "";
  if (points.length > 0) {
    const coords = points.map((p, i) => `${getX(i)},${getY(p.y)}`);
    pathD = `M ${coords.join(" L ")}`;
    areaD = `${pathD} L ${getX(points.length - 1)},${height - padding.bottom} L ${getX(0)},${height - padding.bottom} Z`;
  }

  const modeIcons = {
    ONE_WORD: <Terminal className="w-3.5 h-3.5 text-purple-400" />,
    MCQ: <ListChecks className="w-3.5 h-3.5 text-blue-400" />,
    TYPING: <Keyboard className="w-3.5 h-3.5 text-emerald-400" />,
  };

  const modeColors = {
    ONE_WORD: { stroke: "#a855f7", fill: "url(#purpleGradient)", dot: "bg-purple-500" },
    MCQ: { stroke: "#3b82f6", fill: "url(#blueGradient)", dot: "bg-blue-500" },
    TYPING: { stroke: "#10b981", fill: "url(#emeraldGradient)", dot: "bg-emerald-500" },
  };

  const activeColor = modeColors[selectedMode];

  return (
    <div className="rounded-3xl bg-arena-900 border border-arena-800 p-5 sm:p-6 shadow-xl space-y-4">
      {/* Header & Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-arena-800">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-white text-sm sm:text-base tracking-tight">
              Rating Progression
            </h3>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Competitive Elo trajectory over recorded duels
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 bg-arena-950 p-1 rounded-xl border border-arena-800 self-start sm:self-auto">
          {(["ONE_WORD", "MCQ", "TYPING"] as DuelType[]).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setSelectedMode(mode);
                setHoveredPoint(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                selectedMode === mode
                  ? "bg-arena-800 text-white shadow-md border border-arena-700"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {modeIcons[mode]}
              <span>{mode === "ONE_WORD" ? "One-Word" : mode}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Current Rating & Tier Banner */}
      <div className="flex items-center justify-between px-2 pt-1">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl font-black font-mono text-white">
            {currentRatings
              ? selectedMode === "ONE_WORD"
                ? currentRatings.oneWord
                : selectedMode === "MCQ"
                ? currentRatings.mcq
                : currentRatings.typing
              : 1000}
          </span>
          <span className="text-xs font-mono text-gray-400 uppercase">Rating</span>
        </div>
        <TierBadge
          rating={
            currentRatings
              ? selectedMode === "ONE_WORD"
                ? currentRatings.oneWord
                : selectedMode === "MCQ"
                ? currentRatings.mcq
                : currentRatings.typing
              : 1000
          }
          size="sm"
        />
      </div>

      {/* Chart Canvas / Empty State */}
      {points.length === 0 ? (
        <div className="h-44 flex flex-col items-center justify-center text-center p-6 bg-arena-950/40 rounded-2xl border border-dashed border-arena-800">
          <TrendingUp className="w-8 h-8 text-gray-600 mb-2" />
          <p className="text-xs text-gray-400 font-mono">
            No completed matches in {selectedMode === "ONE_WORD" ? "One-Word" : selectedMode} mode yet.
          </p>
          <p className="text-[11px] text-gray-600 mt-0.5">
            Play a duel to begin tracking your rating curve!
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Tooltip for Hovered Point */}
          {hoveredPoint && (
            <div className="absolute top-2 right-4 bg-arena-950 border border-arena-750 rounded-xl px-3 py-2 shadow-xl z-10 text-[11px] font-mono pointer-events-none animate-fade-in">
              <div className="text-white font-bold flex items-center justify-between gap-4">
                <span>Rating: {hoveredPoint.newRating}</span>
                <span
                  className={
                    hoveredPoint.ratingChange > 0
                      ? "text-emerald-400"
                      : hoveredPoint.ratingChange < 0
                      ? "text-red-400"
                      : "text-gray-400"
                  }
                >
                  {hoveredPoint.ratingChange > 0
                    ? `+${hoveredPoint.ratingChange}`
                    : hoveredPoint.ratingChange}
                </span>
              </div>
              <div className="text-gray-400 text-[10px] mt-0.5">
                vs {hoveredPoint.botDifficulty} bot ({hoveredPoint.botRating} rating) • {hoveredPoint.result}
              </div>
              <div className="text-gray-500 text-[9px] mt-0.5">
                {new Date(hoveredPoint.createdAt).toLocaleDateString()}
              </div>
            </div>
          )}

          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-44 overflow-visible"
            >
              <defs>
                <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid Lines */}
              {[minRating, Math.round((minRating + maxRating) / 2), maxRating].map((val, idx) => (
                <g key={idx}>
                  <line
                    x1={padding.left}
                    y1={getY(val)}
                    x2={width - padding.right}
                    y2={getY(val)}
                    stroke="#27272a"
                    strokeDasharray="3,3"
                  />
                  <text
                    x={padding.left - 8}
                    y={getY(val) + 3}
                    textAnchor="end"
                    fill="#71717a"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {val}
                  </text>
                </g>
              ))}

              {/* Area fill */}
              {areaD && <path d={areaD} fill={activeColor.fill} />}

              {/* Line path */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke={activeColor.stroke}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Dots */}
              {points.map((p, idx) => (
                <circle
                  key={idx}
                  cx={getX(idx)}
                  cy={getY(p.y)}
                  r={hoveredPoint?.id === p.point.id ? "5.5" : "3.5"}
                  fill={activeColor.stroke}
                  stroke="#18181b"
                  strokeWidth="2"
                  className="cursor-pointer transition-all hover:r-6"
                  onMouseEnter={() => setHoveredPoint(p.point)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
