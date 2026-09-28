import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Search,
  KeyRound,
  UserX,
  UserCheck,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";
import { AuthUser, UserRole } from "../../types/auth";
import { cn } from "../../lib/utils";

export const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [roleModalUser, setRoleModalUser] = useState<AuthUser | null>(null);
  const [resetModalUser, setResetModalUser] = useState<AuthUser | null>(null);
  const [statusConfirmUser, setStatusConfirmUser] = useState<AuthUser | null>(null);

  // Form states
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("OPERATOR");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Role change form
  const [selectedRole, setSelectedRole] = useState<UserRole>("OPERATOR");

  // Reset password form
  const [resetPasswordVal, setResetPasswordVal] = useState("");

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authService.getUsers();
      setUsers(data.users);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load station users.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await authService.createUser({
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole
      });
      setSuccess(`User ${newName} (${newRole}) registered successfully.`);
      setCreateModalOpen(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("OPERATOR");
      fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to register user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeRole = async () => {
    if (!roleModalUser) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await authService.changeRole(roleModalUser.id, selectedRole);
      setSuccess(`Role updated to ${selectedRole} for ${roleModalUser.name}.`);
      setRoleModalUser(null);
      fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update role.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!statusConfirmUser) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const newStatus = !statusConfirmUser.isActive;
      await authService.changeStatus(statusConfirmUser.id, newStatus);
      setSuccess(`Account status updated for ${statusConfirmUser.name}.`);
      setStatusConfirmUser(null);
      fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update user status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser) return;
    if (resetPasswordVal.length < 8) {
      setError("Temporary password must be at least 8 characters.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await authService.resetPassword(resetModalUser.id, resetPasswordVal);
      setSuccess(`Password reset successfully for ${resetModalUser.name}.`);
      setResetModalUser(null);
      setResetPasswordVal("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeAdminsCount = users.filter((u) => u.role === "ADMIN" && u.isActive).length;

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" ? u.isActive : !u.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        return "bg-indigo-950/80 text-indigo-300 border-indigo-700/60 shadow-ice-glow";
      case "OPERATOR":
        return "bg-sky-950/80 text-sky-300 border-sky-700/60";
      case "VIEWER":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-700/60";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-100 tracking-wide">
                User Management & Access Control
              </h1>
              <p className="text-xs text-slate-400">
                Manage Antarctic station personnel, role permissions, and authentication accounts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-ice-glow hover:opacity-95 transition-opacity"
          >
            <UserPlus className="h-4 w-4" />
            <span>Register Personnel</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search personnel by name or email..."
            className="w-full rounded-lg border border-slate-700 bg-slate-950/80 pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950/80 px-2.5 py-1.5 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="OPERATOR">OPERATOR</option>
              <option value="VIEWER">VIEWER</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950/80 px-2.5 py-1.5 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Disabled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-bold tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Station Personnel</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Last Authentication</th>
                <th className="py-3 px-4">Registered On</th>
                <th className="py-3 px-4 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-sky-400 mb-2" />
                    <span>Loading personnel roster...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                    <span>No personnel match your search filters.</span>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  const isSoleAdmin = u.role === "ADMIN" && activeAdminsCount <= 1;

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 border border-slate-700 font-bold text-sky-300">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isSelf && (
                                <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[9px] font-bold text-sky-300 border border-sky-500/30">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border",
                            getRoleBadgeVariant(u.role)
                          )}
                        >
                          <Shield className="h-3 w-3" />
                          <span>{u.role}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-red-400 font-semibold text-[11px]">
                            <span className="h-2 w-2 rounded-full bg-red-400" />
                            <span>Disabled</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never"}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setRoleModalUser(u);
                              setSelectedRole(u.role);
                            }}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-sky-300 transition-colors"
                            title="Change Role"
                          >
                            <Shield className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => setResetModalUser(u)}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-amber-300 transition-colors"
                            title="Reset Password"
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => setStatusConfirmUser(u)}
                            disabled={isSelf || (isSoleAdmin && u.isActive)}
                            className={cn(
                              "rounded p-1.5 transition-colors",
                              u.isActive
                                ? "text-slate-400 hover:bg-slate-800 hover:text-red-400"
                                : "text-slate-400 hover:bg-slate-800 hover:text-emerald-400",
                              (isSelf || (isSoleAdmin && u.isActive)) &&
                                "opacity-30 cursor-not-allowed"
                            )}
                            title={
                              isSelf
                                ? "Cannot disable your own account"
                                : isSoleAdmin && u.isActive
                                ? "Cannot disable the last active administrator"
                                : u.isActive
                                ? "Deactivate User"
                                : "Activate User"
                            }
                          >
                            {u.isActive ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create User */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-sky-400" />
                <h3 className="text-base font-bold text-slate-100">Register Station Personnel</h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name & Designation
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  placeholder="e.g. Dr. Rajesh Sharma"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Official Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  placeholder="name@polaris.local"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Role Assignment
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
                >
                  <option value="VIEWER">VIEWER (Read-only station access)</option>
                  <option value="OPERATOR">OPERATOR (Station operations & telemetry)</option>
                  <option value="ADMIN">ADMIN (Full administrative clearance)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-xs font-bold text-white hover:bg-sky-400 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Change Role */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">Update User Role</h3>
              <button
                onClick={() => setRoleModalUser(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <p className="text-xs text-slate-300">
                Updating role for <span className="font-semibold text-sky-400">{roleModalUser.name}</span> ({roleModalUser.email}).
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select New Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="OPERATOR">OPERATOR</option>
                  <option value="VIEWER">VIEWER</option>
                </select>
              </div>

              {roleModalUser.role === "ADMIN" && selectedRole !== "ADMIN" && activeAdminsCount <= 1 && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-300">
                  ⚠️ This user is currently the sole active administrator. Demoting them is blocked by system safety policy.
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRoleModalUser(null)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleChangeRole}
                  disabled={isSubmitting || (roleModalUser.role === "ADMIN" && selectedRole !== "ADMIN" && activeAdminsCount <= 1)}
                  className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-xs font-bold text-white hover:bg-sky-400 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save Role</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Toggle Status Confirm */}
      {statusConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">
                {statusConfirmUser.isActive ? "Deactivate Account" : "Activate Account"}
              </h3>
              <button
                onClick={() => setStatusConfirmUser(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <p className="text-xs text-slate-300">
                Are you sure you want to {statusConfirmUser.isActive ? "deactivate" : "reactivate"} access for{" "}
                <span className="font-semibold text-sky-400">{statusConfirmUser.name}</span>?
              </p>
              {statusConfirmUser.isActive && (
                <p className="text-[11px] text-slate-400">
                  The user will be immediately logged out and unable to authenticate into POLARIS.
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStatusConfirmUser(null)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  disabled={isSubmitting}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold text-white transition-colors disabled:opacity-50",
                    statusConfirmUser.isActive ? "bg-red-600 hover:bg-red-500" : "bg-emerald-600 hover:bg-emerald-500"
                  )}
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{statusConfirmUser.isActive ? "Deactivate" : "Activate"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">Reset User Credentials</h3>
              <button
                onClick={() => setResetModalUser(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
              <p className="text-xs text-slate-300">
                Issue a new password for <span className="font-semibold text-sky-400">{resetModalUser.name}</span>. Existing sessions will be terminated immediately.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  New Temporary Password
                </label>
                <input
                  type="password"
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-500 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Confirm Reset</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
