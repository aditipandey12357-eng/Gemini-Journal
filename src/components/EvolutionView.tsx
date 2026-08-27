import React, { useState, useEffect } from "react";
import {
  GitBranch,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRightCircle,
  HelpCircle,
  BookOpen
} from "lucide-react";
import { User } from "firebase/auth";
import { Journal, ReflectionEvolution } from "../types";
import { getUserEvolutions, saveEvolutionInsight, getJournalMessages } from "../lib/journalService";
import { analyzeReflectionEvolution } from "../lib/geminiApi";

interface EvolutionViewProps {
  user: User;
  journals: Journal[];
  onStartReflectionWithPrompt: (prompt: string) => void;
}

export const EvolutionView: React.FC<EvolutionViewProps> = ({
  user,
  journals,
  onStartReflectionWithPrompt
}) => {
  const [evolutions, setEvolutions] = useState<ReflectionEvolution[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<ReflectionEvolution | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>("All Topics");
  const [error, setError] = useState<string | null>(null);

  // Load saved evolutions from Firestore
  useEffect(() => {
    let isMounted = true;
    const fetchEvolutions = async () => {
      try {
        const saved = await getUserEvolutions(user.uid);
        if (isMounted) {
          setEvolutions(saved);
          if (saved.length > 0) {
            setCurrentAnalysis(saved[0]);
          }
        }
      } catch (err) {
        console.error("Error loading evolution history:", err);
      }
    };

    fetchEvolutions();
    return () => {
      isMounted = false;
    };
  }, [user.uid]);

  // Run Reflection Evolution comparison
  const handleGenerateEvolution = async () => {
    if (journals.length < 2) {
      setError("Please write at least 2 journal entries to compare how your thinking has evolved.");
      return;
    }

    setError(null);
    setIsAnalyzing(true);

    try {
      // Sort journals chronologically (oldest first)
      const sorted = [...journals].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      const splitIndex = Math.max(1, Math.floor(sorted.length / 2));
      const earlierList = sorted.slice(0, splitIndex);
      const recentList = sorted.slice(splitIndex);

      // Fetch preview messages for richer context
      const earlierWithMsgs = await Promise.all(
        earlierList.slice(0, 3).map(async (j) => {
          const msgs = await getJournalMessages(user.uid, j.id);
          return {
            title: j.title,
            summary: j.summary,
            date: new Date(j.createdAt).toLocaleDateString(),
            topics: j.topics,
            messages: msgs.slice(0, 4)
          };
        })
      );

      const recentWithMsgs = await Promise.all(
        recentList.slice(-3).map(async (j) => {
          const msgs = await getJournalMessages(user.uid, j.id);
          return {
            title: j.title,
            summary: j.summary,
            date: new Date(j.createdAt).toLocaleDateString(),
            topics: j.topics,
            messages: msgs.slice(0, 4)
          };
        })
      );

      const result = await analyzeReflectionEvolution(
        earlierWithMsgs,
        recentWithMsgs,
        selectedTopic !== "All Topics" ? selectedTopic : undefined
      );

      // Persist to user-isolated Firestore
      const saved = await saveEvolutionInsight(user.uid, {
        comparedJournalIds: [...earlierList.map((j) => j.id), ...recentList.map((j) => j.id)],
        theme: result.theme,
        earlierSummary: result.earlierSummary,
        earlierQuote: result.earlierQuote,
        recentSummary: result.recentSummary,
        recentQuote: result.recentQuote,
        shiftSummary: result.shiftSummary,
        geminiObservation: result.geminiObservation,
        followUpPrompts: result.followUpPrompts
      });

      setCurrentAnalysis(saved);
      setEvolutions([saved, ...evolutions]);
    } catch (err: any) {
      console.error("Error analyzing reflection evolution:", err);
      setError(err?.message || "Failed to analyze reflection evolution. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Distinct topics available from user's journals
  const availableTopics = [
    "All Topics",
    ...Array.from(new Set(journals.flatMap((j) => j.topics || [])))
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <GitBranch className="h-4 w-4" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight">
              🌱 Reflection Evolution
            </h1>
          </div>
          <p className="mt-1 text-sm text-stone-600">
            Discover how your thoughts, concerns, and priorities have changed over time.
          </p>
        </div>

        {/* Generate / Refresh Action */}
        <div className="flex items-center space-x-3">
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
          >
            {availableTopics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <button
            id="analyze-evolution-btn"
            onClick={handleGenerateEvolution}
            disabled={isAnalyzing}
            className="flex items-center space-x-2 rounded-xl bg-emerald-800 px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-emerald-900 transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
            <span>{isAnalyzing ? "Analyzing Mindset Shifts..." : "Analyze Thinking Changes"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-stone-500 hover:text-stone-800 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Evolution View */}
      {currentAnalysis ? (
        <div className="space-y-8">
          {/* Headline Observation Card */}
          <div className="rounded-3xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/60 p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100/80 pb-4 mb-6">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                  Mindset Evolution Track &bull; {currentAnalysis.theme}
                </span>
              </div>
              <span className="text-xs text-stone-400">
                {new Date(currentAnalysis.timestamp).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                })}
              </span>
            </div>

            {/* Side-by-Side Comparison: Earlier vs. Now */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
              {/* Earlier Reflection State */}
              <div className="rounded-2xl border border-stone-200 bg-white/90 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                    <span>⏳ Earlier Reflection</span>
                  </div>
                  <blockquote className="text-sm font-medium text-stone-800 italic font-serif leading-relaxed">
                    &ldquo;{currentAnalysis.earlierQuote}&rdquo;
                  </blockquote>
                  <p className="mt-3 text-xs text-stone-600 leading-relaxed">
                    {currentAnalysis.earlierSummary}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-stone-400">
                  Initial baseline perspective
                </div>
              </div>

              {/* Recent Reflection State */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-2">
                    <span>🌱 More Recent Reflection</span>
                  </div>
                  <blockquote className="text-sm font-medium text-emerald-950 italic font-serif leading-relaxed">
                    &ldquo;{currentAnalysis.recentQuote}&rdquo;
                  </blockquote>
                  <p className="mt-3 text-xs text-stone-700 leading-relaxed">
                    {currentAnalysis.recentSummary}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-emerald-200/60 text-[11px] text-emerald-800 font-medium">
                  Current focus & evaluation
                </div>
              </div>
            </div>

            {/* Shift Descriptor Badge */}
            <div className="my-6 flex justify-center">
              <div className="inline-flex items-center space-x-3 rounded-full bg-stone-900 text-white px-5 py-2 text-xs font-medium shadow-sm">
                <span className="text-stone-300">Progression:</span>
                <span className="font-semibold text-amber-300">{currentAnalysis.shiftSummary}</span>
              </div>
            </div>

            {/* Gemini's Empathetic Observation */}
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
              <div className="flex items-center space-x-2 text-xs font-semibold text-stone-800 mb-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Gemini's Observation</span>
              </div>
              <p className="text-sm sm:text-base text-stone-700 leading-relaxed font-serif">
                &ldquo;{currentAnalysis.geminiObservation}&rdquo;
              </p>
              <div className="mt-3 text-[11px] text-stone-400">
                AI reflection based purely on your authenticated private entries &bull; Non-diagnostic
              </div>
            </div>

            {/* Follow-up Exploration Prompts */}
            <div className="mt-6">
              <h3 className="text-xs font-semibold text-stone-700 uppercase tracking-wider mb-3">
                Explore Your Next Step
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(currentAnalysis.followUpPrompts || []).map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => onStartReflectionWithPrompt(prompt)}
                    className="p-4 rounded-xl border border-emerald-200/80 bg-white/90 hover:bg-emerald-50/70 hover:border-emerald-300 text-left transition shadow-xs group flex flex-col justify-between"
                  >
                    <span className="text-xs font-medium text-stone-800 group-hover:text-emerald-900 leading-relaxed">
                      {prompt}
                    </span>
                    <span className="mt-3 text-[11px] font-semibold text-emerald-700 flex items-center space-x-1">
                      <span>Reflect on this</span>
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Historical Evolution Timeline / Past Insights */}
          {evolutions.length > 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-stone-900 flex items-center space-x-2">
                <Clock className="h-4 w-4 text-stone-500" />
                <span>Past Evolution Insights</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {evolutions.slice(1).map((evo) => (
                  <div
                    key={evo.id}
                    onClick={() => setCurrentAnalysis(evo)}
                    className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs hover:border-stone-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-stone-400 mb-2">
                        <span className="font-semibold text-stone-800">{evo.theme}</span>
                        <span>{new Date(evo.timestamp).toLocaleDateString()}</span>
                      </div>
                      <div className="text-xs font-medium text-emerald-800 mb-2">
                        {evo.shiftSummary}
                      </div>
                      <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                        {evo.geminiObservation}
                      </p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-stone-100 text-[11px] text-stone-500 font-medium flex items-center justify-between">
                      <span>View Analysis</span>
                      <ArrowRight className="h-3 w-3 text-stone-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-3xl border border-dashed border-stone-300 bg-white/70 p-12 text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
            <GitBranch className="h-7 w-7" />
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-stone-900">
            Discover how your thinking changes over time
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
            As you write journal entries, the Reflection Evolution engine will compare earlier and recent reflections to uncover your growth in clarity, confidence, and purpose.
          </p>

          <button
            onClick={handleGenerateEvolution}
            disabled={isAnalyzing}
            className="inline-flex items-center space-x-2 rounded-xl bg-emerald-800 px-5 py-2.5 text-xs font-medium text-white shadow-xs hover:bg-emerald-900 transition disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4 text-emerald-200" />
            <span>{isAnalyzing ? "Analyzing Mindset Shifts..." : "Analyze My Reflections"}</span>
          </button>
        </div>
      )}
    </div>
  );
};
