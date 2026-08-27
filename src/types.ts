export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  lastLoginAt: string;
  streakCount: number;
  totalJournals: number;
}

export type JournalMood =
  | "Reflective"
  | "Calm"
  | "Excited"
  | "Worried"
  | "Frustrated"
  | "Confused"
  | "Happy"
  | "Neutral";

export type JournalTopic =
  | "Career"
  | "Studies"
  | "Relationships"
  | "Goals"
  | "Ideas"
  | "Future"
  | "Personal"
  | "Wellbeing"
  | "Creativity";

export interface JournalMessage {
  id: string;
  journalId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  actionType?: "reflect" | "summarize" | "brainstorm" | "action_plan" | "deeper_question";
}

export interface Journal {
  id: string;
  userId: string;
  title: string;
  summary: string;
  mood: JournalMood;
  topics: JournalTopic[];
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessagePreview?: string;
  keyInsight?: string;
}

export interface ReflectionEvolution {
  id: string;
  userId: string;
  timestamp: string;
  comparedJournalIds: string[];
  theme: string;
  earlierSummary: string;
  earlierQuote: string;
  recentSummary: string;
  recentQuote: string;
  shiftSummary: string;
  geminiObservation: string;
  followUpPrompts: string[];
}

export interface DailyPrompt {
  prompt: string;
  category: string;
}
