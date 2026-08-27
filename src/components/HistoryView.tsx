import React, { useState, useMemo } from "react";
import {
  Search,
  Calendar,
  Tag,
  Smile,
  ArrowRight,
  Trash2,
  BookOpen,
  Filter,
  Sparkles,
  Plus
} from "lucide-react";
import { Journal, JournalMood, JournalTopic } from "../types";

interface HistoryViewProps {
  journals: Journal[];
  onOpenJournal: (journalId: string) => void;
  onDeleteJournal: (journalId: string) => void;
  onNewJournal: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  journals,
  onOpenJournal,
  onDeleteJournal,
  onNewJournal
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMood, setSelectedMood] = useState<string>("All");
  const [selectedTopic, setSelectedTopic] = useState<string>("All");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const moods: string[] = [
    "All",
    "Reflective",
    "Calm",
    "Excited",
    "Worried",
    "Frustrated",
    "Confused",
    "Happy",
    "Neutral"
  ];

  const topics: string[] = [
    "All",
    "Career",
    "Studies",
    "Relationships",
    "Goals",
    "Ideas",
    "Future",
    "Personal",
    "Wellbeing",
    "Creativity"
  ];

  const filteredJournals = useMemo(() => {
    return journals
      .filter((journal) => {
        // Search matching
        const matchesQuery =
          searchQuery.trim() === "" ||
          journal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          journal.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          journal.keyInsight?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (journal.topics || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

        // Mood matching
        const matchesMood = selectedMood === "All" || journal.mood === selectedMood;

        // Topic matching
        const matchesTopic =
          selectedTopic === "All" || (journal.topics || []).includes(selectedTopic as JournalTopic);

        return matchesQuery && matchesMood && matchesTopic;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
      });
  }, [journals, searchQuery, selectedMood, selectedTopic, sortOrder]);

  const getMoodBadge = (mood: string) => {
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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight">
            Reflection History
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Browse and continue your private personal reflections ({journals.length} total).
          </p>
        </div>

        <button
          onClick={onNewJournal}
          className="flex items-center space-x-2 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-medium text-white shadow-xs hover:bg-stone-800 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Reflection</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your reflections by topic, thought, or title..."
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 pl-10 pr-4 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-stone-400 focus:bg-white transition"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2 w-full md:w-auto justify-between md:justify-end">
            <select
              value={selectedMood}
              onChange={(e) => setSelectedMood(e.target.value)}
              className="rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-xs font-medium text-stone-700 focus:outline-hidden focus:ring-2 focus:ring-stone-400"
            >
              {moods.map((m) => (
                <option key={m} value={m}>
                  Mood: {m}
                </option>
              ))}
            </select>

            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-xs font-medium text-stone-700 focus:outline-hidden focus:ring-2 focus:ring-stone-400"
            >
              {topics.map((t) => (
                <option key={t} value={t}>
                  Topic: {t}
                </option>
              ))}
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-xs font-medium text-stone-700 focus:outline-hidden focus:ring-2 focus:ring-stone-400"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>
      </div>

      {/* Journals Grid */}
      {filteredJournals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white/70 p-12 text-center space-y-3">
          <BookOpen className="h-10 w-10 text-stone-400 mx-auto" />
          <h3 className="text-sm font-semibold text-stone-900">No reflections found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {searchQuery || selectedMood !== "All" || selectedTopic !== "All"
              ? "Try adjusting your search terms or filters."
              : "You haven't created any journal entries yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJournals.map((journal) => (
            <div
              key={journal.id}
              className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs hover:border-stone-300 hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${getMoodBadge(
                      journal.mood
                    )}`}
                  >
                    {journal.mood || "Reflective"}
                  </span>
                  <span className="text-[11px] text-stone-400 flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(journal.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </span>
                  </span>
                </div>

                <h3 className="text-base font-semibold text-stone-900 leading-snug">
                  {journal.title}
                </h3>

                <p className="mt-2 text-xs text-stone-600 line-clamp-3 leading-relaxed">
                  {journal.summary || journal.lastMessagePreview || "Private reflection session."}
                </p>

                {journal.keyInsight && (
                  <div className="mt-3 p-2.5 rounded-xl bg-stone-50 border border-stone-100 text-[11px] text-stone-700 flex items-start space-x-1.5">
                    <Sparkles className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                    <span>&ldquo;{journal.keyInsight}&rdquo;</span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1">
                  {(journal.topics || []).map((t, idx) => (
                    <span
                      key={idx}
                      className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md text-[10px]"
                    >
                      #{t}
                    </span>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onDeleteJournal(journal.id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition"
                    title="Delete reflection"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => onOpenJournal(journal.id)}
                    className="flex items-center space-x-1 rounded-xl bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-800 transition"
                  >
                    <span>Continue</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
