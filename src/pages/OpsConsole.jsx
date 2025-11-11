import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Scale,
  User,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2,
  Mail,
  DollarSign,
  Search,
  Filter,
  Loader2,
  ArrowLeft,
  LayoutGrid,
  List,
  Target
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CaseKanban from "../components/admin/CaseKanban";
import { ToastProvider, useToast } from "../components/shared/Toast";

const STATUS_CONFIG = {
  intake: { label: 'Intake', color: 'bg-slate-100 text-slate-800', icon: Clock },
  pending_review: { label: 'Pending Review', color: 'bg-amber-100 text-amber-800', icon: Clock },
  under_review: { label: 'Under Review', color: 'bg-blue-100 text-blue-800', icon: Scale },
  ready_drafts: { label: 'Drafts Ready', color: 'bg-purple-100 text-purple-800', icon: FileText },
  client_review: { label: 'Client Review', color: 'bg-indigo-100 text-indigo-800', icon: User },
  awaiting_landlord: { label: 'Awaiting Landlord', color: 'bg-yellow-100 text-yellow-800', icon: Mail },
  in_progress: { label: 'In Progress', color: 'bg-cyan-100 text-cyan-800', icon: Clock },
  resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800', icon: CheckCircle2 }
};

function OpsConsoleContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [selectedCase, setSelectedCase] = useState(null);
  const [actionMode, setActionMode] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [generatingLetters, setGeneratingLetters] = useState(null);
  const [viewMode, setViewMode] = useState('kanban');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const accessLevel = user?.access_level || 'user';
  const hasOpsAccess = ['va', 'admin', 'super_admin'].includes(accessLevel) || user?.role === 'admin';

  const { data: cases = [] } = useQuery({
    queryKey: ['allCases'],
    queryFn: () => base44.entities.Case.list('-created_date'),
    enabled: hasOpsAccess,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: hasOpsAccess,
  });

  const updateCaseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Case.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allCases'] });
      toast.success(language === 'th' ? 'อัปเดตคดีสำเร็จ' : 'Case updated successfully');
      setSelectedCase(null);
      setActionMode(null);
    },
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40',
    statBg: '#353A3D',
    modalBg: '#2A2D30',
    inputBg: '#353A3D',
    inputBorder: '#4A4D50'
  } : {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB',
    statBg: '#FFFFFF',
    modalBg: '#FFFFFF',
    inputBg: '#FFFFFF',
    inputBorder: '#E5E7EB'
  };

  if (!hasOpsAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: colors.bg }}>
        <Card className="max-w-md border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardContent className="p-8 text-center">
            <Scale className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              {language === 'th' ? 'ไม่ได้รับอนุญาต' : 'Unauthorized'}
            </h2>
            <p style={{ color: colors.textSecondary }}>
              {language === 'th'
                ? 'คุณต้องมีสิทธิ์ VA, Admin หรือ Super Admin เพื่อเข้าถึงหน้านี้'
                : 'You need VA, Admin, or Super Admin access to view this page.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredCases = cases.filter(c => {
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesSearch = !searchQuery ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.case_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleUpdateStatus = (caseId, newStatus) => {
    const existingCase = cases.find(c => c.id === caseId);
    const timeline = existingCase?.timeline || [];

    timeline.push({
      timestamp: new Date().toISOString(),
      event: `Status changed to ${newStatus}`,
      actor: user.email
    });

    updateCaseMutation.mutate({
      id: caseId,
      data: { status: newStatus, timeline }
    });
  };

  const handleAssign = (caseId, assigneeEmail) => {
    const existingCase = cases.find(c => c.id === caseId);
    const timeline = existingCase?.timeline || [];

    timeline.push({
      timestamp: new Date().toISOString(),
      event: `Assigned to ${assigneeEmail}`,
      actor: user.email
    });

    updateCaseMutation.mutate({
      id: caseId,
      data: { assignee_id: assigneeEmail, timeline }
    });
  };

  const handleRecordSettlement = (caseId, settlementData) => {
    const existingCase = cases.find(c => c.id === caseId);
    const timeline = existingCase?.timeline || [];

    timeline.push({
      timestamp: new Date().toISOString(),
      event: `Settlement recorded: ฿${settlementData.amount}`,
      actor: user.email,
      meta: settlementData
    });

    updateCaseMutation.mutate({
      id: caseId,
      data: {
        status: 'resolved',
        settlement: {
          ...settlementData,
          date: new Date().toISOString()
        },
        timeline
      }
    });
  };

  const handleGenerateLetter = async (caseItem, subject) => {
    setGeneratingLetters(`${caseItem.id}-${subject}`);
    try {
      const response = await base44.functions.invoke('generatePhase1Letter', {
        caseId: caseItem.id,
        subject: subject
      });

      if (response.data?.ok) {
        queryClient.invalidateQueries({ queryKey: ['allCases'] });
        toast.success(`${subject.toUpperCase()} letter generated!`);
      } else {
        throw new Error(response.data?.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Letter generation failed:', error);
      toast.error('Failed to generate letter');
    } finally {
      setGeneratingLetters(null);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl("AdminConsole"))}
            className="mb-4"
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.borderColor,
              color: colors.textPrimary
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'th' ? 'กลับไปแอดมิน' : 'Back to Admin'}
          </Button>
          
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Scale className="w-8 h-8 text-ls-forest" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold" style={{ color: colors.textPrimary }}>
                  {language === 'th' ? 'คอนโซลปฏิบัติการ' : 'Ops Console'}
                </h1>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  {language === 'th' ? 'จัดการคดีพิพาทจนถึงการแก้ปัญหา' : 'Manage dispute cases through resolution'}
                </p>
              </div>
            </div>

            <div 
              className="flex rounded-lg p-1"
              style={{ 
                backgroundColor: colors.cardBg,
                border: `2px solid ${colors.borderColor}`,
              }}
            >
              <button
                onClick={() => setViewMode('kanban')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: viewMode === 'kanban' ? '#0C3B2E' : 'transparent',
                  color: viewMode === 'kanban' ? '#FFFFFF' : colors.textPrimary,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <LayoutGrid className="w-4 h-4" />
                Kanban
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: viewMode === 'list' ? '#0C3B2E' : 'transparent',
                  color: viewMode === 'list' ? '#FFFFFF' : colors.textPrimary,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <List className="w-4 h-4" />
                List
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-none shadow-md" style={{ backgroundColor: colors.statBg, borderColor: colors.borderColor }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {language === 'th' ? 'คดีทั้งหมด' : 'Total Cases'}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{cases.length}</p>
                </div>
                <Scale className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md" style={{ backgroundColor: colors.statBg, borderColor: colors.borderColor }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {language === 'th' ? 'รอตรวจสอบ' : 'Pending Review'}
                  </p>
                  <p className="text-2xl font-bold text-amber-600">
                    {cases.filter(c => c.status === 'pending_review').length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md" style={{ backgroundColor: colors.statBg, borderColor: colors.borderColor }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {language === 'th' ? 'ดำเนินการ' : 'In Progress'}
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {cases.filter(c => ['under_review', 'ready_drafts', 'client_review', 'awaiting_landlord', 'in_progress'].includes(c.status)).length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md" style={{ backgroundColor: colors.statBg, borderColor: colors.borderColor }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {language === 'th' ? 'แก้ไขแล้ว' : 'Resolved'}
                  </p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {cases.filter(c => c.status === 'resolved' || c.status === 'closed').length}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6 border-none shadow-md" style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
          <CardContent className="p-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="search" className="text-sm font-semibold mb-2 block" style={{ color: colors.textPrimary }}>
                  <Search className="w-4 h-4 inline mr-2" />
                  {language === 'th' ? 'ค้นหาคดี' : 'Search Cases'}
                </Label>
                <Input
                  id="search"
                  placeholder={language === 'th' ? 'รหัสคดี, อีเมล, หรือสรุป...' : 'Case ID, email, or summary...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.textPrimary
                  }}
                />
              </div>
              <div>
                <Label htmlFor="filter" className="text-sm font-semibold mb-2 block" style={{ color: colors.textPrimary }}>
                  <Filter className="w-4 h-4 inline mr-2" />
                  {language === 'th' ? 'กรองตามสถานะ' : 'Filter by Status'}
                </Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.textPrimary
                  }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'th' ? 'สถานะทั้งหมด' : 'All Statuses'}</SelectItem>
                    <SelectItem value="pending_review">{language === 'th' ? 'รอตรวจสอบ' : 'Pending Review'}</SelectItem>
                    <SelectItem value="under_review">{language === 'th' ? 'กำลังตรวจสอบ' : 'Under Review'}</SelectItem>
                    <SelectItem value="ready_drafts">{language === 'th' ? 'ร่างพร้อม' : 'Drafts Ready'}</SelectItem>
                    <SelectItem value="client_review">{language === 'th' ? 'ลูกค้าตรวจสอบ' : 'Client Review'}</SelectItem>
                    <SelectItem value="awaiting_landlord">{language === 'th' ? 'รอเจ้าของบ้าน' : 'Awaiting Landlord'}</SelectItem>
                    <SelectItem value="in_progress">{language === 'th' ? 'ดำเนินการ' : 'In Progress'}</SelectItem>
                    <SelectItem value="resolved">{language === 'th' ? 'แก้ไขแล้ว' : 'Resolved'}</SelectItem>
                    <SelectItem value="closed">{language === 'th' ? 'ปิดแล้ว' : 'Closed'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {viewMode === 'kanban' ? (
          <CaseKanban
            cases={filteredCases}
            users={users}
            onUpdateStatus={handleUpdateStatus}
            language={language}
            colors={colors}
          />
        ) : (
          <div className="grid gap-4">
            {filteredCases.map((caseItem) => {
              const statusConfig = STATUS_CONFIG[caseItem.status] || STATUS_CONFIG.pending_review;
              const StatusIcon = statusConfig.icon;
              const tenant = users.find(u => u.email === caseItem.user_email);
              const assignee = users.find(u => u.email === caseItem.assignee_id);

              return (
                <Card key={caseItem.id} className="border-none shadow-lg hover:shadow-xl transition-all" style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
                  <CardHeader className="pb-3" style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Scale className="w-6 h-6 text-blue-600" />
                        <div>
                          <CardTitle className="text-lg" style={{ color: colors.textPrimary }}>
                            {caseItem.case_number || `Case #${caseItem.id.slice(0, 8)}`}
                          </CardTitle>
                          <p className="text-sm" style={{ color: colors.textSecondary }}>
                            {tenant?.full_name || caseItem.user_email}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${statusConfig.color} border flex items-center gap-1`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-3 gap-6 mb-4">
                      <div>
                        <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
                          {language === 'th' ? 'จำนวนเงินพิพาท' : 'Dispute Amount'}
                        </p>
                        <div className="flex items-baseline gap-1">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                          <p className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                            ฿{caseItem.dispute_amount?.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
                          {language === 'th' ? 'มอบหมายให้' : 'Assigned To'}
                        </p>
                        <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                          {assignee?.full_name || (language === 'th' ? 'ยังไม่มอบหมาย' : 'Unassigned')}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
                          {language === 'th' ? 'เปิดเมื่อ' : 'Opened'}
                        </p>
                        <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                          {format(new Date(caseItem.created_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>

                    {caseItem.summary && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
                          {language === 'th' ? 'สรุป' : 'Summary'}
                        </p>
                        <p className="text-sm line-clamp-2" style={{ color: colors.textPrimary }}>{caseItem.summary}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedCase(caseItem);
                          setActionMode('status');
                        }}
                      >
                        {language === 'th' ? 'อัปเดตสถานะ' : 'Update Status'}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedCase(caseItem);
                          setActionMode('assign');
                        }}
                      >
                        {language === 'th' ? 'มอบหมาย' : 'Assign'}
                      </Button>

                      {caseItem.status === 'under_review' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGenerateLetter(caseItem, 'deposit')}
                            disabled={generatingLetters === `${caseItem.id}-deposit`}
                            className="border-blue-600 text-blue-600"
                          >
                            {generatingLetters === `${caseItem.id}-deposit` ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                {language === 'th' ? 'กำลังสร้าง...' : 'Generating...'}
                              </>
                            ) : (
                              <>
                                <FileText className="w-3 h-3 mr-1" />
                                {language === 'th' ? 'มัดจำ' : 'Deposit'}
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGenerateLetter(caseItem, 'damages')}
                            disabled={generatingLetters === `${caseItem.id}-damages`}
                            className="border-orange-600 text-orange-600"
                          >
                            {generatingLetters === `${caseItem.id}-damages` ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                {language === 'th' ? 'กำลังสร้าง...' : 'Generating...'}
                              </>
                            ) : (
                              <>
                                <FileText className="w-3 h-3 mr-1" />
                                {language === 'th' ? 'ความเสียหาย' : 'Damages'}
                              </>
                            )}
                          </Button>
                        </>
                      )}

                      {caseItem.status === 'in_progress' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCase(caseItem);
                            setActionMode('settlement');
                          }}
                          className="border-emerald-600 text-emerald-600"
                        >
                          {language === 'th' ? 'บันทึกการตกลง' : 'Record Settlement'}
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(createPageUrl("CaseDetails") + `?caseId=${caseItem.id}`)}
                      >
                        {language === 'th' ? 'ดูรายละเอียด' : 'View Details'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {selectedCase && actionMode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md border-none shadow-2xl" style={{ backgroundColor: colors.modalBg }}>
              <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
                <CardTitle style={{ color: colors.textPrimary }}>
                  {actionMode === 'status' && (language === 'th' ? 'อัปเดตสถานะ' : 'Update Status')}
                  {actionMode === 'assign' && (language === 'th' ? 'มอบหมายคดี' : 'Assign Case')}
                  {actionMode === 'settlement' && (language === 'th' ? 'บันทึกการตกลง' : 'Record Settlement')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {actionMode === 'status' && (
                  <div className="space-y-4">
                    <Label style={{ color: colors.textPrimary }}>
                      {language === 'th' ? 'สถานะใหม่' : 'New Status'}
                    </Label>
                    <Select
                      defaultValue={selectedCase.status}
                      onValueChange={(value) => {
                        handleUpdateStatus(selectedCase.id, value);
                      }}
                    >
                      <SelectTrigger style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.inputBorder,
                        color: colors.textPrimary
                      }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending_review">{language === 'th' ? 'รอตรวจสอบ' : 'Pending Review'}</SelectItem>
                        <SelectItem value="under_review">{language === 'th' ? 'กำลังตรวจสอบ' : 'Under Review'}</SelectItem>
                        <SelectItem value="ready_drafts">{language === 'th' ? 'ร่างพร้อม' : 'Drafts Ready'}</SelectItem>
                        <SelectItem value="client_review">{language === 'th' ? 'ลูกค้าตรวจสอบ' : 'Client Review'}</SelectItem>
                        <SelectItem value="awaiting_landlord">{language === 'th' ? 'รอเจ้าของบ้าน' : 'Awaiting Landlord'}</SelectItem>
                        <SelectItem value="in_progress">{language === 'th' ? 'ดำเนินการ' : 'In Progress'}</SelectItem>
                        <SelectItem value="resolved">{language === 'th' ? 'แก้ไขแล้ว' : 'Resolved'}</SelectItem>
                        <SelectItem value="closed">{language === 'th' ? 'ปิดแล้ว' : 'Closed'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {actionMode === 'assign' && (
                  <div className="space-y-4">
                    <Label style={{ color: colors.textPrimary }}>
                      {language === 'th' ? 'มอบหมายให้' : 'Assign To'}
                    </Label>
                    <Select
                      defaultValue={selectedCase.assignee_id}
                      onValueChange={(value) => {
                        handleAssign(selectedCase.id, value);
                      }}
                    >
                      <SelectTrigger style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.inputBorder,
                        color: colors.textPrimary
                      }}>
                        <SelectValue placeholder={language === 'th' ? 'เลือกสมาชิกทีม' : 'Select team member'} />
                      </SelectTrigger>
                      <SelectContent>
                        {users.filter(u => u.access_level === 'va' || u.access_level === 'admin' || u.access_level === 'super_admin' || u.role === 'admin').map(u => (
                          <SelectItem key={u.id} value={u.email}>
                            {u.full_name} ({u.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {actionMode === 'settlement' && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      handleRecordSettlement(selectedCase.id, {
                        amount: parseFloat(formData.get('amount')),
                        currency: 'THB',
                        method: formData.get('method'),
                        notes: formData.get('notes')
                      });
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="amount" style={{ color: colors.textPrimary }}>
                        {language === 'th' ? 'จำนวนเงินตกลง (฿)' : 'Settlement Amount (฿)'}
                      </Label>
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        required
                        placeholder="15000"
                        style={{
                          backgroundColor: colors.inputBg,
                          borderColor: colors.inputBorder,
                          color: colors.textPrimary
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="method" style={{ color: colors.textPrimary }}>
                        {language === 'th' ? 'วิธีการชำระเงิน' : 'Payment Method'}
                      </Label>
                      <Input
                        id="method"
                        name="method"
                        placeholder={language === 'th' ? 'โอนธนาคาร, เงินสด ฯลฯ' : 'Bank transfer, Cash, etc.'}
                        style={{
                          backgroundColor: colors.inputBg,
                          borderColor: colors.inputBorder,
                          color: colors.textPrimary
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes" style={{ color: colors.textPrimary }}>
                        {language === 'th' ? 'หมายเหตุ' : 'Notes'}
                      </Label>
                      <Textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        placeholder={language === 'th' ? 'รายละเอียดการตกลง...' : 'Settlement details...'}
                        style={{
                          backgroundColor: colors.inputBg,
                          borderColor: colors.inputBorder,
                          color: colors.textPrimary
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedCase(null);
                          setActionMode(null);
                        }}
                      >
                        {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                      </Button>
                      <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                        {language === 'th' ? 'บันทึกการตกลง' : 'Record Settlement'}
                      </Button>
                    </div>
                  </form>
                )}

                {(actionMode === 'status' || actionMode === 'assign') && (
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => {
                      setSelectedCase(null);
                      setActionMode(null);
                    }}
                  >
                    {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OpsConsole() {
  return (
    <ToastProvider>
      <OpsConsoleContent />
    </ToastProvider>
  );
}