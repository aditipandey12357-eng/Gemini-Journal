import { getCurrentUserToken } from "./firebase";
import { JournalMessage, ReflectionEvolution, DailyPrompt } from "../types";

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getCurrentUserToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token || "anonymous_dev_token"}`
  };
}

export async function sendChatMessage(
  history: { role: string; content: string }[],
  message: string,
  actionType?: JournalMessage["actionType"]
): Promise<string> {
  const headers = await getAuthHeaders();
  const response = await fetch("/api/gemini/chat", {
    method: "POST",
    headers,
    body: JSON.stringify({ history, message, actionType })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server responded with ${response.status}`);
  }

  const data = await response.json();
  return data.reply;
}

export async function generateJournalSummary(
  messages: JournalMessage[],
  currentTitle?: string
): Promise<{
  title: string;
  summary: string;
  mood: any;
  topics: any[];
  keyInsight?: string;
}> {
  const headers = await getAuthHeaders();
  const response = await fetch("/api/gemini/summarize", {
    method: "POST",
    headers,
    body: JSON.stringify({ messages, currentTitle })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to generate journal summary");
  }

  return await response.json();
}

export async function analyzeReflectionEvolution(
  earlierJournals: any[],
  recentJournals: any[],
  focusTopic?: string
): Promise<Omit<ReflectionEvolution, "id" | "userId" | "timestamp">> {
  const headers = await getAuthHeaders();
  const response = await fetch("/api/gemini/evolution", {
    method: "POST",
    headers,
    body: JSON.stringify({ earlierJournals, recentJournals, focusTopic })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to analyze reflection evolution");
  }

  return await response.json();
}

export async function fetchDailyPrompts(): Promise<DailyPrompt[]> {
  try {
    const response = await fetch("/api/gemini/daily-prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    if (response.ok) {
      const data = await response.json();
      return data.prompts || [];
    }
  } catch (err) {
    console.warn("Failed to fetch dynamic daily prompts, using static fallback", err);
  }

  return [
    { prompt: "What is something you've been avoiding thinking about, and what is it asking of you?", category: "Clarity" },
    { prompt: "What brought you unexpected energy or quiet joy today?", category: "Wellbeing" },
    { prompt: "If you treated your current challenge as a curious experiment rather than a test, what would change?", category: "Perspective" }
  ];
}
