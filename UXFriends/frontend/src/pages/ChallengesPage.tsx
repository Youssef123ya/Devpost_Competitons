import { ChallengesHubPage } from "./challenges/ChallengesHubPage";

interface ChallengesPageProps {
  onNavigate?: (page: string, context?: Record<string, unknown>) => void;
  language?: "ar" | "en";
}

export function ChallengesPage({
  onNavigate,
  language = "ar",
}: ChallengesPageProps) {
  return (
    <ChallengesHubPage
      onNavigate={onNavigate ?? (() => undefined)}
      language={language}
    />
  );
}
