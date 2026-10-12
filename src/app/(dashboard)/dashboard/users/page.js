"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  Phone,
  CheckCircle2,
  AlertCircle,
  Send,
  Sparkles,
  MessageSquare,
  ArrowRight,
  Check,
  Copy,
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
  const [verifyPhoneUser, setVerifyPhoneUser] = useState(null);
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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[24px] font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
              <Users className="w-6 h-6 text-gray-400" />
              User Management
            </h1>
            <p className="text-[13px] text-gray-500 mt-1">
              Manage accounts, roles, mobile numbers, and OTP verification.
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 text-white text-[13px] font-medium hover:bg-gray-800 transition-colors shadow-sm"
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
              placeholder="Search by name, email, or contact number…"
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
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">User</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Role</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Contact & OTP Status</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Account</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Joined</th>
                  {isSuperuser && (
                    <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={isSuperuser ? 6 : 5} className="px-5 py-12 text-center text-[13px] text-gray-400">
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
                            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-[13px] font-semibold text-gray-600 flex-shrink-0">
                              {user.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-gray-900 truncate flex items-center gap-1.5">
                                {user.name}
                                {isCurrentUser && (
                                  <span className="text-[10px] text-gray-400 font-normal px-1.5 py-0.5 rounded bg-gray-100">(you)</span>
                                )}
                              </p>
                              <p className="text-[12px] text-gray-400 truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-5 py-3.5">
                          <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border", rc.badgeClass)}>
                            <RoleIcon className="w-3 h-3" />
                            {rc.label}
                          </span>
                        </td>

                        {/* Contact & Phone Verification */}
                        <td className="px-5 py-3.5">
                          {user.phone ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[12px] font-mono text-gray-800 font-medium flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-gray-400" />
                                  {user.phone}
                                </span>
                                {user.isPhoneVerified ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Verified
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                    <AlertCircle className="w-3 h-3 text-amber-600" />
                                    Unverified
                                  </span>
                                )}
                              </div>
                              {!user.isPhoneVerified && (isSuperuser || isCurrentUser) && (
                                <button
                                  onClick={() => setVerifyPhoneUser(user)}
                                  className="self-start mt-0.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors flex items-center gap-1 shadow-sm"
                                >
                                  <Send className="w-2.5 h-2.5" />
                                  Verify OTP
                                </button>
                              )}
                            </div>
                          ) : (
                            <div>
                              {(isSuperuser || isCurrentUser) ? (
                                <button
                                  onClick={() => setVerifyPhoneUser(user)}
                                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors flex items-center gap-1.5"
                                >
                                  <Plus className="w-3 h-3 text-gray-500" />
                                  Add & Verify Phone
                                </button>
                              ) : (
                                <span className="text-[12px] text-gray-400 italic">No phone added</span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Account status */}
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
                                    onClick={() => setVerifyPhoneUser(user)}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-emerald-600 hover:text-emerald-800 transition-colors"
                                    title="Manage / Verify Mobile Number"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingUser(user)}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Edit user details"
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
                                    title={user.isActive ? "Deactivate account" : "Activate account"}
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

      {/* ── Verify Phone OTP Modal ─────────────────────────────────────── */}
      {verifyPhoneUser && (
        <VerifyPhoneOtpModal
          user={verifyPhoneUser}
          isSuperuser={isSuperuser}
          onClose={() => setVerifyPhoneUser(null)}
          onSuccess={() => {
            setVerifyPhoneUser(null);
            fetchUsers();
          }}
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
    phone: "",
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
            <label className="block text-[12px] font-medium text-gray-600">Full name *</label>
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
            <label className="block text-[12px] font-medium text-gray-600">Email address *</label>
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
            <label className="block text-[12px] font-medium text-gray-600">Contact Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 bg-gray-50 text-[13px] text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium text-gray-600">Password *</label>
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
    phone: user.phone || "",
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

  const canAssignSuperuser = superuserCount < 2 || user.role === "superuser";

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
            <label className="block text-[12px] font-medium text-gray-600">Contact Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 bg-gray-50 text-[13px] text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
                placeholder="+91 98765 43210"
              />
            </div>
            {formData.phone !== user.phone && user.isPhoneVerified && (
              <p className="text-[11px] text-amber-600 mt-1">
                ⚠️ Changing contact number will reset its verification status.
              </p>
            )}
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

          <div className="flex items-center gap-3 px-3.5 py-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[13px] font-semibold text-gray-500">
              {user.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div>
              <p className="text-[13px] font-medium text-gray-900">{user.name}</p>
              <p className="text-[11px] text-gray-400">{user.email}</p>
            </div>
          </div>

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

// ── Verify Phone OTP Modal (Allows adding/updating phone & instant OTP verify) ──
function VerifyPhoneOtpModal({ user, isSuperuser, onClose, onSuccess }) {
  const [phoneNumber, setPhoneNumber] = useState(user.phone || "");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [singleOtp, setSingleOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [directLoading, setDirectLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [previewOtp, setPreviewOtp] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [hasSmsGateway, setHasSmsGateway] = useState(false);
  const [step, setStep] = useState(user.phone ? "otp" : "phone"); // "phone" or "otp"
  const [copied, setCopied] = useState(false);
  const inputRefs = useRef([]);

  // Countdown timer for resending OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOtp = async (phoneToSend = phoneNumber) => {
    const raw = (phoneToSend || user.phone || "").trim();
    const cleanDigits = raw.replace(/[^0-9]/g, "");
    if (!cleanDigits || cleanDigits.length < 7) {
      setError("Please enter a valid mobile number (min 10 digits).");
      return;
    }

    setSendingOtp(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/users/${user._id}/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: raw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send OTP.");
        return;
      }
      setSuccess(data.message || "OTP generated successfully!");
      if (data.otp) {
        setPreviewOtp(data.otp);
      }
      if (data.whatsappUrl) {
        setWhatsappUrl(data.whatsappUrl);
      }
      setHasSmsGateway(!!data.hasSmsGateway);
      setStep("otp");
      setCountdown(60);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch {
      setError("Network error sending OTP. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleDigitChange = (index, value) => {
    const char = value.slice(-1);
    if (char && !/^[0-9]$/.test(char)) return;

    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setSingleOtp(newDigits.join(""));

    // Auto-advance to next input
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim().replace(/[^0-9]/g, "");
    if (pasted.length >= 6) {
      const arr = pasted.slice(0, 6).split("");
      setDigits(arr);
      setSingleOtp(pasted.slice(0, 6));
      inputRefs.current[5]?.focus();
    }
  };

  const fillAutoOtp = () => {
    if (previewOtp && previewOtp.length === 6) {
      const arr = previewOtp.split("");
      setDigits(arr);
      setSingleOtp(previewOtp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const otpCode = singleOtp || digits.join("");
  const isComplete = otpCode.length === 6;

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (!isComplete) {
      setError("Please enter all 6 digits of the OTP.");
      return;
    }

    const rawPhone = (phoneNumber || user.phone || "").trim();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/users/${user._id}/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: otpCode, phone: rawPhone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Verification failed.");
        return;
      }
      setSuccess(data.message || "Contact number verified! ✅");
      setTimeout(() => onSuccess(), 1200);
    } catch {
      setError("Something went wrong during verification.");
    } finally {
      setLoading(false);
    }
  };

  // Direct Superuser Bypass Verification
  const handleDirectVerify = async () => {
    const phoneToVerify = (phoneNumber || user.phone || "").trim();
    const cleanDigits = phoneToVerify.replace(/[^0-9]/g, "");
    if (!cleanDigits || cleanDigits.length < 7) {
      setError("Please enter a valid mobile number (min 10 digits).");
      return;
    }

    setDirectLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/users/${user._id}/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directVerify: true, phone: phoneToVerify }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Direct verification failed.");
        return;
      }
      setSuccess(data.message || "Marked as Verified! ✅");
      setTimeout(() => onSuccess(), 1000);
    } catch {
      setError("Failed to directly verify user.");
    } finally {
      setDirectLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">
                {step === "phone" ? "Add & Verify Mobile Number" : "Verify Mobile OTP"}
              </h2>
              <p className="text-[11px] text-gray-500">
                User: <strong>{user.name}</strong> ({user.role})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200/60 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-xl text-[12px] text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[12px] text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* STEP 1: Phone Input */}
          {step === "phone" ? (
            <div className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="block text-[12px] font-semibold text-gray-700">
                  Mobile / WhatsApp Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full h-11 pl-10 pr-3 rounded-xl border border-gray-200 bg-gray-50 text-[14px] text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-gray-400">
                  Enter 10-digit number with country code (e.g. +91 9876543210).
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={sendingOtp || !phoneNumber.trim()}
                  onClick={() => handleSendOtp(phoneNumber)}
                  className="w-full h-11 rounded-xl bg-gray-900 text-white text-[13px] font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  {sendingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sendingOtp ? "Generating OTP…" : "Send Verification OTP"}
                </button>

                {/* Superuser Instant Bypass */}
                {isSuperuser && phoneNumber.trim().length >= 8 && (
                  <button
                    type="button"
                    disabled={directLoading}
                    onClick={handleDirectVerify}
                    className="w-full h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-[12px] font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    {directLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Direct Verify (Admin Bypass without OTP)
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* STEP 2: OTP Verification */
            <div className="space-y-4">
              {/* Phone info card with Change button */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-gray-400 font-medium">OTP Sent To</p>
                  <p className="text-[13px] font-mono font-bold text-gray-900">{phoneNumber || user.phone}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setError("");
                    setSuccess("");
                  }}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                >
                  Change Number
                </button>
              </div>

              {/* Instant OTP Helpers (Auto-fill & WhatsApp) */}
              {previewOtp ? (
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-indigo-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      Verification Code:
                    </span>
                    <span className="font-mono font-bold text-[15px] bg-white text-indigo-900 px-2.5 py-0.5 rounded-lg border border-indigo-200 tracking-widest">
                      {previewOtp}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={fillAutoOtp}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100/60 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? "Auto-Filled!" : "1-Click Auto Fill"}
                    </button>
                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs text-center"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Send via WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[12px] text-amber-800 flex items-center justify-between">
                  <span>No OTP generated yet.</span>
                  <button
                    onClick={() => handleSendOtp(phoneNumber || user.phone)}
                    className="text-[11px] font-semibold text-amber-900 underline"
                  >
                    Send OTP Now
                  </button>
                </div>
              )}

              {/* 6 Digit Input Boxes */}
              <div className="space-y-2 pt-1">
                <label className="block text-[12px] font-medium text-gray-600 text-center">
                  Enter 6-Digit OTP Code
                </label>
                <div className="flex items-center justify-center gap-2" onPaste={handlePaste}>
                  {digits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (inputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className={cn(
                        "w-11 h-12 text-center text-[18px] font-bold rounded-xl border bg-gray-50 text-gray-900 transition-all",
                        digit
                          ? "border-gray-900 bg-white ring-1 ring-gray-900"
                          : "border-gray-200 focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Resend button & timer */}
              <div className="flex items-center justify-between text-[12px] pt-1 px-1">
                <span className="text-gray-400">Didn&apos;t receive code?</span>
                {countdown > 0 ? (
                  <span className="text-gray-500 font-medium">Resend in {countdown}s</span>
                ) : (
                  <button
                    type="button"
                    disabled={sendingOtp}
                    onClick={() => handleSendOtp(phoneNumber || user.phone)}
                    className="font-medium text-gray-900 hover:underline disabled:opacity-50"
                  >
                    {sendingOtp ? "Sending…" : "Resend OTP"}
                  </button>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-10 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loading || !isComplete}
                  onClick={handleVerify}
                  className="flex-1 h-10 rounded-xl bg-emerald-600 text-white text-[13px] font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {loading ? "Verifying…" : "Confirm & Verify"}
                </button>
              </div>

              {/* Superuser Direct Bypass in Step 2 */}
              {isSuperuser && (
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    disabled={directLoading}
                    onClick={handleDirectVerify}
                    className="text-[11px] text-gray-400 hover:text-emerald-700 hover:underline transition-colors"
                  >
                    {directLoading ? "Verifying..." : "⚡ Or directly mark as verified without code (Superuser)"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

