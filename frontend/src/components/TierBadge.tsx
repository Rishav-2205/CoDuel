import React from "react";
import { RatingTier } from "../types";
import { TIERS_CONFIG, getTierFromRating } from "../lib/rating-tier";

interface TierBadgeProps {
  tier?: RatingTier;
  rating?: number;
  size?: "xs" | "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export function TierBadge({
  tier,
  rating,
  size = "sm",
  showIcon = true,
  className = "",
}: TierBadgeProps) {
  const activeTier = tier || (rating !== undefined ? getTierFromRating(rating) : "Intermediate");
  const config = TIERS_CONFIG[activeTier] || TIERS_CONFIG.Intermediate;

  const sizeClasses = {
    xs: "text-[9px] px-1.5 py-0.5 gap-1",
    sm: "text-[11px] px-2.5 py-0.5 gap-1.5",
    md: "text-xs px-3 py-1 gap-2",
    lg: "text-sm px-4 py-1.5 gap-2.5 font-bold",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-mono uppercase tracking-wider font-semibold border transition-all ${config.badgeStyle} ${sizeClasses[size]} ${className}`}
    >
      {showIcon && <span>{config.icon}</span>}
      <span>{config.tier}</span>
    </span>
  );
}
