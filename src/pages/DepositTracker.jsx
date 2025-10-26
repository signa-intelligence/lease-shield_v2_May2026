import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Wallet, Plus, Calendar, AlertTriangle, CheckCircle2, Clock, Shield, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FeatureGate, useFeatureAccess } from "../components/shared/FeatureGate";

export default function DepositTracker() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    deposit_amount: '',
    deposit_paid_date: '',
    expected_return_date: '',
    property_address: '',
    notes: ''
  });
  
  const queryClient = useQueryClient();
  const { hasAccess: hasDepositShield } = useFeatureAccess('deposit_shield');
  const { hasAccess: hasLineNotify } = useFeatureAccess('line_notify_enabled');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: deposits = [] } = useQuery({
    queryKey: ['deposits'],
    queryFn: () => base44.entities.DepositTracker.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user,
  });

  const createDepositMutation = useMutation({
    mutationFn: (data) => base44.entities.DepositTracker.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      setShowAddDialog(false);
      setFormData({
        deposit_amount: '',
        deposit_paid_date: '',
        expected_return_date: '',
        property_address: '',
        notes: ''
      });
    },
  });

  const updateDepositMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DepositTracker.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createDepositMutation.mutate({
      ...formData,
      deposit_amount: parseFloat(formData.deposit_amount),
      status: 'tracking'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      tracking: "bg-blue-100 text-blue-800 border-blue-200",
      returned: "bg-emerald-100 text-emerald-800 border-emerald-200",
      dispute: "bg-red-100 text-red-800 border-red-200"
    };
    return colors[status] || "bg-slate-100 text-slate-800";
  };

  const getStatusIcon = (status) => {
    const icons = {
      tracking: Clock,
      returned: CheckCircle2,
      dispute: AlertTriangle
    };
    const Icon = icons[status] || Clock;
    return <Icon className="w-5 h-5" />;
  };

  const getDaysRemaining = (date) => {
    return differenceInDays(new Date(date), new Date());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-slate-900">Deposit Tracker</h1>
            </div>
            <p className="text-slate-600">Monitor your security deposits</p>
          </div>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-lg">
                <Plus className="w-5 h-5 mr-2" />
                Add Deposit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Track New Deposit</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="amount">Deposit Amount (฿)</Label>
                  <Input
                    id="amount"
                    type="number"
                    required
                    value={formData.deposit_amount}
                    onChange={(e) => setFormData({...formData, deposit_amount: e.target.value})}
                    placeholder="10000"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Property Address</Label>
                  <Input
                    id="address"
                    value={formData.property_address}
                    onChange={(e) => setFormData({...formData, property_address: e.target.value})}
                    placeholder="123 Main St, Bangkok"
                  />
                </div>
                <div>
                  <Label htmlFor="paid_date">Date Paid</Label>
                  <Input
                    id="paid_date"
                    type="date"
                    required
                    value={formData.deposit_paid_date}
                    onChange={(e) => setFormData({...formData, deposit_paid_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="return_date">Expected Return Date</Label>
                  <Input
                    id="return_date"
                    type="date"
                    required
                    value={formData.expected_return_date}
                    onChange={(e) => setFormData({...formData, expected_return_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Any additional details..."
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                  Track Deposit
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Deposit Shield Feature Banner */}
        <FeatureGate feature="deposit_shield">
          <Card className="mb-6 border-none shadow-lg bg-gradient-to-r from-emerald-500 to-emerald-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">Deposit Shield Active</h3>
                  <p className="text-emerald-50 text-sm">
                    Your deposits are protected with automatic reminders and dispute assistance
                  </p>
                </div>
                {hasLineNotify && (
                  <Button variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                    <Bell className="w-4 h-4 mr-2" />
                    LINE Notify
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </FeatureGate>

        <div className="grid gap-6">
          {deposits.length === 0 ? (
            <Card className="border-none shadow-xl">
              <CardContent className="p-12 text-center">
                <Wallet className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Deposits Tracked</h3>
                <p className="text-slate-600 mb-6">Start tracking your security deposits to get return reminders</p>
                <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Your First Deposit
                </Button>
              </CardContent>
            </Card>
          ) : (
            deposits.map((deposit) => {
              const daysRemaining = getDaysRemaining(deposit.expected_return_date);
              const isUrgent = daysRemaining <= 30 && deposit.status === 'tracking';
              
              return (
                <Card key={deposit.id} className={`border-none shadow-lg hover:shadow-xl transition-all duration-300 ${isUrgent ? 'ring-2 ring-amber-400' : ''}`}>
                  <CardHeader className="border-b border-slate-100 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(deposit.status)}
                        <div>
                          <CardTitle className="text-2xl font-bold text-slate-900">
                            ฿{deposit.deposit_amount.toLocaleString()}
                          </CardTitle>
                          {deposit.property_address && (
                            <p className="text-sm text-slate-600 mt-1">{deposit.property_address}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={`${getStatusColor(deposit.status)} border`}>
                          {deposit.status.toUpperCase()}
                        </Badge>
                        {hasDepositShield && deposit.status === 'tracking' && (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                            <Shield className="w-3 h-3 mr-1" />
                            Protected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                          <Calendar className="w-4 h-4" />
                          Paid Date
                        </div>
                        <p className="font-semibold text-slate-900">
                          {format(new Date(deposit.deposit_paid_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                          <Calendar className="w-4 h-4" />
                          Expected Return
                        </div>
                        <p className="font-semibold text-slate-900">
                          {format(new Date(deposit.expected_return_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      {deposit.status === 'tracking' && (
                        <div>
                          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                            <Clock className="w-4 h-4" />
                            Days Remaining
                          </div>
                          <p className={`font-semibold ${isUrgent ? 'text-amber-600' : 'text-slate-900'}`}>
                            {daysRemaining} days
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {deposit.notes && (
                      <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                        <p className="text-sm text-slate-700">{deposit.notes}</p>
                      </div>
                    )}

                    {hasLineNotify && deposit.status === 'tracking' && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800 flex items-center gap-2">
                          <Bell className="w-4 h-4" />
                          <span>
                            {daysRemaining <= 30 ? '30-day' : daysRemaining <= 7 ? '7-day' : 'Automated'} reminder will be sent via LINE & Email
                          </span>
                        </p>
                      </div>
                    )}

                    {deposit.status === 'tracking' && (
                      <div className="flex gap-3 mt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateDepositMutation.mutate({ 
                            id: deposit.id, 
                            data: { status: 'returned' } 
                          })}
                          className="flex-1"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Mark Returned
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateDepositMutation.mutate({ 
                            id: deposit.id, 
                            data: { status: 'dispute' } 
                          })}
                          className="flex-1 text-red-600 hover:text-red-700"
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Open Dispute
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}