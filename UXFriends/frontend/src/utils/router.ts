export type AppLanguage = "ar" | "en";

export const PAGE_PATHS = {
  landing: "/",
  login: "/login",
  signup: "/signup",
  "auth-callback": "/auth/callback",
  "forgot-password": "/forgot-password",
  "reset-password": "/reset-password",
  "verify-email": "/verify-email",
  "onboarding-welcome": "/onboarding",
  "onboarding-assessment": "/onboarding/assessment",
  home: "/dashboard",
  learn: "/learning",
  "unit-details": "/learning/unit-details",
  "unit-overview": "/learning/unit-overview",
  "lesson-player": "/learning/lesson-player",
  quiz: "/learning/quiz",
  "quiz-result": "/learning/quiz-result",
  "unit-quiz": "/learning/unit-quiz",
  "unit-quiz-result": "/learning/unit-quiz-result",
  "section-quiz": "/learning/section-quiz",
  "section-quiz-result": "/learning/section-quiz-result",
  "projects-list": "/projects",
  "project-brief": "/projects/brief",
  "project-submission": "/projects/submission",
  "project-status": "/projects/status",
  "project-detail": "/projects/detail",
  "ai-analysis": "/ai/analysis",
  "ai-coach-hub": "/ai/coach",
  "ai-coach-chat": "/ai/coach/chat",
  "ai-coach-recommendations": "/ai/coach/recommendations",
  "weak-topic-detail": "/ai/analysis/weak-topic",
  "revision-plan": "/ai/revision-plan",
  "revision-session": "/ai/revision-session",
  "revision-result": "/ai/revision-result",
  "revision-center": "/revision",
  certificates: "/certificates",
  "certificate-detail": "/certificates/detail",
  "certificates-library": "/certificates/library",
  "certificate-preview": "/certificates/preview",
  portfolio: "/portfolio",
  "privacy-settings": "/portfolio/privacy",
  "public-portfolio": "/portfolio/public",
  "public-project-detail": "/portfolio/public-project",
  challenges: "/challenges",
  "challenges-hub": "/challenges/hub",
  "challenge-detail": "/challenges/detail",
  profile: "/profile",
  settings: "/settings",
  "email-verification": "/settings/email-verification",
  "edit-profile": "/profile/edit",
  search: "/search",
  share: "/share",
} as const;

export type RoutePage = keyof typeof PAGE_PATHS;

const PATH_TO_PAGE = new Map<string, RoutePage>(
  Object.entries(PAGE_PATHS).map(([page, path]) => [path, page as RoutePage]),
);

const PATH_ALIASES: Record<string, RoutePage> = {
  "/home": "home",
  "/onboarding/goal": "onboarding-welcome",
  "/onboarding/level": "onboarding-welcome",
  "/onboarding/availability": "onboarding-welcome",
};

const LEARNING_CONTEXT_PAGES = new Set<RoutePage>([
  "unit-details",
  "unit-overview",
  "lesson-player",
  "quiz",
  "quiz-result",
  "unit-quiz",
  "unit-quiz-result",
  "section-quiz",
  "section-quiz-result",
  "project-brief",
  "project-submission",
  "project-status",
  "project-detail",
]);

export function stripEnglishSuffix(page: string) {
  return page.replace(/-en$/, "");
}

export function getLanguageFromPage(page: string, fallback: AppLanguage) {
  return page.endsWith("-en") ? "en" : fallback;
}

export function resolveRoute(pathname: string, search: string) {
  const normalizedPath =
    pathname !== "/" ? pathname.replace(/\/+$/, "") || "/" : pathname;
  const page = PATH_TO_PAGE.get(normalizedPath) ?? PATH_ALIASES[normalizedPath] ?? null;
  const params = new URLSearchParams(search);
  const language: AppLanguage = params.get("lang") === "en" ? "en" : "ar";

  return { page, language };
}

export function buildRouteUrl(
  page: string,
  language: AppLanguage,
  context?: Record<string, unknown>,
) {
  const basePage = stripEnglishSuffix(page) as RoutePage;
  const pathname = PAGE_PATHS[basePage] ?? PAGE_PATHS.landing;
  const params = new URLSearchParams();

  if (language === "en") {
    params.set("lang", "en");
  }

  if (basePage === "search") {
    const searchQuery = context?.searchQuery;
    if (typeof searchQuery === "string" && searchQuery.trim().length > 0) {
      params.set("q", searchQuery.trim());
    }
  }

  if (basePage === "learn") {
    const sectionCode = context?.sectionCode;
    if (typeof sectionCode === "string" && sectionCode.trim().length > 0) {
      params.set("sectionCode", sectionCode.trim());
    }
  }

  if (LEARNING_CONTEXT_PAGES.has(basePage)) {
    for (const key of ["sectionCode", "unitCode", "lessonCode", "projectCode"] as const) {
      const value = context?.[key];
      if (typeof value === "string" && value.trim().length > 0) {
        params.set(key, value.trim());
      }
    }
  }

  if (basePage === "challenge-detail") {
    const challengeId = context?.challengeId;
    if (typeof challengeId === "string" && challengeId.trim().length > 0) {
      params.set("challengeId", challengeId.trim());
    }

    const cycleKey = context?.cycleKey;
    if (typeof cycleKey === "string" && cycleKey.trim().length > 0) {
      params.set("cycleKey", cycleKey.trim());
    }
  }

  if (basePage === "project-detail" || basePage === "project-submission") {
    const projectCode = context?.projectCode;
    if (typeof projectCode === "string" && projectCode.trim().length > 0) {
      params.set("projectCode", projectCode.trim());
    }

    const projectTitle = context?.projectTitle;
    if (typeof projectTitle === "string" && projectTitle.trim().length > 0) {
      params.set("projectTitle", projectTitle.trim());
    }
  }

  if (
    basePage === "certificates-library" ||
    basePage === "certificate-preview" ||
    basePage === "certificate-detail"
  ) {
    const certificateCode = context?.certificateCode;
    if (typeof certificateCode === "string" && certificateCode.trim().length > 0) {
      params.set("certificateCode", certificateCode.trim());
    }
  }

  if (basePage === "public-portfolio" || basePage === "public-project-detail") {
    const slug = context?.slug;
    if (typeof slug === "string" && slug.trim().length > 0) {
      params.set("slug", slug.trim());
    }

    const accessKey = context?.accessKey;
    if (typeof accessKey === "string" && accessKey.trim().length > 0) {
      params.set("access", accessKey.trim());
    }
  }

  if (basePage === "public-project-detail") {
    const projectCode = context?.projectCode;
    if (typeof projectCode === "string" && projectCode.trim().length > 0) {
      params.set("projectCode", projectCode.trim());
    }
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function readRoutePageContext(pathname: string, search: string): Record<string, unknown> {
  const route = resolveRoute(pathname, search);
  const params = new URLSearchParams(search);
  const pageContext: Record<string, unknown> = {};

  if (!route.page) {
    return pageContext;
  }

  if (route.page === "search") {
    const searchQuery = params.get("q");
    if (searchQuery) {
      pageContext.searchQuery = searchQuery;
    }
  }

  if (route.page === "learn") {
    const sectionCode = params.get("sectionCode");
    if (sectionCode) {
      pageContext.sectionCode = sectionCode;
    }
  }

  if (route.page === "auth-callback") {
    const provider = params.get("provider");
    if (provider) {
      pageContext.provider = provider;
    }

    const code = params.get("code");
    if (code) {
      pageContext.code = code;
    }

    const error = params.get("error");
    if (error) {
      pageContext.error = error;
    }

    pageContext.rememberMe = params.get("remember") === "1";
  }

  if (route.page === "verify-email") {
    const userId = params.get("userId");
    if (userId) {
      pageContext.userId = userId;
    }

    const token = params.get("token");
    if (token) {
      pageContext.token = token;
    }
  }

  if (LEARNING_CONTEXT_PAGES.has(route.page)) {
    for (const key of ["sectionCode", "unitCode", "lessonCode", "projectCode"] as const) {
      const value = params.get(key);
      if (value) {
        pageContext[key] = value;
      }
    }
  }

  if (route.page === "challenge-detail") {
    const challengeId = params.get("challengeId");
    if (challengeId) {
      pageContext.challengeId = challengeId;
    }

    const cycleKey = params.get("cycleKey");
    if (cycleKey) {
      pageContext.cycleKey = cycleKey;
    }
  }

  if (route.page === "project-detail" || route.page === "project-submission") {
    const projectCode = params.get("projectCode");
    if (projectCode) {
      pageContext.projectCode = projectCode;
    }

    const projectTitle = params.get("projectTitle");
    if (projectTitle) {
      pageContext.projectTitle = projectTitle;
    }
  }

  if (
    route.page === "certificates-library" ||
    route.page === "certificate-preview" ||
    route.page === "certificate-detail"
  ) {
    const certificateCode = params.get("certificateCode");
    if (certificateCode) {
      pageContext.certificateCode = certificateCode;
    }
  }

  if (route.page === "public-portfolio" || route.page === "public-project-detail") {
    const slug = params.get("slug");
    if (slug) {
      pageContext.slug = slug;
    }

    const accessKey = params.get("access");
    if (accessKey) {
      pageContext.accessKey = accessKey;
    }
  }

  if (route.page === "public-project-detail") {
    const projectCode = params.get("projectCode");
    if (projectCode) {
      pageContext.projectCode = projectCode;
    }
  }

  return pageContext;
}

export function readHistoryPageContext(state: unknown): Record<string, unknown> {
  if (
    state &&
    typeof state === "object" &&
    "pageContext" in state &&
    state.pageContext &&
    typeof state.pageContext === "object"
  ) {
    return state.pageContext as Record<string, unknown>;
  }

  return {};
}
