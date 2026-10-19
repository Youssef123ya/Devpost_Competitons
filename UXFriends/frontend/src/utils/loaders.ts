export function resolveLoaderVariant(page: string) {
  if (page === "home") {
    return "dashboard" as const;
  }

  if (
    page === "profile" ||
    page === "edit-profile"
  ) {
    return "profile" as const;
  }

  if (page === "settings" || page === "email-verification") {
    return "settings" as const;
  }

  if (
    page === "learn" ||
    page === "unit-details" ||
    page === "unit-overview"
  ) {
    return "learning" as const;
  }

  if (page.startsWith("lesson-")) {
    return "lesson" as const;
  }

  if (
    page === "quiz" ||
    page === "quiz-result" ||
    page === "unit-quiz" ||
    page === "unit-quiz-result" ||
    page === "section-quiz" ||
    page === "section-quiz-result"
  ) {
    return "quiz" as const;
  }

  if (page === "ai-coach-chat") {
    return "chat" as const;
  }

  if (page.startsWith("ai-") || page.startsWith("revision-")) {
    return "analysis" as const;
  }

  if (page.startsWith("challenge")) {
    return "challenge" as const;
  }

  if (page.startsWith("project")) {
    return "form" as const;
  }

  if (page.startsWith("portfolio") || page.startsWith("public-portfolio")) {
    return "portfolio" as const;
  }

  if (page.startsWith("certificate")) {
    return "certificate" as const;
  }

  return "dashboard" as const;
}
