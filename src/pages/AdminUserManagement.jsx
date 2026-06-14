import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, Shield, Edit, RefreshCw, Loader2, FileText, Scale, ChevronLeft, ChevronRight, Crown, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import AuthGuard from "../components/shared/AuthGuard";
import PageHeader from "../components/shared/PageHeader";
import { ToastProvider, useToast } from "../components/shared/Toast";
import { createPageUrl } from "@/utils";
import EditCreditsModal from "../components/admin/EditCreditsModal";

const USERS_PER_PAGE = 15;

function AdminUserManagementContent() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [overrideFilter, setOverrideFilter] = useState("all");
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = currentUser && (
    ['admin', 'super_admin', 'va'].includes(currentUser.role) ||
    ['admin', 'super_admin', 'va'].includes(currentUser.access_level)
  );

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      const response = await base44.functions.invoke('adminListUsers');
      return response.data?.users || [];
    },
    enabled: !!isAdmin,
  });

  const filteredUsers = useMemo(() => {
    let result = users;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.email?.toLowerCase().includes(q) ||
          u.full_name?.toLowerCase().includes(q)
      );
    }

    if (tierFilter !== "all") {
      result = result.filter((u) => (u.plan_tier || "explorer") === tierFilter);
    }

    if (overrideFilter === "true") {
      result = result.filter((u) => u.manual_tier_override === true);
    } else if (overrideFilter === "false") {
      result = result.filter((u) => !u.manual_tier_override);
    }

    return result;
  }, [users, searchQuery, tierFilter, overrideFilter]);

  // Reset page when filters change
  React.useEffect(() => { setCurrentPage(1); }, [searchQuery, tierFilter, overrideFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE
  );

  const handleSaveCredits = async (userId, data) => {
    await base44.entities.User.update(userId, data);
    toast.success("User credits updated");
    queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
  };

  const handleQuickToggleOverride = async (user) => {
    const newValue = !user.manual_tier_override;
    await base44.entities.User.update(user.id, { manual_tier_override: newValue });
    toast.success(newValue ? "Manual override enabled" : "Manual override disabled");
    queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Admin access required</p>
      </div>
    );
  }

  const tierColor = (tier) => {
    switch ((tier || "free").toLowerCase()) {
      case "secure": return "bg-emerald-100 text-emerald-700";
      case "protect": return "bg-blue-100 text-blue-700";
      case "lite": return "bg-purple-100 text-purple-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const formatCredits = (val) => {
    if (val === 999999 || val === 999) return "∞";
    return val ?? 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="User Management"
          subtitle={`${users.length} users total`}
          icon={Users}
          iconColor="#0C3B2E"
          showBack
          backRoute={createPageUrl("AdminConsole")}
        />

        {/* Search & Filters */}
        <Card className="border-none shadow-lg mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by email or name..."
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={tierFilter} onValueChange={setTierFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="All Tiers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="explorer">Explorer</SelectItem>
                    <SelectItem value="lite">Lite</SelectItem>
                    <SelectItem value="protect">Protect</SelectItem>
                    <SelectItem value="secure">Secure</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={overrideFilter} onValueChange={setOverrideFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="true">Manual Override</SelectItem>
                    <SelectItem value="false">Stripe Only</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => refetch()} title="Refresh">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Users ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50/80">
                      <th className="text-left p-3 font-semibold">User</th>
                      <th className="text-left p-3 font-semibold">Tier</th>
                      <th className="text-center p-3 font-semibold">
                        <div className="flex items-center justify-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-blue-600" />
                          <span>Scans</span>
                        </div>
                      </th>
                      <th className="text-center p-3 font-semibold">
                        <div className="flex items-center justify-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-purple-600" />
                          <span>Letters</span>
                        </div>
                      </th>
                      <th className="text-center p-3 font-semibold">
                        <div className="flex items-center justify-center gap-1">
                          <Scale className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Cases</span>
                        </div>
                      </th>
                      <th className="text-left p-3 font-semibold">Joined</th>
                      <th className="text-center p-3 font-semibold">Free Scan</th>
                      <th className="text-left p-3 font-semibold">Last Login</th>
                      <th className="text-center p-3 font-semibold">Override</th>
                      <th className="text-center p-3 font-semibold">
                        <div className="flex items-center justify-center gap-1">
                          <Crown className="w-3.5 h-3.5 text-purple-600" />
                          <span>Role</span>
                        </div>
                      </th>
                      <th className="text-center p-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((u) => {
                      const isOverride = u.manual_tier_override;
                      return (
                        <tr key={u.id} className="border-b hover:bg-gray-50/50 transition-colors">
                          <td className="p-3">
                            <div className="min-w-0">
                              <p className="font-medium truncate max-w-[180px]">{u.full_name || "—"}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[180px]">{u.email}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge className={tierColor(u.plan_tier)}>
                              {(u.plan_tier || "explorer").toUpperCase()}
                            </Badge>
                            {!u.stripe_subscription_id && u.plan_tier && u.plan_tier !== "explorer" && u.plan_tier !== "free" && (
                              <p className="text-[10px] text-amber-600 mt-0.5">No Stripe</p>
                            )}
                          </td>
                          {/* Scan Credits */}
                          <td className="p-3 text-center">
                            <div>
                              <span className={`font-mono text-sm font-bold ${isOverride ? 'text-amber-600' : 'text-gray-900'}`}>
                                {isOverride
                                  ? formatCredits(u.manual_scan_credits)
                                  : formatCredits(u.available_scans)
                                }
                              </span>
                              <p className="text-[10px] text-gray-400">scans</p>
                            </div>
                          </td>
                          {/* Letter Credits */}
                          <td className="p-3 text-center">
                            <div>
                              <span className={`font-mono text-sm font-bold ${isOverride ? 'text-amber-600' : 'text-gray-900'}`}>
                                {isOverride && u.manual_letter_credits != null
                                  ? formatCredits(u.manual_letter_credits)
                                  : formatCredits(u.letter_credits)
                                }
                              </span>
                              <p className="text-[10px] text-gray-400">letters</p>
                            </div>
                          </td>
                          {/* Case Credits */}
                          <td className="p-3 text-center">
                            <div>
                              <span className={`font-mono text-sm font-bold ${isOverride ? 'text-amber-600' : 'text-gray-900'}`}>
                                {formatCredits(u.manual_case_credits)}
                              </span>
                              <p className="text-[10px] text-gray-400">free cases</p>
                            </div>
                          </td>
                          {/* Joined */}
                          <td className="p-3 text-xs text-gray-600 whitespace-nowrap">
                           {u.created_date
                             ? new Date(u.created_date).toLocaleDateString('en-GB')
                             : '—'}
                          </td>
                          {/* Free Scan */}
                          <td className="p-3 text-center">
                           {(u.plan_tier || 'explorer') === 'explorer' || (u.plan_tier || 'explorer') === 'free'
                             ? (
                               <span className={`text-xs font-semibold ${(u.free_scans_used ?? 0) >= 1 ? 'text-red-500' : 'text-emerald-600'}`}>
                                 {(u.free_scans_used ?? 0) >= 1 ? 'Used' : 'Available'}
                               </span>
                             )
                             : <span className="text-xs text-gray-400">—</span>
                           }
                          </td>
                          {/* Last Login */}
                          <td className="p-3 text-xs text-gray-600 whitespace-nowrap">
                           {u.last_login
                             ? new Date(u.last_login).toLocaleDateString('en-GB')
                             : '—'}
                          </td>
                          {/* Override Toggle */}
                          <td className="p-3 text-center">
                            <Switch
                              checked={isOverride || false}
                              onCheckedChange={() => handleQuickToggleOverride(u)}
                            />
                          </td>
                          {/* Role */}
                          <td className="p-3 text-center">
                            <Select
                              value={u.access_level || u.role || 'user'}
                              onValueChange={async (newRole) => {
                                if (newRole === (u.access_level || u.role || 'user')) return;
                                const isSuperAdmin = currentUser?.access_level === 'super_admin';
                                if (!isSuperAdmin && (newRole === 'super_admin' || newRole === 'admin')) {
                                  toast.error("Only Super Admins can assign admin roles");
                                  return;
                                }
                                if (u.id === currentUser?.id) {
                                  toast.error("Cannot change your own role");
                                  return;
                                }
                                try {
                                  const res = await base44.functions.invoke('adminUpdateUserRole', { userId: u.id, role: newRole });
                                  if (res.data?.error) {
                                    toast.error(res.data.error);
                                  } else {
                                    toast.success(`Role updated to ${newRole}`);
                                    queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
                                  }
                                } catch (err) {
                                  const msg = err?.response?.data?.error || err.message || "Failed to update role";
                                  console.error('[ROLE_UPDATE_ERROR]', msg);
                                  toast.error(msg);
                                }
                              }}
                            >
                              <SelectTrigger className="w-[120px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="va">VA</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                {currentUser?.access_level === 'super_admin' && (
                                  <SelectItem value="super_admin">Super Admin</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </td>
                          {/* Actions */}
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingUser(u)}
                                className="gap-1"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDeletingUser(u)}
                                className="gap-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    No users found
                  </div>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </Button>
                <span className="text-sm font-medium text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <EditCreditsModal
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        onSave={handleSaveCredits}
      />

      <AlertDialog open={!!deletingUser} onOpenChange={(open) => { if (!open) setDeletingUser(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this user? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                const userEmail = deletingUser?.email;
                setDeletingUser(null);
                try {
                  const res = await base44.functions.invoke('adminDeleteUserData', {
                    targetUserEmail: userEmail,
                    reason: 'admin_manual_delete'
                  });
                  if (res.data?.ok) {
                    toast.success("User deleted");
                  } else {
                    toast.error(res.data?.message || "Failed to delete user");
                  }
                  queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
                } catch (err) {
                  toast.error(err?.response?.data?.message || err.message || "Failed to delete user");
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function AdminUserManagement() {
  return (
    <AuthGuard>
      <ToastProvider>
        <AdminUserManagementContent />
      </ToastProvider>
    </AuthGuard>
  );
}