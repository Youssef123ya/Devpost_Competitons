import { Brain, Layers3, Sparkles, Trophy, Zap } from "lucide-react";

type LoaderVariant =
  | "dashboard"
  | "profile"
  | "learning"
  | "lesson"
  | "quiz"
  | "analysis"
  | "chat"
  | "challenge"
  | "settings"
  | "form"
  | "portfolio"
  | "certificate";

export interface AppBootLoaderProps {
  language?: "ar" | "en";
}

export interface RouteSkeletonProps {
  language?: "ar" | "en";
  variant?: LoaderVariant;
  compact?: boolean;
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`skeleton-wave rounded-2xl ${className}`} />;
}

export function AppBootLoader({ language = "ar" }: AppBootLoaderProps) {
  const isArabic = language === "ar";

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.14),_transparent_38%),linear-gradient(180deg,_#fbfbff_0%,_#f7f7fb_100%)]">
      <div className="relative flex min-h-screen items-center justify-center px-6">
        <div className="loader-blob loader-blob-a" />
        <div className="loader-blob loader-blob-b" />
        <div className="loader-blob loader-blob-c" />

        <div className="relative w-full max-w-lg text-center">
          <div className="mx-auto mb-8 flex h-44 w-44 items-center justify-center rounded-full border border-white/70 bg-white/80 shadow-[0_30px_80px_rgba(124,58,237,0.18)] backdrop-blur">
            <div className="loader-orbit-ring" />
            <div className="loader-orbit-chip loader-orbit-chip-a">
              <Zap className="h-4 w-4" />
              <span>XP</span>
            </div>
            <div className="loader-orbit-chip loader-orbit-chip-b">
              <Trophy className="h-4 w-4" />
              <span>{isArabic ? "رتبة" : "Rank"}</span>
            </div>
            <div className="loader-orbit-chip loader-orbit-chip-c">
              <Layers3 className="h-4 w-4" />
              <span>{isArabic ? "دروس" : "Lessons"}</span>
            </div>
            <div className="loader-core">
              <Sparkles className="h-9 w-9 text-white" />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-slate-900">
              {isArabic ? "نجهز رحلتك التالية" : "Preparing your next step"}
            </h3>
            <p className="mx-auto max-w-md text-sm text-slate-600">
              {isArabic
                ? "تحميل التقدم، التحديات، والتوصيات الحقيقية مع لمسة لعبية أسرع وأكثر وضوحاً."
                : "Loading your live progress, challenges, and recommendations with a smoother learning flow."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RouteSkeleton({
  language = "ar",
  variant = "dashboard",
  compact = false,
}: RouteSkeletonProps) {
  const isArabic = language === "ar";
  const containerClassName = compact
    ? "container-custom py-8"
    : "container-custom py-8 lg:py-10";

  return (
    <div className={containerClassName}>
      <div className={`mb-6 ${isArabic ? "text-right" : "text-left"}`}>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-2 shadow-sm backdrop-blur">
          <Brain className="h-4 w-4 text-purple-600" />
          <span className="text-xs font-semibold text-slate-500">
            {isArabic ? "نجهز الشاشة" : "Preparing screen"}
          </span>
        </div>
        <SkeletonBlock className="mb-3 h-10 w-52 max-w-full" />
        <SkeletonBlock className="h-5 w-80 max-w-full" />
      </div>

      {variant === "dashboard" && (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-32" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
            <div className="space-y-6">
              <SkeletonBlock className="h-56" />
              <SkeletonBlock className="h-64" />
            </div>
            <div className="space-y-6">
              <SkeletonBlock className="h-48" />
              <SkeletonBlock className="h-56" />
            </div>
          </div>
        </>
      )}

      {variant === "profile" && (
        <>
          <SkeletonBlock className="mb-6 h-72" />
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <SkeletonBlock className="h-80" />
            <SkeletonBlock className="h-80" />
          </div>
        </>
      )}

      {variant === "learning" && (
        <>
          <SkeletonBlock className="mb-6 h-48" />
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-52" />
            ))}
          </div>
        </>
      )}

      {variant === "lesson" && (
        <>
          <SkeletonBlock className="mb-6 h-20" />
          <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
            <SkeletonBlock className="h-52" />
            <div className="space-y-4">
              <SkeletonBlock className="h-24" />
              <SkeletonBlock className="h-40" />
              <SkeletonBlock className="h-40" />
            </div>
          </div>
        </>
      )}

      {variant === "quiz" && (
        <>
          <SkeletonBlock className="mb-6 h-20" />
          <SkeletonBlock className="mb-6 h-72" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-24" />
            ))}
          </div>
        </>
      )}

      {variant === "analysis" && (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-28" />
            ))}
          </div>
          <div className="space-y-6">
            <SkeletonBlock className="h-52" />
            <SkeletonBlock className="h-72" />
          </div>
        </>
      )}

      {variant === "chat" && (
        <>
          <SkeletonBlock className="mb-4 h-16" />
          <div className="mb-6 space-y-4">
            <SkeletonBlock className="h-20 w-3/4" />
            <SkeletonBlock className="ms-auto h-20 w-2/3" />
            <SkeletonBlock className="h-24 w-4/5" />
          </div>
          <SkeletonBlock className="mb-4 h-16" />
          <SkeletonBlock className="h-24" />
        </>
      )}

      {variant === "challenge" && (
        <>
          <SkeletonBlock className="mb-6 h-44" />
          <div className="grid gap-6 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-64" />
            ))}
          </div>
        </>
      )}

      {variant === "settings" && (
        <>
          <SkeletonBlock className="mb-6 h-28" />
          <div className="space-y-6">
            <SkeletonBlock className="h-32" />
            <SkeletonBlock className="h-64" />
            <SkeletonBlock className="h-52" />
          </div>
        </>
      )}

      {variant === "portfolio" && (
        <>
          <SkeletonBlock className="mb-6 h-56" />
          <div className="grid gap-6 md:grid-cols-2">
            <SkeletonBlock className="h-72" />
            <SkeletonBlock className="h-72" />
          </div>
        </>
      )}

      {variant === "certificate" && (
        <>
          <SkeletonBlock className="mb-6 h-[28rem]" />
          <div className="grid gap-6 md:grid-cols-2">
            <SkeletonBlock className="h-48" />
            <SkeletonBlock className="h-48" />
          </div>
        </>
      )}

      {variant === "form" && (
        <>
          <SkeletonBlock className="mb-6 h-24" />
          <SkeletonBlock className="mb-4 h-16" />
          <SkeletonBlock className="mb-4 h-16" />
          <SkeletonBlock className="mb-4 h-40" />
          <SkeletonBlock className="h-14 w-44" />
        </>
      )}
    </div>
  );
}
