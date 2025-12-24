import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Loader2, Plus, ArrowLeft, Edit, Trash2 } from "lucide-react";
import AuthGuard from "../components/shared/AuthGuard";
import { haptic } from "../components/shared/HapticFeedback";
import { ToastProvider, useToast } from "../components/shared/Toast";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import { format } from "date-fns";

function LeaseLettersContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  
  const urlParams = new URLSearchParams(window.location.search);
  const leaseId = urlParams.get('leaseId');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: lease } = useQuery({
    queryKey: ['lease', leaseId],
    queryFn: async () => {
      const leases = await base44.entities.Lease.filter({ id: leaseId });
      return leases[0];
    },
    enabled: !!leaseId
  });

  const { data: letters = [], isLoading } = useQuery({
    queryKey: ['letters', leaseId],
    queryFn: async () => {
      console.log('[LeaseLetters] Fetching letters for:', { leaseId, userId: user?.id });
      const result = await base44.entities.Letter.filter({ lease_id: leaseId }, '-created_date');
      console.log('[LeaseLetters] Query result:', { count: result.length, leaseId });
      return result;
    },
    enabled: !!leaseId && !!user,
    initialData: []
  });

  const deleteLetterMutation = useMutation({
    mutationFn: (id) => base44.entities.Letter.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letters', leaseId] });
      toast.success(language === 'th' ? 'ลบจดหมายแล้ว' : 'Letter deleted');
      haptic.success();
    }
  });

  const createBlankLetter = async () => {
    if (!user || !leaseId) {
      console.error('[CreateBlankLetter] Missing required data:', { user: !!user, leaseId });
      toast.error('Cannot create letter - missing data');
      return;
    }

    try {
      haptic.medium();
      const blankBody = `Dear Landlord,

I am writing regarding the lease agreement for ${lease?.property_address || 'the property'}.

[Add your concerns and requests here]

Thank you for your consideration.

Sincerely,
${user.full_name}`;

      const letterData = {
        user_id: user.id,
        lease_id: leaseId,
        title: `Draft Letter - ${lease?.property_address || 'Property'}`,
        body: blankBody,
        status: 'draft',
        language: language
      };

      console.log('[CreateBlankLetter] Creating with data:', {
        user_id: letterData.user_id,
        lease_id: letterData.lease_id,
        titleLength: letterData.title.length,
        bodyLength: letterData.body.length
      });

      const newLetter = await base44.entities.Letter.create(letterData);

      console.log('[CreateBlankLetter] Create response:', { 
        hasId: !!newLetter?.id, 
        letterId: newLetter?.id,
        fullResponse: newLetter
      });

      if (!newLetter || !newLetter.id) {
        throw new Error('No letter ID returned from create');
      }

      // Verify creation
      const verify = await base44.entities.Letter.filter({ id: newLetter.id });
      console.log('[CreateBlankLetter] Verification:', { found: verify.length > 0 });

      if (verify.length === 0) {
        throw new Error('Letter created but not retrievable');
      }

      queryClient.invalidateQueries({ queryKey: ['letters', leaseId] });
      toast.success(language === 'th' ? 'สร้างจดหมายว่างแล้ว' : 'Blank letter created');
      navigate(createPageUrl("LetterReview") + `?letterId=${newLetter.id}&leaseId=${leaseId}`);
    } catch (error) {
      console.error('[CreateBlankLetter] ERROR:', {
        message: error.message,
        stack: error.stack,
        error
      });
      toast.error(`Failed to create letter: ${error.message}`);
      haptic.error();
    }
  };

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40'
  } : {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB'
  };

  const t = {
    en: {
      title: "Lease Letters",
      subtitle: "Review and edit your negotiation letters",
      draft: "Draft",
      ready: "Ready",
      failed: "Failed",
      createBlank: "Create Blank Letter",
      review: "Review",
      delete: "Delete",
      confirmDelete: "Are you sure you want to delete this letter?",
      noLetters: "No letters yet",
      noLettersDesc: "Create a letter to start negotiating your lease terms",
      backToScan: "Back to Scan"
    },
    th: {
      title: "จดหมายสัญญาเช่า",
      subtitle: "ตรวจสอบและแก้ไขจดหมายเจรจาของคุณ",
      draft: "ฉบับร่าง",
      ready: "พร้อม",
      failed: "ล้มเหลว",
      createBlank: "สร้างจดหมายว่าง",
      review: "ตรวจสอบ",
      delete: "ลบ",
      confirmDelete: "คุณแน่ใจหรือไม่ว่าต้องการลบจดหมายนี้?",
      noLetters: "ยังไม่มีจดหมาย",
      noLettersDesc: "สร้างจดหมายเพื่อเริ่มการเจรจาเงื่อนไขสัญญาเช่า",
      backToScan: "กลับไปสแกน"
    }
  };

  const strings = t[language] || t.en;

  const getStatusBadge = (status) => {
    const badges = {
      draft: { label: strings.draft, color: '#F59E0B', bg: '#FEF3C7' },
      ready: { label: strings.ready, color: '#10B981', bg: '#D1FAE5' },
      failed: { label: strings.failed, color: '#EF4444', bg: '#FEE2E2' }
    };
    return badges[status] || badges.draft;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin" style={{ color: '#0C3B2E' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title={strings.title}
          subtitle={strings.subtitle}
          icon={FileText}
          iconColor="#0C3B2E"
          showBack={true}
          isDarkMode={isDarkMode}
          actions={
            <Button
              onClick={createBlankLetter}
              style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}
            >
              <Plus className="w-4 h-4 mr-2" />
              {strings.createBlank}
            </Button>
          }
        />

        {letters.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={strings.noLetters}
            description={strings.noLettersDesc}
            isDarkMode={isDarkMode}
            actions={[
              {
                label: strings.createBlank,
                onClick: createBlankLetter,
                variant: 'primary'
              },
              {
                label: strings.backToScan,
                onClick: () => navigate(createPageUrl("ReportFull") + `?scanId=${lease?.id}&leaseId=${leaseId}`),
                variant: 'secondary'
              }
            ]}
          />
        ) : (
          <div className="space-y-4">
            {letters.map((letter) => {
              const statusBadge = getStatusBadge(letter.status);
              return (
                <Card
                  key={letter.id}
                  className="border-none shadow-md hover:shadow-lg transition-all"
                  style={{ backgroundColor: colors.cardBg }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                        backgroundColor: isDarkMode ? '#374151' : '#F3F4F6'
                      }}>
                        <FileText className="w-6 h-6" style={{ color: '#0C3B2E' }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-bold text-base" style={{ color: colors.textPrimary }}>
                            {letter.title}
                          </h3>
                          <div
                            className="px-2 py-1 rounded-md text-xs font-semibold"
                            style={{
                              backgroundColor: statusBadge.bg,
                              color: statusBadge.color
                            }}
                          >
                            {statusBadge.label}
                          </div>
                        </div>

                        <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                          {format(new Date(letter.created_date), 'MMM d, yyyy · h:mm a')}
                        </p>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              haptic.light();
                              navigate(createPageUrl("LetterReview") + `?letterId=${letter.id}`);
                            }}
                            style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}
                            size="sm"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            {strings.review}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              haptic.medium();
                              if (confirm(strings.confirmDelete)) {
                                deleteLetterMutation.mutate(letter.id);
                              }
                            }}
                            style={{
                              borderColor: '#EF4444',
                              color: '#EF4444'
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LeaseLetters() {
  return (
    <AuthGuard>
      <ToastProvider>
        <LeaseLettersContent />
      </ToastProvider>
    </AuthGuard>
  );
}