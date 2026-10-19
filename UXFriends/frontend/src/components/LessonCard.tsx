import React from "react";
import { Clock, Star, Lock } from "lucide-react";
import { Card } from "./Card";
import { Badge } from "./Badge";
import { ProgressBar } from "./ProgressBar";

export interface LessonCardProps {
  title: string;
  description: string;
  duration: string;
  difficulty: string;
  difficultyLabel?: string;
  progress?: number;
  xpReward: number;
  locked?: boolean;
  completed?: boolean;
  onClick?: () => void;
  language?: "ar" | "en";
}

export function LessonCard({
  title,
  description,
  duration,
  difficulty,
  difficultyLabel,
  progress = 0,
  xpReward,
  locked = false,
  completed = false,
  onClick,
  language = "ar",
}: LessonCardProps) {
  const normalizedDifficulty = difficulty.trim().toLowerCase();
  const difficultyColors = {
    beginner: "success" as const,
    easy: "success" as const,
    "مبتدئ": "success" as const,
    intermediate: "warning" as const,
    medium: "warning" as const,
    "متوسط": "warning" as const,
    advanced: "error" as const,
    hard: "error" as const,
    "متقدم": "error" as const,
  };

  return (
    <Card
      hover={!locked}
      onClick={locked ? undefined : onClick}
      className={locked ? "opacity-60" : ""}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-16 h-16 rounded-xl flex items-center justify-center ${
            completed
              ? "bg-green-100"
              : locked
                ? "bg-slate-100"
                : "bg-purple-100"
          }`}
        >
          {locked ? (
            <Lock className="w-8 h-8 text-slate-400" />
          ) : completed ? (
            <Star className="w-8 h-8 text-green-600 fill-green-600" />
          ) : (
            <span className="text-2xl">📚</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-semibold text-slate-900">{title}</h4>
            <Badge
              variant={difficultyColors[normalizedDifficulty as keyof typeof difficultyColors] ?? "neutral"}
              size="sm"
            >
              {difficultyLabel || difficulty}
            </Badge>
          </div>

          <p className="text-sm text-slate-600 mb-3 line-clamp-2">
            {description}
          </p>

          <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              <span>{xpReward} XP</span>
            </div>
          </div>

          {!locked && !completed && progress > 0 && (
            <ProgressBar value={progress} color="primary" size="sm" />
          )}

          {completed && (
            <div className="text-sm font-semibold text-green-600">
              ✓ {language === "ar" ? "مكتمل" : "Completed"}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
