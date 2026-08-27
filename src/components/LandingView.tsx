import React from "react";
import {
  ShieldCheck,
  Lock,
  Sparkles,
  GitBranch,
  ArrowRight,
  Database,
  KeyRound,
  CheckCircle2
} from "lucide-react";

interface LandingViewProps {
  onSignIn: () => void;
  isLoading: boolean;
  error?: string | null;
}

export const LandingView: React.FC<LandingViewProps> = ({ onSignIn, isLoading, error }) => {
  return (
    <div className="relative min-h-[calc(100vh-65px)] bg-stone-50 text-stone-900 overflow-hidden flex flex-col justify-between">
      {/* Decorative subtle ambient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 right-10 w-96 h-96 bg-amber-100/60 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-80 h-80 bg-emerald-100/50 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 right-1/4 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 z-10 flex-1 flex flex-col justify-center">
        {/* Main Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center space-x-2 rounded-full border border-stone-300/80 bg-white/80 px-4 py-1.5 text-xs font-medium text-stone-700 shadow-xs backdrop-blur-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>GenAI Academy Challenge &bull; Production Security Standard</span>
          </div>
        </div>

        {/* Hero Title & Positioning */}
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-stone-900 leading-[1.15]">
            Think freely. Reflect deeply. <br />
            <span className="text-emerald-700 font-serif italic">Grow over time.</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-stone-600 leading-relaxed">
            A private AI-powered reflection companion. Have multi-turn conversations with Gemini,
            summarize insights automatically, and discover how your thoughts evolve over time.
          </p>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg max-w-md mx-auto">
              {error}
            </div>
          )}

          {/* Primary Action Button */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="hero-google-signin-btn"
              onClick={onSignIn}
              disabled={isLoading}
              className="w-full sm:w-auto flex items-center justify-center space-x-3 rounded-xl bg-stone-900 px-6 py-3.5 text-sm font-medium text-white shadow-md hover:bg-stone-800 transition disabled:opacity-50 cursor-pointer"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
                />
              </svg>
              <span>{isLoading ? "Connecting securely..." : "Sign in with Google"}</span>
              <ArrowRight className="h-4 w-4 text-stone-400" />
            </button>
          </div>

          <p className="mt-3 text-xs text-stone-500">
            Strict per-user data isolation. No passwords stored. Never used for public model training.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Multi-turn Companion */}
          <div className="rounded-2xl border border-stone-200/80 bg-white/70 p-6 shadow-xs backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 mb-4">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-stone-900">Multi-Turn AI Companion</h2>
            <p className="mt-2 text-xs text-stone-600 leading-relaxed">
              Explore your thoughts through conversational journaling. Gemini helps ask deeper questions,
              brainstorm creative ideas, and create low-stress action plans without feeling like a generic chatbot.
            </p>
          </div>

          {/* Card 2: Reflection Evolution */}
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-6 shadow-xs backdrop-blur-sm relative overflow-hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-200/70 text-emerald-900 mb-4">
              <GitBranch className="h-5 w-5" />
            </div>
            <div className="inline-block rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 uppercase tracking-wider mb-1">
              ⭐ Original Feature
            </div>
            <h2 className="text-base font-semibold text-stone-900">Reflection Evolution</h2>
            <p className="mt-2 text-xs text-stone-600 leading-relaxed">
              Uncover how your mindset shifts over weeks and months. Compare earlier hesitations with recent
              clarity (e.g. <em>uncertainty &rarr; evaluation</em>) with empowering, non-diagnostic AI reflections.
            </p>
          </div>

          {/* Card 3: Security & Data Isolation */}
          <div className="rounded-2xl border border-stone-200/80 bg-white/70 p-6 shadow-xs backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-800 mb-4">
              <Lock className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-stone-900">Zero-Compromise Security</h2>
            <p className="mt-2 text-xs text-stone-600 leading-relaxed">
              Strict owner-bound Firestore rules (<code className="text-[11px] bg-stone-100 px-1 py-0.5 rounded">request.auth.uid == userId</code>),
              server-side Gemini API proxy, and Secret Manager hygiene. User A can never see User B's entries.
            </p>
          </div>
        </div>

        {/* Security Invariants Checklist Banner */}
        <div className="mt-8 rounded-xl border border-stone-200 bg-stone-100/60 p-4 text-xs text-stone-700">
          <div className="font-semibold text-stone-900 mb-2 flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Architecture & Privacy Guarantees</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-stone-600">
            <div className="flex items-center space-x-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Firebase Google Auth</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Server-Side Gemini SDK</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>User-Isolated Firestore</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Non-Diagnostic AI Stance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-4 text-center text-xs text-stone-500 bg-white/50">
        Personal Gemini Journal &bull; Built for the GenAI Academy Ideathon Challenge
      </footer>
    </div>
  );
};
