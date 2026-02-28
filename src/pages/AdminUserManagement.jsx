import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Users, Search, Shield, Edit, RefreshCw, Loader2 } from "lucide-react";
import AuthGuard from "../components/shared/AuthGuard";
import PageHeader from "../components/shared/PageHeader";
import { ToastProvider, useToast } from "../components/shared/Toast";
import EditCreditsModal from "../components/admin/EditCreditsModal";

function AdminUserManagementContent() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState(null);

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
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.full_name?.toLowerCase().includes(q) ||
        u.plan_tier?.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="User Management"
          subtitle={`${users.length} users total`}
          icon={Users}
          iconColor="#0C3B2E"
          showBack
        />

        {/* Search & Actions */}
        <Card className="border-none shadow-lg mb-6">
          <CardContent className="p-4">
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by email, name, or tier..."
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
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
                    <tr className="border-b bg-gray-50/50">
                      <th className="text-left p-3 font-semibold">User</th>
                      <th className="text-left p-3 font-semibold">Tier</th>
                      <th className="text-center p-3 font-semibold">Letters</th>
                      <th className="text-center p-3 font-semibold">Scans</th>
                      <th className="text-center p-3 font-semibold">Cases</th>
                      <th className="text-center p-3 font-semibold">Override</th>
                      <th className="text-center p-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b hover:bg-gray-50/50 transition-colors">
                        <td className="p-3">
                          <div className="min-w-0">
                            <p className="font-medium truncate max-w-[200px]">{u.full_name || "—"}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{u.email}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className={tierColor(u.plan_tier)}>
                            {(u.plan_tier || "free").toUpperCase()}
                          </Badge>
                          {!u.stripe_subscription_id && u.plan_tier && u.plan_tier !== "free" && (
                            <p className="text-[10px] text-amber-600 mt-0.5">No Stripe</p>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-mono text-xs">
                            {u.manual_tier_override && u.manual_letter_credits != null
                              ? <span className="text-amber-600 font-bold">{u.manual_letter_credits}</span>
                              : u.letter_credits ?? 0}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-mono text-xs">
                            {u.manual_tier_override && u.manual_scan_credits != null
                              ? <span className="text-amber-600 font-bold">{u.manual_scan_credits}</span>
                              : u.available_scans ?? 0}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-mono text-xs">
                            {u.manual_tier_override
                              ? <span className="text-amber-600 font-bold">{u.manual_case_credits ?? 0}</span>
                              : "—"}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <Switch
                            checked={u.manual_tier_override || false}
                            onCheckedChange={() => handleQuickToggleOverride(u)}
                          />
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingUser(u)}
                            className="gap-1"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    No users found
                  </div>
                )}
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