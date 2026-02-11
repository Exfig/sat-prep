import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from '../contexts/AuthContext';
import { DOMAIN_NAMES, SECTION_NAMES, SECTION_DOMAINS } from '../types';
import type { SectionId } from '../types';
import { exportAllUserData, deleteUserAccount } from '../services/database';
import { hasLocalStorageData, parseLocalStorageData, clearLocalStorageData } from '../services/migration';
import { syncGamificationState, upsertUserProgress, insertAttempt } from '../services/database';

const sections: SectionId[] = ['reading-writing', 'math'];

export default function Settings() {
  const resetProgress = useAppStore((s) => s.resetProgress);
  const thinkPeriodEnabled = useAppStore((s) => s.thinkPeriodEnabled);
  const setThinkPeriodEnabled = useAppStore((s) => s.setThinkPeriodEnabled);
  const metacogEnabled = useAppStore((s) => s.metacogEnabled);
  const setMetacogEnabled = useAppStore((s) => s.setMetacogEnabled);
  const scaffoldingOverrides = useAppStore((s) => s.scaffoldingOverrides);
  const setScaffoldingOverride = useAppStore((s) => s.setScaffoldingOverride);
  const userId = useAppStore((s) => s.userId);
  const hydrateFromSupabase = useAppStore((s) => s.hydrateFromSupabase);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [showConfirm, setShowConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // localStorage migration
  const [showMigration, setShowMigration] = useState(() => hasLocalStorageData());
  const [migrating, setMigrating] = useState(false);

  const handleReset = () => {
    resetProgress();
    setShowConfirm(false);
  };

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const json = await exportAllUserData(user.id);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sat-prep-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteUserAccount();
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Delete account error:', err);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleMigrate = async () => {
    if (!userId) return;
    setMigrating(true);
    try {
      const localData = parseLocalStorageData();
      if (localData) {
        // Write data to Supabase
        await syncGamificationState(userId, {
          xp: localData.xp,
          xpHistory: localData.xpHistory,
          earnedBadges: localData.earnedBadges,
          sessionsCompleted: localData.sessionsCompleted,
          studyStreak: localData.studyStreak,
          longestStreak: localData.longestStreak,
          lastStudyDate: localData.lastStudyDate,
          streakFreezes: localData.streakFreezes,
          questProgress: localData.questProgress,
          bossesDefeated: localData.bossesDefeated,
          sectionQuests: localData.sectionQuests,
          calibrationData: localData.calibrationData,
          deepDivesCompleted: localData.deepDivesCompleted,
          sessionHistory: localData.sessionHistory,
          thinkPeriodEnabled: localData.thinkPeriodEnabled,
          metacogEnabled: localData.metacogEnabled,
          scaffoldingOverrides: localData.scaffoldingOverrides,
          hasSeenWelcome: localData.hasSeenWelcome,
          strategyGuideCompleted: localData.strategyGuideCompleted,
          strategyGuideSectionsCompleted: localData.strategyGuideSectionsCompleted,
          strategyGuideCurrentSection: localData.strategyGuideCurrentSection,
        });

        // Write question progress and attempts
        for (const qp of Object.values(localData.questionProgress)) {
          await upsertUserProgress(userId, qp);
          for (const attempt of qp.attempts) {
            await insertAttempt(userId, qp.questionId, attempt);
          }
        }

        // Hydrate Zustand with the migrated data
        hydrateFromSupabase(userId, localData);
        clearLocalStorageData();
      }
    } catch (err) {
      console.error('Migration error:', err);
    } finally {
      setMigrating(false);
      setShowMigration(false);
    }
  };

  const handleDeclineMigration = () => {
    clearLocalStorageData();
    setShowMigration(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Settings</h1>

      {/* localStorage migration banner */}
      {showMigration && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-amber-800 mb-2">Existing Progress Found</h2>
          <p className="text-sm text-amber-700 mb-4">
            We found study progress saved locally on this browser. Would you like to import it to your account?
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleMigrate}
              disabled={migrating}
              className="px-4 py-2.5 bg-amber-600 text-white rounded-lg font-medium
                hover:bg-amber-700 transition-colors disabled:opacity-50 min-h-[44px]"
            >
              {migrating ? 'Importing...' : 'Import Progress'}
            </button>
            <button
              onClick={handleDeclineMigration}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium
                hover:bg-slate-200 transition-colors min-h-[44px]"
            >
              No Thanks
            </button>
          </div>
        </div>
      )}

      {/* Think Period toggle */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Think Period</h2>
        <p className="text-sm text-slate-600 mb-4">
          Show think period for hard questions (4-second delay before answer choices appear)
        </p>
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={thinkPeriodEnabled}
              onChange={(e) => setThinkPeriodEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 rounded-full peer-checked:bg-indigo-500 transition-colors" />
            <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
          </div>
          <span className="text-sm font-medium text-slate-700">
            {thinkPeriodEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      </div>

      {/* Metacognition toggle */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Confidence &amp; Self-Rating</h2>
        <p className="text-sm text-slate-600 mb-4">
          Show &ldquo;How confident are you?&rdquo; and &ldquo;How well did you know this?&rdquo; prompts after each question.
          These feed the calibration gauge and spaced-repetition scheduling.
        </p>
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={metacogEnabled}
              onChange={(e) => setMetacogEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 rounded-full peer-checked:bg-indigo-500 transition-colors" />
            <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
          </div>
          <span className="text-sm font-medium text-slate-700">
            {metacogEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      </div>

      {/* Scaffolding Overrides grouped by section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Learning Scaffolds</h2>
        <p className="text-sm text-slate-600 mb-4">
          Keep hints and formulas enabled for specific domains, even after mastery.
        </p>
        <div className="space-y-5">
          {sections.map((sectionId) => (
            <div key={sectionId}>
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
                {SECTION_NAMES[sectionId]}
              </h3>
              <div className="space-y-3 pl-1">
                {SECTION_DOMAINS[sectionId].map((domainId) => (
                  <label key={domainId} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scaffoldingOverrides[domainId] ?? false}
                      onChange={(e) => setScaffoldingOverride(domainId, e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">
                      Keep hints & formulas enabled for {DOMAIN_NAMES[domainId]}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export data */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Export My Data</h2>
        <p className="text-sm text-slate-600 mb-4">
          Download all your study progress, scores, and settings as a JSON file.
        </p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium
            hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50 min-h-[44px]"
        >
          {exporting ? 'Exporting...' : 'Export Data'}
        </button>
      </div>

      {/* Reset progress */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Reset Progress</h2>
        <p className="text-sm text-slate-600 mb-4">
          This will permanently delete all your progress, including mastered questions, study
          streak, attempt history, XP, badges, and spaced repetition data. This action cannot be undone.
        </p>
        <button
          onClick={() => setShowConfirm(true)}
          className="px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium
            hover:bg-red-700 transition-all duration-200 min-h-[44px]"
        >
          Reset All Progress
        </button>
      </div>

      {/* Delete account */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-red-800 mb-2">Delete Account</h2>
        <p className="text-sm text-slate-600 mb-4">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium
            hover:bg-red-700 transition-all duration-200 min-h-[44px]"
        >
          Delete My Account
        </button>
      </div>

      {/* App info */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">About</h2>
        <div className="space-y-2 text-sm text-slate-600">
          <p>SAT Prep Study App</p>
          <p>Covers Reading & Writing and Math sections of the Digital SAT.</p>
          <p className="text-slate-400">Built with React, TypeScript, and Tailwind CSS.</p>
        </div>
      </div>

      {/* Reset confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Are you sure?</h3>
            <p className="text-sm text-slate-600 mb-6">
              All progress will be permanently deleted. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium
                  hover:bg-red-700 transition-all duration-200 min-h-[44px]"
              >
                Yes, Reset
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium
                  hover:bg-slate-200 transition-all duration-200 min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete account confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold text-red-800 mb-2">Delete Account?</h3>
            <p className="text-sm text-slate-600 mb-6">
              This will permanently delete your account, all study progress, scores, and settings.
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium
                  hover:bg-red-700 transition-all duration-200 disabled:opacity-50 min-h-[44px]"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium
                  hover:bg-slate-200 transition-all duration-200 min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
