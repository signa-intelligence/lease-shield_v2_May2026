import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Minus, Edit, AlertCircle, User, CreditCard, Clock } from "lucide-react";
import { haptic } from "../components/shared/HapticFeedback";
import { useToast } from "../components/shared/Toast";
import PageHeader from "../components/shared/PageHeader";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function AdminCredits() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: users = [], isLoading: searchLoading } = useQuery({
    queryKey: ['adminUsers', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const allUsers = await base44.asServiceRole.entities.User.list();
      return allUsers.filter(u => 
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.id?.includes(searchQuery)
      ).slice(0, 20);
    },
    enabled: searchQuery.length >= 2
  });

  const { data: creditHistory = [] } = useQuery({
    queryKey: ['creditHistory', selectedUser?.id],
    queryFn: () => base44.asServiceRole.entities.CreditLedger.filter(
      { user_id: selectedUser.id },
      '-created_date',
      50
    ),
    enabled: !!selectedUser
  });

  const modifyCreditsMutation = useMutation({
    mutationFn: async ({ action, value, note }) => {
      const response = await base44.asServiceRole.functions.invoke('adminModifyCredits', {
        userId: selectedUser.id,
        action,
        amount: parseInt(value),
        reason: note,
        adminUserId: currentUser.id,
        adminEmail: currentUser.email
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Credits updated: ${data.previousBalance} → ${data.newBalance}`);
        queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
        queryClient.invalidateQueries({ queryKey: ['creditHistory'] });
        setSelectedUser({ ...selectedUser, letter_credits: data.newBalance });
        setActionModal(null);
        setAmount("");
        setReason("");
        haptic.success();
      } else {
        throw new Error(data.error || 'Failed to modify credits');
      }
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
      haptic.error();
    }
  });

  const handleConfirmAction = () => {
    if (!amount || parseInt(amount) < 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    haptic.medium();
    modifyCreditsMutation.mutate({
      action: actionModal,
      value: amount,
      note: reason
    });
  };

  const isDarkMode = currentUser?.theme === 'dark';
  const colors = {
    bg: isDarkMode ? '#1A1D1F' : '#F9FAFB',
    cardBg: isDarkMode ? '#2A2D30' : '#FFFFFF',
    textPrimary: isDarkMode ? '#ECEFED' : '#1A1D1F',
    textSecondary: isDarkMode ? '#9CA3AF' : '#6B7280',
    borderColor: isDarkMode ? '#3A3D40' : '#E5E7EB'
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.access_level === 'admin' || 
                  currentUser?.role === 'super_admin' || currentUser?.access_level === 'super_admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
        <Card style={{ backgroundColor: colors.cardBg }}>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
            <h2 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              Admin Access Required
            </h2>
            <p style={{ color: colors.textSecondary }}>
              This page is only accessible to administrators.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Letter Credits Management"
          subtitle="Grant and manage user letter credits"
          icon={CreditCard}
          colors={colors}
          isDarkMode={isDarkMode}
          showBack
          backRoute={createPageUrl("AdminConsole")}
        />

        {/* Search Section */}
        <Card className="mb-6" style={{ backgroundColor: colors.cardBg }}>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: colors.textSecondary }} />
              <Input
                type="text"
                placeholder="Search by email, name, or user ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                style={{
                  backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                  borderColor: colors.borderColor,
                  color: colors.textPrimary
                }}
              />
            </div>

            {searchQuery.length >= 2 && (
              <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                {searchLoading ? (
                  <p className="text-center py-4" style={{ color: colors.textSecondary }}>Searching...</p>
                ) : users.length === 0 ? (
                  <p className="text-center py-4" style={{ color: colors.textSecondary }}>No users found</p>
                ) : (
                  users.map(user => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSelectedUser(user);
                        haptic.light();
                      }}
                      className="w-full p-3 rounded-lg text-left transition-all hover:shadow-md"
                      style={{
                        backgroundColor: selectedUser?.id === user.id ? '#0C3B2E' : (isDarkMode ? '#353A3D' : '#F8FAFC'),
                        color: selectedUser?.id === user.id ? '#FFFFFF' : colors.textPrimary
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{user.full_name || user.email}</p>
                          <p className="text-xs opacity-75">{user.email}</p>
                        </div>
                        <Badge className={selectedUser?.id === user.id ? 'bg-white/20' : ''}>
                          {user.letter_credits || 0} credits
                        </Badge>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected User Details */}
        {selectedUser && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* User Info + Actions */}
            <Card style={{ backgroundColor: colors.cardBg }}>
              <CardHeader>
                <CardTitle style={{ color: colors.textPrimary }}>User Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC' }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#0C3B2E' }}>
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold" style={{ color: colors.textPrimary }}>{selectedUser.full_name}</p>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>{selectedUser.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC' }}>
                    <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>Plan Tier</p>
                    <p className="font-bold" style={{ color: colors.textPrimary }}>
                      {selectedUser.plan_tier || 'free'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1E4435' : '#ECFDF5' }}>
                    <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>Letter Credits</p>
                    <p className="font-bold text-2xl" style={{ color: '#10B981' }}>
                      {selectedUser.letter_credits || 0}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      setActionModal('ADD');
                      haptic.light();
                    }}
                    className="w-full"
                    style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Credits
                  </Button>
                  <Button
                    onClick={() => {
                      setActionModal('REMOVE');
                      haptic.light();
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <Minus className="w-4 h-4 mr-2" />
                    Remove Credits
                  </Button>
                  <Button
                    onClick={() => {
                      setActionModal('SET');
                      haptic.light();
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Set Credits
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Credit History */}
            <Card style={{ backgroundColor: colors.cardBg }}>
              <CardHeader>
                <CardTitle style={{ color: colors.textPrimary }}>Credit History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {creditHistory.length === 0 ? (
                    <p className="text-center py-8" style={{ color: colors.textSecondary }}>
                      No credit history yet
                    </p>
                  ) : (
                    creditHistory.map(entry => (
                      <div
                        key={entry.id}
                        className="p-3 rounded-lg border"
                        style={{
                          backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                          borderColor: colors.borderColor
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={
                            entry.action_type === 'ADD' ? 'bg-green-100 text-green-700' :
                            entry.action_type === 'REMOVE' ? 'bg-red-100 text-red-700' :
                            entry.action_type === 'SET' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }>
                            {entry.action_type}
                          </Badge>
                          <span className="text-xs" style={{ color: colors.textSecondary }}>
                            {format(new Date(entry.created_date), 'MMM d, HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm font-semibold mb-1" style={{ color: colors.textPrimary }}>
                          {entry.previous_balance} → {entry.new_balance}
                          <span className="ml-2 text-xs opacity-75">
                            ({entry.amount > 0 ? '+' : ''}{entry.amount})
                          </span>
                        </p>
                        {entry.reason && (
                          <p className="text-xs" style={{ color: colors.textSecondary }}>{entry.reason}</p>
                        )}
                        {entry.admin_email && (
                          <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                            by {entry.admin_email}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Modal */}
        <Dialog open={!!actionModal} onOpenChange={() => setActionModal(null)}>
          <DialogContent style={{ backgroundColor: colors.cardBg }}>
            <DialogHeader>
              <DialogTitle style={{ color: colors.textPrimary }}>
                {actionModal === 'ADD' ? 'Add Credits' :
                 actionModal === 'REMOVE' ? 'Remove Credits' :
                 'Set Credits'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                  {actionModal === 'SET' ? 'New Balance' : 'Amount'}
                </label>
                <Input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  style={{
                    backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                  Reason
                </label>
                <Input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Manual top-up, Refund, Correction"
                  style={{
                    backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                />
              </div>

              {selectedUser && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1E3A5F' : '#EFF6FF' }}>
                  <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>Preview</p>
                  <p className="font-bold" style={{ color: colors.textPrimary }}>
                    Current: {selectedUser.letter_credits || 0} →{' '}
                    New: {
                      actionModal === 'SET' ? (parseInt(amount) || 0) :
                      actionModal === 'ADD' ? ((selectedUser.letter_credits || 0) + (parseInt(amount) || 0)) :
                      Math.max(0, (selectedUser.letter_credits || 0) - (parseInt(amount) || 0))
                    }
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setActionModal(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmAction}
                disabled={!amount || !reason.trim() || modifyCreditsMutation.isPending}
                style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}
              >
                {modifyCreditsMutation.isPending ? 'Applying...' : 'Confirm'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}