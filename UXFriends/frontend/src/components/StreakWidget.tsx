import React from "react";
import { Flame } from "lucide-react";

export interface StreakWidgetProps {
  days: number;
  className?: string;
  language?: "ar" | "en";
}

export function StreakWidget({
  days,
  className = "",
  language = "ar",
}: StreakWidgetProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
        {days > 0 && (
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-orange-600 rounded-full flex items-center justify-center">
            <span className="text-[8px] text-white font-bold">{days}</span>
          </div>
        )}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-slate-900">
          {days} {language === "ar" ? "يوم" : "days"}
        </span>
        <span className="text-xs text-slate-500">
          {language === "ar" ? "سلسلة التعلم" : "Learning streak"}
        </span>
      </div>
    </div>
  );
}
