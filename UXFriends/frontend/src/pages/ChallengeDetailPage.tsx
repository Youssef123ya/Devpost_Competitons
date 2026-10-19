import axios from "axios";
import { useEffect, useState } from "react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { RouteSkeleton } from "../components/AppLoaders";
import { useRewardCelebration } from "../contexts/RewardCelebrationContext";
import {
  gamificationApi,
  type ChallengeDetail,
} from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { buildRewardSnapshot, rewindRewardSnapshot } from "../utils/rewards";
import {
  createServerClockSnapshot,
  formatServerRemainingTime,
  type ServerClockSnapshot,
} from "../utils/serverTime";
import {
  ArrowRight,
  ArrowLeft,
  Trophy,
  Clock3,
  CheckCircle2,
  Zap,
  Medal,
} from "lucide-react";
import { toast } from "sonner";

export interface ChallengeDetailPageProps {
  onNavigate: (page: string, context?: Record<string, unknown>) => void;
  context?: {
    challengeId?: string;
    cycleKey?: string;
  };
  language?: "ar" | "en";
}

function getChallengeTypeLabel(type: string, language: "ar" | "en") {
  switch (type.toLowerCase()) {
    case "weekly":
      return language === "ar" ? "أسبوعي" : "Weekly";
    case "daily":
      return language === "ar" ? "يومي" : "Daily";
    case "personal":
      return language === "ar" ? "شخصي" : "Personal";
    default:
      return language === "ar" ? "تحدي" : "Challenge";
  }
}

function getDifficultyLabel(difficulty: string, language: "ar" | "en") {
  switch (difficulty.toLowerCase()) {
    case "easy":
      return language === "ar" ? "سهل" : "Easy";
    case "medium":
      return language === "ar" ? "متوسط" : "Medium";
    case "hard":
      return language === "ar" ? "صعب" : "Hard";
    default:
      return difficulty;
  }
}

function getChallengeActionError(
  error: unknown,
  language: "ar" | "en",
) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | string
      | {
          message?: string;
          objectiveAr?: string;
          objectiveEn?: string;
          progressCurrent?: number;
          progressTarget?: number;
          progressLabelAr?: string;
          progressLabelEn?: string;
        }
      | undefined;

    if (typeof data === "string" && data.trim().length > 0) {
      return {
        message: data.trim(),
        detail: undefined,
      };
    }

    if (data && typeof data === "object" && data.message) {
      const objective =
        language === "ar" ? data.objectiveAr : data.objectiveEn;
      const progressLabel =
        language === "ar" ? data.progressLabelAr : data.progressLabelEn;

      const detail =
        objective && progressLabel
          ? `${objective} • ${data.progressCurrent ?? 0}/${data.progressTarget ?? 0} • ${progressLabel}`
          : progressLabel ?? undefined;

      return {
        message: data.message,
        detail,
      };
    }

    if (typeof error.message === "string" && error.message.trim().length > 0) {
      return {
        message: error.message,
        detail: undefined,
      };
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return {
      message: error.message,
      detail: undefined,
    };
  }

  return {
    message:
      language === "ar"
        ? "تعذر تنفيذ هذا الإجراء حالياً."
        : "Could not complete this action right now.",
    detail: undefined,
  };
}

export function ChallengeDetailPage({
  onNavigate,
  context,
  language = "ar",
}: ChallengeDetailPageProps) {
  const { refreshUser } = useAuth();
  const { queueRewards } = useRewardCelebration();
  const isArabic = language === "ar";
  const BackIcon = isArabic ? ArrowRight : ArrowLeft;
  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null);
  const [serverClock, setServerClock] = useState<ServerClockSnapshot | null>(null);
  const [, setClockTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    message: string;
    detail?: string;
  } | null>(null);

  const loadChallenge = async (
    challengeId: string,
    cycleKey?: string,
    cancelled = false,
  ) => {
    try {
      setLoading(true);
      setError(null);

      const challengeResponse = await gamificationApi.getChallenge(challengeId, cycleKey);

      if (!cancelled) {
        setChallenge(challengeResponse.data);
        setServerClock(createServerClockSnapshot(challengeResponse.data.serverNow));
      }
    } catch (requestError) {
      if (!cancelled) {
        console.error("Failed to load challenge details", requestError);
        setError(
          isArabic
            ? "تعذر تحميل تفاصيل التحدي."
            : "Could not load challenge details.",
        );
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;
    const challengeId = context?.challengeId;
    if (!challengeId) {
      setChallenge(null);
      setLoading(false);
      setError(
        isArabic
          ? "لم يتم تحديد تحدٍ لعرضه."
          : "No challenge was selected to view.",
      );
      return;
    }

    const loadSelectedChallenge = async () => {
      try {
        setLoading(true);
        setError(null);

        const challengeResponse = await gamificationApi.getChallenge(
          challengeId,
          context?.cycleKey,
        );

        if (!cancelled) {
          setChallenge(challengeResponse.data);
          setServerClock(createServerClockSnapshot(challengeResponse.data.serverNow));
        }
      } catch (requestError) {
        if (!cancelled) {
          console.error("Failed to load challenge details", requestError);
          setError(
            isArabic
              ? "تعذر تحميل تفاصيل التحدي."
              : "Could not load challenge details.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadSelectedChallenge();

    return () => {
      cancelled = true;
    };
  }, [context?.challengeId, context?.cycleKey, isArabic]);

  useEffect(() => {
    if (!serverClock) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setClockTick((value) => value + 1);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [serverClock]);

  const handleJoin = async () => {
    if (!challenge || challenge.participating || challenge.completed) {
      return;
    }

    try {
      setSubmitting(true);
      setActionFeedback(null);
      const response = await gamificationApi.joinChallenge(
        challenge.code,
        challenge.cycleKey,
      );
      const nextCycleKey =
        typeof response.data?.cycleKey === "string" && response.data.cycleKey.length > 0
          ? response.data.cycleKey
          : challenge.cycleKey;

      try {
        await loadChallenge(challenge.code, nextCycleKey);
      } catch (refreshError) {
        console.warn("Joined challenge but failed to refresh challenge state", refreshError);
      }
      toast.success(
        isArabic
          ? "تم الانضمام إلى التحدي. سيبدأ احتساب تقدمك من الآن."
          : "Challenge joined. Your progress starts counting from now.",
      );
    } catch (requestError) {
      console.error("Failed to join challenge", requestError);
      setActionFeedback(getChallengeActionError(requestError, language));
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!challenge || challenge.completed || !challenge.participating) {
      return;
    }

    try {
      setSubmitting(true);
      setActionFeedback(null);
      const response = await gamificationApi.completeChallenge(
        challenge.code,
        challenge.cycleKey,
      );
      setChallenge((current) =>
        current
          ? {
              ...current,
              completed: true,
              readyToClaim: false,
              progressCurrent: current.progressTarget,
            }
          : current,
      );

      try {
        await Promise.allSettled([
          refreshUser(),
          loadChallenge(challenge.code, challenge.cycleKey),
        ]);
      } catch (refreshError) {
        console.warn("Challenge reward claimed but follow-up refresh failed", refreshError);
      }

      const xpAwarded = Number(response.data?.xpAwarded ?? 0);
      const dailyGoalXpAwarded = Number(response.data?.dailyGoalXpAwarded ?? 0);
      const totalAwarded = xpAwarded + dailyGoalXpAwarded;
      if (totalAwarded > 0) {
        const finalSnapshot = buildRewardSnapshot(response.data);
        const afterChallengeReward =
          dailyGoalXpAwarded > 0
            ? rewindRewardSnapshot(finalSnapshot, dailyGoalXpAwarded)
            : finalSnapshot;
        const beforeChallengeReward = rewindRewardSnapshot(
          afterChallengeReward,
          xpAwarded,
        );

        queueRewards([
          {
            kind: "challenge",
            titleAr: "تمت المطالبة بمكافأة التحدي",
            titleEn: "Challenge reward claimed",
            subtitleAr: "واصل صعودك في الدوري الأسبوعي مع كل XP جديدة.",
            subtitleEn: "Keep climbing the weekly league with every new XP gain.",
            xp: xpAwarded,
            from: beforeChallengeReward,
            to: afterChallengeReward,
          },
          {
            kind: "goal",
            titleAr: "تم تحقيق هدف يومي",
            titleEn: "Daily goal achieved",
            subtitleAr: "المكافأة اليومية أضيفت مع نتيجة التحدي.",
            subtitleEn: "Your daily-goal bonus was added with this challenge result.",
            xp: dailyGoalXpAwarded,
            from: afterChallengeReward,
            to: finalSnapshot,
          },
        ]);
      } else {
        toast.success(
          isArabic
            ? "تم تحديث حالة التحدي بنجاح."
            : "Challenge state was updated successfully.",
        );
      }
    } catch (requestError) {
      console.error("Failed to complete challenge", requestError);
      setActionFeedback(getChallengeActionError(requestError, language));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <RouteSkeleton language={language} variant="challenge" />;
  }

  if (error || !challenge) {
    return (
      <div className="container-custom py-8">
        <Card className="py-16 text-center">
          <p className="mb-4 text-slate-600">
            {error ||
              (isArabic
                ? "التحدي غير متاح حالياً."
                : "This challenge is not available right now.")}
          </p>
          <Button
            onClick={() => onNavigate(isArabic ? "challenges-hub" : "challenges-hub-en")}
            variant="primary"
          >
            {isArabic ? "العودة للتحديات" : "Back to Challenges"}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      <button
        onClick={() => onNavigate(isArabic ? "challenges-hub" : "challenges-hub-en")}
        className={`mb-6 flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 ${
          isArabic ? "flex-row-reverse" : ""
        }`}
      >
        <BackIcon className="h-4 w-4" />
        <span>{isArabic ? "العودة إلى صفحة التحديات" : "Back to challenges"}</span>
      </button>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-purple-900 to-teal-700 text-white">
            <div className={isArabic ? "text-right" : "text-left"}>
              <div
                className={`mb-4 flex flex-wrap items-center gap-2 ${isArabic ? "flex-row-reverse" : ""}`}
              >
                <Badge variant="primary" size="sm">
                  {getChallengeTypeLabel(challenge.challengeType, language)}
                </Badge>
                <Badge variant="secondary" size="sm">
                  {getDifficultyLabel(challenge.difficulty, language)}
                </Badge>
                {challenge.completed && (
                  <Badge variant="success" size="sm">
                    {isArabic ? "مكتمل" : "Completed"}
                  </Badge>
                )}
              </div>

              <h1 className="mb-3 text-white">
                {isArabic ? challenge.titleAr : challenge.titleEn}
              </h1>
              <p className="max-w-3xl text-white/80">
                {isArabic ? challenge.descriptionAr : challenge.descriptionEn}
              </p>

              <div
                className={`mt-6 flex flex-wrap items-center gap-4 text-sm text-white/80 ${
                  isArabic ? "flex-row-reverse" : ""
                }`}
              >
                <div className={`flex items-center gap-1 ${isArabic ? "flex-row-reverse" : ""}`}>
                  <Zap className="h-4 w-4 text-yellow-300" />
                  <span>{challenge.xpReward} XP</span>
                </div>
                <div className={`flex items-center gap-1 ${isArabic ? "flex-row-reverse" : ""}`}>
                  <Trophy className="h-4 w-4 text-amber-300" />
                  <span>
                    {challenge.participants} {isArabic ? "مشارك" : "participants"}
                  </span>
                </div>
                <div className={`flex items-center gap-1 ${isArabic ? "flex-row-reverse" : ""}`}>
                  <Clock3 className="h-4 w-4 text-teal-200" />
                  <span>
                    {formatServerRemainingTime(challenge.expiresAt, language, serverClock)}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card className={isArabic ? "text-right" : "text-left"}>
            <h3 className="mb-4">{isArabic ? "تفاصيل التحدي" : "Challenge Details"}</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">
                  {isArabic ? "الحالة" : "Status"}
                </div>
                <div className="mt-2 text-lg font-semibold text-slate-900">
                  {challenge.completed
                    ? isArabic
                      ? "تم الإنجاز"
                      : "Completed"
                    : challenge.participating
                      ? isArabic
                        ? "مشترك ونشط"
                        : "Joined and active"
                    : isArabic
                      ? "متاح للانضمام"
                      : "Available to join"}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">
                  {isArabic ? "الموعد النهائي" : "Deadline"}
                </div>
                <div className="mt-2 text-lg font-semibold text-slate-900">
                  {formatServerRemainingTime(challenge.expiresAt, language, serverClock)}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">
                  {isArabic ? "المشاركون" : "Participants"}
                </div>
                <div className="mt-2 text-lg font-semibold text-slate-900">
                  {challenge.participants}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-5">
              <div className="mb-2 text-sm font-medium text-slate-500">
                {isArabic ? "ماذا يجب أن تنجز؟" : "What do you need to do?"}
              </div>
              <div className="mb-2 text-base font-semibold text-slate-900">
                {isArabic ? challenge.objectiveAr : challenge.objectiveEn}
              </div>
              <div className="text-sm text-slate-500">
                {isArabic ? challenge.progressLabelAr : challenge.progressLabelEn}
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    challenge.readyToClaim
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                      : "bg-gradient-to-r from-purple-600 to-teal-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      challenge.progressTarget === 0
                        ? 0
                        : (challenge.progressCurrent / challenge.progressTarget) * 100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className={isArabic ? "text-right" : "text-left"}>
            <h3 className="mb-4">{isArabic ? "المكافآت" : "Rewards"}</h3>
            <div className="space-y-4">
              <div
                className={`flex items-center gap-3 rounded-2xl bg-slate-50 p-4 ${
                  isArabic ? "flex-row-reverse" : ""
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
                  <Zap className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">{challenge.xpReward} XP</div>
                  <div className="text-sm text-slate-500">
                    {isArabic ? "نقاط الخبرة" : "Experience points"}
                  </div>
                </div>
              </div>
              <div
                className={`flex items-center gap-3 rounded-2xl bg-amber-50 p-4 ${
                  isArabic ? "flex-row-reverse" : ""
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                  <Trophy className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">
                    {challenge.participants}{" "}
                    {isArabic ? "مشاركاً الآن" : "live participants"}
                  </div>
                  <div className="text-sm text-slate-500">
                    {isArabic
                      ? "يتم تحديث هذا العدد مباشرة مع كل انضمام داخل دورة التحدي الحالية."
                      : "This count updates live as learners join the current challenge cycle."}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className={isArabic ? "text-right" : "text-left"}>
            <h3 className="mb-4">{isArabic ? "الإجراء" : "Action"}</h3>
            {!challenge.participating && !challenge.completed ? (
              <Button
                onClick={handleJoin}
                disabled={submitting}
                variant="primary"
                fullWidth
                icon={Trophy}
              >
                {submitting
                  ? isArabic
                    ? "جارٍ الانضمام..."
                    : "Joining..."
                  : isArabic
                    ? "الانضمام إلى التحدي"
                    : "Join Challenge"}
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={challenge.completed || submitting || !challenge.readyToClaim}
                variant={challenge.completed ? "outline" : challenge.readyToClaim ? "primary" : "outline"}
                fullWidth
                icon={challenge.completed ? CheckCircle2 : Trophy}
              >
                {challenge.completed
                  ? isArabic
                    ? "تم إنهاء التحدي"
                    : "Challenge Completed"
                  : submitting
                    ? isArabic
                      ? "جارٍ المطالبة بالمكافأة..."
                      : "Claiming reward..."
                    : !challenge.readyToClaim
                      ? isArabic
                        ? "أكمل الهدف أولاً"
                        : "Finish the goal first"
                    : isArabic
                      ? "المطالبة بالمكافأة"
                      : "Claim Reward"}
              </Button>
            )}

            <div
              className={`mt-4 flex items-center gap-2 text-sm text-slate-500 ${
                isArabic ? "flex-row-reverse" : ""
              }`}
            >
              <Medal className="h-4 w-4" />
              <span>
                {!challenge.participating
                  ? isArabic
                    ? "لن يبدأ احتساب التقدم إلا بعد الانضمام إلى هذا التحدي."
                    : "Progress starts counting only after you join this challenge."
                  : challenge.readyToClaim
                    ? isArabic
                      ? "أكملت الهدف المطلوب ويمكنك الآن المطالبة بالمكافأة."
                      : "You reached the target and can now claim the reward."
                    : challenge.participating
                  ? isArabic
                    ? "يجب الوصول إلى الهدف المطلوب أولاً ثم المطالبة بالمكافأة."
                    : "You need to reach the required target before you can claim the reward."
                  : isArabic
                    ? "يتم تحديث الشارات وXP تلقائياً بعد الإنجاز."
                    : "Badges and XP update automatically after completion."}
              </span>
            </div>

            {actionFeedback ? (
              <div
                className={`mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 ${
                  isArabic ? "text-right" : "text-left"
                }`}
              >
                <div className="font-semibold">{actionFeedback.message}</div>
                {actionFeedback.detail ? (
                  <div className="mt-2 text-amber-800">{actionFeedback.detail}</div>
                ) : null}
              </div>
            ) : null}
          </Card>

          <Card className={isArabic ? "text-right" : "text-left"}>
            <h3 className="mb-3">{isArabic ? "موعد الانتهاء" : "Cycle Ends"}</h3>
            <p className="text-slate-600">
              {new Intl.DateTimeFormat(isArabic ? "ar-EG" : "en-US", {
                dateStyle: "full",
                timeStyle: "short",
              }).format(new Date(challenge.expiresAt))}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
