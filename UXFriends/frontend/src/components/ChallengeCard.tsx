import React from "react";
import { Trophy, Clock, Users } from "lucide-react";
import { Card } from "./Card";
import { Badge } from "./Badge";

export interface ChallengeCardProps {
  title: string;
  description: string;
  type: string;
  typeLabel?: string;
  objective?: string;
  progressLabel?: string;
  progressCurrent?: number;
  progressTarget?: number;
  readyToClaim?: boolean;
  xpReward: number;
  participants?: number;
  timeRemaining?: string;
  participating?: boolean;
  completed?: boolean;
  onClick?: () => void;
  language?: "ar" | "en";
}

export function ChallengeCard({
  title,
  description,
  type,
  typeLabel,
  objective,
  progressLabel,
  progressCurrent = 0,
  progressTarget = 0,
  readyToClaim = false,
  xpReward,
  participants,
  timeRemaining,
  participating = false,
  completed = false,
  onClick,
  language = "ar",
}: ChallengeCardProps) {
  const normalizedType = type.trim().toLowerCase();
  const typeColors = {
    daily: "secondary" as const,
    "يومي": "secondary" as const,
    weekly: "primary" as const,
    "أسبوعي": "primary" as const,
    monthly: "warning" as const,
    "شهري": "warning" as const,
  };

  return (
    <Card hover onClick={onClick} className="relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-teal-500" />

      <div className="flex items-start gap-4">
        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center ${
            completed
              ? "bg-green-100"
              : "bg-gradient-to-br from-purple-100 to-teal-100"
          }`}
        >
          <Trophy
            className={`w-7 h-7 ${completed ? "text-green-600" : "text-purple-600"}`}
          />
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-semibold text-slate-900">{title}</h4>
            <Badge
              variant={typeColors[normalizedType as keyof typeof typeColors] ?? "neutral"}
              size="sm"
            >
              {typeLabel || type}
            </Badge>
          </div>

          <p className="text-sm text-slate-600 mb-3">{description}</p>

          {objective && (
            <div className="mb-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {objective}
            </div>
          )}

          <div className="flex items-center gap-4 text-sm">
            {timeRemaining && (
              <div className="flex items-center gap-1 text-orange-600">
                <Clock className="w-4 h-4" />
                <span>{timeRemaining}</span>
              </div>
            )}
            {participants !== undefined && (
              <div className="flex items-center gap-1 text-slate-500">
                <Users className="w-4 h-4" />
                <span>
                  {participants} {language === "ar" ? "مشارك" : "participants"}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1 text-yellow-600 font-semibold mr-auto">
              <Trophy className="w-4 h-4" />
              <span>{xpReward} XP</span>
            </div>
          </div>

          {progressTarget > 0 && (
            <div className="mt-3">
              <div className="mb-1 text-sm text-slate-500">{progressLabel}</div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    readyToClaim
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                      : "bg-gradient-to-r from-purple-600 to-teal-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      progressTarget === 0 ? 0 : (progressCurrent / progressTarget) * 100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {completed && (
            <div className="mt-3 text-sm font-semibold text-green-600">
              ✓ {language === "ar" ? "اكتمل التحدي" : "Challenge completed"}
            </div>
          )}

          {!completed && participating && readyToClaim && (
            <div className="mt-3 text-sm font-semibold text-emerald-600">
              {language === "ar"
                ? "أصبحت المكافأة جاهزة للمطالبة"
                : "Reward is ready to claim"}
            </div>
          )}

          {!completed && participating && !readyToClaim && (
            <div className="mt-3 text-sm font-semibold text-purple-600">
              {language === "ar" ? "أنت مشترك في هذا التحدي" : "You joined this challenge"}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
