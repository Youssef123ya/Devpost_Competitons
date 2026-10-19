import { Award, BookOpen, Sparkles, Target, Trophy, Zap } from "lucide-react";
import { toast } from "sonner";

type AchievementKind =
  | "lesson"
  | "challenge"
  | "project"
  | "revision"
  | "badge"
  | "xp";

interface AchievementToastOptions {
  language?: "ar" | "en";
  kind?: AchievementKind;
  titleAr: string;
  titleEn: string;
  subtitleAr?: string;
  subtitleEn?: string;
  xp?: number;
}

const ICON_MAP = {
  lesson: BookOpen,
  challenge: Trophy,
  project: Target,
  revision: Sparkles,
  badge: Award,
  xp: Zap,
} as const;

export function showAchievementToast({
  language = "ar",
  kind = "xp",
  titleAr,
  titleEn,
  subtitleAr,
  subtitleEn,
  xp,
}: AchievementToastOptions) {
  const isArabic = language === "ar";
  const Icon = ICON_MAP[kind];
  const title = isArabic ? titleAr : titleEn;
  const subtitle = isArabic ? subtitleAr : subtitleEn;

  toast.custom(
    () => (
      <div
        className={`achievement-toast relative w-[min(92vw,24rem)] overflow-hidden rounded-[1.75rem] border border-purple-200/70 bg-white/95 p-4 shadow-[0_18px_50px_rgba(91,33,182,0.18)] backdrop-blur ${
          isArabic ? "text-right" : "text-left"
        }`}
      >
        <div className="achievement-toast-burst achievement-toast-burst-a" />
        <div className="achievement-toast-burst achievement-toast-burst-b" />
        <div className="achievement-toast-burst achievement-toast-burst-c" />

        <div className={`relative flex items-start gap-3 ${isArabic ? "flex-row-reverse" : ""}`}>
          <div className="achievement-toast-icon">
            <Icon className="h-5 w-5 text-white" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 text-sm font-bold text-slate-900">{title}</div>
            {subtitle && <div className="text-xs leading-6 text-slate-600">{subtitle}</div>}
          </div>

          {typeof xp === "number" && xp > 0 && (
            <div className="achievement-toast-xp">
              +{xp} XP
            </div>
          )}
        </div>
      </div>
    ),
    { duration: 3600 },
  );
}
