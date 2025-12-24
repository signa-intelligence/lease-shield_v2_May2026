import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Download, Copy, CheckCircle2, Loader2, FileText, AlertCircle } from "lucide-react";
import AuthGuard from "../components/shared/AuthGuard";
import { haptic } from "../components/shared/HapticFeedback";
import { ToastProvider, useToast } from "../components/shared/Toast";
import PageHeader from "../components/shared/PageHeader";

function LetterReviewContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  
  const urlParams = new URLSearchParams(window.location.search);
  const letterId = urlParams.get('letterId');

  const [editedTitle, setEditedTitle] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [hasEdits, setHasEdits] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: letter, isLoading, error: letterError } = useQuery({
    queryKey: ['letter', letterId],
    queryFn: async () => {
      console.log('[LetterReview] Fetching letter:', { letterId });
      
      if (!letterId) {
        console.error('[LetterReview] No letterId provided');
        return null;
      }

      const letters = await base44.entities.Letter.filter({ id: letterId });
      
      console.log('[LetterReview] Query result:', { 
        found: letters.length,
        letterId,
        hasData: !!letters[0]
      });

      const l = letters[0];
      if (l) {
        setEditedTitle(l.title);
        setEditedBody(l.body);
      }
      return l;
    },
    enabled: !!letterId,
    retry: 1
  });

  const updateLetterMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Letter.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letter', letterId] });
      setHasEdits(false);
      toast.success(language === 'th' ? 'บันทึกแล้ว' : 'Saved');
      haptic.success();
    },
    onError: () => {
      toast.error(language === 'th' ? 'ไม่สามารถบันทึกได้' : 'Failed to save');
      haptic.error();
    }
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40',
    inputBg: '#353A3D'
  } : {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB',
    inputBg: '#FFFFFF'
  };

  const t = {
    en: {
      title: "Review Letter",
      subtitle: "Edit and download your negotiation letter",
      letterTitle: "Letter Title",
      letterBody: "Letter Content",
      saveChanges: "Save Changes",
      download: "Download",
      copyToClipboard: "Copy to Clipboard",
      copied: "Copied!",
      letterNotFound: "Letter not found",
      loading: "Loading letter...",
      downloadingPDF: "Generating PDF...",
      downloadFailed: "Download failed. Please try again."
    },
    th: {
      title: "ตรวจสอบจดหมาย",
      subtitle: "แก้ไขและดาวน์โหลดจดหมายเจรจาของคุณ",
      letterTitle: "หัวข้อจดหมาย",
      letterBody: "เนื้อหาจดหมาย",
      saveChanges: "บันทึกการเปลี่ยนแปลง",
      download: "ดาวน์โหลด",
      copyToClipboard: "คัดลอกไปยังคลิปบอร์ด",
      copied: "คัดลอกแล้ว!",
      letterNotFound: "ไม่พบจดหมาย",
      loading: "กำลังโหลดจดหมาย...",
      downloadingPDF: "กำลังสร้าง PDF...",
      downloadFailed: "ดาวน์โหลดล้มเหลว กรุณาลองอีกครั้ง"
    }
  };

  const strings = t[language] || t.en;

  const handleSave = () => {
    if (!letter) return;
    haptic.medium();
    updateLetterMutation.mutate({
      id: letter.id,
      data: {
        title: editedTitle,
        body: editedBody,
        status: 'ready'
      }
    });
  };

  const handleCopy = () => {
    haptic.light();
    navigator.clipboard.writeText(editedBody);
    toast.success(strings.copied);
  };

  const handleDownload = async () => {
    if (!letter) return;
    
    setDownloading(true);
    haptic.medium();

    try {
      // Generate DOCX via LLM
      const { data: docxResult } = await base44.functions.invoke('generateDocx', {
        content: editedBody,
        filename: editedTitle || 'Letter'
      });

      if (docxResult?.file_url) {
        const link = document.createElement('a');
        link.href = docxResult.file_url;
        link.download = `${editedTitle || 'Letter'}.docx`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success(language === 'th' ? 'กำลังดาวน์โหลด' : 'Downloading');
        haptic.success();
      } else {
        throw new Error('No file URL returned');
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error(strings.downloadFailed);
      haptic.error();
    } finally {
      setDownloading(false);
    }
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

  if (!letter && !isLoading) {
    console.error('[LetterReview] Letter not found. Params:', { letterId, error: letterError });
    
    // Try to get leaseId from URL or referrer
    const leaseIdFromUrl = urlParams.get('leaseId');
    
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-16 h-16 mb-4 text-red-600" />
            <h2 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              {strings.letterNotFound}
            </h2>
            <p className="text-sm mb-6 text-center" style={{ color: colors.textSecondary }}>
              {language === 'th' 
                ? 'จดหมายที่คุณกำลังมองหาไม่พบ'
                : 'The letter you\'re looking for was not found'}
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              {leaseIdFromUrl && (
                <Button
                  onClick={() => {
                    haptic.light();
                    navigate(createPageUrl("LeaseLetters") + `?leaseId=${leaseIdFromUrl}`);
                  }}
                  style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {language === 'th' ? 'ดูจดหมายทั้งหมด' : 'View All Letters'}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {strings.back || 'Back'}
              </Button>
            </div>
          </div>
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
        />

        <Card className="border-none shadow-lg mb-6" style={{ backgroundColor: colors.cardBg }}>
          <CardContent className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                {strings.letterTitle}
              </label>
              <Input
                value={editedTitle}
                onChange={(e) => {
                  setEditedTitle(e.target.value);
                  setHasEdits(true);
                }}
                className="text-lg font-semibold"
                style={{
                  backgroundColor: colors.inputBg,
                  borderColor: colors.borderColor,
                  color: colors.textPrimary
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                {strings.letterBody}
              </label>
              <Textarea
                value={editedBody}
                onChange={(e) => {
                  setEditedBody(e.target.value);
                  setHasEdits(true);
                }}
                rows={20}
                className="font-mono text-sm"
                style={{
                  backgroundColor: colors.inputBg,
                  borderColor: colors.borderColor,
                  color: colors.textPrimary,
                  lineHeight: '1.6'
                }}
              />
            </div>

            <div className="flex flex-col gap-3">
              {hasEdits && (
                <Button
                  onClick={handleSave}
                  disabled={updateLetterMutation.isPending}
                  className="w-full"
                  style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}
                >
                  {updateLetterMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {language === 'th' ? 'กำลังบันทึก...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {strings.saveChanges}
                    </>
                  )}
                </Button>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleDownload}
                  disabled={downloading}
                  variant="outline"
                  style={{ borderColor: '#0C3B2E', color: '#0C3B2E' }}
                >
                  {downloading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {strings.downloadingPDF}
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      {strings.download}
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleCopy}
                  variant="outline"
                  style={{ borderColor: colors.borderColor, color: colors.textPrimary }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {strings.copyToClipboard}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LetterReview() {
  return (
    <AuthGuard>
      <ToastProvider>
        <LetterReviewContent />
      </ToastProvider>
    </AuthGuard>
  );
}