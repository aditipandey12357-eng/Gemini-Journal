import React, { useState } from "react";
import {
  User as UserIcon,
  Mail,
  Key,
  Calendar,
  Download,
  LogOut,
  ShieldCheck,
  Flame,
  BookOpen,
  Check
} from "lucide-react";
import { User } from "firebase/auth";
import { Journal, UserProfile } from "../types";
import { getUserJournals, getUserEvolutions, getJournalMessages } from "../lib/journalService";

interface ProfileViewProps {
  user: User;
  profile: UserProfile | null;
  journals: Journal[];
  onSignOut: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  profile,
  journals,
  onSignOut
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // Gather all journals with messages
      const fullJournals = await Promise.all(
        journals.map(async (j) => {
          const msgs = await getJournalMessages(user.uid, j.id);
          return { ...j, messages: msgs };
        })
      );

      const evolutions = await getUserEvolutions(user.uid);

      const exportBundle = {
        exportedAt: new Date().toISOString(),
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        },
        profile,
        totalJournals: fullJournals.length,
        journals: fullJournals,
        reflectionEvolutions: evolutions
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportBundle, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `gemini-journal-export-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setExportComplete(true);
      setTimeout(() => setExportComplete(false), 3000);
    } catch (err) {
      console.error("Failed to export data:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="border-b border-stone-200/80 pb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight">
          Account & Preferences
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Manage your private identity, review reflection stats, and export your personal journal archives.
        </p>
      </div>

      {/* Account Profile Card */}
      <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || "User"}
              className="h-20 w-20 rounded-full object-cover border-2 border-stone-200 shadow-xs"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-stone-100 text-stone-600 border border-stone-200">
              <UserIcon className="h-10 w-10" />
            </div>
          )}

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-semibold text-stone-900">{user.displayName || "Reflection Explorer"}</h2>
                <div className="flex items-center justify-center sm:justify-start space-x-1.5 text-xs text-stone-500 mt-0.5">
                  <Mail className="h-3.5 w-3.5 text-stone-400" />
                  <span>{user.email}</span>
                </div>
              </div>

              <div className="inline-flex items-center space-x-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 border border-emerald-200 self-center sm:self-auto">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Google Verified</span>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-stone-500">
              <div className="flex items-center space-x-1">
                <Key className="h-3.5 w-3.5 text-stone-400" />
                <span className="font-mono text-[11px]">UID: {user.uid}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-3.5 w-3.5 text-stone-400" />
                <span>Joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "Today"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center space-x-2 text-stone-500 text-xs mb-1">
            <BookOpen className="h-4 w-4 text-indigo-500" />
            <span>Lifetime Journal Sessions</span>
          </div>
          <div className="text-2xl font-semibold text-stone-900">{journals.length}</div>
          <p className="text-[11px] text-stone-400 mt-1">Saved securely in Firestore</p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center space-x-2 text-stone-500 text-xs mb-1">
            <Flame className="h-4 w-4 text-amber-500" />
            <span>Current Reflection Streak</span>
          </div>
          <div className="text-2xl font-semibold text-stone-900">
            {profile?.streakCount || (journals.length > 0 ? 1 : 0)} <span className="text-xs font-normal text-stone-500">days</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Daily mindful habit</p>
        </div>
      </div>

      {/* Data Export & Privacy Section */}
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-base font-semibold text-stone-900">Data Portability & Sovereignty</h3>
        <p className="text-xs text-stone-600 leading-relaxed">
          Your reflections belong to you. Download a complete machine-readable JSON archive of all your conversations,
          Gemini reflections, summaries, and reflection evolution tracks at any time.
        </p>

        <div className="pt-2">
          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="flex items-center space-x-2 rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 px-4 py-2.5 text-xs font-medium text-stone-800 transition disabled:opacity-50"
          >
            {exportComplete ? <Check className="h-4 w-4 text-emerald-600" /> : <Download className="h-4 w-4 text-stone-600" />}
            <span>{isExporting ? "Compiling Archive..." : exportComplete ? "Archive Downloaded!" : "Export All Journal Data (JSON)"}</span>
          </button>
        </div>
      </div>

      {/* Sign Out Card */}
      <div className="rounded-3xl border border-stone-200 bg-stone-50 p-6 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-stone-900">Sign out of session</h4>
          <p className="text-xs text-stone-500">You will need to sign back in with Google to access your reflections.</p>
        </div>

        <button
          onClick={onSignOut}
          className="flex items-center space-x-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 text-xs font-medium transition cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
