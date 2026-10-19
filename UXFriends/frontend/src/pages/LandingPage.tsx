import React, { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { publicApi, type PublicLandingOverview } from "../services/api";
import {
  getCachedLandingOverview,
  setCachedLandingOverview,
} from "../utils/startupCache";
import {
  Sparkles,
  BookOpen,
  Trophy,
  Zap,
  Target,
  Star,
  Flame,
  Award,
  CheckCircle2,
  ArrowLeft,
  LayoutGrid,
  Layers3,
} from "lucide-react";

export interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  language?: "ar" | "en";
  onLanguageSwitch?: (lang: "ar" | "en") => void;
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

function formatEstimatedTime(totalMinutes: number, language: "ar" | "en") {
  const hours = Math.max(1, Math.round(totalMinutes / 60));
      return language === "ar"
        ? `${hours} ${hours === 1 ? "ساعة" : "ساعات"} تقريباً`
        : `About ${hours} ${hours === 1 ? "hour" : "hours"}`;
}

function formatCourseHours(hours: number, language: "ar" | "en") {
  const rounded = Number.isInteger(hours) ? hours.toString() : hours.toFixed(1);
  return language === "ar" ? `${rounded} س` : `${rounded}h`;
}

export function LandingPage({
  onGetStarted,
  onLogin,
  language = "ar",
  onLanguageSwitch,
}: LandingPageProps) {
  const isArabic = language === "ar";
  const ctaIconPosition = "left";
  const [overview, setOverview] = useState<PublicLandingOverview | null>(
    () => getCachedLandingOverview(),
  );
  const [loadingOverview, setLoadingOverview] = useState(() => !getCachedLandingOverview());

  useEffect(() => {
    let cancelled = false;

    const loadOverview = async () => {
      try {
        setLoadingOverview(true);
        const response = await publicApi.getLandingOverview();

        if (!cancelled) {
          setOverview(response.data);
          setCachedLandingOverview(response.data);
        }
      } catch (requestError) {
        if (!cancelled) {
          console.error("Failed to load landing overview", requestError);
          setOverview(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingOverview(false);
        }
      }
    };

    void loadOverview();

    return () => {
      cancelled = true;
    };
  }, []);

  const features = isArabic
    ? [
        {
          icon: BookOpen,
          title: "مسارات تعليم منظمة",
          description:
            "تعلم عبر Sections وUnits وLessons واضحة بدل صفحات معزولة وغير مترابطة.",
          color: "from-purple-500 to-purple-600",
        },
        {
          icon: Target,
          title: "تقدم حقيقي من الخادم",
          description:
            "الدروس والتحديات والإنجازات تعتمد على بيانات backend بدلاً من أرقام ثابتة داخل الواجهة.",
          color: "from-teal-500 to-teal-600",
        },
        {
          icon: Award,
          title: "شهادات لكل مسار",
          description:
            "احصل على شهادة بعد إكمال كل مسار تعليمي وشاركها لاحقاً في ملفك العام.",
          color: "from-amber-500 to-amber-600",
        },
        {
          icon: Sparkles,
          title: "تحليل وتوصيات",
          description:
            "المنصة تقترح لك الدروس التالية والتحديات المناسبة حسب تقدمك الفعلي.",
          color: "from-orange-500 to-orange-600",
        },
        {
          icon: Trophy,
          title: "تحديات متجددة",
          description:
            "اختبر مهاراتك في تحديات يومية وأسبوعية مع XP ومكافآت قابلة للتوسع.",
          color: "from-green-500 to-green-600",
        },
        {
          icon: CheckCircle2,
          title: "تجربة تعلم أوضح",
          description:
            "واجهة أبسط، دعم عربي وإنجليزي، ومسار دخول واضح من أول تشغيل للتطبيق.",
          color: "from-blue-500 to-blue-600",
        },
      ]
    : [
        {
          icon: BookOpen,
          title: "Structured Learning Paths",
          description:
            "Learn through clear Sections, Units, and Lessons instead of disconnected screens.",
          color: "from-purple-500 to-purple-600",
        },
        {
          icon: Target,
          title: "Live Backend Progress",
          description:
            "Lessons, challenges, and achievements now come from backend data instead of hardcoded numbers.",
          color: "from-teal-500 to-teal-600",
        },
        {
          icon: Award,
          title: "Certificates per Path",
          description:
            "Earn a certificate after each completed learning path and share it later in your portfolio.",
          color: "from-amber-500 to-amber-600",
        },
        {
          icon: Sparkles,
          title: "Analysis & Recommendations",
          description:
            "The platform suggests the next lessons and challenges based on your real activity.",
          color: "from-orange-500 to-orange-600",
        },
        {
          icon: Trophy,
          title: "Recurring Challenges",
          description:
            "Practice your skills with daily and weekly challenges that can scale with the product.",
          color: "from-green-500 to-green-600",
        },
        {
          icon: CheckCircle2,
          title: "Cleaner Learning Experience",
          description:
            "Simpler UI, Arabic and English support, and a clear signed-out entry flow from first launch.",
          color: "from-blue-500 to-blue-600",
        },
      ];

  const steps = isArabic
    ? [
        {
          number: 1,
          title: "أنشئ حساباً",
          description: "سجّل باسمك وبريدك وابدأ من الصفحة العامة بشكل واضح.",
        },
        {
          number: 2,
          title: "حدّد هدفك",
          description: "اختر مستواك ووقتك المتاح ليُبنى تقدمك الشخصي عليه.",
        },
        {
          number: 3,
          title: "ابدأ المسار",
          description:
            "تصفح المسارات والوحدات والدروس ببيانات حقيقية من الخادم.",
        },
        {
          number: 4,
          title: "تقدم واكسب",
          description: "أكمل الدروس والتحديات لتحصل على XP وشارات وشهادات.",
        },
      ]
    : [
        {
          number: 1,
          title: "Create an Account",
          description:
            "Sign up with your name and email and start from the public entry page.",
        },
        {
          number: 2,
          title: "Set Your Goal",
          description:
            "Choose your level and availability so your progress is tailored to you.",
        },
        {
          number: 3,
          title: "Start a Path",
          description:
            "Browse paths, units, and lessons backed by live server data.",
        },
        {
          number: 4,
          title: "Grow and Earn",
          description:
            "Complete lessons and challenges to earn XP, badges, and certificates.",
        },
      ];

  const testimonials = isArabic
    ? [
        {
          name: "أحمد محمد",
          role: "UI Designer",
          rating: 5,
          text: "المنصة أوضح بكثير الآن، وأصبحت أتابع تقدمي الحقيقي بدل الأرقام الوهمية.",
        },
        {
          name: "ليلى حسن",
          role: "UX Researcher",
          rating: 5,
          text: "المحتوى منظم بشكل جيد، ووجود العربية والإنجليزية معاً يجعلها أسهل لفريقنا.",
        },
        {
          name: "خالد العلي",
          role: "Product Designer",
          rating: 5,
          text: "فكرة التحديات والتوصيات ممتازة، والواجهة أصبحت أقرب لمنتج جاهز فعلاً.",
        },
      ]
    : [
        {
          name: "Ahmad Mohammed",
          role: "UI Designer",
          rating: 5,
          text: "The platform feels much clearer now, and I can track real progress instead of fake numbers.",
        },
        {
          name: "Layla Hassan",
          role: "UX Researcher",
          rating: 5,
          text: "The content structure is solid, and the Arabic/English support makes it easier for our team.",
        },
        {
          name: "Khaled Al-Ali",
          role: "Product Designer",
          rating: 5,
          text: "The challenge and recommendation flow is strong, and the UI now feels much closer to a real product.",
        },
      ];

  const heroMetrics = overview
    ? [
        {
          icon: BookOpen,
          label: isArabic ? "الدروس المتاحة" : "Available lessons",
          value: overview.metrics.lessonsCount,
        },
        {
          icon: Sparkles,
          label: isArabic ? "ساعات المحتوى" : "Course hours",
          value: formatCourseHours(overview.metrics.totalCourseHours, language),
        },
        {
          icon: Layers3,
          label: isArabic ? "الوحدات" : "Units",
          value: overview.metrics.unitsCount,
        },
        {
          icon: LayoutGrid,
          label: isArabic ? "المسارات" : "Paths",
          value: overview.metrics.sectionsCount,
        },
        {
          icon: Trophy,
          label: isArabic ? "التحديات" : "Challenges",
          value: overview.metrics.challengesCount,
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="container-custom">
          <div className="flex min-h-[88px] items-center justify-between gap-3 py-4 md:hidden">
            <div className="flex shrink-0 items-center gap-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-teal-500">
                <span className="text-xl font-bold text-white">UX</span>
              </div>
              <span className="text-2xl font-bold text-slate-900">
                UXFriends
              </span>
            </div>

            {onLanguageSwitch && (
              <div dir="ltr" className="shrink-0 rounded-xl bg-slate-100 p-1">
                <button
                  onClick={() => onLanguageSwitch("en")}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                    language === "en"
                      ? "bg-white text-purple-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => onLanguageSwitch("ar")}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                    language === "ar"
                      ? "bg-white text-purple-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  AR
                </button>
              </div>
            )}
          </div>

          <div className="hidden min-h-[102px] items-center justify-between gap-6 py-5 md:flex lg:min-h-[112px]">
            <div className="flex shrink-0 items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-teal-500">
                <span className="text-xl font-bold text-white">UX</span>
              </div>
              <span className="text-2xl font-bold text-slate-900">
                UXFriends
              </span>
            </div>

            <div className="flex items-center gap-3 lg:gap-4">
              {onLanguageSwitch && (
                <div dir="ltr" className="shrink-0 rounded-xl bg-slate-100 p-1">
                  <button
                    onClick={() => onLanguageSwitch("en")}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                      language === "en"
                        ? "bg-white text-purple-600 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => onLanguageSwitch("ar")}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                      language === "ar"
                        ? "bg-white text-purple-600 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    AR
                  </button>
                </div>
              )}

              <Button
                variant="ghost"
                onClick={onLogin}
                className="justify-center whitespace-nowrap px-5 py-3"
              >
                {isArabic ? "تسجيل الدخول" : "Sign in"}
              </Button>
              <Button
                variant="primary"
                onClick={onGetStarted}
                icon={ArrowLeft}
                iconPosition={ctaIconPosition}
                className="justify-center whitespace-nowrap px-5 py-3"
              >
                {isArabic ? "إنشاء حساب" : "Create account"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <section className="overflow-hidden bg-gradient-to-b from-purple-50 via-white to-white py-16 md:py-24">
        <div className="container-custom">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div
              className={`space-y-6 text-center ${isArabic ? "md:text-right" : "md:text-left"}`}
            >
              <Badge variant="primary" size="lg" icon={Sparkles}>
                {isArabic
                  ? "تعلم UX/UI بمنصة أوضح وأكثر جاهزية للإنتاج"
                  : "Learn UX/UI with a cleaner, more production-ready platform"}
              </Badge>

              <h1 className="text-balance">
                {isArabic
                  ? "ابدأ من صفحة عامة واضحة ثم تابع رحلتك التعليمية ببيانات حقيقية"
                  : "Start from a clear public homepage and continue with live learning data"}
              </h1>

              <p className="text-xl leading-relaxed text-slate-600">
                {isArabic
                  ? "واجهة البداية عادت لتعرض التسجيل والدخول، والمسارات والدروس المعروضة هنا تأتي الآن من الخادم بدل أمثلة ثابتة."
                  : "The public entry page is back for sign in and registration, and the learning catalog shown here is now loaded from the backend instead of hardcoded examples."}
              </p>

              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center md:justify-start">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={onGetStarted}
                  icon={ArrowLeft}
                  iconPosition={ctaIconPosition}
                >
                  {isArabic ? "ابدأ الآن" : "Get started"}
                </Button>
                <Button variant="outline" size="lg" onClick={onLogin}>
                  {isArabic ? "لدي حساب بالفعل" : "I already have an account"}
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600 md:justify-start">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>
                    {isArabic
                      ? "صفحة دخول واضحة"
                      : "Clear signed-out entry flow"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>
                    {isArabic
                      ? "بيانات backend حقيقية"
                      : "Real backend-powered data"}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10 space-y-4">
                <div className="rounded-2xl bg-white p-6 shadow-xl">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
                        <Zap className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-slate-600">
                          {isArabic ? "محتوى المنصة" : "Platform content"}
                        </div>
                        <div className="text-2xl font-bold text-slate-900">
                          {loadingOverview
                            ? isArabic
                              ? "جارٍ التحميل..."
                              : "Loading..."
                            : overview
                              ? `${overview.metrics.sectionsCount} ${isArabic ? "مسارات" : "paths"}`
                              : isArabic
                                ? "الخادم غير متاح"
                                : "Backend unavailable"}
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-sm text-slate-600">
                        {isArabic ? "الدروس" : "Lessons"}
                      </div>
                      <div className="text-xl font-bold text-purple-600">
                        {overview?.metrics.lessonsCount ?? "--"}
                      </div>
                      <div className="mt-2 text-sm text-slate-600">
                        {isArabic ? "ساعات المحتوى" : "Course hours"}
                      </div>
                      <div className="text-lg font-bold text-teal-600">
                        {overview ? formatCourseHours(overview.metrics.totalCourseHours, language) : "--"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {heroMetrics.map((metric) => {
                      const Icon = metric.icon;
                      return (
                        <div
                          key={metric.label}
                          className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <Icon className="h-4 w-4 text-purple-600" />
                            <span className="text-xs text-slate-500">
                              {metric.label}
                            </span>
                          </div>
                          <div className="text-xl font-bold text-slate-900">
                            {metric.value}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-white p-4 shadow-lg">
                    <div className="mb-2 flex items-center gap-2">
                      <Flame className="h-6 w-6 fill-orange-500 text-orange-500" />
                      <span className="font-bold text-2xl text-slate-900">
                        {overview?.metrics.challengesCount ?? "--"}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600">
                      {isArabic ? "تحديات متاحة" : "Available challenges"}
                    </div>
                  </div>

                  <div className="rounded-xl bg-white p-4 shadow-lg">
                    <div className="mb-2 flex items-center gap-2">
                      <Award className="h-6 w-6 fill-yellow-500 text-yellow-500" />
                      <span className="font-bold text-2xl text-slate-900">
                        {overview?.metrics.certificatesCount ?? "--"}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600">
                      {isArabic
                        ? "شهادات قابلة للإنجاز"
                        : "Certificates to earn"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-gradient-to-br from-purple-400 to-teal-400 opacity-20 blur-3xl" />
              <div className="absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-gradient-to-br from-teal-400 to-purple-400 opacity-20 blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="container-custom">
          <div className="mb-12 text-center">
            <h2 className="mb-4">
              {isArabic ? "لماذا UXFriends؟" : "Why UXFriends?"}
            </h2>
            <p className="mx-auto max-w-3xl text-xl text-slate-600">
              {isArabic
                ? "التركيز هنا على منتج يعمل فعلاً: دخول واضح، بيانات حقيقية، وتجربة تعلم منظمة."
                : "The focus here is a product that actually works: a clear entry flow, live data, and a structured learning experience."}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} hover>
                  <div
                    className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color}`}
                  >
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h4 className="mb-2">{feature.title}</h4>
                  <p className="text-slate-600">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-slate-50 to-white py-16 md:py-24">
        <div className="container-custom">
          <div className="mb-12 text-center">
            <h2 className="mb-4">{isArabic ? "كيف تبدأ؟" : "How it works"}</h2>
            <p className="text-xl text-slate-600">
              {isArabic
                ? "أربع خطوات بسيطة من إنشاء الحساب حتى تتبع تقدمك."
                : "Four simple steps from account creation to progress tracking."}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-4">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="relative mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-teal-500">
                  <span className="text-3xl font-bold text-white">
                    {step.number}
                  </span>
                  <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg">
                    <span className="font-bold text-purple-600">
                      {step.number}
                    </span>
                  </div>
                </div>
                <h4 className="mb-2">{step.title}</h4>
                <p className="text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="container-custom">
          <div className="mb-12 text-center">
            <h2 className="mb-4">
              {isArabic ? "المسارات المتاحة" : "Available learning paths"}
            </h2>
            <p className="text-xl text-slate-600">
              {isArabic
                ? "هذه المعاينة تُحمَّل من backend العام قبل تسجيل الدخول."
                : "This preview is loaded from the public backend before sign-in."}
            </p>
          </div>

          {loadingOverview ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-slate-50"
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {overview?.learningPaths.map((path) => (
                <Card key={path.code} hover>
                  <div className="mb-4 text-5xl">{path.icon}</div>
                  <h4 className="mb-2">
                    {isArabic ? path.titleAr : path.titleEn}
                  </h4>
                  <p className="mb-4 text-sm text-slate-600">
                    {isArabic ? path.descriptionAr : path.descriptionEn}
                  </p>
                  <div className="mb-4 space-y-2 text-sm text-slate-600">
                    <div>
                      {path.lessonsCount} {isArabic ? "درس" : "lessons"}
                    </div>
                    <div>
                      {formatEstimatedTime(path.estimatedMinutes, language)}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={
                        path.difficulty === "beginner"
                          ? "success"
                          : path.difficulty === "intermediate"
                            ? "warning"
                            : "error"
                      }
                      size="sm"
                    >
                      {getDifficultyLabel(path.difficulty, language)}
                    </Badge>
                    {path.locked && (
                      <Badge variant="neutral" size="sm">
                        {isArabic ? "مقفل حالياً" : "Currently locked"}
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-gradient-to-b from-purple-50 to-white py-16 md:py-24">
        <div className="container-custom">
          <div className="mb-12 text-center">
            <h2 className="mb-4">
              {isArabic ? "ماذا يقول المتعلمون" : "What learners are saying"}
            </h2>
            <p className="text-xl text-slate-600">
              {isArabic
                ? "تجربة واضحة ومنظمة تصنع فرقاً فعلاً أثناء التعلم."
                : "A clearer and more structured product makes a real difference while learning."}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name}>
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: testimonial.rating }).map(
                    (_, index) => (
                      <Star
                        key={index}
                        className="h-5 w-5 fill-yellow-500 text-yellow-500"
                      />
                    ),
                  )}
                </div>

                <p className="mb-4 leading-relaxed text-slate-700">
                  "{testimonial.text}"
                </p>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-teal-500 font-semibold text-white">
                    {testimonial.name
                      .split(" ")
                      .map((name) => name[0])
                      .join("")}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-slate-600">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-purple-600 via-purple-700 to-teal-600 py-16 text-white md:py-24">
        <div className="container-custom text-center">
          <h2 className="mb-6 text-white">
            {isArabic
              ? "ابدأ رحلتك التعليمية اليوم"
              : "Start your learning journey today"}
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-purple-100">
            {isArabic
              ? "سجّل الآن وابدأ من الصفحة العامة ثم أكمل مساراتك وتقدمك الحقيقي داخل التطبيق."
              : "Sign up now, start from the public homepage, and continue with live progress across the app."}
          </p>
          <Button
            variant="secondary"
            size="lg"
            onClick={onGetStarted}
            className="bg-white text-purple-700 hover:bg-purple-50"
            icon={ArrowLeft}
          >
            {isArabic ? "ابدأ التعلم مجاناً" : "Start learning for free"}
          </Button>
          <p className="mt-4 text-sm text-purple-200">
            {isArabic ? "لا حاجة لبطاقة ائتمانية" : "No credit card required"}
          </p>
        </div>
      </section>

      <footer className="bg-slate-900 py-12 text-white">
        <div className="container-custom">
          <div className="mb-8 grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-teal-500">
                  <span className="text-xl font-bold text-white">UX</span>
                </div>
                <span className="text-xl font-bold">UXFriends</span>
              </div>
              <p className="leading-relaxed text-slate-400">
                {isArabic
                  ? "منصة UX/UI تعليمية تدعم العربية والإنجليزية وتعرض تقدماً حقيقياً من الخادم."
                  : "A UX/UI learning platform with Arabic and English support and live backend-powered progress."}
              </p>
            </div>

            <div>
              <h5 className="mb-4 font-semibold">
                {isArabic ? "المنصة" : "Platform"}
              </h5>
              <ul className="space-y-2 text-slate-400">
                <li>{isArabic ? "المسارات التعليمية" : "Learning paths"}</li>
                <li>{isArabic ? "التحديات" : "Challenges"}</li>
                <li>{isArabic ? "الشهادات" : "Certificates"}</li>
                <li>{isArabic ? "التحليل" : "Analysis"}</li>
              </ul>
            </div>

            <div>
              <h5 className="mb-4 font-semibold">
                {isArabic ? "الحساب" : "Account"}
              </h5>
              <ul className="space-y-2 text-slate-400">
                <li>{isArabic ? "تسجيل الدخول" : "Sign in"}</li>
                <li>{isArabic ? "إنشاء حساب" : "Create account"}</li>
                <li>
                  {isArabic ? "إعادة تعيين كلمة المرور" : "Reset password"}
                </li>
                <li>{isArabic ? "الملف الشخصي" : "Profile"}</li>
              </ul>
            </div>

            <div>
              <h5 className="mb-4 font-semibold">
                {isArabic ? "الدعم" : "Support"}
              </h5>
              <ul className="space-y-2 text-slate-400">
                <li>
                  {isArabic ? "واجهة ثنائية اللغة" : "Bilingual interface"}
                </li>
                <li>
                  {isArabic ? "بيانات مباشرة من الخادم" : "Live backend data"}
                </li>
                <li>{isArabic ? "تدفق دخول أوضح" : "Cleaner auth flow"}</li>
                <li>
                  {isArabic
                    ? "تجربة موبايل محسنة"
                    : "Improved mobile experience"}
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center text-slate-400">
            <p>
              &copy; 2026 UXFriends.{" "}
              {isArabic ? "جميع الحقوق محفوظة." : "All rights reserved."}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
