export interface StoredUser {
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
  hasCompletedOnboarding?: boolean;
  learningGoal?: string;
  skillLevel?: string;
  weeklyDays?: number;
  dailyMinutes?: number;
  preferredLanguage?: "ar" | "en";
  emailConfirmed?: boolean;
  createdAt?: string;
  emailVerificationDeadline?: string;
}

interface StoredAuth {
  user: StoredUser;
  mode: "session" | "local";
}

const AUTH_VERSION = "5";
const USER_KEY = "uxfriends_user";
const VERSION_KEY = "uxfriends_auth_version";
const REMEMBERED_EMAIL_KEY = "uxfriends_remembered_email";

function getAvailableStorages(): Storage[] {
  if (typeof window === "undefined") {
    return [];
  }

  return [window.sessionStorage, window.localStorage];
}

function readFromStorage(
  storage: Storage,
  mode: "session" | "local",
): StoredAuth | null {
  if (storage.getItem(VERSION_KEY) !== AUTH_VERSION) {
    return null;
  }

  const userJson = storage.getItem(USER_KEY);
  if (!userJson) {
    return null;
  }

  try {
    return {
      user: JSON.parse(userJson) as StoredUser,
      mode,
    };
  } catch {
    return null;
  }
}

export function clearStoredAuth() {
  getAvailableStorages().forEach((storage) => {
    storage.removeItem(USER_KEY);
    storage.removeItem(VERSION_KEY);
  });
}

export function persistStoredAuth(user: StoredUser, remember = false) {
  clearStoredAuth();

  const targetStorage =
    typeof window === "undefined"
      ? null
      : remember
        ? window.localStorage
        : window.sessionStorage;

  if (!targetStorage) {
    return;
  }

  targetStorage.setItem(USER_KEY, JSON.stringify(user));
  targetStorage.setItem(VERSION_KEY, AUTH_VERSION);
}

export function getStoredAuth(): StoredAuth | null {
  const storages: Array<{ storage: Storage; mode: "session" | "local" }> =
    typeof window === "undefined"
      ? []
      : [
          { storage: window.sessionStorage, mode: "session" },
          { storage: window.localStorage, mode: "local" },
        ];

  for (const { storage, mode } of storages) {
    const stored = readFromStorage(storage, mode);
    if (stored) {
      return stored;
    }
  }

  // Clear stale auth saved by older app versions.
  if (
    storages.some(
      ({ storage }) => storage.getItem(USER_KEY),
    )
  ) {
    clearStoredAuth();
  }

  return null;
}
export function persistRememberedLogin(email: string, remember: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  if (!remember) {
    window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    return;
  }

  window.localStorage.setItem(REMEMBERED_EMAIL_KEY, normalizedEmail);
}

export function getRememberedLogin() {
  if (typeof window === "undefined") {
    return null;
  }

  const email = window.localStorage.getItem(REMEMBERED_EMAIL_KEY);
  if (!email) {
    return null;
  }

  return {
    email,
    rememberMe: true,
  };
}
