import { createContext, useCallback, useContext, useEffect, useState } from "react";
import axios from "axios";
import type { AxiosError } from "axios";
import {
  clearStoredAuth,
  getStoredAuth,
  persistRememberedLogin,
  persistStoredAuth,
  type StoredUser,
} from "../utils/authStorage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5176/api";
axios.defaults.withCredentials = true;

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  level: number;
  totalXP: number;
  currentXP: number;
  nextLevelXP: number;
  currentStreak: number;
  longestStreak: number;
  coins: number;
  lessonsCompleted: number;
  projectsCompleted: number;
  challengesWon: number;
  avatar?: string;

  // ✅ Onboarding data
  hasCompletedOnboarding?: boolean;
  learningGoal?: string; // "basics", "ui", "ux", "career"
  skillLevel?: string; // "beginner", "intermediate", "advanced"
  weeklyDays?: number; // 3, 5, 7
  dailyMinutes?: number; // 15, 30, 60
  preferredLanguage?: "ar" | "en";
  emailConfirmed?: boolean;
  createdAt?: string;
  emailVerificationDeadline?: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  age?: number;
  preferredLanguage?: "ar" | "en";
}

export interface ExternalAuthProviders {
  google: boolean;
  github: boolean;
}

export interface PlacementAssessmentResult {
  assignedLevel: "beginner" | "intermediate" | "advanced";
  scorePercent: number;
  correctAnswers: number;
  totalQuestions: number;
  user?: User;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (
    data: RegisterData,
    rememberMe?: boolean,
  ) => Promise<{
    success: boolean;
    user?: User;
    error?: string;
    verificationEmailSent?: boolean;
    developmentVerificationUrl?: string | null;
  }>;
  logout: () => void;
  clearError: () => void;
  startFromScratch: () => Promise<{ success: boolean; user?: User; error?: string }>;
  submitPlacementAssessment: (
    answers: Record<string, number>,
  ) => Promise<{ success: boolean; result?: PlacementAssessmentResult; error?: string }>;
  updatePreferredLanguage: (
    preferredLanguage: "ar" | "en",
  ) => Promise<{ success: boolean; user?: User; error?: string }>;
  loginWithExternalCode: (
    provider: "google" | "github",
    code: string,
    rememberMe?: boolean,
  ) => Promise<{ success: boolean; user?: User; error?: string }>;
  getExternalProviders: () => Promise<ExternalAuthProviders>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthResponse {
  user?: Partial<User>;
  verificationEmailSent?: boolean;
  developmentVerificationUrl?: string | null;
}

function normalizeUser(
  userData: Partial<User> | undefined,
  fallback?: Partial<RegisterData>,
): StoredUser {
  return {
    id: userData?.id ?? "",
    firstName: userData?.firstName ?? fallback?.firstName ?? "",
    lastName: userData?.lastName ?? fallback?.lastName ?? "",
    email: userData?.email ?? fallback?.email ?? "",
    level: userData?.level ?? 1,
    totalXP: userData?.totalXP ?? 0,
    currentXP: userData?.currentXP ?? 0,
    nextLevelXP: userData?.nextLevelXP ?? 1000,
    currentStreak: userData?.currentStreak ?? 0,
    longestStreak: userData?.longestStreak ?? 0,
    coins: userData?.coins ?? 0,
    lessonsCompleted: userData?.lessonsCompleted ?? 0,
    projectsCompleted: userData?.projectsCompleted ?? 0,
    challengesWon: userData?.challengesWon ?? 0,
    avatar: userData?.avatar,
    hasCompletedOnboarding: userData?.hasCompletedOnboarding ?? false,
    learningGoal: userData?.learningGoal,
    skillLevel: userData?.skillLevel,
    weeklyDays: userData?.weeklyDays,
    dailyMinutes: userData?.dailyMinutes,
    preferredLanguage:
      userData?.preferredLanguage === "en" ? "en" : "ar",
    emailConfirmed: userData?.emailConfirmed ?? false,
    createdAt: userData?.createdAt,
    emailVerificationDeadline: userData?.emailVerificationDeadline,
  };
}

function getApiErrorMessage(
  error: unknown,
  defaultMessage: string,
  overrides?: {
    unauthorized?: string;
    conflict?: string;
    offline?: string;
  },
) {
  if (axios.isAxiosError(error)) {
    const apiError = error as AxiosError<{ message?: string }>;

    if (apiError.response?.data?.message) {
      return apiError.response.data.message;
    }

    if (apiError.response?.status === 401 && overrides?.unauthorized) {
      return overrides.unauthorized;
    }

    if (apiError.response?.status === 409 && overrides?.conflict) {
      return overrides.conflict;
    }

    if (!apiError.response && overrides?.offline) {
      return overrides.offline;
    }
  }

  return defaultMessage;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [initialAuth] = useState(getStoredAuth);
  const [user, setUser] = useState<User | null>(initialAuth?.user ?? null);
  const [loading, setLoading] = useState(false);
  const [rememberSession, setRememberSession] = useState(
    initialAuth?.mode === "local",
  );
  const [error, setError] = useState<string | null>(null);

  const applyAuthenticatedSession = useCallback((nextUser: StoredUser, rememberMe: boolean) => {
    setRememberSession(rememberMe);
    persistStoredAuth(nextUser, rememberMe);
    persistRememberedLogin(nextUser.email, rememberMe);
    setUser(nextUser);
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    const response = await axios.get<{ user: Partial<User> }>(`${API_URL}/auth/me`);
    return normalizeUser(response.data.user);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user) {
      return null;
    }

    const refreshedUser = await fetchCurrentUser();
    setUser(refreshedUser);
    persistStoredAuth(refreshedUser, rememberSession);

    return refreshedUser;
  }, [fetchCurrentUser, rememberSession, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let isCancelled = false;

    const restoreAuthenticatedSession = async () => {
      try {
        const refreshedUser = await fetchCurrentUser();
        if (isCancelled) {
          return;
        }

        setUser(refreshedUser);
        persistStoredAuth(refreshedUser, rememberSession);
      } catch (requestError: unknown) {
        if (isCancelled) {
          return;
        }

        if (axios.isAxiosError(requestError)) {
          console.warn("Failed to restore authenticated session", requestError);
        }

        clearStoredAuth();
        setUser(null);
        setRememberSession(false);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    void restoreAuthenticatedSession();

    return () => {
      isCancelled = true;
    };
  }, [fetchCurrentUser, rememberSession, user]);

  const login = async (email: string, password: string, rememberMe = false) => {
    try {
      setError(null);
      const response = await axios.post<AuthResponse>(`${API_URL}/auth/login`, {
        email,
        password,
        rememberMe,
      });

      const normalizedUser = normalizeUser(response.data.user, { email });
      applyAuthenticatedSession(normalizedUser, rememberMe);

      return { success: true, user: normalizedUser };
    } catch (requestError: unknown) {
      const message = getApiErrorMessage(requestError, "Login failed. Please check your credentials.", {
        unauthorized: "Invalid email or password.",
        offline: "Cannot connect to server.",
      });
      setError(message);
      return { success: false, error: message };
    }
  };

  const register = async (data: RegisterData, rememberMe = false) => {
    try {
      setError(null);
      const response = await axios.post<AuthResponse>(`${API_URL}/auth/register`, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        age: data.age || 18,
        preferredLanguage: data.preferredLanguage,
        rememberMe,
      });

      const normalizedUser = normalizeUser(response.data.user, data);
      applyAuthenticatedSession(normalizedUser, rememberMe);

      return {
        success: true,
        user: normalizedUser,
        verificationEmailSent: response.data.verificationEmailSent ?? false,
        developmentVerificationUrl: response.data.developmentVerificationUrl ?? null,
      };
    } catch (requestError: unknown) {
      const message = getApiErrorMessage(requestError, "Registration failed. Please try again.", {
        conflict: "This email is already registered.",
        offline: "Cannot connect to server.",
      });
      setError(message);
      return { success: false, error: message };
    }
  };

  const startFromScratch = async () => {
    try {
      const response = await axios.post<{ user?: Partial<User> }>(
        `${API_URL}/auth/onboarding/start-from-scratch`,
      );

      if (user) {
        const updatedUser = normalizeUser(response.data.user, user);
        setUser(updatedUser);
        persistStoredAuth(updatedUser, rememberSession);
        return { success: true, user: updatedUser };
      }

      return { success: true };
    } catch (requestError: unknown) {
      const message = getApiErrorMessage(
        requestError,
        "Failed to start your learning path",
      );
      return { success: false, error: message };
    }
  };

  const submitPlacementAssessment = async (answers: Record<string, number>) => {
    try {
      const response = await axios.post<{
        assignedLevel: "beginner" | "intermediate" | "advanced";
        scorePercent: number;
        correctAnswers: number;
        totalQuestions: number;
        user?: Partial<User>;
      }>(
        `${API_URL}/auth/onboarding/assessment/submit`,
        { answers },
      );

      let updatedUser: StoredUser | undefined;

      if (user) {
        updatedUser = normalizeUser(response.data.user, user);
        setUser(updatedUser);
        persistStoredAuth(updatedUser, rememberSession);
      }

      return {
        success: true,
        result: {
          assignedLevel: response.data.assignedLevel,
          scorePercent: response.data.scorePercent,
          correctAnswers: response.data.correctAnswers,
          totalQuestions: response.data.totalQuestions,
          user: updatedUser,
        },
      };
    } catch (requestError: unknown) {
      const message = getApiErrorMessage(
        requestError,
        "Failed to submit the placement assessment",
      );
      return { success: false, error: message };
    }
  };

  const updatePreferredLanguage = async (preferredLanguage: "ar" | "en") => {
    const previousUser = user;

    try {
      if (user) {
        const optimisticUser = normalizeUser(
          {
            ...user,
            preferredLanguage,
          },
          user,
        );
        setUser(optimisticUser);
        persistStoredAuth(optimisticUser, rememberSession);
      }

      const response = await axios.put<{ user?: Partial<User> }>(
        `${API_URL}/users/me/preferences`,
        { preferredLanguage },
      );

      if (user) {
        const updatedUser = normalizeUser(response.data.user, user);
        setUser(updatedUser);
        persistStoredAuth(updatedUser, rememberSession);
        return { success: true, user: updatedUser };
      }

      return { success: true };
    } catch (requestError: unknown) {
      if (previousUser) {
        const revertedUser = normalizeUser(previousUser, previousUser);
        setUser(revertedUser);
        persistStoredAuth(revertedUser, rememberSession);
      }

      const message = getApiErrorMessage(
        requestError,
        "Failed to update preferred language",
      );
      return { success: false, error: message };
    }
  };

  const loginWithExternalCode = async (
    provider: "google" | "github",
    code: string,
    rememberMe = false,
  ) => {
    try {
      setError(null);
      const response = await axios.post<AuthResponse>(
        `${API_URL}/auth/external/${provider}/exchange`,
        { code, rememberMe },
      );

      const normalizedUser = normalizeUser(response.data.user);
      applyAuthenticatedSession(normalizedUser, rememberMe);
      return { success: true, user: normalizedUser };
    } catch (requestError: unknown) {
      const message = getApiErrorMessage(
        requestError,
        "Social sign-in failed. Please try again.",
        {
          offline: "Cannot connect to server.",
        },
      );
      setError(message);
      return { success: false, error: message };
    }
  };

  const getExternalProviders = useCallback(async () => {
    const response = await axios.get<ExternalAuthProviders>(
      `${API_URL}/auth/external/providers`,
    );
    return response.data;
  }, []);

  const logout = () => {
    void axios.post(`${API_URL}/auth/logout`).catch(() => {
      // Best effort only; local cleanup still happens below.
    });
    clearStoredAuth();
    setUser(null);
    setRememberSession(false);
    setLoading(false);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        clearError,
        startFromScratch,
        submitPlacementAssessment,
        updatePreferredLanguage,
        loginWithExternalCode,
        getExternalProviders,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
