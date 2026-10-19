import { useEffect, useMemo, useState } from "react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Avatar } from "../components/Avatar";
import { ProgressBar } from "../components/ProgressBar";
import { RouteSkeleton } from "../components/AppLoaders";
import { userApi, type ProfileOverview } from "../services/api";
import { parseServerDate } from "../utils/serverTime";
import {
  Settings,
  Share2,
  Award,
  BookOpen,
  Trophy,
  Target,
  Calendar,
  TrendingUp,
  Flame,
  ExternalLink,
  Edit,
  FolderOpen,
  Lock,
} from "lucide-react";

export interface ProfilePageProps {
  user: {
    name: string;
    xp: number;
    level: number;
    streak: number;
    lessonsCompleted: number;
    projectsCompleted: number;
    challengesWon: number;
  };
  onNavigate?: (page: string, context?: Record<string, unknown>) => void;
  language?: "ar" | "en";
}

function formatRelativeTime(dateString: string, language: "ar" | "en") {
  const date = parseServerDate(dateString) ?? new Date(dateString);
  const diffMs = date.getTime() - Date.now();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const formatter = new Intl.RelativeTimeFormat(
    language === "ar" ? "ar-EG" : "en-US",
    {
      numeric: "auto",
    },
  );

  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) {
    return formatter.format(diffDays, "day");
  }

  const diffMonths = Math.round(diffDays / 30);
  return formatter.format(diffMonths, "month");
}

function getGoalLabel(goal: string | null | undefined, language: "ar" | "en") {
  switch (goal) {
    case "basics":
      return language === "ar" ? "تعلم الأساسيات" : "Learning the fundamentals";
    case "ui":
      return language === "ar" ? "تطوير مهارات UI" : "Improving UI skills";
    case "ux":
      return language === "ar" ? "تطوير مهارات UX" : "Improving UX skills";
    case "career":
      return language === "ar"
        ? "الاستعداد لسوق العمل"
        : "Preparing for career growth";
    default:
      return language === "ar"
        ? "رحلة تعلم مستمرة"
        : "Ongoing learning journey";
  }
}

function getSkillLevelLabel(
  level: string | null | undefined,
  language: "ar" | "en",
) {
  switch (level) {
    case "beginner":
      return language === "ar" ? "مبتدئ" : "Beginner";
    case "intermediate":
      return language === "ar" ? "متوسط" : "Intermediate";
    case "advanced":
      return language === "ar" ? "متقدم" : "Advanced";
    default:
      return language === "ar" ? "غير محدد" : "Not set";
  }
}

function getProfileTitle(
  profile: ProfileOverview["profile"],
  language: "ar" | "en",
) {
  if (profile.professionalTitle?.trim()) {
    return profile.professionalTitle.trim();
  }

  switch (profile.learningGoal) {
    case "basics":
      return language === "ar"
        ? "مصمم UX/UI في بداية الرحلة"
        : "Early-stage UX/UI Designer";
    case "ui":
      return language === "ar" ? "مصمم واجهات UI" : "UI Designer";
    case "ux":
      return language === "ar" ? "مصمم تجربة مستخدم UX" : "UX Designer";
    case "career":
      return language === "ar"
        ? "مصمم UX/UI يستعد لسوق العمل"
        : "UX/UI Designer preparing for the job market";
    default:
      return language === "ar" ? "مصمم UX/UI" : "UX/UI Designer";
  }
}

function getProfileBio(
  profile: ProfileOverview["profile"],
  language: "ar" | "en",
) {
  if (profile.bio?.trim()) {
    return profile.bio.trim();
  }

  if (language === "ar") {
    if (profile.weeklyDays && profile.dailyMinutes) {
      return `يتعلم ${profile.weeklyDays} أيام أسبوعياً بمتوسط ${profile.dailyMinutes} دقيقة يومياً مع تركيز على ${getGoalLabel(profile.learningGoal, language)}.`;
    }

    return `يركز حالياً على ${getGoalLabel(profile.learningGoal, language)} ويطوّر مستواه ${getSkillLevelLabel(profile.skillLevel, language)} خطوة بخطوة.`;
  }

  if (profile.weeklyDays && profile.dailyMinutes) {
    return `Learns ${profile.weeklyDays} days a week for about ${profile.dailyMinutes} minutes per day, with a focus on ${getGoalLabel(profile.learningGoal, language).toLowerCase()}.`;
  }

  return `Currently focused on ${getGoalLabel(profile.learningGoal, language).toLowerCase()} while growing at the ${getSkillLevelLabel(profile.skillLevel, language).toLowerCase()} level.`;
}

export function ProfilePage({
  user,
  onNavigate,
  language = "ar",
}: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "projects" | "achievements" | "activity"
  >("overview");
  const [overview, setOverview] = useState<ProfileOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadOverview = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await userApi.getProfileOverview();

        if (!cancelled) {
          setOverview(response.data);
        }
      } catch (requestError) {
        if (!cancelled) {
          console.error("Failed to load profile overview", requestError);
          setError(
            language === "ar"
              ? "تعذر تحميل بيانات الملف الشخصي."
              : "Could not load profile data.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadOverview();

    return () => {
      cancelled = true;
    };
  }, [language]);

  const profile = overview?.profile;
  const stats = useMemo(
    () => [
      {
        label: language === "ar" ? "دروس مكتملة" : "Lessons completed",
        value: profile?.lessonsCompleted ?? user.lessonsCompleted,
        icon: BookOpen,
        color: "from-purple-500 to-purple-600",
      },
      {
        label: language === "ar" ? "مشاريع مكتملة" : "Projects completed",
        value: profile?.projectsCompleted ?? user.projectsCompleted,
        icon: Target,
        color: "from-teal-500 to-teal-600",
      },
      {
        label: language === "ar" ? "تحديات منجزة" : "Challenges won",
        value: profile?.challengesWon ?? user.challengesWon,
        icon: Trophy,
        color: "from-yellow-500 to-yellow-600",
      },
      {
        label: language === "ar" ? "سلسلة التعلم" : "Learning streak",
        value: profile?.currentStreak ?? user.streak,
        icon: Flame,
        color: "from-orange-500 to-orange-600",
      },
    ],
    [
      language,
      profile,
      user.challengesWon,
      user.lessonsCompleted,
      user.projectsCompleted,
      user.streak,
    ],
  );
  const unlockedBadges = useMemo(
    () => overview?.badges.filter((badge) => badge.unlocked) ?? [],
    [overview?.badges],
  );

  if (loading) {
    return <RouteSkeleton language={language} variant="profile" />;
  }

  if (error || !overview || !profile) {
    return (
      <div className="container-custom py-8">
        <Card className="py-16 text-center">
          <p className="mb-4 text-slate-600">
            {error ||
              (language === "ar"
                ? "تعذر عرض الملف الشخصي حالياً."
                : "The profile is not available right now.")}
          </p>
          <Button
            onClick={() => onNavigate?.(language === "ar" ? "home" : "home-en")}
            variant="primary"
          >
            {language === "ar" ? "العودة للرئيسية" : "Back to Dashboard"}
          </Button>
        </Card>
      </div>
    );
  }

  const isArabic = language === "ar";
  const displayName =
    `${profile.firstName} ${profile.lastName}`.trim() || user.name;
  const displayTitle = getProfileTitle(profile, language);
  const displayBio = getProfileBio(profile, language);
  const joinedLabel = new Intl.DateTimeFormat(isArabic ? "ar-EG" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(profile.joinDate));
  const heroStats = [
    {
      label: isArabic ? "المستوى" : "Level",
      value: profile.level,
      valueClassName: "text-purple-700",
      labelClassName: "text-purple-600",
      cardClassName: "bg-gradient-to-br from-purple-50 to-purple-100",
    },
    {
      label: "XP",
      value: profile.totalXP.toLocaleString(),
      valueClassName: "text-teal-700",
      labelClassName: "text-teal-600",
      cardClassName: "bg-gradient-to-br from-teal-50 to-teal-100",
    },
    {
      label: isArabic ? "أيام متتالية" : "Streak days",
      value: profile.currentStreak,
      valueClassName: "text-orange-700",
      labelClassName: "text-orange-600",
      cardClassName: "bg-gradient-to-br from-orange-50 to-orange-100",
    },
    {
      label: isArabic ? "شارة" : "Badges",
      value: profile.badgesEarned,
      valueClassName: "text-yellow-700",
      labelClassName: "text-yellow-600",
      cardClassName: "bg-gradient-to-br from-yellow-50 to-yellow-100",
    },
  ];

  return (
    <div className="container-custom py-8">
      <Card className="mb-8" padding="none">
        <div className="p-5 sm:p-8">
          <div
            className={`mb-6 flex ${isArabic ? "justify-end" : "justify-start"}`}
          >
            <Button
              variant="ghost"
              size="sm"
              icon={Settings}
              onClick={() =>
                onNavigate?.(isArabic ? "settings" : "settings-en")
              }
            >
              {isArabic ? "الإعدادات" : "Settings"}
            </Button>
          </div>

          <div
            className={`flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between ${
              isArabic ? "xl:flex-row-reverse" : ""
            }`}
          >
            <div className={`flex-1 ${isArabic ? "text-right" : "text-left"}`}>
              <h2 className="mb-2 text-3xl sm:text-4xl lg:text-5xl">
                {displayName}
              </h2>
              <p className="mb-3 text-xl text-slate-600">{displayTitle}</p>
              <div className={`mb-4 flex flex-wrap gap-3 ${isArabic ? "justify-end" : ""}`}>
                <Badge variant="secondary" size="sm">
                  {isArabic ? "المستوى الحالي" : "Current level"}:{" "}
                  {getSkillLevelLabel(profile.skillLevel, language)}
                </Badge>
              </div>

              <div
                className={`flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500 `}
              >
                <div
                  className={`flex items-center gap-2 ${isArabic ? "flex-row-reverse" : ""}`}
                >
                  <Calendar className="h-4 w-4" />
                  <span>
                    {isArabic
                      ? `انضم في ${joinedLabel}`
                      : `Joined in ${joinedLabel}`}
                  </span>
                </div>
                {profile.website ? (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center gap-2 text-purple-600 transition-colors hover:text-purple-700 ${isArabic ? "flex-row-reverse" : ""}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>{isArabic ? "الموقع الشخصي" : "Website"}</span>
                  </a>
                ) : null}
              </div>

              <p className="mt-5 max-w-4xl text-lg leading-relaxed text-slate-700">
                {displayBio}
              </p>

              <div className={`mt-8 flex flex-wrap gap-4 `}>
                {heroStats.map((stat) => (
                  <div
                    key={stat.label}
                    className={`min-w-[150px] flex-1 rounded-2xl p-5 text-center sm:w-[170px] sm:flex-none ${stat.cardClassName}`}
                  >
                    <div
                      className={`mb-1 text-3xl font-bold ${stat.valueClassName}`}
                    >
                      {stat.value}
                    </div>
                    <div className={`text-sm ${stat.labelClassName}`}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className={`flex shrink-0 flex-col items-center gap-4 ${
                isArabic ? "xl:items-start" : "xl:items-end"
              }`}
            >
              <Avatar
                name={displayName}
                src={profile.avatar ?? undefined}
                size="xl"
                className="h-28 w-28 sm:h-32 sm:w-32 lg:h-36 lg:w-36"
              />

              <div
                className={`flex flex-wrap gap-3 ${isArabic ? "justify-start" : "justify-end"}`}
              >
                <Button
                  variant="primary"
                  icon={Edit}
                  onClick={() =>
                    onNavigate?.(isArabic ? "edit-profile" : "edit-profile-en")
                  }
                >
                  {isArabic ? "تعديل الملف" : "Edit Profile"}
                </Button>
                <Button
                  variant="outline"
                  icon={Share2}
                  onClick={() =>
                    onNavigate?.(isArabic ? "share" : "share-en", {
                      type: "profile",
                      title: displayName,
                      backPage: isArabic ? "profile" : "profile-en",
                    })
                  }
                >
                  {isArabic ? "مشاركة" : "Share"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={activeTab === "overview" ? "primary" : "ghost"}
          onClick={() => setActiveTab("overview")}
        >
          {isArabic ? "نظرة عامة" : "Overview"}
        </Button>
        <Button
          variant={activeTab === "projects" ? "primary" : "ghost"}
          onClick={() => setActiveTab("projects")}
          icon={Target}
        >
          {isArabic ? "المشاريع" : "Projects"}
        </Button>
        <Button
          variant={activeTab === "achievements" ? "primary" : "ghost"}
          onClick={() => setActiveTab("achievements")}
          icon={Award}
        >
          {isArabic ? "الإنجازات" : "Achievements"}
        </Button>
        <Button
          variant={activeTab === "activity" ? "primary" : "ghost"}
          onClick={() => setActiveTab("activity")}
          icon={TrendingUp}
        >
          {isArabic ? "النشاط" : "Activity"}
        </Button>
      </div>

      {activeTab === "overview" && (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <Card>
              <h3 className="mb-6">
                {isArabic ? "تقدم المسارات" : "Path Progress"}
              </h3>
              <div className="space-y-4">
                {overview.learningPaths.map((path) => (
                  <div key={path.code}>
                    <div
                      className={`mb-2 flex items-center justify-between gap-4 `}
                    >
                      <div className={isArabic ? "text-right" : "text-left"}>
                        <div className="font-medium text-slate-900">
                          {isArabic ? path.titleAr : path.titleEn}
                        </div>
                        <div className="text-sm text-slate-500">
                          {isArabic
                            ? `${path.completedLessons} من ${path.totalLessons} دروس مكتملة`
                            : `${path.completedLessons} of ${path.totalLessons} lessons completed`}
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-purple-600">
                        {path.progress}%
                      </span>
                    </div>
                    <ProgressBar
                      value={path.progress}
                      color="primary"
                      size="md"
                    />
                  </div>
                ))}
              </div>
            </Card>

            <div>
              <div
                className={`mb-6 flex items-center justify-between ${isArabic ? "flex-row-reverse" : ""}`}
              >
                <h3>{isArabic ? "آخر المشاريع" : "Latest Projects"}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onNavigate?.(
                      isArabic ? "projects-list" : "projects-list-en",
                    )
                  }
                >
                  {isArabic ? "عرض الكل" : "View all"}
                </Button>
              </div>

              {overview.projects.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {overview.projects.slice(0, 4).map((project) => (
                    <Card key={project.code} hover>
                      <h4 className="mb-2">
                        {isArabic ? project.titleAr : project.titleEn}
                      </h4>
                      <p className="mb-3 text-sm text-slate-600">
                        {isArabic
                          ? project.descriptionAr
                          : project.descriptionEn}
                      </p>
                      <div
                        className={`flex items-center justify-between gap-3 ${isArabic ? "flex-row-reverse" : ""}`}
                      >
                        <Badge variant="secondary" size="sm">
                          {project.submissionStatus
                            ? isArabic
                              ? "تم التسليم"
                              : "Submitted"
                            : isArabic
                              ? "جاهز للبدء"
                              : "Ready"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            onNavigate?.(
                              isArabic ? "project-detail" : "project-detail-en",
                              { projectCode: project.code },
                            )
                          }
                        >
                          {isArabic ? "عرض" : "View"}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="text-center">
                  <FolderOpen className="mx-auto mb-4 h-10 w-10 text-slate-300" />
                  <p className="mb-4 text-slate-600">
                    {isArabic
                      ? "لا توجد تسليمات مشاريع بعد."
                      : "No project submissions yet."}
                  </p>
                  <Button
                    onClick={() =>
                      onNavigate?.(
                        isArabic ? "projects-list" : "projects-list-en",
                      )
                    }
                    variant="primary"
                  >
                    {isArabic ? "ابدأ مشروعك" : "Start a Project"}
                  </Button>
                </Card>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <h4 className="mb-4">{isArabic ? "الإحصائيات" : "Stats"}</h4>
              <div className="space-y-4">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className={`flex items-center gap-3 ${isArabic ? "flex-row-reverse" : ""}`}
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${stat.color}`}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div
                        className={`flex-1 ${isArabic ? "text-right" : "text-left"}`}
                      >
                        <div className="text-sm text-slate-600">
                          {stat.label}
                        </div>
                        <div className="text-xl font-bold text-slate-900">
                          {stat.value}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card>
              <div
                className={`mb-4 flex items-center justify-between ${isArabic ? "flex-row-reverse" : ""}`}
              >
                <h4>{isArabic ? "الشارات" : "Badges"}</h4>
                <Badge variant="primary" size="sm">
                  {profile.badgesEarned} / {overview.totals.totalBadges}
                </Badge>
              </div>
              {unlockedBadges.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {unlockedBadges.slice(0, 4).map((badge) => (
                    <div
                      key={badge.code}
                      className="rounded-xl bg-gradient-to-br from-purple-500 to-teal-500 p-3 text-center text-white"
                    >
                      <span className="mb-1 block text-3xl">{badge.icon}</span>
                      <span className="text-xs font-medium">
                        {isArabic ? badge.nameAr : badge.nameEn}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  {isArabic
                    ? "لم تحصل على شارات بعد."
                    : "No badges unlocked yet."}
                </p>
              )}
            </Card>
          </div>
        </div>
      )}

      {activeTab === "projects" && (
        <div>
          <div
            className={`mb-6 flex items-center justify-between ${isArabic ? "flex-row-reverse" : ""}`}
          >
            <div className={isArabic ? "text-right" : "text-left"}>
              <h3 className="mb-1">{isArabic ? "مشاريعي" : "My Projects"}</h3>
              <p className="text-slate-600">
                {isArabic
                  ? `${overview.projects.length} مشاريع مرتبطة بحسابك`
                  : `${overview.projects.length} projects linked to your account`}
              </p>
            </div>
            <Button
              variant="primary"
              icon={Target}
              onClick={() =>
                onNavigate?.(isArabic ? "projects-list" : "projects-list-en")
              }
            >
              {isArabic ? "استعراض المشاريع" : "Browse Projects"}
            </Button>
          </div>

          {overview.projects.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {overview.projects.map((project) => (
                <Card key={project.code} hover>
                  <h4 className="mb-2">
                    {isArabic ? project.titleAr : project.titleEn}
                  </h4>
                  <p className="mb-3 text-sm text-slate-600">
                    {isArabic ? project.descriptionAr : project.descriptionEn}
                  </p>
                  <div
                    className={`flex items-center justify-between gap-3 border-t border-slate-100 pt-3 ${isArabic ? "flex-row-reverse" : ""}`}
                  >
                    <span className="text-sm text-slate-500">
                      {project.submittedAt
                        ? formatRelativeTime(project.submittedAt, language)
                        : isArabic
                          ? "لم يتم التسليم بعد"
                          : "Not submitted yet"}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        onNavigate?.(
                          isArabic ? "project-detail" : "project-detail-en",
                          { projectCode: project.code },
                        )
                      }
                    >
                      {isArabic ? "عرض" : "Open"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="py-16 text-center">
              <p className="mb-4 text-slate-600">
                {isArabic
                  ? "لا توجد تسليمات مشاريع بعد."
                  : "No project submissions yet."}
              </p>
              <Button
                onClick={() =>
                  onNavigate?.(isArabic ? "projects-list" : "projects-list-en")
                }
                variant="primary"
              >
                {isArabic ? "ابدأ مشروعاً" : "Start a Project"}
              </Button>
            </Card>
          )}
        </div>
      )}

      {activeTab === "achievements" && (
        <div>
          <div className="mb-8 rounded-2xl bg-gradient-to-br from-purple-50 to-teal-50 p-8 text-center">
            <Award className="mx-auto mb-4 h-16 w-16 text-purple-600" />
            <h3 className="mb-2">
              {isArabic ? "الشارات والإنجازات" : "Badges & Achievements"}
            </h3>
            <p className="mb-4 text-slate-600">
              {isArabic
                ? `حصلت على ${profile.badgesEarned} من أصل ${overview.totals.totalBadges} شارات متاحة`
                : `You've unlocked ${profile.badgesEarned} out of ${overview.totals.totalBadges} available badges`}
            </p>
            <ProgressBar
              value={
                overview.totals.totalBadges === 0
                  ? 0
                  : (profile.badgesEarned / overview.totals.totalBadges) * 100
              }
              color="primary"
              size="lg"
            />
            <p className="mt-4 text-sm text-slate-600">
              {isArabic
                ? `${overview.totals.totalBadges - profile.badgesEarned} شارات غير محققة ما زالت بانتظارك`
                : `${overview.totals.totalBadges - profile.badgesEarned} locked badges are still waiting for you`}
            </p>
          </div>

          {overview.badges.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {overview.badges.map((badge) => (
                <Card
                  key={badge.code}
                  className={`text-center ${badge.unlocked ? "" : "border-dashed border-slate-300 bg-slate-50/80"}`}
                >
                  <div className="mb-4 flex justify-center text-5xl">
                    {badge.unlocked ? (
                      <span>{badge.icon}</span>
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200 text-slate-500">
                        <Lock className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <h5 className="mb-2">
                    {isArabic ? badge.nameAr : badge.nameEn}
                  </h5>
                  <p className="mb-3 text-sm text-slate-600">
                    {isArabic ? badge.descriptionAr : badge.descriptionEn}
                  </p>
                  <Badge variant={badge.unlocked ? "success" : "neutral"} size="sm">
                    {badge.unlocked
                      ? isArabic
                        ? "مفتوحة"
                        : "Unlocked"
                      : isArabic
                        ? "غير محققة"
                        : "Locked"}
                  </Badge>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center">
              <p className="text-slate-600">
                {isArabic
                  ? "لم يتم فتح أي شارة بعد."
                  : "No badges have been unlocked yet."}
              </p>
            </Card>
          )}
        </div>
      )}

      {activeTab === "activity" && (
        <Card>
          <h3 className="mb-6">
            {isArabic ? "النشاط الأخير" : "Recent Activity"}
          </h3>
          <div className="space-y-4">
            {overview.recentActivity.length > 0 ? (
              overview.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className={`flex items-start gap-4 border-b border-slate-100 pb-4 last:border-b-0 ${isArabic ? "flex-row-reverse text-right" : ""}`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                    {activity.type === "lesson" && (
                      <BookOpen className="h-5 w-5 text-purple-600" />
                    )}
                    {activity.type === "challenge" && (
                      <Trophy className="h-5 w-5 text-orange-600" />
                    )}
                    {activity.type === "badge" && (
                      <Award className="h-5 w-5 text-emerald-600" />
                    )}
                    {activity.type === "project" && (
                      <ExternalLink className="h-5 w-5 text-teal-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">
                      {isArabic ? activity.titleAr : activity.titleEn}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {formatRelativeTime(activity.occurredAt, language)}
                    </div>
                  </div>
                  {activity.xpAwarded > 0 && (
                    <div className="text-sm font-semibold text-purple-600">
                      +{activity.xpAwarded} XP
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-slate-600">
                {isArabic
                  ? "لا يوجد نشاط حديث بعد."
                  : "There is no recent activity yet."}
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
