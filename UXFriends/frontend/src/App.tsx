import { Suspense, lazy, useCallback, useEffect, useState, type ComponentType } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { RewardCelebrationProvider } from "./contexts/RewardCelebrationContext";
import { AppSidebar } from "./components/AppSidebar";
import { AppHeader } from "./components/AppHeader";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { AppBootLoader, RouteSkeleton } from "./components/AppLoaders";
import { LandingPage } from "./pages/LandingPage";

// Auth
import { LoginPage } from "./pages/auth/LoginPage";
import { SignupPage } from "./pages/auth/SignupPage";
import { AuthCallbackPage } from "./pages/auth/AuthCallbackPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";
import { VerifyEmailPage } from "./pages/auth/VerifyEmailPage";

import { Toaster, toast } from "sonner";
import { authApi, type EmailVerificationStatus } from "./services/api";
import {
  buildRouteUrl,
  getLanguageFromPage,
  readRoutePageContext,
  readHistoryPageContext,
  resolveRoute,
  stripEnglishSuffix,
  type AppLanguage,
} from "./utils/router";
import { resolveLoaderVariant } from "./utils/loaders";
import {
  createServerClockSnapshot,
  formatServerCountdownDetailed,
  type ServerClockSnapshot,
} from "./utils/serverTime";
import {
  getPendingOnboardingPage,
} from "./utils/onboarding";

function lazyPage<TModule extends Record<string, unknown>>(
  loader: () => Promise<TModule>,
  exportName: keyof TModule,
) {
  return lazy(async () => {
    const module = await loader();

    return {
      default: module[exportName] as ComponentType<Record<string, unknown>>,
    };
  });
}

const DashboardPage = lazyPage(() => import("./pages/DashboardPage"), "DashboardPage");
const LearnPage = lazyPage(() => import("./pages/LearnPage"), "LearnPage");
const ChallengesPage = lazyPage(() => import("./pages/ChallengesPage"), "ChallengesPage");
const ProfilePage = lazyPage(() => import("./pages/ProfilePage"), "ProfilePage");
const SettingsPage = lazyPage(() => import("./pages/SettingsPage"), "SettingsPage");
const EditProfilePage = lazyPage(() => import("./pages/EditProfilePage"), "EditProfilePage");
const SearchPage = lazyPage(() => import("./pages/SearchPage"), "SearchPage");
const SharePage = lazyPage(() => import("./pages/SharePage"), "SharePage");
const ChallengeDetailPage = lazyPage(
  () => import("./pages/ChallengeDetailPage"),
  "ChallengeDetailPage",
);

const UnitDetailsPage = lazyPage(
  () => import("./pages/learning/UnitDetailsPage"),
  "UnitDetailsPage",
);
const UnitOverviewPage = lazyPage(
  () => import("./pages/learning/UnitOverviewPage"),
  "UnitOverviewPage",
);
const LessonPlayerPage = lazyPage(
  () => import("./pages/learning/LessonPlayerPage"),
  "LessonPlayerPage",
);
const QuizPage = lazyPage(() => import("./pages/learning/QuizPage"), "QuizPage");
const QuizResultPage = lazyPage(
  () => import("./pages/learning/QuizResultPage"),
  "QuizResultPage",
);
const UnitQuizPage = lazyPage(
  () => import("./pages/learning/UnitQuizPage"),
  "UnitQuizPage",
);
const UnitQuizResultPage = lazyPage(
  () => import("./pages/learning/UnitQuizResultPage"),
  "UnitQuizResultPage",
);
const SectionQuizPage = lazyPage(
  () => import("./pages/learning/SectionQuizPage"),
  "SectionQuizPage",
);
const SectionQuizResultPage = lazyPage(
  () => import("./pages/learning/SectionQuizResultPage"),
  "SectionQuizResultPage",
);

const ProjectBriefPage = lazyPage(
  () => import("./pages/projects/ProjectBriefPage"),
  "ProjectBriefPage",
);
const ProjectSubmissionPage = lazyPage(
  () => import("./pages/projects/ProjectSubmissionPage"),
  "ProjectSubmissionPage",
);
const ProjectStatusPage = lazyPage(
  () => import("./pages/projects/ProjectStatusPage"),
  "ProjectStatusPage",
);
const ProjectsListPage = lazyPage(
  () => import("./pages/projects/ProjectsListPage"),
  "ProjectsListPage",
);
const ProjectDetailPage = lazyPage(
  () => import("./pages/projects/ProjectDetailPage"),
  "ProjectDetailPage",
);

const AIAnalysisPage = lazyPage(
  () => import("./pages/ai/AIAnalysisPage"),
  "AIAnalysisPage",
);
const AICoachHubPage = lazyPage(
  () => import("./pages/ai/AICoachHubPage"),
  "AICoachHubPage",
);
const AICoachChatPage = lazyPage(
  () => import("./pages/ai/AICoachChatPage"),
  "AICoachChatPage",
);
const AICoachRecommendationsPage = lazyPage(
  () => import("./pages/ai/AICoachRecommendationsPage"),
  "AICoachRecommendationsPage",
);
const WeakTopicDetailPage = lazyPage(
  () => import("./pages/ai/WeakTopicDetailPage"),
  "WeakTopicDetailPage",
);
const RevisionPlanPage = lazyPage(
  () => import("./pages/ai/RevisionPlanPage"),
  "RevisionPlanPage",
);
const RevisionSessionPage = lazyPage(
  () => import("./pages/ai/RevisionSessionPage"),
  "RevisionSessionPage",
);
const RevisionResultPage = lazyPage(
  () => import("./pages/ai/RevisionResultPage"),
  "RevisionResultPage",
);
const RevisionCenterPage = lazyPage(
  () => import("./pages/revision/RevisionCenterPage"),
  "RevisionCenterPage",
);

const CertificatesPage = lazyPage(
  () => import("./pages/certificates/CertificatesPage"),
  "CertificatesPage",
);
const CertificateDetailPage = lazyPage(
  () => import("./pages/certificates/CertificateDetailPage"),
  "CertificateDetailPage",
);
const CertificatesLibraryPage = lazyPage(
  () => import("./pages/certificates/CertificatesLibraryPage"),
  "CertificatesLibraryPage",
);
const CertificatePreviewPage = lazyPage(
  () => import("./pages/certificates/CertificatePreviewPage"),
  "CertificatePreviewPage",
);

const ChallengesHubPage = lazyPage(
  () => import("./pages/challenges/ChallengesHubPage"),
  "ChallengesHubPage",
);

const PortfolioPage = lazyPage(
  () => import("./pages/portfolio/PortfolioPage"),
  "PortfolioPage",
);
const PrivacySettingsPage = lazyPage(
  () => import("./pages/portfolio/PrivacySettingsPage"),
  "PrivacySettingsPage",
);
const PublicPortfolioPage = lazyPage(
  () => import("./pages/portfolio/PublicPortfolioPage"),
  "PublicPortfolioPage",
);
const PublicProjectDetailPage = lazyPage(
  () => import("./pages/portfolio/PublicProjectDetailPage"),
  "PublicProjectDetailPage",
);

const EmailVerificationPage = lazyPage(
  () => import("./pages/auth/EmailVerificationPage"),
  "EmailVerificationPage",
);
const OnboardingWelcomePage = lazyPage(
  () => import("./pages/auth/OnboardingWelcomePage"),
  "OnboardingWelcomePage",
);
const OnboardingAssessmentPage = lazyPage(
  () => import("./pages/auth/OnboardingAssessmentPage"),
  "OnboardingAssessmentPage",
);

type PageContext = Record<string, unknown> & {
  searchQuery?: string;
};

const AUTH_PAGES = ["landing", "login", "signup", "auth-callback", "forgot-password", "reset-password", "verify-email"];
const PUBLIC_PAGES = ["landing", "login", "signup", "auth-callback", "forgot-password", "reset-password", "verify-email", "public-portfolio", "public-project-detail"];
const KNOWN_APP_PAGES = [
  "home",
  "learn",
  "unit-details",
  "unit-overview",
  "lesson-player",
  "quiz",
  "quiz-result",
  "unit-quiz",
  "unit-quiz-result",
  "section-quiz",
  "section-quiz-result",
  "projects-list",
  "project-brief",
  "project-submission",
  "project-status",
  "project-detail",
  "ai-analysis",
  "ai-coach-hub",
  "ai-coach-chat",
  "ai-coach-recommendations",
  "weak-topic-detail",
  "revision-plan",
  "revision-session",
  "revision-result",
  "revision-center",
  "certificates",
  "certificate-detail",
  "certificates-library",
  "certificate-preview",
  "portfolio",
  "privacy-settings",
  "public-portfolio",
  "public-project-detail",
  "onboarding-welcome",
  "onboarding-assessment",
  "challenges",
  "challenges-hub",
  "challenge-detail",
  "profile",
  "settings",
  "email-verification",
  "edit-profile",
  "search",
  "share",
  "verify-email",
] as const;

const LANGUAGE_STORAGE_KEY = "uxfriends_language";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5176/api";

function readInitialLanguage() {
  if (typeof window === "undefined") {
    return "ar" as const;
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get("lang") === "en") {
    return "en" as const;
  }

  if (window.location.pathname === "/" && !params.has("lang")) {
    return "ar" as const;
  }

  const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

  return savedLanguage === "en" ? "en" : "ar";
}

function readInitialPage(language: AppLanguage) {
  const route = resolveRoute(window.location.pathname, window.location.search);

  if (!route.page) {
    return language === "en" ? "landing-en" : "landing";
  }

  return route.language === "en" ? `${route.page}-en` : route.page;
}

function getPageTitle(
  basePage: string,
  language: AppLanguage,
  context: PageContext,
) {
  const isArabic = language === "ar";

  switch (basePage) {
    case "landing":
      return isArabic ? "UXFriends | تعلم UX/UI" : "UXFriends | Learn UX/UI";
    case "login":
      return isArabic ? "تسجيل الدخول | UXFriends" : "Sign In | UXFriends";
    case "signup":
      return isArabic ? "إنشاء حساب | UXFriends" : "Create Account | UXFriends";
    case "forgot-password":
      return isArabic ? "نسيت كلمة المرور | UXFriends" : "Forgot Password | UXFriends";
    case "reset-password":
      return isArabic ? "إعادة تعيين كلمة المرور | UXFriends" : "Reset Password | UXFriends";
    case "verify-email":
    case "email-verification":
      return isArabic ? "تأكيد البريد الإلكتروني | UXFriends" : "Verify Email | UXFriends";
    case "onboarding-welcome":
      return isArabic ? "ابدأ رحلتك | UXFriends" : "Start Your Journey | UXFriends";
    case "onboarding-assessment":
      return isArabic ? "اختبار تحديد المستوى | UXFriends" : "Level Placement Test | UXFriends";
    case "home":
      return isArabic ? "لوحة التحكم | UXFriends" : "Dashboard | UXFriends";
    case "learn":
      return isArabic ? "التعلّم | UXFriends" : "Learning | UXFriends";
    case "lesson-player":
      return isArabic ? "الدرس | UXFriends" : "Lesson | UXFriends";
    case "quiz":
    case "unit-quiz":
    case "section-quiz":
      return isArabic ? "الاختبار | UXFriends" : "Quiz | UXFriends";
    case "quiz-result":
    case "unit-quiz-result":
    case "section-quiz-result":
      return isArabic ? "نتيجة الاختبار | UXFriends" : "Quiz Result | UXFriends";
    case "projects-list":
      return isArabic ? "المشاريع | UXFriends" : "Projects | UXFriends";
    case "project-brief":
      return isArabic ? "تفاصيل المشروع | UXFriends" : "Project Brief | UXFriends";
    case "project-submission":
      return isArabic ? "تسليم المشروع | UXFriends" : "Project Submission | UXFriends";
    case "project-status":
      return isArabic ? "حالة المشروع | UXFriends" : "Project Status | UXFriends";
    case "project-detail":
      return isArabic ? "تفاصيل المشروع | UXFriends" : "Project Details | UXFriends";
    case "ai-analysis":
      return isArabic ? "تحليل الأداء | UXFriends" : "AI Analysis | UXFriends";
    case "ai-coach-hub":
      return isArabic ? "المساعد الذكي | UXFriends" : "AI Coach | UXFriends";
    case "ai-coach-chat":
      return isArabic ? "محادثة المساعد الذكي | UXFriends" : "AI Coach Chat | UXFriends";
    case "ai-coach-recommendations":
      return isArabic ? "توصيات المساعد الذكي | UXFriends" : "AI Recommendations | UXFriends";
    case "revision-plan":
      return isArabic ? "خطة المراجعة | UXFriends" : "Revision Plan | UXFriends";
    case "revision-session":
      return isArabic ? "جلسة مراجعة | UXFriends" : "Revision Session | UXFriends";
    case "revision-result":
      return isArabic ? "نتيجة المراجعة | UXFriends" : "Revision Result | UXFriends";
    case "revision-center":
      return isArabic ? "مركز المراجعة | UXFriends" : "Revision Center | UXFriends";
    case "certificates":
    case "certificates-library":
      return isArabic ? "الشهادات | UXFriends" : "Certificates | UXFriends";
    case "certificate-detail":
      return isArabic ? "تفاصيل الشهادة | UXFriends" : "Certificate Details | UXFriends";
    case "certificate-preview":
      return isArabic ? "معاينة الشهادة | UXFriends" : "Certificate Preview | UXFriends";
    case "portfolio":
      return isArabic ? "الملف العام | UXFriends" : "Portfolio | UXFriends";
    case "privacy-settings":
      return isArabic ? "خصوصية الملف العام | UXFriends" : "Portfolio Privacy | UXFriends";
    case "public-portfolio":
      return isArabic ? "الملف العام العام | UXFriends" : "Public Portfolio | UXFriends";
    case "public-project-detail":
      return isArabic ? "مشروع عام | UXFriends" : "Public Project | UXFriends";
    case "challenges":
    case "challenges-hub":
      return isArabic ? "التحديات | UXFriends" : "Challenges | UXFriends";
    case "challenge-detail":
      return isArabic ? "تفاصيل التحدي | UXFriends" : "Challenge Details | UXFriends";
    case "profile":
      return isArabic ? "الملف الشخصي | UXFriends" : "Profile | UXFriends";
    case "edit-profile":
      return isArabic ? "تعديل الملف الشخصي | UXFriends" : "Edit Profile | UXFriends";
    case "settings":
      return isArabic ? "الإعدادات | UXFriends" : "Settings | UXFriends";
    case "search": {
      const query =
        typeof context.searchQuery === "string" && context.searchQuery.trim().length > 0
          ? context.searchQuery.trim()
          : null;
      if (query) {
        return isArabic
          ? `بحث: ${query} | UXFriends`
          : `Search: ${query} | UXFriends`;
      }
      return isArabic ? "البحث | UXFriends" : "Search | UXFriends";
    }
    case "share":
      return isArabic ? "مشاركة | UXFriends" : "Share | UXFriends";
    default:
      return "UXFriends";
  }
}

function AppInner() {
  const {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updatePreferredLanguage,
    loginWithExternalCode,
  } = useAuth();

  const [language, setLanguage] = useState<AppLanguage>(readInitialLanguage);
  const [currentPage, setCurrentPage] = useState<string>(() =>
    readInitialPage(readInitialLanguage()),
  );
  const [pageContext, setPageContext] = useState<PageContext>(() =>
    ({
      ...readRoutePageContext(window.location.pathname, window.location.search),
      ...readHistoryPageContext(window.history.state),
    }) as PageContext,
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [emailVerificationStatus, setEmailVerificationStatus] =
    useState<EmailVerificationStatus | null>(null);
  const [emailVerificationClock, setEmailVerificationClock] =
    useState<ServerClockSnapshot | null>(null);

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    const basePage = stripEnglishSuffix(currentPage);
    document.title = getPageTitle(basePage, language, pageContext);
  }, [currentPage, language, pageContext]);

  useEffect(() => {
    const syncFromUrl = (historyState?: unknown) => {
      const route = resolveRoute(window.location.pathname, window.location.search);
      const params = new URLSearchParams(window.location.search);
      const nextLanguage =
        params.get("lang") === "en"
          ? "en"
          : window.location.pathname === "/" && !params.has("lang")
            ? "ar"
          : (window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === "en"
              ? "en"
              : "ar");

      setLanguage(nextLanguage);
      setCurrentPage(
        route.page
          ? nextLanguage === "en"
            ? `${route.page}-en`
            : route.page
          : nextLanguage === "en"
            ? "landing-en"
            : "landing",
      );
      setPageContext({
        ...readRoutePageContext(window.location.pathname, window.location.search),
        ...readHistoryPageContext(historyState ?? window.history.state),
      });
    };

    const handlePopState = (event: PopStateEvent) => {
      syncFromUrl(event.state);
    };

    window.addEventListener("popstate", handlePopState);
    syncFromUrl();

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const handleNavigate = useCallback(
    (
      page: string,
      context?: PageContext,
      options?: { replace?: boolean; languageOverride?: AppLanguage },
    ) => {
      const nextLanguage =
        options?.languageOverride ?? getLanguageFromPage(page, language);
      const basePage = stripEnglishSuffix(page);
      const normalizedPage = nextLanguage === "en" ? `${basePage}-en` : basePage;
      const nextContext = context ?? {};
      const nextUrl = buildRouteUrl(normalizedPage, nextLanguage, nextContext);
      const nextHistoryState = { pageContext: nextContext };

      setCurrentPage(normalizedPage);
      setPageContext(nextContext);
      setLanguage(nextLanguage);

      if (options?.replace) {
        window.history.replaceState(nextHistoryState, "", nextUrl);
        return;
      }

      window.history.pushState(nextHistoryState, "", nextUrl);
    },
    [language],
  );

  useEffect(() => {
    if (loading) {
      return;
    }

    const navigateSoon = (
      page: string,
      context?: PageContext,
      options?: { replace?: boolean; languageOverride?: AppLanguage },
    ) => {
      queueMicrotask(() => {
        handleNavigate(page, context, options);
      });
    };

    const basePage = stripEnglishSuffix(currentPage);
    const isAuthPage = AUTH_PAGES.includes(basePage);
    const isPublicPage = PUBLIC_PAGES.includes(basePage);
    const isOnboardingPage = basePage.startsWith("onboarding-");
    const isVerificationPage =
      basePage === "verify-email" || basePage === "email-verification";
    const pendingOnboardingPage = getPendingOnboardingPage(user);

    if (!isAuthenticated) {
      if (!isPublicPage) {
        navigateSoon(language === "en" ? "landing-en" : "landing", {}, {
          replace: true,
        });
      }
      return;
    }

    if (pendingOnboardingPage && !isOnboardingPage && !isVerificationPage) {
      navigateSoon(
        language === "en" ? `${pendingOnboardingPage}-en` : pendingOnboardingPage,
        {},
        { replace: true },
      );
      return;
    }

    if ((basePage === "landing" || (isAuthPage && !isVerificationPage)) && !pendingOnboardingPage) {
      navigateSoon(language === "en" ? "home-en" : "home", {}, {
        replace: true,
      });
      return;
    }

    if ((basePage === "landing" || (isAuthPage && !isVerificationPage)) && pendingOnboardingPage) {
      navigateSoon(
        language === "en" ? `${pendingOnboardingPage}-en` : pendingOnboardingPage,
        {},
        { replace: true },
      );
      return;
    }

    if (
      isOnboardingPage &&
      !pendingOnboardingPage &&
      basePage !== "onboarding-assessment"
    ) {
      navigateSoon(language === "en" ? "home-en" : "home", {}, {
        replace: true,
      });
    }
  }, [
    currentPage,
    handleNavigate,
    isAuthenticated,
    language,
    loading,
    user,
  ]);

  const isRTL = language === "ar";
  const basePage = stripEnglishSuffix(currentPage);
  const isENPage = currentPage.endsWith("-en");
  const pageLanguage = isENPage ? "en" : language;

  useEffect(() => {
    if (!isAuthenticated || !user?.preferredLanguage || user.preferredLanguage === language) {
      return;
    }

    queueMicrotask(() => {
      handleNavigate(
        user.preferredLanguage === "en" ? `${basePage}-en` : basePage,
        pageContext,
        {
          languageOverride: user.preferredLanguage,
          replace: true,
        },
      );
    });
  }, [basePage, handleNavigate, isAuthenticated, language, pageContext, user?.preferredLanguage]);

  useEffect(() => {
    if (!isAuthenticated || !user || user.emailConfirmed) {
      return;
    }

    let cancelled = false;

    const loadVerificationStatus = async () => {
      try {
        const response = await authApi.getEmailVerificationStatus();
        if (cancelled) {
          return;
        }

        setEmailVerificationStatus(response.data);
        setEmailVerificationClock(
          createServerClockSnapshot(response.data.serverNow),
        );
      } catch (requestError) {
        console.error("Failed to load email verification status", requestError);
      }
    };

    void loadVerificationStatus();
    const intervalId = window.setInterval(() => {
      void loadVerificationStatus();
    }, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, user]);

  if (loading) {
    return <AppBootLoader language={language} />;
  }

  const mappedUser = user
    ? {
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar,
        xp: user.totalXP,
        level: user.level,
        streak: user.currentStreak,
        lessonsCompleted: user.lessonsCompleted,
        projectsCompleted: user.projectsCompleted,
        challengesWon: user.challengesWon,
        coins: user.coins,
      }
    : undefined;

  const handleLogin = async (
    email: string,
    password: string,
    rememberMe = false,
  ) => {
    setAuthLoading(true);
    const result = await login(email, password, rememberMe);
    setAuthLoading(false);

    if (result.success) {
      const nextLanguage = result.user?.preferredLanguage === "en" ? "en" : "ar";
      const pendingOnboardingPage = getPendingOnboardingPage(result.user);
      handleNavigate(
        nextLanguage === "en"
          ? `${pendingOnboardingPage ?? "home"}-en`
          : pendingOnboardingPage ?? "home",
        {},
        { replace: true, languageOverride: nextLanguage },
      );
      toast.success(
        nextLanguage === "ar"
          ? "تم تسجيل الدخول بنجاح!"
          : "Logged in successfully!",
      );
    } else {
      toast.error(result.error || "Login failed");
    }
    return result;
  };

  const handleSignup = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    age?: number;
  }) => {
    setAuthLoading(true);
    const result = await register(
      {
        ...data,
        preferredLanguage: language,
      },
      false,
    );
    setAuthLoading(false);

    if (result.success) {
      handleNavigate(
        language === "en" ? "email-verification-en" : "email-verification",
        {
          developmentVerificationUrl: result.developmentVerificationUrl ?? undefined,
        },
        {
          replace: true,
        },
      );
      toast.success(
        language === "ar"
          ? "تم إنشاء الحساب بنجاح!"
          : "Account created successfully!",
      );
    } else {
      toast.error(result.error || "Registration failed");
    }
    return result;
  };

  const handleExternalLoginStart = (provider: "google" | "github", rememberMe = false) => {
    const params = new URLSearchParams();
    params.set("language", language);
    if (rememberMe) {
      params.set("rememberMe", "true");
    }

    window.location.assign(`${API_URL}/auth/external/${provider}/start?${params.toString()}`);
  };

  const handleExternalLoginComplete = async (
    provider: "google" | "github",
    code: string,
    rememberMe = false,
  ) => {
    setAuthLoading(true);
    const result = await loginWithExternalCode(provider, code, rememberMe);
    setAuthLoading(false);

    if (!result.success) {
      toast.error(result.error || "Social sign-in failed");
      return result;
    }

    const nextLanguage = result.user?.preferredLanguage === "en" ? "en" : "ar";
    const pendingOnboardingPage = getPendingOnboardingPage(result.user);

    handleNavigate(
      nextLanguage === "en"
        ? `${pendingOnboardingPage ?? "home"}-en`
        : pendingOnboardingPage ?? "home",
      {},
      { replace: true, languageOverride: nextLanguage },
    );

    toast.success(
      nextLanguage === "ar"
        ? "تم تسجيل الدخول بنجاح!"
        : "Logged in successfully!",
    );

    return result;
  };

  const handleLogout = () => {
    logout();
    handleNavigate(language === "en" ? "landing-en" : "landing", {}, { replace: true });
    toast.success(
      language === "ar" ? "تم تسجيل الخروج" : "Logged out successfully",
    );
  };
  const contentOffsetClass = isRTL
    ? sidebarCollapsed
      ? "mr-0 md:mr-20"
      : "mr-0 md:mr-64"
    : sidebarCollapsed
      ? "ml-0 md:ml-20"
      : "ml-0 md:ml-64";
  const handleLanguageSwitch = (lang: "ar" | "en") => {
    if (lang === pageLanguage) {
      return;
    }

    if (isAuthenticated) {
      void updatePreferredLanguage(lang).then((result) => {
        if (!result.success) {
          toast.error(
            result.error ??
              (lang === "ar"
                ? "تعذر حفظ اللغة المفضلة."
                : "Couldn't save your preferred language."),
          );
        }
      });
    }

    handleNavigate(lang === "en" ? `${basePage}-en` : basePage, pageContext, {
      languageOverride: lang,
      replace: true,
    });
  };

  // Landing page
  if (!isAuthenticated && basePage === "landing") {
    return (
      <div dir={isRTL ? "rtl" : "ltr"}>
        <Toaster position={isRTL ? "bottom-left" : "bottom-right"} />
        <LandingPage
          onGetStarted={() => handleNavigate("signup")}
          onLogin={() => handleNavigate("login")}
          language={language}
          onLanguageSwitch={handleLanguageSwitch}
        />
      </div>
    );
  }

  if (!isAuthenticated && (basePage === "public-portfolio" || basePage === "public-project-detail")) {
    return (
      <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-neutral-50">
        <Toaster position={isRTL ? "bottom-left" : "bottom-right"} />

        <Suspense fallback={<RouteSkeleton language={language} variant="portfolio" />}>
          {basePage === "public-portfolio" && (
            <PublicPortfolioPage
              onNavigate={handleNavigate}
              language={language}
              context={pageContext as { slug?: string; accessKey?: string }}
            />
          )}

          {basePage === "public-project-detail" && (
            <PublicProjectDetailPage
              onNavigate={handleNavigate}
              context={
                pageContext as {
                  slug?: string;
                  accessKey?: string;
                  projectCode?: string;
                }
              }
              language={language}
            />
          )}
        </Suspense>
      </div>
    );
  }

  // Auth pages
  if (!isAuthenticated) {
    return (
      <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-neutral-50">
        <Toaster position={isRTL ? "bottom-left" : "bottom-right"} />

        {basePage === "login" && (
          <LoginPage
            onLogin={handleLogin}
            onNavigate={handleNavigate}
            language={language}
            onLanguageSwitch={handleLanguageSwitch}
            onSocialLogin={handleExternalLoginStart}
            isLoading={authLoading}
          />
        )}

        {basePage === "signup" && (
          <SignupPage
            onSignup={handleSignup}
            onNavigate={handleNavigate}
            language={language}
            onLanguageSwitch={handleLanguageSwitch}
            onSocialLogin={handleExternalLoginStart}
            isLoading={authLoading}
          />
        )}

        {basePage === "auth-callback" && (
          <AuthCallbackPage
            onNavigate={handleNavigate}
            language={language}
            context={
              pageContext as {
                provider?: string;
                code?: string;
                error?: string;
                rememberMe?: boolean;
              }
            }
            onComplete={handleExternalLoginComplete}
          />
        )}

        {basePage === "forgot-password" && (
          <ForgotPasswordPage
            onNavigate={handleNavigate}
            language={language}
            onLanguageSwitch={handleLanguageSwitch}
          />
        )}

        {basePage === "reset-password" && (
          <ResetPasswordPage
            onNavigate={handleNavigate}
            language={language}
            onLanguageSwitch={handleLanguageSwitch}
            context={pageContext as { email?: string }}
          />
        )}

        {basePage === "verify-email" && (
          <VerifyEmailPage
            onNavigate={handleNavigate}
            language={language}
            context={pageContext as { userId?: string; token?: string }}
          />
        )}
      </div>
    );
  }

  if (basePage.startsWith("onboarding-")) {
    return (
      <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-neutral-50">
        <Toaster position={isRTL ? "bottom-left" : "bottom-right"} />

        <Suspense fallback={<RouteSkeleton language={language} variant="form" />}>
          {basePage === "onboarding-welcome" && (
            <OnboardingWelcomePage
              onNavigate={handleNavigate}
              language={language}
              onLanguageSwitch={handleLanguageSwitch}
            />
          )}
          {basePage === "onboarding-assessment" && (
            <OnboardingAssessmentPage
              onNavigate={handleNavigate}
              language={language}
              onLanguageSwitch={handleLanguageSwitch}
            />
          )}
        </Suspense>
      </div>
    );
  }

  if (!mappedUser) {
    return null;
  }

  // Main app
  return (
    <RewardCelebrationProvider language={pageLanguage}>
      <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-neutral-50">
        <Toaster position={isRTL ? "bottom-left" : "bottom-right"} />

        <AppSidebar
          currentPage={basePage}
          onNavigate={(page) =>
            handleNavigate(
              isENPage ? `${stripEnglishSuffix(page)}-en` : stripEnglishSuffix(page),
            )
          }
          language={pageLanguage}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <div className={`${contentOffsetClass} transition-all duration-300`}>
          <AppHeader
            user={mappedUser}
            language={pageLanguage}
            onLanguageSwitch={handleLanguageSwitch}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            currentPage={currentPage}
            searchQuery={typeof pageContext.searchQuery === "string" ? pageContext.searchQuery : ""}
          />

        {user && !user.emailConfirmed && emailVerificationStatus && (
          <div className="border-b border-amber-200 bg-amber-50/90 px-4 py-3">
            <div className={`container-custom flex flex-col gap-3 md:flex-row md:items-center md:justify-between ${isRTL ? "md:flex-row-reverse" : ""}`}>
              <div className={isRTL ? "text-right" : "text-left"}>
                <p className="font-semibold text-amber-900">
                  {isRTL
                    ? "التحقق من البريد الإلكتروني ما زال مطلوباً."
                    : "Email verification is still required."}
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  {isRTL
                    ? `المهلة المتبقية: ${formatServerCountdownDetailed(emailVerificationStatus.emailVerificationDeadline, "ar", emailVerificationClock)}. إذا انتهت المهلة سيُحذف الحساب مع جميع بيانات التقدم المرتبطة به.`
                    : `Time remaining: ${formatServerCountdownDetailed(emailVerificationStatus.emailVerificationDeadline, "en", emailVerificationClock)}. If the deadline passes, the account and all related learning progress will be deleted.`}
                </p>
              </div>
              <button
                onClick={() =>
                  handleNavigate(isENPage ? "email-verification-en" : "email-verification")
                }
                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
              >
                {isRTL ? "تحقق الآن" : "Verify now"}
              </button>
            </div>
          </div>
        )}

        <main className="pb-20 md:pb-0">
          <Suspense
            fallback={
              <RouteSkeleton
                language={pageLanguage}
                variant={resolveLoaderVariant(basePage)}
              />
            }
          >
          {basePage === "home" && (
            <DashboardPage
              user={mappedUser}
              onNavigate={handleNavigate}
              language={pageLanguage}
            />
          )}
          {basePage === "learn" && (
            <LearnPage
              onNavigate={handleNavigate}
              language={pageLanguage}
              context={pageContext as { sectionCode?: string }}
            />
          )}
          {basePage === "unit-details" && (
            <UnitDetailsPage
              onNavigate={handleNavigate}
              context={pageContext as { sectionCode?: string; unitCode?: string }}
              language={pageLanguage}
            />
          )}
          {basePage === "unit-overview" && (
            <UnitOverviewPage
              onNavigate={handleNavigate}
              context={pageContext as { sectionCode?: string; unitCode?: string }}
              language={pageLanguage}
            />
          )}
          {basePage === "lesson-player" && (
            <LessonPlayerPage
              onNavigate={handleNavigate}
              context={
                pageContext as {
                  sectionCode?: string;
                  unitCode?: string;
                  lessonCode?: string;
                }
              }
              language={pageLanguage}
            />
          )}
          {basePage === "quiz" && (
            <QuizPage
              onNavigate={handleNavigate}
              context={
                pageContext as {
                  sectionCode?: string;
                  unitCode?: string;
                  lessonCode?: string;
                }
              }
              language={pageLanguage}
            />
          )}
          {basePage === "quiz-result" && (
            <QuizResultPage
              onNavigate={handleNavigate}
              context={
                pageContext as {
                  sectionCode?: string;
                  unitCode?: string;
                  lessonCode?: string;
                  quizTitleAr?: string;
                  quizTitleEn?: string;
                }
              }
              language={pageLanguage}
            />
          )}
          {basePage === "unit-quiz" && (
            <UnitQuizPage
              onNavigate={handleNavigate}
              context={
                pageContext as {
                  sectionCode?: string;
                  unitCode?: string;
                  projectCode?: string;
                }
              }
              language={pageLanguage}
            />
          )}
          {basePage === "unit-quiz-result" && (
            <UnitQuizResultPage
              onNavigate={handleNavigate}
              context={
                pageContext as {
                  sectionCode?: string;
                  unitCode?: string;
                  projectCode?: string;
                  quizTitleAr?: string;
                  quizTitleEn?: string;
                }
              }
              language={pageLanguage}
            />
          )}
          {basePage === "section-quiz" && (
            <SectionQuizPage
              onNavigate={handleNavigate}
              context={
                pageContext as {
                  sectionCode?: string;
                  unitCode?: string;
                }
              }
              language={pageLanguage}
            />
          )}
          {basePage === "section-quiz-result" && (
            <SectionQuizResultPage
              onNavigate={handleNavigate}
              context={
                pageContext as {
                  sectionCode?: string;
                  unitCode?: string;
                  quizTitleAr?: string;
                  quizTitleEn?: string;
                }
              }
              language={pageLanguage}
            />
          )}
          {basePage === "projects-list" && (
            <ProjectsListPage
              onNavigate={handleNavigate}
              language={pageLanguage}
            />
          )}
          {basePage === "project-brief" && (
            <ProjectBriefPage
              onNavigate={handleNavigate}
              context={
                pageContext as {
                  sectionCode?: string;
                  unitCode?: string;
                  projectCode?: string;
                }
              }
              language={pageLanguage}
            />
          )}
          {basePage === "project-submission" && (
            <ProjectSubmissionPage
              onNavigate={handleNavigate}
              context={
                pageContext as {
                  sectionCode?: string;
                  unitCode?: string;
                  projectCode?: string;
                }
              }
              language={pageLanguage}
            />
          )}
          {basePage === "project-status" && (
            <ProjectStatusPage
              onNavigate={handleNavigate}
              context={
                pageContext as {
                  sectionCode?: string;
                  unitCode?: string;
                  projectCode?: string;
                }
              }
              language={pageLanguage}
            />
          )}
          {basePage === "project-detail" && (
            <ProjectDetailPage
              onNavigate={handleNavigate}
              context={pageContext as { projectCode?: string }}
              language={pageLanguage}
            />
          )}
          {basePage === "ai-analysis" && (
            <AIAnalysisPage
              onNavigate={handleNavigate}
              language={pageLanguage}
            />
          )}
          {basePage === "ai-coach-hub" && (
            <AICoachHubPage
              onNavigate={handleNavigate}
              language={pageLanguage}
            />
          )}
          {basePage === "ai-coach-chat" && (
            <AICoachChatPage
              onNavigate={handleNavigate}
              language={pageLanguage}
            />
          )}
          {basePage === "ai-coach-recommendations" && (
            <AICoachRecommendationsPage
              onNavigate={handleNavigate}
              language={pageLanguage}
            />
          )}
          {basePage === "weak-topic-detail" && (
            <WeakTopicDetailPage
              onNavigate={handleNavigate}
              context={pageContext}
              language={pageLanguage}
            />
          )}
          {basePage === "revision-plan" && (
            <RevisionPlanPage
              onNavigate={handleNavigate}
              language={pageLanguage}
            />
          )}
          {basePage === "revision-session" && (
            <RevisionSessionPage
              onNavigate={handleNavigate}
              context={pageContext}
              language={pageLanguage}
            />
          )}
          {basePage === "revision-result" && (
            <RevisionResultPage
              onNavigate={handleNavigate}
              context={pageContext}
              language={pageLanguage}
            />
          )}
          {basePage === "revision-center" && (
            <RevisionCenterPage
              onNavigate={handleNavigate}
              language={pageLanguage}
            />
          )}
          {basePage === "certificates" && (
            <CertificatesPage
              onNavigate={handleNavigate}
              language={pageLanguage}
            />
          )}
          {basePage === "certificate-detail" && (
            <CertificateDetailPage
              onNavigate={handleNavigate}
              context={pageContext as { certificateCode?: string }}
              language={pageLanguage}
            />
          )}
          {basePage === "certificates-library" && (
            <CertificatesLibraryPage
              onNavigate={handleNavigate}
              language={pageLanguage}
            />
          )}
          {basePage === "certificate-preview" && (
            <CertificatePreviewPage
              onNavigate={handleNavigate}
              context={pageContext as { certificateCode?: string }}
              language={pageLanguage}
            />
          )}
          {basePage === "portfolio" && (
            <PortfolioPage
              onNavigate={handleNavigate}
              language={pageLanguage}
            />
          )}
          {basePage === "privacy-settings" && (
            <PrivacySettingsPage
              onNavigate={handleNavigate}
              language={pageLanguage}
            />
          )}
          {basePage === "public-portfolio" && (
            <PublicPortfolioPage
              onNavigate={handleNavigate}
              context={pageContext as { slug?: string; accessKey?: string }}
              language={pageLanguage}
            />
          )}
          {basePage === "public-project-detail" && (
            <PublicProjectDetailPage
              onNavigate={handleNavigate}
              context={
                pageContext as {
                  slug?: string;
                  accessKey?: string;
                  projectCode?: string;
                }
              }
              language={pageLanguage}
            />
          )}
          {basePage === "challenges" && (
            <ChallengesPage
              onNavigate={handleNavigate}
              language={pageLanguage}
            />
          )}
          {basePage === "challenges-hub" && (
            <ChallengesHubPage
              onNavigate={handleNavigate}
              language={pageLanguage}
            />
          )}
          {basePage === "challenge-detail" && (
            <ChallengeDetailPage
              onNavigate={handleNavigate}
              context={pageContext as { challengeId?: string; cycleKey?: string }}
              language={pageLanguage}
            />
          )}
          {basePage === "profile" && (
            <ProfilePage
              user={mappedUser}
              onNavigate={handleNavigate}
              language={pageLanguage}
            />
          )}
          {basePage === "settings" && (
            <SettingsPage
              onNavigate={handleNavigate}
              language={pageLanguage}
              onLanguageSwitch={handleLanguageSwitch}
              onLogout={handleLogout}
            />
          )}
          {basePage === "email-verification" && (
            <EmailVerificationPage
              onNavigate={handleNavigate}
              language={pageLanguage}
              developmentVerificationUrl={
                typeof pageContext.developmentVerificationUrl === "string"
                  ? pageContext.developmentVerificationUrl
                  : undefined
              }
            />
          )}
          {basePage === "edit-profile" && (
            <EditProfilePage
              onNavigate={handleNavigate}
              language={pageLanguage}
              user={mappedUser}
            />
          )}
          {basePage === "search" && (
            <SearchPage
              onNavigate={handleNavigate}
              language={pageLanguage}
              userId={user?.id}
              context={pageContext}
            />
          )}
          {basePage === "share" && (
            <SharePage
              onNavigate={handleNavigate}
              language={pageLanguage}
              context={pageContext as {
                type?: "profile" | "portfolio" | "project";
                title?: string;
                shareUrl?: string;
                backPage?: string;
              }}
            />
          )}
          {!KNOWN_APP_PAGES.includes(basePage as (typeof KNOWN_APP_PAGES)[number]) && (
            <div className="container-custom py-12">
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <h2 className="mb-3 text-slate-900">
                  {isRTL ? "الصفحة غير متاحة" : "Page unavailable"}
                </h2>
                <p className="mb-6 text-slate-600">
                  {isRTL
                    ? "هذا الرابط لا يشير إلى صفحة صالحة داخل التطبيق الحالي."
                    : "This route does not map to a valid page in the current app."}
                </p>
                <button
                  onClick={() => handleNavigate(isENPage ? "home-en" : "home")}
                  className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
                >
                  {isRTL ? "العودة للرئيسية" : "Go to dashboard"}
                </button>
              </div>
            </div>
          )}
          </Suspense>
        </main>

          <MobileBottomNav
            currentPage={basePage}
            onNavigate={(page) =>
              handleNavigate(
                isENPage ? `${stripEnglishSuffix(page)}-en` : stripEnglishSuffix(page),
              )
            }
            language={pageLanguage}
          />
        </div>
      </div>
    </RewardCelebrationProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
