import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { auth, signInWithGoogle, signOutUser, onAuthStateChanged } from "./lib/firebase";
import { Journal, DailyPrompt, UserProfile } from "./types";
import {
  getUserJournals,
  createJournal,
  syncUserProfile,
  addJournalMessage,
  updateJournal
} from "./lib/journalService";
import { fetchDailyPrompts, sendChatMessage, generateJournalSummary } from "./lib/geminiApi";

import { Navbar } from "./components/Navbar";
import { LandingView } from "./components/LandingView";
import { DashboardView } from "./components/DashboardView";
import { JournalView } from "./components/JournalView";
import { EvolutionView } from "./components/EvolutionView";
import { HistoryView } from "./components/HistoryView";
import { SecurityView } from "./components/SecurityView";
import { ProfileView } from "./components/ProfileView";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // App Navigation
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "journal" | "evolution" | "history" | "security" | "profile"
  >("dashboard");

  // User Data State
  const [journals, setJournals] = useState<Journal[]>([]);
  const [activeJournal, setActiveJournal] = useState<Journal | null>(null);
  const [dailyPrompts, setDailyPrompts] = useState<DailyPrompt[]>([
    {
      prompt: "What is something you've been avoiding thinking about, and what is it trying to tell you?",
      category: "Clarity"
    }
  ]);
  const [isInitializingData, setIsInitializingData] = useState(false);

  // Monitor Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setAuthError(null);
        await loadUserData(currentUser);
      } else {
        setProfile(null);
        setJournals([]);
        setActiveJournal(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch user data from Cloud Firestore
  const loadUserData = async (currentUser: User) => {
    setIsInitializingData(true);
    try {
      // 1. Sync or retrieve profile
      const prof = await syncUserProfile({
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL
      });
      setProfile(prof);

      // 2. Load user's private journals
      const userJournals = await getUserJournals(currentUser.uid);
      setJournals(userJournals);

      // 3. Fetch curated/dynamic daily prompts
      const prompts = await fetchDailyPrompts();
      if (prompts.length > 0) {
        setDailyPrompts(prompts);
      }
    } catch (err: any) {
      console.error("Error loading user data from Firestore:", err);
    } finally {
      setIsInitializingData(false);
    }
  };

  // Sign in handler
  const handleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Google sign in error:", err);
      setAuthError(err?.message || "Failed to sign in with Google. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await signOutUser();
      setActiveTab("dashboard");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  // Start a new blank journal reflection
  const handleNewJournal = async () => {
    if (!user) return;
    try {
      const newJ = await createJournal(user.uid, {
        title: "New Reflection",
        summary: "Private reflection session.",
        mood: "Reflective",
        topics: ["Personal"]
      });
      setJournals([newJ, ...journals]);
      setActiveJournal(newJ);
      setActiveTab("journal");
    } catch (err) {
      console.error("Error creating new reflection:", err);
    }
  };

  // Start a new reflection seeded with a prompt
  const handleNewJournalWithPrompt = async (promptText: string) => {
    if (!user) return;
    try {
      const newJ = await createJournal(user.uid, {
        title: promptText.length > 40 ? promptText.slice(0, 37) + "..." : promptText,
        summary: "Exploring: " + promptText,
        mood: "Reflective",
        topics: ["Personal"]
      });

      // Add user prompt as first message
      await addJournalMessage(user.uid, newJ.id, {
        role: "user",
        content: promptText,
        actionType: "reflect"
      });

      // Prompt Gemini companion for initial reflection
      const initialReply = await sendChatMessage([], promptText, "reflect");
      await addJournalMessage(user.uid, newJ.id, {
        role: "assistant",
        content: initialReply
      });

      // Refresh journal metadata
      const updated = {
        ...newJ,
        lastMessagePreview: promptText.slice(0, 100)
      };
      setJournals([updated, ...journals]);
      setActiveJournal(updated);
      setActiveTab("journal");
    } catch (err) {
      console.error("Error seeding reflection with prompt:", err);
      handleNewJournal();
    }
  };

  // Open existing journal
  const handleOpenJournal = (journalId: string) => {
    const found = journals.find((j) => j.id === journalId);
    if (found) {
      setActiveJournal(found);
      setActiveTab("journal");
    }
  };

  // Journal updated handler
  const handleJournalUpdated = (updated: Journal) => {
    setJournals((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
    if (activeJournal?.id === updated.id) {
      setActiveJournal(updated);
    }
  };

  // Journal deleted handler
  const handleJournalDeleted = (deletedId: string) => {
    setJournals((prev) => prev.filter((j) => j.id !== deletedId));
    if (activeJournal?.id === deletedId) {
      setActiveJournal(null);
      setActiveTab("dashboard");
    }
  };

  // Pre-seed sample journey for demo/judging convenience if needed
  const handleSeedDemoJournals = async () => {
    if (!user) return;
    setIsInitializingData(true);
    try {
      // 1. Earlier Journal (Past uncertainty)
      const pastJournal = await createJournal(user.uid, {
        title: "Career Path Crossroads",
        summary: "You explored whether to pivot into a new creative career, feeling paralyzed by fear of making the wrong choice.",
        mood: "Worried",
        topics: ["Career", "Goals"],
        keyInsight: "Realized the fear of regret was causing inaction."
      });

      await addJournalMessage(user.uid, pastJournal.id, {
        role: "user",
        content: "I've been thinking about changing my career to something more creative, but what if I make the wrong decision?"
      });
      await addJournalMessage(user.uid, pastJournal.id, {
        role: "assistant",
        content: "It is natural to feel hesitation when creative fulfillment and security are in tension. What does making the 'wrong decision' mean to you in concrete terms?"
      });
      await addJournalMessage(user.uid, pastJournal.id, {
        role: "user",
        content: "I'm worried I will lose financial stability and regret leaving my predictable path."
      });
      await addJournalMessage(user.uid, pastJournal.id, {
        role: "assistant",
        content: "That highlights a core value: you care about protecting peace of mind while exploring creative depth. What would a safe, low-risk experiment look like?"
      });

      // 2. Recent Journal (Clarity & Evaluation)
      const recentJournal = await createJournal(user.uid, {
        title: "Evaluating Creative Priorities",
        summary: "You narrowed your options and established three clear criteria to evaluate creative paths without compromising financial runway.",
        mood: "Calm",
        topics: ["Career", "Personal"],
        keyInsight: "Focusing on criteria rather than perfection brought confidence."
      });

      await addJournalMessage(user.uid, recentJournal.id, {
        role: "user",
        content: "I've narrowed down my options and now I know what factors matter most to me: 6 months runway, part-time prototyping, and weekly creative practice."
      });
      await addJournalMessage(user.uid, recentJournal.id, {
        role: "assistant",
        content: "Your approach has become remarkably grounded. Instead of feeling trapped by an all-or-nothing choice, you've designed a clear evaluation framework."
      });

      // Reload list
      const freshJournals = await getUserJournals(user.uid);
      setJournals(freshJournals);
      setActiveTab("evolution");
    } catch (err) {
      console.error("Error seeding demo journals:", err);
    } finally {
      setIsInitializingData(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans selection:bg-amber-200 selection:text-stone-900">
      {/* Navigation Header */}
      <Navbar
        user={user}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== "journal") setActiveJournal(null);
        }}
        onNewJournal={handleNewJournal}
        onSignOut={handleSignOut}
        onSignIn={handleSignIn}
      />

      {/* Main Content Body */}
      <main className="flex-1 flex flex-col">
        {authLoading ? (
          <div className="flex-1 flex items-center justify-center p-8 text-stone-500 text-xs">
            <div className="flex items-center space-x-2">
              <span className="h-4 w-4 rounded-full border-2 border-stone-300 border-t-stone-800 animate-spin" />
              <span>Verifying secure Firebase session...</span>
            </div>
          </div>
        ) : !user ? (
          <LandingView
            onSignIn={handleSignIn}
            isLoading={authLoading}
            error={authError}
          />
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Quick Demo Seed helper banner if user has 0 journals */}
            {journals.length === 0 && !isInitializingData && activeTab === "dashboard" && (
              <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2">
                <span>
                  💡 <strong>Ideathon Judge Demo</strong>: Would you like to seed 2 sample reflections (Earlier uncertainty vs. Recent evaluation) to immediately experience <strong>Reflection Evolution</strong>?
                </span>
                <button
                  onClick={handleSeedDemoJournals}
                  className="px-3 py-1 bg-amber-800 text-white rounded-lg font-medium hover:bg-amber-900 transition"
                >
                  Seed Demo Reflections &rarr;
                </button>
              </div>
            )}

            {/* Tab: Dashboard (Home) */}
            {activeTab === "dashboard" && (
              <DashboardView
                user={user}
                profile={profile}
                journals={journals}
                dailyPrompt={dailyPrompts[0] || { prompt: "What gave you energy today?", category: "Wellbeing" }}
                onNewJournalWithPrompt={handleNewJournalWithPrompt}
                onOpenJournal={handleOpenJournal}
                onNavigateTab={(tab) => {
                  setActiveTab(tab);
                  if (tab !== "journal") setActiveJournal(null);
                }}
                onNewJournal={handleNewJournal}
              />
            )}

            {/* Tab: Active Journal Conversation */}
            {activeTab === "journal" && (
              activeJournal ? (
                <JournalView
                  user={user}
                  journal={activeJournal}
                  onBack={() => {
                    setActiveJournal(null);
                    setActiveTab("dashboard");
                  }}
                  onJournalUpdated={handleJournalUpdated}
                  onJournalDeleted={handleJournalDeleted}
                />
              ) : (
                <div className="mx-auto max-w-4xl px-4 py-12 text-center space-y-4">
                  <h2 className="text-lg font-semibold text-stone-900">No active reflection selected</h2>
                  <p className="text-xs text-stone-500">Choose a reflection from history or start a new one.</p>
                  <button
                    onClick={handleNewJournal}
                    className="inline-flex items-center space-x-2 rounded-xl bg-stone-900 px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-stone-800"
                  >
                    <span>Start New Reflection</span>
                  </button>
                </div>
              )
            )}

            {/* Tab: Reflection Evolution (⭐ Original Ideathon Feature) */}
            {activeTab === "evolution" && (
              <EvolutionView
                user={user}
                journals={journals}
                onStartReflectionWithPrompt={handleNewJournalWithPrompt}
              />
            )}

            {/* Tab: Reflection History */}
            {activeTab === "history" && (
              <HistoryView
                journals={journals}
                onOpenJournal={handleOpenJournal}
                onDeleteJournal={handleJournalDeleted}
                onNewJournal={handleNewJournal}
              />
            )}

            {/* Tab: Security & Threat Modeling Dashboard */}
            {activeTab === "security" && <SecurityView user={user} />}

            {/* Tab: Profile & Data Export */}
            {activeTab === "profile" && (
              <ProfileView
                user={user}
                profile={profile}
                journals={journals}
                onSignOut={handleSignOut}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
