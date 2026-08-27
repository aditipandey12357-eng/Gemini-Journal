import React from "react";
import {
  Sparkles,
  Plus,
  BookOpen,
  GitBranch,
  Flame,
  Clock,
  ArrowRight,
  TrendingUp,
  Tag,
  Smile,
  ShieldAlert
} from "lucide-react";
import { User } from "firebase/auth";
import { Journal, DailyPrompt, UserProfile } from "../types";

interface DashboardViewProps {
  user: User;
  profile: UserProfile | null;
  journals: Journal[];
  dailyPrompt: DailyPrompt;
  onNewJournalWithPrompt: (promptText: string) => void;
  onOpenJournal: (journalId: string) => void;
  onNavigateTab: (tab: "journal" | "evolution" | "history" | "security") => void;
  onNewJournal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  profile,
  journals,
  dailyPrompt,
  onNewJournalWithPrompt,
  onOpenJournal,
  onNavigateTab,
  onNewJournal
}) => {
  const firstName = user.displayName?.split(" ")[0] || "Explorer";

  // Calculate statistics
  const totalJournals = journals.length;
  const topicsMap: Record<string, number> = {};
  journals.forEach((j) => {
    (j.topics || []).forEach((topic) => {
      topicsMap[topic] = (topicsMap[topic] || 0) + 1;
    });
  });

  const topTopic = Object.entries(topicsMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "Personal Growth";
  const recentJournals = journals.slice(0, 4);

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case "Calm":
        return "bg-teal-50 text-teal-700 border-teal-200";
      case "Excited":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Happy":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Worried":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Frustrated":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "Confused":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-stone-100 text-stone-700 border-stone-200";
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight">
              Welcome back, {firstName}
            </h1>
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
              Private Journal
            </span>
          </div>
          <p className="mt-1 text-sm text-stone-500">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} &bull; Your space for private, thoughtful reflection.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="dash-new-reflection-btn"
            onClick={onNewJournal}
            className="flex items-center space-x-2 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-medium text-white shadow-xs hover:bg-stone-800 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Reflection</span>
          </button>
        </div>
      </div>

      {/* Hero Daily Reflection Prompt Card */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/70 via-stone-50 to-orange-50/40 p-6 sm:p-8 shadow-xs">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2 text-amber-800 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <span>Today's Reflection Prompt &bull; {dailyPrompt.category || "Perspective"}</span>
          </div>
          <span className="text-[11px] text-stone-400 font-medium hidden sm:inline">Daily curated thought</span>
        </div>

        <p className="mt-4 text-lg sm:text-xl font-medium text-stone-900 leading-relaxed font-serif">
          &ldquo;{dailyPrompt.prompt}&rdquo;
        </p>

        <div className="mt-6 flex items-center space-x-4">
          <button
            id="start-daily-reflection-btn"
            onClick={() => onNewJournalWithPrompt(dailyPrompt.prompt)}
            className="flex items-center space-x-2 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-medium text-white shadow-xs hover:bg-stone-800 transition cursor-pointer"
          >
            <span>Start Reflecting on This</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Stats & Journey Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-stone-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium">Writing Streak</span>
            <Flame className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-stone-900">
            {profile?.streakCount || (totalJournals > 0 ? 1 : 0)} <span className="text-xs font-normal text-stone-500">days</span>
          </div>
          <p className="mt-1 text-[11px] text-stone-400">Consistent daily mindfulness</p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium">Total Reflections</span>
            <BookOpen className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-stone-900">{totalJournals}</div>
          <p className="mt-1 text-[11px] text-stone-400">All user-isolated & private</p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium">Most Discussed Topic</span>
            <Tag className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-lg font-semibold text-stone-900 truncate">{topTopic}</div>
          <p className="mt-1 text-[11px] text-stone-400">Key focus area</p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium">Reflection Evolution</span>
            <GitBranch className="h-4 w-4 text-emerald-600" />
          </div>
          <button
            onClick={() => onNavigateTab("evolution")}
            className="mt-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
          >
            <span>Analyze shifts &rarr;</span>
          </button>
          <p className="mt-1 text-[11px] text-stone-400">Earlier vs Recent mindset</p>
        </div>
      </div>

      {/* Main Grid: Recent Reflections & Evolution Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recent Journals */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-stone-900 flex items-center space-x-2">
              <Clock className="h-4 w-4 text-stone-500" />
              <span>Recent Journal Conversations</span>
            </h2>
            {journals.length > 0 && (
              <button
                onClick={() => onNavigateTab("history")}
                className="text-xs font-medium text-stone-600 hover:text-stone-900 transition flex items-center space-x-1"
              >
                <span>View all ({totalJournals})</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {recentJournals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 p-8 text-center">
              <BookOpen className="h-8 w-8 text-stone-400 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-stone-900">Your journal is waiting</h3>
              <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto">
                Begin your first private conversation with Gemini. Write what's on your mind, explore feelings, or brainstorm decisions.
              </p>
              <button
                onClick={onNewJournal}
                className="mt-4 inline-flex items-center space-x-2 rounded-xl bg-stone-900 px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-stone-800 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Start Your First Reflection</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentJournals.map((journal) => (
                <div
                  key={journal.id}
                  onClick={() => onOpenJournal(journal.id)}
                  className="group rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xs hover:shadow-md hover:border-stone-300 transition cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${getMoodColor(journal.mood)}`}>
                        {journal.mood || "Reflective"}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {new Date(journal.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-stone-900 group-hover:text-stone-800 line-clamp-1">
                      {journal.title}
                    </h3>
                    <p className="mt-2 text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      {journal.summary || journal.lastMessagePreview || "Private reflection session."}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                    <div className="flex items-center space-x-1">
                      {(journal.topics || []).slice(0, 2).map((t, idx) => (
                        <span key={idx} className="bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded text-[10px]">
                          #{t}
                        </span>
                      ))}
                    </div>
                    <span className="group-hover:translate-x-0.5 transition font-medium text-stone-800 flex items-center space-x-1">
                      <span>Open</span>
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Reflection Evolution Spotlight & Security Callout */}
        <div className="space-y-6">
          {/* Evolution Feature Card */}
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 p-6 shadow-xs relative">
            <div className="flex items-center space-x-2 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-2">
              <GitBranch className="h-4 w-4 text-emerald-600" />
              <span>Reflection Evolution</span>
            </div>
            <h3 className="text-base font-semibold text-stone-900">How has your thinking changed?</h3>
            <p className="mt-2 text-xs text-stone-600 leading-relaxed">
              Compare your earlier thoughts with recent reflections to uncover shifts in confidence, priorities, and mindset over time.
            </p>

            <div className="mt-4 p-3 bg-white/90 rounded-xl border border-emerald-100 text-xs space-y-1.5">
              <div className="text-[11px] text-stone-500">Example Mindset Shift:</div>
              <div className="font-medium text-emerald-900 flex items-center space-x-1.5">
                <span className="text-stone-600">Uncertainty</span>
                <span>&rarr;</span>
                <span className="text-emerald-700 font-semibold">Clear Evaluation</span>
              </div>
            </div>

            <button
              id="dash-explore-evolution-btn"
              onClick={() => onNavigateTab("evolution")}
              className="mt-4 w-full flex items-center justify-center space-x-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-medium text-white shadow-xs hover:bg-emerald-900 transition"
            >
              <span>Explore My Evolution</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Security & Isolation Status Box */}
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 text-xs text-stone-700 space-y-2">
            <div className="font-semibold text-stone-900 flex items-center space-x-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-indigo-600" />
              <span>Strict Ownership Security</span>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              All journal messages are stored in your private path (<code className="bg-stone-200/70 px-1 py-0.5 rounded text-[10px]">users/{user.uid.slice(0, 6)}...</code>). User A cannot query or read User B's entries.
            </p>
            <button
              onClick={() => onNavigateTab("security")}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition block"
            >
              Inspect Security Controls &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
