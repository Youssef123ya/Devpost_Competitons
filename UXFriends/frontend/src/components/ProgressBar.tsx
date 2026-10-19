import React from "react";

export interface ProgressBarProps {
  value: number;
  max?: number;
  color?: "primary" | "secondary" | "success" | "warning" | "xp";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  color = "primary",
  size = "md",
  showLabel = false,
  className = "",
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const colorStyles = {
    primary: "bg-purple-600",
    secondary: "bg-teal-500",
    success: "bg-green-500",
    warning: "bg-orange-500",
    xp: "bg-yellow-500",
  };

  const sizeStyles = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2 text-sm text-slate-600">
          <span>{Math.round(percentage)}%</span>
          <span>
            {value} / {max}
          </span>
        </div>
      )}
      <div className={`progress-bar ${sizeStyles[size]}`}>
        <div
          className={`progress-bar-fill ${colorStyles[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
