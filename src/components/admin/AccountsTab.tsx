import { useEffect, useState } from 'react';
import type { AdminUserRow } from '../../services/adminService';
import { fetchAllUsers, adminUpdateProfile, adminDeleteUser } from '../../services/adminService';

export default function AccountsTab() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState({ full_name: '', school: '', grade_level: '' });
  const [deleteTarget, setDeleteTarget] = useState<AdminUserRow | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await fetchAllUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.full_name ?? '').toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  function startEdit(user: AdminUserRow) {
    setEditingId(user.id);
    setEditFields({
      full_name: user.full_name ?? '',
      school: user.school ?? '',
      grade_level: user.grade_level?.toString() ?? '',
    });
  }

  async function saveEdit() {
    if (!editingId) return;
    try {
      const sanitizedName = editFields.full_name.slice(0, 200).trim();
      const sanitizedSchool = (editFields.school || '').slice(0, 200).trim();
      const gradeNum = editFields.grade_level ? parseInt(editFields.grade_level) : null;
      const validGrade = gradeNum !== null && gradeNum >= 1 && gradeNum <= 13 ? gradeNum : null;
      await adminUpdateProfile(editingId, {
        full_name: sanitizedName,
        school: sanitizedSchool || undefined,
        grade_level: validGrade,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingId
            ? {
                ...u,
                full_name: editFields.full_name,
                school: editFields.school || null,
                grade_level: editFields.grade_level ? parseInt(editFields.grade_level) : null,
              }
            : u,
        ),
      );
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await adminDeleteUser(deleteTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 text-red-700 rounded-lg p-4">{error}</div>;
  }

  return (
    <div>
      {/* Search */}
      <input
        type="text"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md mb-4 px-4 py-2 border border-slate-300 rounded-lg text-sm
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      />

      <div className="text-sm text-slate-500 mb-3">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-600">Name</th>
              <th className="px-4 py-3 font-medium text-slate-600">Email</th>
              <th className="px-4 py-3 font-medium text-slate-600">School</th>
              <th className="px-4 py-3 font-medium text-slate-600">Grade</th>
              <th className="px-4 py-3 font-medium text-slate-600 text-right">XP</th>
              <th className="px-4 py-3 font-medium text-slate-600 text-right">Streak</th>
              <th className="px-4 py-3 font-medium text-slate-600">Joined</th>
              <th className="px-4 py-3 font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50">
                {editingId === user.id ? (
                  <>
                    <td className="px-4 py-2">
                      <input
                        value={editFields.full_name}
                        onChange={(e) => setEditFields((f) => ({ ...f, full_name: e.target.value }))}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </td>
                    <td className="px-4 py-2 text-slate-500">{user.email}</td>
                    <td className="px-4 py-2">
                      <input
                        value={editFields.school}
                        onChange={(e) => setEditFields((f) => ({ ...f, school: e.target.value }))}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={editFields.grade_level}
                        onChange={(e) => setEditFields((f) => ({ ...f, grade_level: e.target.value }))}
                        className="w-16 px-2 py-1 border rounded text-sm"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">{user.xp}</td>
                    <td className="px-4 py-2 text-right">{user.study_streak}</td>
                    <td className="px-4 py-2 text-slate-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <button
                          onClick={saveEdit}
                          className="px-2 py-1 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs font-medium hover:bg-slate-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2 font-medium text-slate-900">
                      {user.full_name || '—'}
                      {user.role === 'admin' && (
                        <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-medium">
                          admin
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-slate-500">{user.email}</td>
                    <td className="px-4 py-2 text-slate-500">{user.school || '—'}</td>
                    <td className="px-4 py-2 text-slate-500">{user.grade_level ?? '—'}</td>
                    <td className="px-4 py-2 text-right font-medium">{user.xp}</td>
                    <td className="px-4 py-2 text-right">{user.study_streak}</td>
                    <td className="px-4 py-2 text-slate-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(user)}
                          className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium hover:bg-indigo-200"
                        >
                          Edit
                        </button>
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => setDeleteTarget(user)}
                            className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete User</h3>
            <p className="text-slate-600 mb-1">
              Are you sure you want to delete <strong>{deleteTarget.full_name || deleteTarget.email}</strong>?
            </p>
            <p className="text-sm text-red-600 mb-6">
              This will permanently remove all their data and cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
