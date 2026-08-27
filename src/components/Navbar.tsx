import React from "react";
import {
  Sparkles,
  BookOpen,
  GitBranch,
  History,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  Plus
} from "lucide-react";
import { User } from "firebase/auth";

interface NavbarProps {
  user: User | null;
  activeTab: "dashboard" | "journal" | "evolution" | "history" | "security" | "profile";
  onTabChange: (tab: "dashboard" | "journal" | "evolution" | "history" | "security" | "profile") => void;
  onNewJournal: () => void;
  onSignOut: () => void;
  onSignIn: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  onTabChange,
  onNewJournal,
  onSignOut,
  onSignIn
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-stone-50/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand & Positioning */}
        <div className="flex items-center space-x-3">
          <button
            id="brand-home-button"
            onClick={() => onTabChange("dashboard")}
            className="flex items-center space-x-2.5 text-left group transition"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-stone-100 shadow-xs group-hover:bg-stone-800 transition">
              <Sparkles className="h-4 w-4 text-amber-300" />
            </div>
            <div>
              <span className="text-base font-semibold tracking-tight text-stone-900 block leading-tight">
                Gemini Journal
              </span>
              <span className="text-[11px] text-stone-500 font-medium hidden sm:inline-block">
                Think freely. Reflect deeply. Grow over time.
              </span>
            </div>
          </button>
        </div>

        {/* Navigation Tabs (Only when authenticated) */}
        {user ? (
          <nav className="hidden md:flex items-center space-x-1 bg-stone-100/80 p-1 rounded-xl border border-stone-200/70">
            <button
              id="nav-dashboard-tab"
              onClick={() => onTabChange("dashboard")}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === "dashboard"
                  ? "bg-white text-stone-900 shadow-xs border border-stone-200/50"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/50"
              }`}
            >
              <span>Home</span>
            </button>

            <button
              id="nav-journal-tab"
              onClick={() => onTabChange("journal")}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === "journal"
                  ? "bg-white text-stone-900 shadow-xs border border-stone-200/50"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/50"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Journal</span>
            </button>

            <button
              id="nav-evolution-tab"
              onClick={() => onTabChange("evolution")}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === "evolution"
                  ? "bg-white text-emerald-800 shadow-xs border border-emerald-200/60 font-semibold"
                  : "text-stone-600 hover:text-emerald-800 hover:bg-stone-200/50"
              }`}
            >
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <GitBranch className="h-3.5 w-3.5 text-emerald-600" />
              <span>Evolution</span>
            </button>

            <button
              id="nav-history-tab"
              onClick={() => onTabChange("history")}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === "history"
                  ? "bg-white text-stone-900 shadow-xs border border-stone-200/50"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/50"
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>History</span>
            </button>

            <button
              id="nav-security-tab"
              onClick={() => onTabChange("security")}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === "security"
                  ? "bg-white text-stone-900 shadow-xs border border-stone-200/50"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/50"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
              <span>Security</span>
            </button>
          </nav>
        ) : null}

        {/* Right CTA / User controls */}
        <div className="flex items-center space-x-2">
          {user ? (
            <>
              <button
                id="new-reflection-top-btn"
                onClick={onNewJournal}
                className="hidden sm:flex items-center space-x-1.5 rounded-lg bg-stone-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-stone-800 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Reflection</span>
              </button>

              <button
                id="nav-profile-tab"
                onClick={() => onTabChange("profile")}
                className={`flex items-center space-x-2 rounded-lg p-1.5 border transition ${
                  activeTab === "profile"
                    ? "border-stone-400 bg-white"
                    : "border-transparent hover:border-stone-200 hover:bg-white"
                }`}
                title="Account & Profile"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="h-7 w-7 rounded-full object-cover border border-stone-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-200 text-stone-700">
                    <UserIcon className="h-4 w-4" />
                  </div>
                )}
                <span className="text-xs font-medium text-stone-800 max-w-[100px] truncate hidden lg:inline">
                  {user.displayName?.split(" ")[0] || "Account"}
                </span>
              </button>

              <button
                id="sign-out-btn"
                onClick={onSignOut}
                className="p-1.5 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-200/60 transition"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              id="google-signin-nav-btn"
              onClick={onSignIn}
              className="flex items-center space-x-2 rounded-lg bg-stone-900 px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-stone-800 transition"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
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
              <span>Sign in with Google</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile navigation row */}
      {user && (
        <div className="flex md:hidden border-t border-stone-200 bg-stone-100/90 px-3 py-1.5 justify-around">
          <button
            onClick={() => onTabChange("dashboard")}
            className={`px-2.5 py-1 text-xs rounded-md ${
              activeTab === "dashboard" ? "bg-white text-stone-900 font-semibold shadow-xs" : "text-stone-600"
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onTabChange("journal")}
            className={`px-2.5 py-1 text-xs rounded-md ${
              activeTab === "journal" ? "bg-white text-stone-900 font-semibold shadow-xs" : "text-stone-600"
            }`}
          >
            Journal
          </button>
          <button
            onClick={() => onTabChange("evolution")}
            className={`px-2.5 py-1 text-xs rounded-md ${
              activeTab === "evolution" ? "bg-white text-emerald-800 font-semibold shadow-xs" : "text-stone-600"
            }`}
          >
            🌱 Evolution
          </button>
          <button
            onClick={() => onTabChange("history")}
            className={`px-2.5 py-1 text-xs rounded-md ${
              activeTab === "history" ? "bg-white text-stone-900 font-semibold shadow-xs" : "text-stone-600"
            }`}
          >
            History
          </button>
          <button
            onClick={() => onTabChange("security")}
            className={`px-2.5 py-1 text-xs rounded-md ${
              activeTab === "security" ? "bg-white text-stone-900 font-semibold shadow-xs" : "text-stone-600"
            }`}
          >
            Security
          </button>
        </div>
      )}
    </header>
  );
};
