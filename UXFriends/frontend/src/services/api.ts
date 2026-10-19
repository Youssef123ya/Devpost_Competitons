import axios from "axios";
import { clearStoredAuth } from "../utils/authStorage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5176/api";

// ── Axios Instance ─────────────────────────────────────────────────────────
export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// ── Response Interceptor: handle 401 ─────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired — clear session
      clearStoredAuth();
      window.location.reload();
    }
    return Promise.reject(error);
  },
);

// ── Auth Endpoints ────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),

  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    age?: number;
  }) => api.post("/auth/register", data),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>("/auth/forgot-password", { email }),

  verifyResetCode: (email: string, code: string) =>
    api.post<{ message: string }>("/auth/verify-reset-code", {
      email,
      code,
    }),

  resetPassword: (data: {
    email: string;
    code: string;
    newPassword: string;
  }) => api.post<{ message: string }>("/auth/reset-password", data),

  getExternalProviders: () =>
    api.get<{ google: boolean; github: boolean }>("/auth/external/providers"),

  exchangeExternalCode: (
    provider: "google" | "github",
    code: string,
    rememberMe = false,
  ) => api.post(`/auth/external/${provider}/exchange`, { code, rememberMe }),

  getPlacementAssessment: () =>
    api.get<QuizDefinition>("/auth/onboarding/assessment"),

  submitPlacementAssessment: (answers: Record<string, number>) =>
    api.post<{
      assignedLevel: "beginner" | "intermediate" | "advanced";
      scorePercent: number;
      correctAnswers: number;
      totalQuestions: number;
    }>("/auth/onboarding/assessment/submit", { answers }),

  startFromScratch: () =>
    api.post<{
      assignedLevel: "beginner";
    }>("/auth/onboarding/start-from-scratch"),

  getEmailVerificationStatus: () =>
    api.get<EmailVerificationStatus>("/auth/email-verification/status"),

  sendEmailVerification: () =>
    api.post<{
      message: string;
      status: EmailVerificationStatus;
      developmentVerificationUrl?: string | null;
    }>("/auth/email-verification/send"),

  confirmEmailVerification: (data: { userId: string; token: string }) =>
    api.post<{
      alreadyVerified: boolean;
      message: string;
    }>("/auth/email-verification/confirm", data),
};

export interface PublicLearningPath {
  code: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: string;
  difficulty: string;
  unitsCount: number;
  lessonsCount: number;
  estimatedMinutes: number;
  locked: boolean;
}

export interface PublicLandingOverview {
  generatedAt: string;
  cacheVersion: string;
  metrics: {
    sectionsCount: number;
    unitsCount: number;
    lessonsCount: number;
    totalCourseHours: number;
    challengesCount: number;
    certificatesCount: number;
  };
  learningPaths: PublicLearningPath[];
}

export interface EmailVerificationStatus {
  email: string | null;
  emailConfirmed: boolean;
  createdAt: string;
  emailVerificationDeadline: string;
  serverNow: string;
}

export interface DashboardGoal {
  key: string;
  category: "lessons" | "focus" | "consistency";
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  current: number;
  target: number;
  xpReward: number;
  completed: boolean;
  rewardClaimed: boolean;
}

export interface DashboardLesson {
  code: string;
  sectionCode: string;
  unitCode: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  durationMinutes: number;
  difficulty: string;
  progress: number;
  xpReward: number;
}

export interface DashboardChallenge {
  code: string;
  cycleKey: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  challengeType: string;
  difficulty: string;
  xpReward: number;
  participants: number;
  participating: boolean;
  completed: boolean;
  expiresAt: string;
  objectiveAr: string;
  objectiveEn: string;
  progressCurrent: number;
  progressTarget: number;
  progressLabelAr: string;
  progressLabelEn: string;
  readyToClaim: boolean;
}

export interface DashboardSummary {
  stats: {
    lessonsCompleted: number;
    lessonsCompletedThisWeek: number;
    challengesWon: number;
    challengesWonThisMonth: number;
    projectsCompleted: number;
    badgesEarned: number;
  };
  xp: {
    current: number;
    total: number;
    required: number;
    level: number;
  };
  streak: {
    current: number;
    longest: number;
    nextMilestone: number;
    progressPercent: number;
    daysUntilNextReward: number;
    nextReward: null | {
      milestoneDays: number;
      xpReward: number;
      titleAr: string;
      titleEn: string;
      descriptionAr: string;
      descriptionEn: string;
      badgeCode?: string | null;
      badgeNameAr?: string | null;
      badgeNameEn?: string | null;
    };
  };
  serverNow: string;
  todayGoals: DashboardGoal[];
  recommendedLessons: DashboardLesson[];
  activeChallenges: DashboardChallenge[];
  aiInsight: {
    strengthAr: string;
    strengthEn: string;
    focusAr: string;
    focusEn: string;
  };
}

export type InsightSeverity = "high" | "medium" | "low";

export interface InsightTopic {
  code: string;
  titleAr: string;
  titleEn: string;
  progress: number;
  severity: InsightSeverity;
  reasonAr: string;
  reasonEn: string;
  lessonsRemaining: number;
  estimatedMinutes: number;
  nextLessonCode?: string | null;
  nextLessonTitleAr?: string | null;
  nextLessonTitleEn?: string | null;
}

export interface InsightRecommendation {
  id: string;
  type: "lesson" | "revision" | "challenge";
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  priority: InsightSeverity;
  estimatedMinutes: number;
  xpReward: number;
  destinationPage: string;
  destinationContext?: Record<string, string | number | null>;
}

export interface InsightActivity {
  id: string;
  titleAr: string;
  titleEn: string;
  occurredAt: string;
  statusAr: string;
  statusEn: string;
}

export interface AICoachOverview {
  stats: {
    level: number;
    streak: number;
    bestPerformance: number;
    weakAreasCount: number;
  };
  strengths: Array<{
    code: string;
    titleAr: string;
    titleEn: string;
    progress: number;
  }>;
  weakTopics: InsightTopic[];
  mistakes: QuizMistake[];
  recommendedNextStep: InsightRecommendation | null;
  recommendations: InsightRecommendation[];
  recentActivity: InsightActivity[];
}

export interface AIChatSessionMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface AIChatContextSnapshot {
  skillLevel: string;
  level: number;
  streak: number;
  totalXp: number;
  lessonsCompleted: number;
  recommendedStepId?: string | null;
  recommendedStepTitle?: string | null;
  primaryWeakTopicTitle?: string | null;
  generatedAtUtc: string;
}

export interface AIChatSessionResponse {
  messages: AIChatSessionMessage[];
  contextSnapshot: AIChatContextSnapshot;
  updatedAt?: string | null;
  maxMessages: number;
}

export interface RevisionOverview {
  weeklyGoal: {
    targetSessions: number;
    completedSessions: number;
    progressPercent: number;
  };
  recommendedTopics: InsightTopic[];
  reviewBank: RevisionReviewItem[];
  revisionHistory: Array<{
    id: string;
    titleAr: string;
    titleEn: string;
    occurredAt: string;
    score: number;
  }>;
  plan: Array<{
    key: string;
    dayLabelAr: string;
    dayLabelEn: string;
    topics: InsightTopic[];
    items: RevisionReviewItem[];
  }>;
}

export interface RevisionSessionCompletionResponse {
  xpAwarded: number;
  level: number;
  totalXP: number;
  currentXP: number;
  nextLevelXP: number;
  revisionTopicCode: string | null;
  completedAt: string;
}

export interface LessonNote {
  lessonCode: string;
  content: string;
  hasNote: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface RevisionReviewItem {
  id: string;
  topicCode: string;
  titleAr: string;
  titleEn: string;
  reasonAr: string;
  reasonEn: string;
  sourceAr: string;
  sourceEn: string;
  occurredAt: string | null;
  nextLessonCode?: string | null;
  nextLessonTitleAr?: string | null;
  nextLessonTitleEn?: string | null;
  promptAr: string;
  promptEn: string;
  optionsAr: string[];
  optionsEn: string[];
  correctOptionIndex: number;
  selectedAnswerAr?: string | null;
  selectedAnswerEn?: string | null;
  correctAnswerAr: string;
  correctAnswerEn: string;
  explanationAr: string;
  explanationEn: string;
  questionType?: string;
  optionVisualKeys?: string[] | null;
}

export interface BadgeEntry {
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: string;
  earnedAt: string | null;
  unlocked: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar?: string | null;
  portfolioSlug?: string | null;
  xp: number;
  level: number;
  streak: number;
  isCurrentUser: boolean;
  period: string;
  completed?: boolean;
  progressCurrent?: number;
  progressTarget?: number;
  tier?: string;
  skillLevel?: string;
}

export interface ChallengeSummary {
  code: string;
  cycleKey: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  challengeType: string;
  difficulty: string;
  xpReward: number;
  participants: number;
  participating: boolean;
  completed: boolean;
  expiresAt: string;
  isCurrentCycle: boolean;
  objectiveAr: string;
  objectiveEn: string;
  progressCurrent: number;
  progressTarget: number;
  progressLabelAr: string;
  progressLabelEn: string;
  readyToClaim: boolean;
}

export interface ChallengeDetail extends ChallengeSummary {
  serverNow: string;
  skillLevel: string;
  league: {
    tier: string;
    nameAr: string;
    nameEn: string;
  };
}

export interface LeagueLeaderboardResponse {
  serverNow: string;
  league: {
    tier: string;
    nameAr: string;
    nameEn: string;
    skillLevel: string;
    weekKey: string;
    weekStartsAt: string;
    weekEndsAt: string;
    promotionSlots: number;
    demotionSlots: number;
    rewards: {
      first: number;
      second: number;
      third: number;
    };
  };
  lastWeekResult: null | {
    weekKey: string;
    rank: number;
    rewardXp: number;
    movement: "promoted" | "demoted" | "stayed";
    tier: string;
    tierNameAr: string;
    tierNameEn: string;
    skillLevel: string;
    settledAt: string | null;
  };
  entries: LeaderboardEntry[];
}

export interface SearchResult {
  id: string;
  code: string;
  type: "section" | "lesson" | "project" | "challenge" | "certificate";
  sectionCode?: string | null;
  unitCode?: string | null;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  badgeAr: string;
  badgeEn: string;
}

export interface ProjectSummary {
  code: string;
  sectionCode: string;
  sectionTitleAr: string;
  sectionTitleEn: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  submissionStatus: string | null;
  submittedAt: string | null;
  submissionUrl: string | null;
  canEditSubmission?: boolean;
  estimatedHours?: number;
  xpReward?: number;
  eligibleToSubmit?: boolean;
  submissionEligibility?: {
    eligible: boolean;
    requirements: {
      lessonsCompleted: boolean;
      unitQuizzesPassed: boolean;
      completedLessons: number;
      totalLessons: number;
      passedUnitQuizzes: number;
      totalUnitQuizzes: number;
    };
  };
}

export interface ProjectDetail extends ProjectSummary {
  requirementsAr: string;
  requirementsEn: string;
  deliverablesAr: string[];
  deliverablesEn: string[];
  evaluationCriteria: Array<{
    labelAr: string;
    labelEn: string;
    weight: number;
  }>;
  estimatedHours: number;
  xpReward: number;
  submissionDescription?: string | null;
}

export type PortfolioVisibility = "public" | "private";

export interface PortfolioProject {
  code: string;
  sectionCode: string;
  sectionTitleAr: string;
  sectionTitleEn: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  submissionStatus: string;
  submittedAt: string | null;
  submissionUrl: string | null;
}

export interface PortfolioOverview {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string | null;
    professionalTitle?: string | null;
    bio?: string | null;
    location?: string | null;
    website?: string | null;
    level: number;
    totalXP: number;
    learningGoal?: string | null;
    skillLevel?: string | null;
    joinDate: string;
  };
  privacy: {
    visibility: PortfolioVisibility;
    slug: string;
    accessKey?: string;
    publicUrl: string;
  };
  stats: {
    approvedProjects: number;
    certificates: number;
    badges: number;
  };
  projects: PortfolioProject[];
}

export interface PortfolioPrivacySettings {
  visibility: PortfolioVisibility;
  slug: string;
  accessKey?: string;
  publicUrl: string;
}

export interface PublicPortfolio {
  owner: {
    firstName: string;
    lastName: string;
    fullName: string;
    avatar?: string | null;
    professionalTitle?: string | null;
    bio?: string | null;
    location?: string | null;
    website?: string | null;
    level: number;
    totalXP: number;
    learningGoal?: string | null;
    skillLevel?: string | null;
    joinDate: string;
  };
  privacy: {
    visibility: PortfolioVisibility;
    slug: string;
    publicUrl: string;
  };
  stats: {
    approvedProjects: number;
    certificates: number;
    badges: number;
  };
  projects: PortfolioProject[];
}

export interface PublicPortfolioProject extends PortfolioProject {
  requirementsAr: string;
  requirementsEn: string;
}

export interface CertificateEntry {
  code: string;
  sectionCode: string;
  titleAr: string;
  titleEn: string;
  pathAr: string;
  pathEn: string;
  descriptionAr: string;
  descriptionEn: string;
  status: "available" | "locked";
  progress: number;
  lessonsCompleted: number;
  totalLessons: number;
  examReady: boolean;
  examPassed: boolean;
  issuedAt: string | null;
  certificateNo: string | null;
  learnerName: string;
}

export interface ProfileOverview {
  profile: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string | null;
    professionalTitle?: string | null;
    bio?: string | null;
    location?: string | null;
    website?: string | null;
    level: number;
    totalXP: number;
    currentXP: number;
    nextLevelXP: number;
    currentStreak: number;
    longestStreak: number;
    lessonsCompleted: number;
    projectsCompleted: number;
    challengesWon: number;
    badgesEarned: number;
    joinDate: string;
    learningGoal?: string | null;
    skillLevel?: string | null;
    weeklyDays?: number | null;
    dailyMinutes?: number | null;
  };
  totals: {
    totalBadges: number;
    totalProjects: number;
  };
  learningPaths: Array<{
    code: string;
    titleAr: string;
    titleEn: string;
    progress: number;
    completedLessons: number;
    totalLessons: number;
  }>;
  badges: BadgeEntry[];
  projects: ProjectSummary[];
  recentActivity: Array<{
    id: string;
    type: "lesson" | "challenge" | "badge" | "project";
    titleAr: string;
    titleEn: string;
    occurredAt: string;
    xpAwarded: number;
  }>;
}

// ── Learning Endpoints ────────────────────────────────────────────────────
export interface LearningSection {
  code: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: string;
  difficulty: string;
  locked: boolean;
  unitsCount: number;
  lessonsCount: number;
  progress: number;
  estimatedMinutes?: number;
  certificateIssued: boolean;
  sectionExamPassed: boolean;
  readyForFinalExam: boolean;
  completionState: "completed" | "ready-for-final" | "requirements-pending" | "in-progress" | "not-started";
  completionLabelAr: string;
  completionLabelEn: string;
}

export interface LearningUnit {
  code: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  durationMinutes: number;
  xpReward: number;
  difficulty: string;
  locked: boolean;
  lessonsCount: number;
  completed: boolean;
  inProgress: boolean;
  progress: number;
}

export interface LearningLesson {
  code: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  contentAr: string;
  contentEn: string;
  durationMinutes: number;
  xpReward: number;
  difficulty: string;
  progress: number;
  completed: boolean;
}

export interface LearningUnitDetail extends LearningUnit {
  sectionCode: string;
  sectionTitleAr: string;
  sectionTitleEn: string;
  outcomesAr: string[];
  outcomesEn: string[];
  quiz: null | {
    questionCount: number;
    xpReward: number;
    passThreshold: number;
    timeLimitMinutes?: number | null;
    passed: boolean;
  };
  sectionExam: null | {
    questionCount: number;
    xpReward: number;
    passThreshold: number;
    timeLimitMinutes?: number | null;
    eligible: boolean;
    passed: boolean;
    certificateIssued: boolean;
    requirements: {
      lessonsCompleted: boolean;
      unitQuizzesPassed: boolean;
      projectRequired: boolean;
      projectSubmitted: boolean;
      completedLessons?: number;
      totalLessons?: number;
      passedUnitQuizzes?: number;
      totalUnitQuizzes?: number;
    };
  };
  project: null | {
    code: string;
    titleAr: string;
    titleEn: string;
    descriptionAr: string;
    descriptionEn: string;
    xpReward: number;
    estimatedHours: number;
    submissionStatus: string | null;
    canEditSubmission?: boolean;
  };
}

export interface LearningContentBlock {
  id: string;
  type: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  itemsAr: string[];
  itemsEn: string[];
  accentAr?: string | null;
  accentEn?: string | null;
  visualKey?: string | null;
  captionAr?: string | null;
  captionEn?: string | null;
}

export interface LearningLessonDetail extends LearningLesson {
  unitCode: string;
  unitTitleAr: string;
  unitTitleEn: string;
  sectionCode?: string | null;
  sectionTitleAr?: string | null;
  sectionTitleEn?: string | null;
  previousLessonCode?: string | null;
  nextLessonCode?: string | null;
  contentBlocks: LearningContentBlock[];
  quiz: null | {
    questionCount: number;
    xpReward: number;
  };
}

export interface QuizQuestion {
  code: string;
  promptAr: string;
  promptEn: string;
  optionsAr: string[];
  optionsEn: string[];
  hintAr: string;
  hintEn: string;
  relatedLessonCode?: string | null;
  questionType?: string;
  optionVisualKeys?: string[] | null;
}

export interface QuizDefinition {
  serverNow?: string | null;
  quizCode: string;
  scope: "lesson" | "unit" | "section" | "assessment";
  sectionCode: string;
  unitCode: string;
  lessonCode?: string | null;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  passThreshold: number;
  xpReward: number;
  timeLimitMinutes?: number | null;
  questions: QuizQuestion[];
}

export interface QuizMistake {
  code: string;
  promptAr: string;
  promptEn: string;
  selectedAnswerAr?: string | null;
  selectedAnswerEn?: string | null;
  correctAnswerAr: string;
  correctAnswerEn: string;
  explanationAr: string;
  explanationEn: string;
  lessonCode?: string | null;
  lessonTitleAr?: string | null;
  lessonTitleEn?: string | null;
  unitCode?: string | null;
  unitTitleAr?: string | null;
  unitTitleEn?: string | null;
  sectionCode?: string | null;
  sectionTitleAr?: string | null;
  sectionTitleEn?: string | null;
  occurredAt?: string;
}

export interface QuizSubmissionResult {
  attemptCode: string;
  scorePercent: number;
  correctAnswers: number;
  totalQuestions: number;
  passed: boolean;
  passThreshold: number;
  xpAwarded: number;
  alreadyAwarded: boolean;
  timeLimitMinutes?: number | null;
  certificateUnlocked: boolean;
  level: number;
  totalXP: number;
  currentXP: number;
  nextLevelXP: number;
  weakTopics: Array<{
    code: string;
    titleAr: string;
    titleEn: string;
    lessonCode?: string | null;
  }>;
  mistakes: QuizMistake[];
}

export const learningApi = {
  getSections: () => api.get<LearningSection[]>("/sections"),
  getSection: (code: string) => api.get<LearningSection>(`/sections/${code}`),
  getUnit: (unitCode: string) => api.get<LearningUnitDetail>(`/units/${unitCode}`),
  getUnits: (sectionCode: string) =>
    api.get<LearningUnit[]>(`/sections/${sectionCode}/units`),
  getLessons: (unitCode: string) =>
    api.get<LearningLesson[]>(`/units/${unitCode}/lessons`),
  getLesson: (code: string) => api.get<LearningLessonDetail>(`/lessons/${code}`),
  getLessonNote: (code: string) => api.get<LessonNote>(`/lessons/${code}/note`),
  saveLessonNote: (code: string, content: string) =>
    api.put<LessonNote>(`/lessons/${code}/note`, { content }),
  completeLesson: (code: string) => api.post(`/lessons/${code}/complete`),
  getUserProgress: () => api.get("/users/me/progress"),
};

export const quizApi = {
  getLessonQuiz: (lessonCode: string) =>
    api.get<QuizDefinition>(`/quizzes/lesson/${lessonCode}`),
  submitLessonQuiz: (lessonCode: string, answers: Record<string, number>) =>
    api.post<QuizSubmissionResult>(`/quizzes/lesson/${lessonCode}/submit`, {
      answers,
    }),
  getUnitQuiz: (unitCode: string) =>
    api.get<QuizDefinition>(`/quizzes/unit/${unitCode}`),
  submitUnitQuiz: (unitCode: string, answers: Record<string, number>) =>
    api.post<QuizSubmissionResult>(`/quizzes/unit/${unitCode}/submit`, {
      answers,
    }),
  getSectionQuiz: (sectionCode: string) =>
    api.get<QuizDefinition>(`/quizzes/section/${sectionCode}`),
  submitSectionQuiz: (sectionCode: string, answers: Record<string, number>) =>
    api.post<QuizSubmissionResult>(`/quizzes/section/${sectionCode}/submit`, {
      answers,
    }),
};

// ── Gamification Endpoints ────────────────────────────────────────────────
export const gamificationApi = {
  getProfile: () => api.get<ProfileOverview["profile"]>("/users/me/profile"),
  getXP: () => api.get("/users/me/xp"),
  getBadges: () => api.get<BadgeEntry[]>("/users/me/badges"),
  getStreak: () => api.get("/users/me/streak"),
  getLeaderboard: (period = "weekly") =>
    api.get<LeagueLeaderboardResponse>(`/leaderboard/${period}`),
  getChallenges: () =>
    api.get<{ serverNow: string; challenges: ChallengeSummary[] }>("/challenges"),
  getChallenge: (code: string, cycleKey?: string) =>
    api.get<ChallengeDetail>(`/challenges/${code}`, {
      params: cycleKey ? { cycleKey } : undefined,
    }),
  joinChallenge: (code: string, cycleKey?: string) =>
    api.post(`/challenges/${code}/join`, { cycleKey }),
  completeChallenge: (code: string, cycleKey?: string) =>
    api.post(`/challenges/${code}/complete`, { cycleKey }),
};

export const dashboardApi = {
  getSummary: () => api.get<DashboardSummary>("/dashboard/summary"),
};

export const aiApi = {
  getOverview: () => api.get<AICoachOverview>("/ai/overview"),
  getRevisionOverview: () => api.get<RevisionOverview>("/ai/revision"),
  updateRevisionPlan: () => api.post<RevisionOverview>("/ai/revision/update"),
  getChatSession: () => api.get<AIChatSessionResponse>("/ai/chat/session"),
  saveChatSession: (data: {
    messages: AIChatSessionMessage[];
    contextSnapshot?: AIChatContextSnapshot;
  }) => api.put<AIChatSessionResponse>("/ai/chat/session", data),
  resetChatSession: () => api.delete<{ success: boolean }>("/ai/chat/session"),
  completeRevisionSession: (data: {
    topicCodes: string[];
    itemIds: string[];
    scorePercent: number;
    correctAnswers: number;
    totalQuestions: number;
  }) =>
    api.post<RevisionSessionCompletionResponse>("/ai/revision/session/complete", data),
};

export const publicApi = {
  getLandingOverview: () => api.get<PublicLandingOverview>("/public/landing"),
};

// ── User Endpoints ────────────────────────────────────────────────────────
export interface ProfileUpdateData {
  firstName: string;
  lastName: string;
  avatar?: string | null;
  professionalTitle?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
}
export const userApi = {
  getProfile: () => api.get<ProfileOverview["profile"]>("/users/me/profile"),
  getProfileOverview: () =>
    api.get<ProfileOverview>("/users/me/profile-overview"),
  updateProfile: (data: ProfileUpdateData) =>
    api.put<ProfileOverview["profile"]>("/users/me/profile", data),
  updatePreferences: (data: { preferredLanguage: "ar" | "en" }) =>
    api.put<{ user: ProfileOverview["profile"] & { preferredLanguage: "ar" | "en" } }>(
      "/users/me/preferences",
      data,
    ),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put("/users/me/password", data),
};

export const projectApi = {
  getProjects: () => api.get<ProjectSummary[]>("/projects"),
  getProject: (code: string) => api.get<ProjectDetail>(`/projects/${code}`),
  submitProject: (code: string, data: { submissionUrl: string; description: string }) =>
    api.post<{
      success: boolean;
      status: string;
      submittedAt: string;
      submissionUrl: string;
      description: string;
      xpAwarded: number;
      dailyGoalXpAwarded: number;
      canEditSubmission: boolean;
      projectsCompleted: number;
      level: number;
      totalXP: number;
      currentXP: number;
      nextLevelXP: number;
    }>(`/projects/${code}/submit`, data),
};

export const certificateApi = {
  getCertificates: () => api.get<CertificateEntry[]>("/certificates"),
  getCertificate: (code: string) => api.get<CertificateEntry>(`/certificates/${code}`),
};

export const portfolioApi = {
  getPortfolio: () => api.get<PortfolioOverview>("/portfolio/me"),
  updatePrivacy: (data: { visibility: PortfolioVisibility }) =>
    api.put<PortfolioPrivacySettings>("/portfolio/privacy", data),
  regenerateLink: () =>
    api.post<PortfolioPrivacySettings>("/portfolio/privacy/regenerate"),
  getPublicPortfolio: (params: { slug: string; accessKey?: string }) =>
    api.get<PublicPortfolio>("/portfolio/public", {
      params: {
        slug: params.slug,
        access: params.accessKey,
      },
    }),
  getPublicProject: (params: {
    slug: string;
    projectCode: string;
    accessKey?: string;
  }) =>
    api.get<PublicPortfolioProject>("/portfolio/public/project", {
      params: {
        slug: params.slug,
        projectCode: params.projectCode,
        access: params.accessKey,
      },
    }),
};

export const searchApi = {
  search: (query: string) =>
    api.get<SearchResult[]>("/search", { params: { q: query } }),
};

export default api;
