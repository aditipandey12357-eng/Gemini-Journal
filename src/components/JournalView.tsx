import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Sparkles,
  RefreshCw,
  Edit2,
  Check,
  Tag,
  Smile,
  Shield,
  HelpCircle,
  Lightbulb,
  ListOrdered,
  FileText,
  Trash2,
  ChevronLeft,
  AlertCircle
} from "lucide-react";
import { User } from "firebase/auth";
import { Journal, JournalMessage } from "../types";
import {
  getJournalMessages,
  addJournalMessage,
  updateJournal,
  deleteJournal
} from "../lib/journalService";
import { sendChatMessage, generateJournalSummary } from "../lib/geminiApi";

interface JournalViewProps {
  user: User;
  journal: Journal;
  onBack: () => void;
  onJournalUpdated: (updated: Journal) => void;
  onJournalDeleted: (journalId: string) => void;
}

export const JournalView: React.FC<JournalViewProps> = ({
  user,
  journal,
  onBack,
  onJournalUpdated,
  onJournalDeleted
}) => {
  const [messages, setMessages] = useState<JournalMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Title edit state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(journal.title);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages on mount or journal change
  useEffect(() => {
    let isMounted = true;
    const fetchMessages = async () => {
      try {
        const msgs = await getJournalMessages(user.uid, journal.id);
        if (isMounted) {
          setMessages(msgs);
        }
      } catch (err: any) {
        console.error("Error loading messages:", err);
        if (isMounted) setError("Failed to load previous messages.");
      }
    };

    fetchMessages();
    return () => {
      isMounted = false;
    };
  }, [user.uid, journal.id]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Handle Save Title
  const handleSaveTitle = async () => {
    if (!titleInput.trim()) return;
    try {
      await updateJournal(user.uid, journal.id, { title: titleInput.trim() });
      onJournalUpdated({ ...journal, title: titleInput.trim() });
      setIsEditingTitle(false);
    } catch (err) {
      console.error("Error updating title:", err);
    }
  };

  // Handle sending a message
  const handleSendMessage = async (customText?: string, actionType?: JournalMessage["actionType"]) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isLoading) return;

    setError(null);
    setInputText("");
    setIsLoading(true);

    try {
      // 1. Optimistically & Defensively persist user message to Firestore
      const userMsg = await addJournalMessage(user.uid, journal.id, {
        role: "user",
        content: textToSend.trim(),
        actionType
      });

      const updatedHistory = [...messages, userMsg];
      setMessages(updatedHistory);

      // 2. Call server-side Gemini API proxy
      const historyPayload = updatedHistory.map((m) => ({
        role: m.role,
        content: m.content
      }));

      const reply = await sendChatMessage(historyPayload, textToSend.trim(), actionType);

      // 3. Persist assistant response to Firestore
      const assistantMsg = await addJournalMessage(user.uid, journal.id, {
        role: "assistant",
        content: reply
      });

      const finalMessages = [...updatedHistory, assistantMsg];
      setMessages(finalMessages);

      // 4. Auto-summarize if we have at least 2 user turns or an explicit action
      if (finalMessages.length >= 4 && finalMessages.length % 2 === 0) {
        triggerAutoSummary(finalMessages);
      }
    } catch (err: any) {
      console.error("Error sending message:", err);
      setError(err?.message || "Something went wrong sending your message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger automatic summarization and topic/mood detection
  const triggerAutoSummary = async (currentMsgs = messages) => {
    if (currentMsgs.length < 2 || isSummarizing) return;
    setIsSummarizing(true);
    try {
      const summaryResult = await generateJournalSummary(currentMsgs, journal.title);
      await updateJournal(user.uid, journal.id, {
        title: summaryResult.title || journal.title,
        summary: summaryResult.summary,
        mood: summaryResult.mood || journal.mood,
        topics: summaryResult.topics || journal.topics,
        keyInsight: summaryResult.keyInsight || ""
      });

      const updated = {
        ...journal,
        title: summaryResult.title || journal.title,
        summary: summaryResult.summary,
        mood: summaryResult.mood || journal.mood,
        topics: summaryResult.topics || journal.topics,
        keyInsight: summaryResult.keyInsight || ""
      };
      onJournalUpdated(updated);
      setTitleInput(updated.title);
    } catch (err) {
      console.warn("Auto-summary failed gracefully:", err);
    } finally {
      setIsSummarizing(false);
    }
  };

  // Handle Delete Journal
  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this reflection? This action cannot be undone.")) {
      try {
        await deleteJournal(user.uid, journal.id);
        onJournalDeleted(journal.id);
      } catch (err) {
        console.error("Error deleting journal:", err);
        setError("Failed to delete journal.");
      }
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 flex flex-col h-[calc(100vh-80px)]">
      {/* Top Header & Context */}
      <div className="border-b border-stone-200 bg-white/70 p-4 rounded-2xl shadow-xs backdrop-blur-xs mb-4">
        <div className="flex items-center justify-between gap-4">
          {/* Back & Title */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 transition"
              title="Back to Dashboard"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex-1 min-w-0">
              {isEditingTitle ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    className="border border-stone-300 rounded-lg px-2.5 py-1 text-sm font-semibold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-stone-400 w-full max-w-md"
                    placeholder="Reflection title..."
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h1 className="text-base sm:text-lg font-semibold text-stone-900 truncate">
                    {journal.title}
                  </h1>
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="text-stone-400 hover:text-stone-700 p-1 rounded"
                    title="Edit title"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Tags & Metadata */}
              <div className="flex items-center space-x-2 mt-1 text-[11px] text-stone-500">
                <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-medium">
                  {journal.mood || "Reflective"}
                </span>
                <span>&bull;</span>
                <span>{(journal.topics || ["Personal"]).join(", ")}</span>
                <span>&bull;</span>
                <span>{new Date(journal.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => triggerAutoSummary()}
              disabled={isSummarizing || messages.length < 2}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-xs font-medium text-stone-700 hover:bg-stone-50 transition disabled:opacity-40"
              title="Generate summary and insights"
            >
              <Sparkles className={`h-3.5 w-3.5 text-amber-500 ${isSummarizing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{isSummarizing ? "Summarizing..." : "Summarize"}</span>
            </button>

            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition"
              title="Delete reflection"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* AI Summary Banner (if exists) */}
        {journal.summary && (
          <div className="mt-3 pt-3 border-t border-stone-100 text-xs text-stone-600 flex items-start space-x-2">
            <span className="font-semibold text-stone-800 shrink-0">Summary:</span>
            <p className="line-clamp-2 leading-relaxed">{journal.summary}</p>
          </div>
        )}
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 px-2 py-4 rounded-2xl bg-stone-50/50 border border-stone-200/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-500 space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-stone-800">Your Private Reflection Companion</h3>
            <p className="text-xs max-w-md leading-relaxed text-stone-600">
              Start by typing whatever is on your mind. You can explore decisions, unpack a challenging thought, or brainstorm creative ideas.
            </p>

            <div className="pt-4 flex flex-wrap justify-center gap-2 max-w-lg">
              <button
                onClick={() => handleSendMessage("I've been thinking about what goals matter most to me this season.", "reflect")}
                className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-stone-700 text-xs hover:border-stone-400 hover:bg-stone-50 transition"
              >
                🌱 &ldquo;What goals matter to me?&rdquo;
              </button>
              <button
                onClick={() => handleSendMessage("I'm weighing a decision and feeling torn between safety and growth.", "reflect")}
                className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-stone-700 text-xs hover:border-stone-400 hover:bg-stone-50 transition"
              >
                ⚖️ &ldquo;Weighing safety vs growth&rdquo;
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  msg.role === "user"
                    ? "bg-stone-900 text-white rounded-br-xs"
                    : "bg-white text-stone-900 border border-stone-200 rounded-bl-xs"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex items-center space-x-1.5 mb-1.5 text-[11px] font-semibold text-amber-700">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Gemini Reflection Companion</span>
                  </div>
                )}

                <div className="whitespace-pre-wrap">{msg.content}</div>

                <div
                  className={`mt-2 text-[10px] ${
                    msg.role === "user" ? "text-stone-400 text-right" : "text-stone-400 text-left"
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-xs bg-white border border-stone-200 p-4 shadow-xs flex items-center space-x-2 text-stone-500 text-xs">
              <Sparkles className="h-4 w-4 text-amber-500 animate-spin" />
              <span>Gemini is reflecting thoughtfully...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Alert */}
      {error && (
        <div className="my-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => handleSendMessage()}
            className="text-xs font-semibold underline hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Quick AI Action Buttons */}
      <div className="py-2 flex items-center space-x-2 overflow-x-auto text-xs no-scrollbar">
        <span className="text-[11px] font-medium text-stone-400 shrink-0">Actions:</span>
        <button
          onClick={() => {
            if (inputText.trim()) handleSendMessage(inputText, "reflect");
            else handleSendMessage("Please offer a gentle reflection on what we've shared so far.", "reflect");
          }}
          disabled={isLoading}
          className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 shrink-0 transition flex items-center space-x-1"
        >
          <Sparkles className="h-3 w-3 text-amber-600" />
          <span>✨ Reflect on this</span>
        </button>

        <button
          onClick={() => {
            if (inputText.trim()) handleSendMessage(inputText, "deeper_question");
            else handleSendMessage("What is a deeper, illuminating question I should ask myself right now?", "deeper_question");
          }}
          disabled={isLoading}
          className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 shrink-0 transition flex items-center space-x-1"
        >
          <HelpCircle className="h-3 w-3 text-indigo-600" />
          <span>❓ Ask deeper question</span>
        </button>

        <button
          onClick={() => {
            if (inputText.trim()) handleSendMessage(inputText, "brainstorm");
            else handleSendMessage("Let's brainstorm a few creative angles or ways forward.", "brainstorm");
          }}
          disabled={isLoading}
          className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 shrink-0 transition flex items-center space-x-1"
        >
          <Lightbulb className="h-3 w-3 text-amber-500" />
          <span>💡 Brainstorm</span>
        </button>

        <button
          onClick={() => {
            if (inputText.trim()) handleSendMessage(inputText, "action_plan");
            else handleSendMessage("Help me outline 2-3 small, low-stress next steps based on this reflection.", "action_plan");
          }}
          disabled={isLoading}
          className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 shrink-0 transition flex items-center space-x-1"
        >
          <ListOrdered className="h-3 w-3 text-emerald-600" />
          <span>🎯 Action Plan</span>
        </button>
      </div>

      {/* Input Box */}
      <div className="pt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center"
        >
          <input
            id="journal-input-field"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Write your thoughts or ask Gemini for reflection..."
            disabled={isLoading}
            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3.5 pr-14 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-stone-400 focus:border-stone-400 shadow-xs"
          />

          <button
            id="send-journal-btn"
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="absolute right-2 flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-white hover:bg-stone-800 transition disabled:opacity-40 cursor-pointer shadow-xs"
            title="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-stone-400 px-1">
          <span>Private reflection session &bull; Press Enter to send</span>
          <span>{messages.length} messages</span>
        </div>
      </div>
    </div>
  );
};
