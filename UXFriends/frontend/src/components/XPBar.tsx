import React from "react";
import { Zap } from "lucide-react";
import { ProgressBar } from "./ProgressBar";

export interface XPBarProps {
  currentXP: number;
  requiredXP: number;
  level: number;
  className?: string;
  language?: "ar" | "en";
}

export function XPBar({
  currentXP,
  requiredXP,
  level,
  className = "",
  language = "ar",
}: XPBarProps) {
  const isArabic = language === "ar";
  return (
    <div
      className={`bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-200 ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">
              {isArabic ? `المستوى ${level}` : `Level ${level}`}
            </div>
            <div className="text-xs text-slate-600">
              {currentXP} / {requiredXP} XP
            </div>
          </div>
        </div>
        <div className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
          {level}
        </div>
      </div>
      <ProgressBar value={currentXP} max={requiredXP} color="xp" size="md" />
    </div>
  );
}
