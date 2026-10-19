export interface OnboardingUserState {
  hasCompletedOnboarding?: boolean;
}

export function getPendingOnboardingPage(user?: OnboardingUserState | null) {
  return user?.hasCompletedOnboarding ? null : "onboarding-welcome";
}
