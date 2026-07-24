"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  User,
  Loader2,
  X,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
  Pencil,
  ChevronDown,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Role metadata ─────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  superuser: {
    label: "Superuser",
    icon: ShieldCheck,
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
    dotClass: "bg-amber-500",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
    dotClass: "bg-blue-500",
  },
  member: {
    label: "Member",
    icon: User,
    badgeClass: "bg-gray-100 text-gray-600 border-gray-200",
    dotClass: "bg-gray-400",
  },
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [superuserCount, setSuperuserCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [actionLoading, setActionLoading] = useState("");

  const isSuperuser = session?.user?.role === "superuser";

  // ── Fetch users ───────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      const res = await fetch(`/api/users?${params}`);
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
        setSuperuserCount(data.superuserCount);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchUsers();
    }
  }, [status, fetchUsers]);

  // ── Toggle user active status ─────────────────────────────────────────────
  const toggleActive = async (user) => {
    if (!isSuperuser) return;
    setActionLoading(user._id);
    try {
      const res = await fetch(`/api/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (res.ok) await fetchUsers();
    } catch (err) {
      console.error("Toggle failed:", err);
    } finally {
      setActionLoading("");
    }
  };

  // ── Deactivate user ───────────────────────────────────────────────────────
  const deactivateUser = async (userId) => {
    if (!isSuperuser) return;
    if (!confirm("Are you sure you want to deactivate this user?")) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (res.ok) await fetchUsers();
      else {
        const data = await res.json();
        alert(data.error || "Failed to deactivate user.");
      }
    } catch (err) {
      console.error("Deactivate failed:", err);
    } finally {
      setActionLoading("");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[24px] font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
              <Users className="w-6 h-6 text-gray-400" />
              User Management
            </h1>
            <p className="text-[13px] text-gray-500 mt-1">
              Manage user accounts, roles, and access permissions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Superuser counter */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-[12px] font-medium text-amber-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              {superuserCount}/2 Superusers
            </div>
            {isSuperuser && (
              <button
                id="create-user-btn"
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 text-white text-[13px] font-medium hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create User
              </button>
            )}
          </div>
        </div>

        {/* ── Search & Filter ────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="user-search"
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors"
            />
          </div>
          <div className="relative">
            <select
              id="role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="appearance-none h-10 pl-3 pr-8 rounded-xl border border-gray-200 bg-white text-[13px] text-gray-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
            >
              <option value="">All Roles</option>
              <option value="superuser">Superuser</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* ── Users Table ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">User</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Role</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Joined</th>
                  {isSuperuser && (
                    <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={isSuperuser ? 5 : 4} className="px-5 py-12 text-center text-[13px] text-gray-400">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const rc = ROLE_CONFIG[user.role] || ROLE_CONFIG.member;
                    const RoleIcon = rc.icon;
                    const isCurrentUser = user._id === session?.user?.id;
                    return (
                      <tr
                        key={user._id}
                        className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors"
                      >
                        {/* User info */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[13px] font-semibold text-gray-500 flex-shrink-0">
                              {user.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium text-gray-900 truncate">
                                {user.name}
                                {isCurrentUser && (
                                  <span className="ml-1.5 text-[10px] text-gray-400 font-normal">(you)</span>
                                )}
                              </p>
                              <p className="text-[12px] text-gray-400 truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        {/* Role */}
                        <td className="px-5 py-3.5">
                          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border", rc.badgeClass)}>
                            <RoleIcon className="w-3 h-3" />
                            {rc.label}
                          </span>
                        </td>
                        {/* Status */}
                        <td className="px-5 py-3.5">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 text-[12px] font-medium",
                            user.isActive ? "text-emerald-600" : "text-red-500"
                          )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", user.isActive ? "bg-emerald-500" : "bg-red-400")} />
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        {/* Joined */}
                        <td className="px-5 py-3.5 text-[12px] text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        {/* Actions */}
                        {isSuperuser && (
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-end gap-1">
                              {actionLoading === user._id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                              ) : (
                                <>
                                  <button
                                    onClick={() => setEditingUser(user)}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Edit user"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setResetPasswordUser(user)}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-amber-500 hover:text-amber-700 transition-colors"
                                    title="Reset password"
                                  >
                                    <KeyRound className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => toggleActive(user)}
                                    className={cn(
                                      "p-1.5 rounded-lg hover:bg-gray-100 transition-colors",
                                      user.isActive ? "text-emerald-500 hover:text-emerald-700" : "text-gray-400 hover:text-gray-600"
                                    )}
                                    title={user.isActive ? "Deactivate" : "Activate"}
                                  >
                                    {user.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* User count */}
        <p className="text-[12px] text-gray-400 mt-3 px-1">
          {users.length} user{users.length !== 1 ? "s" : ""} total
        </p>
      </div>

      {/* ── Create User Modal ──────────────────────────────────────────── */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchUsers();
          }}
          superuserCount={superuserCount}
        />
      )}

      {/* ── Edit User Modal ────────────────────────────────────────────── */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={() => {
            setEditingUser(null);
            fetchUsers();
          }}
          superuserCount={superuserCount}
        />
      )}

      {/* ── Reset Password Modal ───────────────────────────────────────── */}
      {resetPasswordUser && (
        <ResetPasswordModal
          user={resetPasswordUser}
          onClose={() => setResetPasswordUser(null)}
          onSuccess={() => setResetPasswordUser(null)}
        />
      )}
    </div>
  );
}

// ── Create User Modal ─────────────────────────────────────────────────────────
function CreateUserModal({ onClose, onSuccess, superuserCount }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "member",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create user.");
        return;
      }
      onSuccess();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-[16px] font-semibold text-gray-900">Create User</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-[12px] text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium text-gray-600">Full name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-[13px] text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
              placeholder="John Doe"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium text-gray-600">Email address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-[13px] text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
              placeholder="john@agency.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium text-gray-600">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full h-10 px-3 pr-10 rounded-xl border border-gray-200 bg-gray-50 text-[13px] text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
                placeholder="Min. 8 characters"
                required
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium text-gray-600">Role</label>
            <div className="grid grid-cols-3 gap-2">
              {(["superuser", "admin", "member"]).map((r) => {
                const rc = ROLE_CONFIG[r];
                const RIcon = rc.icon;
                const active = formData.role === r;
                const disabled = r === "superuser" && superuserCount >= 2;
                return (
                  <button
                    key={r}
                    type="button"
                    disabled={disabled}
                    onClick={() => setFormData({ ...formData, role: r })}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all",
                      active
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300",
                      disabled && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <RIcon className={cn("w-4 h-4", active ? "text-white" : "text-gray-400")} />
                    <span className="text-[11px] font-semibold">{rc.label}</span>
                    {disabled && <span className="text-[9px] opacity-70">Limit reached</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-10 rounded-xl bg-gray-900 text-white text-[13px] font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {loading ? "Creating…" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit User Modal ───────────────────────────────────────────────────────────
function EditUserModal({ user, onClose, onSuccess, superuserCount }) {
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    role: user.role || "member",
    isActive: user.isActive ?? true,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update user.");
        return;
      }
      onSuccess();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Can still assign superuser role if the user already is one (not a new slot)
  const canAssignSuperuser =
    superuserCount < 2 || user.role === "superuser";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-[16px] font-semibold text-gray-900">Edit User</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-[12px] text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium text-gray-600">Full name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-[13px] text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium text-gray-600">Email address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-[13px] text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium text-gray-600">Role</label>
            <div className="grid grid-cols-3 gap-2">
              {(["superuser", "admin", "member"]).map((r) => {
                const rc = ROLE_CONFIG[r];
                const RIcon = rc.icon;
                const active = formData.role === r;
                const disabled = r === "superuser" && !canAssignSuperuser;
                return (
                  <button
                    key={r}
                    type="button"
                    disabled={disabled}
                    onClick={() => setFormData({ ...formData, role: r })}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all",
                      active
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300",
                      disabled && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <RIcon className={cn("w-4 h-4", active ? "text-white" : "text-gray-400")} />
                    <span className="text-[11px] font-semibold">{rc.label}</span>
                    {disabled && <span className="text-[9px] opacity-70">Limit reached</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-[12px] font-medium text-gray-600">Account status</label>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors",
                formData.isActive
                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "bg-red-50 text-red-600 hover:bg-red-100"
              )}
            >
              {formData.isActive ? (
                <><ToggleRight className="w-4 h-4" /> Active</>
              ) : (
                <><ToggleLeft className="w-4 h-4" /> Inactive</>
              )}
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-10 rounded-xl bg-gray-900 text-white text-[13px] font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-3.5 h-3.5" />}
              {loading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Reset Password Modal ──────────────────────────────────────────────────────
function ResetPasswordModal({ user, onClose, onSuccess }) {
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Password strength rules
  const rules = [
    { label: "At least 8 characters", test: (v) => v.length >= 8 },
    { label: "Contains a letter", test: (v) => /[a-zA-Z]/.test(v) },
    { label: "Contains a number", test: (v) => /[0-9]/.test(v) },
    { label: "Contains a special character", test: (v) => /[^a-zA-Z0-9]/.test(v) },
  ];

  const allPassed = rules.every((r) => r.test(newPassword));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allPassed) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/users/${user._id}/reset-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to reset password.");
        return;
      }
      setSuccess(data.message || "Password reset successfully.");
      setTimeout(() => onSuccess(), 1500);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-[16px] font-semibold text-gray-900">Reset Password</h2>
            <p className="text-[12px] text-gray-500 mt-0.5">
              Set a new password for <strong>{user.name}</strong>
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-[12px] text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[12px] text-emerald-600">
              {success}
            </div>
          )}

          {/* User info */}
          <div className="flex items-center gap-3 px-3.5 py-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[13px] font-semibold text-gray-500">
              {user.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div>
              <p className="text-[13px] font-medium text-gray-900">{user.name}</p>
              <p className="text-[11px] text-gray-400">{user.email}</p>
            </div>
          </div>

          {/* New password */}
          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium text-gray-600">New password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-10 px-3 pr-10 rounded-xl border border-gray-200 bg-gray-50 text-[13px] text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
                placeholder="Enter new password"
                required
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Password rules */}
          {newPassword.length > 0 && (
            <div className="space-y-1.5 px-1">
              {rules.map((rule, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full transition-colors",
                    rule.test(newPassword) ? "bg-emerald-500" : "bg-gray-300"
                  )} />
                  <span className={cn(
                    "transition-colors",
                    rule.test(newPassword) ? "text-emerald-600" : "text-gray-400"
                  )}>
                    {rule.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !allPassed}
              className="flex-1 h-10 rounded-xl bg-amber-500 text-white text-[13px] font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
              {loading ? "Resetting…" : "Reset Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
