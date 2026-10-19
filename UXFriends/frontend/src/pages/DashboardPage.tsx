import React, { useEffect, useState } from "react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { XPBar } from "../components/XPBar";
import { StreakWidget } from "../components/StreakWidget";
import { StatsCard } from "../components/StatsCard";
import { LessonCard } from "../components/LessonCard";
import { ChallengeCard } from "../components/ChallengeCard";
import { dashboardApi, type DashboardSummary } from "../services/api";
import {
  createServerClockSnapshot,
  formatServerRemainingTime,
  type ServerClockSnapshot,
} from "../utils/serverTime";
import {
  BookOpen,
  Trophy,
  Target,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  Award,
  RefreshCcw,
} from "lucide-react";

export interface DashboardPageProps {
  user: {
    name: string;
    xp: number;
    level: number;
    streak: number;
    lessonsCompleted: number;
    projectsCompleted: number;
    challengesWon: number;
  };
  onNavigate: (page: string, context?: Record<string, unknown>) => void;
  language?: "ar" | "en";
}

function getDifficultyLabel(difficulty: string, language: "ar" | "en") {
  const normalized = difficulty.trim().toLowerCase();

  if (language === "ar") {
    if (normalized === "beginner" || normalized === "easy") return "مبتدئ";
    if (normalized === "intermediate" || normalized === "medium")
      return "متوسط";
    if (normalized === "advanced" || normalized === "hard") return "متقدم";
  }

  if (normalized === "مبتدئ") return "Beginner";
  if (normalized === "متوسط") return "Intermediate";
  if (normalized === "متقدم") return "Advanced";
  return difficulty;
}

function getChallengeTypeLabel(type: string, language: "ar" | "en") {
  const normalized = type.trim().toLowerCase();

  if (language === "ar") {
    if (normalized === "daily") return "يومي";
    if (normalized === "weekly") return "أسبوعي";
    if (normalized === "personal") return "شخصي";
  }

  if (normalized === "يومي") return "Daily";
  if (normalized === "أسبوعي") return "Weekly";
  if (normalized === "شخصي") return "Personal";
  return type;
}

function formatDuration(minutes: number, language: "ar" | "en") {
  return language === "ar" ? `${minutes} دقيقة` : `${minutes} min`;
}

function getGoalCategoryLabel(
  category: "lessons" | "focus" | "consistency",
  language: "ar" | "en",
) {
  if (language === "ar") {
    if (category === "lessons") return "الدروس";
    if (category === "focus") return "التركيز";
    return "الاستمرارية";
  }

  if (category === "lessons") return "Lessons";
  if (category === "focus") return "Focus";
  return "Consistency";
}

export function DashboardPage({
  user,
  onNavigate,
  language = "ar",
}: DashboardPageProps) {
  const isArabic = language === "ar";
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [serverClock, setServerClock] = useState<ServerClockSnapshot | null>(
    null,
  );
  const [, setClockTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadSummary = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await dashboardApi.getSummary();

        if (!cancelled) {
          setSummary(response.data);
          setServerClock(createServerClockSnapshot(response.data.serverNow));
        }
      } catch (requestError) {
        if (!cancelled) {
          console.error("Failed to load dashboard summary", requestError);
          setError(
            isArabic
              ? "تعذر تحميل بيانات الصفحة الرئيسية حالياً."
              : "Unable to load the dashboard data right now.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadSummary();

    return () => {
      cancelled = true;
    };
  }, [isArabic]);

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

  if (loading) {
    return (
      <div className="container-custom py-8">
        <div className="mb-8">
          <div className="h-10 w-64 animate-pulse rounded-xl bg-slate-200" />
          <div className="mt-3 h-6 w-80 animate-pulse rounded-lg bg-slate-100" />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="container-custom py-8">
        <Card className="p-8 text-center">
          <h3 className="mb-3">
            {isArabic
              ? "تعذر تحميل الصفحة الرئيسية"
              : "Could not load dashboard"}
          </h3>
          <p className="mb-6 text-slate-600">
            {error ||
              (isArabic
                ? "حاول مرة أخرى بعد التأكد من تشغيل الخادم."
                : "Try again after making sure the backend is running.")}
          </p>
          <Button
            variant="primary"
            icon={RefreshCcw}
            onClick={() => window.location.reload()}
          >
            {isArabic ? "إعادة المحاولة" : "Retry"}
          </Button>
        </Card>
      </div>
    );
  }

  const welcomeName = user.name.split(" ")[0];
  const visibleChallenges = summary.activeChallenges.filter(
    (challenge) => !challenge.completed,
  );
  const ArrowIcon = isArabic ? ArrowRight : ArrowLeft;

  return (
    <div className="container-custom py-8">
      <div className="mb-8">
        <h2 className="mb-2">
          {isArabic
            ? `مرحباً، ${welcomeName}!`
            : `Welcome back, ${welcomeName}!`}
        </h2>
        <p className="text-lg text-slate-600">
          {isArabic
            ? "هذه الصفحة تعرض تقدمك الحقيقي من قاعدة البيانات."
            : "This dashboard now reflects your live backend progress."}
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={BookOpen}
          label={isArabic ? "الدروس المكتملة" : "Completed lessons"}
          value={summary.stats.lessonsCompleted}
          trend={
            summary.stats.lessonsCompletedThisWeek > 0
              ? {
                  value: isArabic
                    ? `${summary.stats.lessonsCompletedThisWeek} هذا الأسبوع`
                    : `${summary.stats.lessonsCompletedThisWeek} this week`,
                  positive: true,
                }
              : undefined
          }
          color="purple"
        />
        <StatsCard
          icon={Trophy}
          label={isArabic ? "التحديات المكتملة" : "Completed challenges"}
          value={summary.stats.challengesWon}
          trend={
            summary.stats.challengesWonThisMonth > 0
              ? {
                  value: isArabic
                    ? `${summary.stats.challengesWonThisMonth} هذا الشهر`
                    : `${summary.stats.challengesWonThisMonth} this month`,
                  positive: true,
                }
              : undefined
          }
          color="teal"
        />
        <StatsCard
          icon={Target}
          label={isArabic ? "المشاريع المكتملة" : "Completed projects"}
          value={summary.stats.projectsCompleted}
          color="green"
        />
        <StatsCard
          icon={Award}
          label={isArabic ? "الشارات المكتسبة" : "Earned badges"}
          value={summary.stats.badgesEarned}
          color="yellow"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Card>
            <div className="mb-6 flex items-center justify-between">
              <h3>{isArabic ? "أهداف اليوم" : "Today's goals"}</h3>
              <Target className="h-6 w-6 text-purple-600" />
            </div>

            <div className="space-y-4">
              {summary.todayGoals.map((goal) => {
                const goalCurrent = Math.min(goal.current, goal.target);
                const progressPercent =
                  goal.target === 0
                    ? 0
                    : Math.min(100, (goalCurrent / goal.target) * 100);

                return (
                  <div
                    key={goal.key}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div
                      className={`mb-3 flex flex-wrap items-center justify-between gap-2`}
                    >
                      <div>
                        <div className="mb-1 text-sm font-medium text-purple-600">
                          {getGoalCategoryLabel(goal.category, language)}
                        </div>
                        <div className="font-semibold text-slate-900">
                          {isArabic ? goal.titleAr : goal.titleEn}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          {isArabic ? goal.descriptionAr : goal.descriptionEn}
                        </div>
                      </div>

                      <div className={isArabic ? "text-right" : "text-left"}>
                        <div className="text-sm font-semibold text-amber-600">
                          +{goal.xpReward} XP
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          {goalCurrent} / {goal.target}
                        </div>
                      </div>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-600 to-teal-500 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    {(goal.completed || goal.rewardClaimed) && (
                      <div
                        className={`mt-3 text-sm font-semibold ${
                          goal.rewardClaimed
                            ? "text-green-600"
                            : "text-purple-600"
                        } ${isArabic ? "text-right" : "text-left"}`}
                      >
                        {goal.rewardClaimed
                          ? isArabic
                            ? "تم احتساب مكافأة الهدف"
                            : "Goal reward already counted"
                          : isArabic
                            ? "تم إنجاز الهدف"
                            : "Goal completed"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="mb-1">
                  {isArabic ? "دروس موصى بها" : "Recommended lessons"}
                </h3>
                <p className="text-slate-600">
                  {isArabic
                    ? "مبنية على تقدمك الحالي في المنصة"
                    : "Based on your current progress"}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => onNavigate("learn")}
                icon={ArrowIcon}
                iconPosition={isArabic ? "right" : "left"}
              >
                {isArabic ? "عرض الكل" : "View all"}
              </Button>
            </div>

            <div className="space-y-4">
              {summary.recommendedLessons.length === 0 && (
                <Card className="p-6 text-center text-slate-600">
                  {isArabic
                    ? "لا توجد دروس مقترحة الآن. ابدأ أي مسار لإظهار التوصيات."
                    : "No lesson recommendations yet. Start a path to unlock them."}
                </Card>
              )}

              {summary.recommendedLessons.map((lesson) => (
                <LessonCard
                  key={lesson.code}
                  title={isArabic ? lesson.titleAr : lesson.titleEn}
                  description={
                    isArabic ? lesson.descriptionAr : lesson.descriptionEn
                  }
                  duration={formatDuration(lesson.durationMinutes, language)}
                  difficulty={lesson.difficulty}
                  difficultyLabel={getDifficultyLabel(
                    lesson.difficulty,
                    language,
                  )}
                  progress={lesson.progress}
                  xpReward={lesson.xpReward}
                  language={language}
                  onClick={() =>
                    onNavigate("lesson-player", {
                      sectionCode: lesson.sectionCode,
                      unitCode: lesson.unitCode,
                      lessonCode: lesson.code,
                    })
                  }
                />
              ))}
            </div>
          </div>

          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="mb-1">
                  {isArabic ? "التحديات النشطة" : "Active challenges"}
                </h3>
                <p className="text-slate-600">
                  {isArabic
                    ? "نافس متعلمين من نفس مستواك، ثم افتح لوحة الدوري في صفحة التحديات لترى ترتيبك الأسبوعي."
                    : "Compete with learners at your current level, then open the league leaderboard in Challenges to track your weekly rank."}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => onNavigate("challenges-hub")}
                icon={ArrowIcon}
                iconPosition={isArabic ? "right" : "left"}
              >
                {isArabic ? "عرض الكل" : "View all"}
              </Button>
            </div>

            <div className="space-y-4">
              {visibleChallenges.length === 0 && (
                <Card className="p-6 text-center text-slate-600">
                  {isArabic
                    ? "لا توجد تحديات متاحة حالياً."
                    : "There are no available challenges right now."}
                </Card>
              )}

              {visibleChallenges.map((challenge) => (
                <ChallengeCard
                  key={`${challenge.code}-${challenge.cycleKey}`}
                  title={isArabic ? challenge.titleAr : challenge.titleEn}
                  description={
                    isArabic ? challenge.descriptionAr : challenge.descriptionEn
                  }
                  type={challenge.challengeType}
                  typeLabel={getChallengeTypeLabel(
                    challenge.challengeType,
                    language,
                  )}
                  objective={
                    isArabic ? challenge.objectiveAr : challenge.objectiveEn
                  }
                  progressLabel={
                    isArabic
                      ? challenge.progressLabelAr
                      : challenge.progressLabelEn
                  }
                  progressCurrent={challenge.progressCurrent}
                  progressTarget={challenge.progressTarget}
                  readyToClaim={challenge.readyToClaim}
                  xpReward={challenge.xpReward}
                  participants={challenge.participants}
                  participating={challenge.participating}
                  timeRemaining={formatServerRemainingTime(
                    challenge.expiresAt,
                    language,
                    serverClock,
                  )}
                  language={language}
                  onClick={() =>
                    onNavigate(
                      isArabic ? "challenge-detail" : "challenge-detail-en",
                      {
                        challengeId: challenge.code,
                        cycleKey: challenge.cycleKey,
                      },
                    )
                  }
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <XPBar
            currentXP={summary.xp.current}
            requiredXP={summary.xp.required}
            level={summary.xp.level}
            language={language}
          />

          <Card>
            <StreakWidget
              days={summary.streak.current}
              className="mb-4"
              language={language}
            />
            {summary.streak.nextReward ? (
              <div className="mb-4 space-y-2 text-sm text-slate-600">
                <p>
                  {isArabic
                    ? `متبقي ${summary.streak.daysUntilNextReward} ${summary.streak.daysUntilNextReward === 1 ? "يوم" : "أيام"} للوصول إلى مكافأة ${summary.streak.nextReward.milestoneDays} أيام.`
                    : `${summary.streak.daysUntilNextReward} ${summary.streak.daysUntilNextReward === 1 ? "day" : "days"} left to reach the ${summary.streak.nextReward.milestoneDays}-day reward.`}
                </p>
                <p className="font-medium text-slate-700">
                  {isArabic
                    ? `${summary.streak.nextReward.titleAr}: +${summary.streak.nextReward.xpReward} XP${summary.streak.nextReward.badgeNameAr ? ` • ${summary.streak.nextReward.badgeNameAr}` : ""}`
                    : `${summary.streak.nextReward.titleEn}: +${summary.streak.nextReward.xpReward} XP${summary.streak.nextReward.badgeNameEn ? ` • ${summary.streak.nextReward.badgeNameEn}` : ""}`}
                </p>
              </div>
            ) : (
              <p className="mb-4 text-sm text-slate-600">
                {isArabic
                  ? "أنت عند أعلى مكافآت السلسلة الحالية. استمر في الحفاظ على الإيقاع."
                  : "You have reached the highest current streak reward. Keep the momentum going."}
              </p>
            )}
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500"
                style={{ width: `${summary.streak.progressPercent}%` }}
              />
            </div>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-teal-50">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-teal-500">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="mb-1">
                  {isArabic ? "تحليل ذكي" : "AI insight"}
                </h4>
                <p className="text-sm text-slate-600">
                  {isArabic
                    ? "ملخص سريع مبني على تقدمك الحالي"
                    : "A quick summary based on your current progress"}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="rounded-lg bg-white p-3">
                <div className="mb-1 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-slate-900">
                    {isArabic ? "نقطة القوة" : "Strength"}
                  </span>
                </div>
                <p className="text-slate-600">
                  {isArabic
                    ? summary.aiInsight.strengthAr
                    : summary.aiInsight.strengthEn}
                </p>
              </div>

              <div className="rounded-lg bg-white p-3">
                <div className="mb-1 flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-600" />
                  <span className="font-semibold text-slate-900">
                    {isArabic ? "ركز على" : "Focus on"}
                  </span>
                </div>
                <p className="text-slate-600">
                  {isArabic
                    ? summary.aiInsight.focusAr
                    : summary.aiInsight.focusEn}
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              fullWidth
              className="mt-4"
              onClick={() => onNavigate("ai-analysis")}
            >
              {isArabic ? "عرض التحليل الكامل" : "Open full analysis"}
            </Button>
          </Card>

          <Card>
            <h4 className="mb-4">{isArabic ? "وصول سريع" : "Quick access"}</h4>
            <div className="space-y-3">
              <Button
                variant="outline"
                fullWidth
                onClick={() => onNavigate("learn")}
              >
                {isArabic ? "متابعة التعلم" : "Continue learning"}
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={() => onNavigate("challenges-hub")}
              >
                {isArabic ? "استعراض التحديات" : "Browse challenges"}
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={() => onNavigate("profile")}
              >
                {isArabic ? "الملف الشخصي" : "Profile"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
