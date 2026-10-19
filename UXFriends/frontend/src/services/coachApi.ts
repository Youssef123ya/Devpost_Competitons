import type { AICoachOverview } from "./api";
import { api } from "./api";

export interface CoachMessagePayload {
  role: "user" | "assistant";
  content: string;
}

export interface CoachReply {
  reply: string;
  suggestedActions: string[];
}

export async function requestCoachReply(input: {
  message: string;
  language: "ar" | "en";
  history: CoachMessagePayload[];
  overview: AICoachOverview | null;
}) {
  const response = await api.post<CoachReply>("/ai/coach/chat", input);
  return response.data;
}
