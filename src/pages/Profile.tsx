import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from '../contexts/AuthContext';
import { calculateOverallStats } from '../utils/stats';
import { getLevelForXP, getXPToNextLevel } from '../utils/xp';
import { BADGE_DEFINITIONS } from '../utils/badges';
import { loadProfile, updateProfile } from '../services/database';
import type { ProfileData } from '../services/database';
import XPBar from '../components/XPBar';
import BadgeGrid from '../components/BadgeGrid';

export default function Profile() {
  const { questionProgress, xp, earnedBadges, sessionsCompleted, studyStreak, longestStreak, lastStudyDate } = useAppStore();
  const { user } = useAuth();
  const stats = calculateOverallStats(questionProgress, studyStreak, lastStudyDate);
  const level = getLevelForXP(xp);
  const xpToNext = getXPToNextLevel(xp);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    school: '',
    grade_level: '',
    target_test_date: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile(user.id).then((p) => {
        if (p) {
          setProfile(p);
          setEditForm({
            full_name: p.full_name ?? '',
            school: p.school ?? '',
            grade_level: p.grade_level ? String(p.grade_level) : '',
            target_test_date: p.target_test_date ?? '',
          });
        }
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await updateProfile(user.id, {
      full_name: editForm.full_name || null,
      school: editForm.school || null,
      grade_level: editForm.grade_level ? parseInt(editForm.grade_level) : null,
      target_test_date: editForm.target_test_date || null,
    });
    setProfile({
      full_name: editForm.full_name || null,
      school: editForm.school || null,
      grade_level: editForm.grade_level ? parseInt(editForm.grade_level) : null,
      target_test_date: editForm.target_test_date || null,
    });
    setEditing(false);
    setSaving(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Profile</h1>

      {/* Account info */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Account Information</h2>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700
                bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600
                  hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  if (profile) {
                    setEditForm({
                      full_name: profile.full_name ?? '',
                      school: profile.school ?? '',
                      grade_level: profile.grade_level ? String(profile.grade_level) : '',
                      target_test_date: profile.target_test_date ?? '',
                    });
                  }
                }}
                className="px-3 py-1.5 text-sm font-medium text-slate-600
                  bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <span className="text-slate-500">Email:</span>{' '}
            <span className="text-slate-800 font-medium">{user?.email ?? '--'}</span>
          </div>

          {editing ? (
            <>
              <div>
                <label className="block text-slate-500 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">School</label>
                <input
                  type="text"
                  value={editForm.school}
                  onChange={(e) => setEditForm((f) => ({ ...f, school: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">Grade Level</label>
                  <select
                    value={editForm.grade_level}
                    onChange={(e) => setEditForm((f) => ({ ...f, grade_level: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select</option>
                    <option value="9">9th</option>
                    <option value="10">10th</option>
                    <option value="11">11th</option>
                    <option value="12">12th</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Target Test Date</label>
                  <input
                    type="date"
                    value={editForm.target_test_date}
                    onChange={(e) => setEditForm((f) => ({ ...f, target_test_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="text-slate-500">Name:</span>{' '}
                <span className="text-slate-800 font-medium">{profile?.full_name || '--'}</span>
              </div>
              <div>
                <span className="text-slate-500">School:</span>{' '}
                <span className="text-slate-800 font-medium">{profile?.school || '--'}</span>
              </div>
              <div>
                <span className="text-slate-500">Grade:</span>{' '}
                <span className="text-slate-800 font-medium">
                  {profile?.grade_level ? `${profile.grade_level}th` : '--'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Target Test Date:</span>{' '}
                <span className="text-slate-800 font-medium">{profile?.target_test_date || '--'}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Level title */}
      <div className="text-center mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-3xl font-bold mx-auto mb-3 shadow-lg">
          {level.level}
        </div>
        <h2 className="text-xl font-bold text-slate-800">{level.title}</h2>
        <p className="text-sm text-slate-500">{xp} total XP</p>
      </div>

      {/* XP bar */}
      <div className="mb-8">
        <XPBar xp={xp} level={level} xpToNext={xpToNext} />
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">{stats.totalAttempted}</p>
          <p className="text-sm text-slate-500">Questions Answered</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">
            {stats.totalAttempted > 0 ? `${stats.overallAccuracy}%` : '--'}
          </p>
          <p className="text-sm text-slate-500">Accuracy</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{sessionsCompleted}</p>
          <p className="text-sm text-slate-500">Sessions</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{longestStreak}</p>
          <p className="text-sm text-slate-500">Longest Streak</p>
        </div>
      </div>

      {/* Current streak */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Study Streak</h2>
        <div className="flex items-center gap-3">
          <span className="text-3xl">🔥</span>
          <div>
            <p className="text-2xl font-bold text-slate-800">{studyStreak} day{studyStreak !== 1 ? 's' : ''}</p>
            <p className="text-sm text-slate-500">Best: {longestStreak} day{longestStreak !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Badge grid */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          Badges ({earnedBadges.length}/{BADGE_DEFINITIONS.length})
        </h2>
        <BadgeGrid
          earnedBadges={earnedBadges}
          allDefinitions={BADGE_DEFINITIONS.map((d) => ({
            id: d.id,
            name: d.name,
            description: d.description,
            icon: d.icon,
          }))}
        />
      </div>
    </div>
  );
}
