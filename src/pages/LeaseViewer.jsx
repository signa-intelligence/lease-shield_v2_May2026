import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, ArrowLeft, Download, ExternalLink, Image as ImageIcon, Loader2 } from "lucide-react";
import AuthGuard from "../components/shared/AuthGuard";
import { haptic } from "../components/shared/HapticFeedback";

function LeaseViewerContent() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const leaseId = urlParams.get('leaseId');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: leases = [], isLoading } = useQuery({
    queryKey: ['leases'],
    queryFn: () => base44.entities.Lease.filter({ id: leaseId }),
    enabled: !!leaseId,
  });

  const lease = leases[0];
  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = {
    bg: isDarkMode ? '#1A1D1F' : '#F9FAFB',
    cardBg: isDarkMode ? '#2A2D30' : '#FFFFFF',
    textPrimary: isDarkMode ? '#ECEFED' : '#1A1D1F',
    textSecondary: isDarkMode ? '#A8ABAD' : '#64748b',
    borderColor: isDarkMode ? '#3A3D40' : '#E5E7EB',
  };

  const t = {
    en: {
      title: "Lease Document",
      back: "Back",
      downloadAll: "Download All",
      viewOnline: "View Online",
      page: "Page",
      loading: "Loading document..."
    },
    th: {
      title: "เอกสารสัญญาเช่า",
      back: "กลับ",
      downloadAll: "ดาวน์โหลดทั้งหมด",
      viewOnline: "ดูออนไลน์",
      page: "หน้า",
      loading: "กำลังโหลดเอกสาร..."
    }
  };

  const strings = t[language] || t.en;

  const handleDownloadAll = () => {
    haptic.medium();
    const urls = lease?.file_urls || [lease?.file_url];
    urls.forEach((url, idx) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `lease-page-${idx + 1}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, idx * 500);
    });
  };

  const handleViewPage = (url) => {
    haptic.light();
    window.open(url, '_blank');
  };

  const isImage = (url) => {
    return url && (url.includes('.png') || url.includes('.jpg') || url.includes('.jpeg') || url.includes('image'));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: '#0C3B2E' }} />
          <p style={{ color: colors.textPrimary }}>{strings.loading}</p>
        </div>
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
        <Button onClick={() => navigate(createPageUrl("UploadScan"))} style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {strings.back}
        </Button>
      </div>
    );
  }

  const pages = lease.file_urls || [lease.file_url];

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => {
              haptic.light();
              navigate(-1);
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {strings.back}
          </Button>
          {pages.length > 1 && (
            <Button variant="outline" onClick={handleDownloadAll}>
              <Download className="w-4 h-4 mr-2" />
              {strings.downloadAll}
            </Button>
          )}
        </div>

        <h1 className="text-2xl font-bold mb-6" style={{ color: colors.textPrimary }}>
          {strings.title}
        </h1>

        <div className="grid gap-4">
          {pages.map((url, idx) => (
            <Card key={idx} className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {isImage(url) ? (
                      <ImageIcon className="w-5 h-5" style={{ color: '#0C3B2E' }} />
                    ) : (
                      <FileText className="w-5 h-5" style={{ color: '#0C3B2E' }} />
                    )}
                    <h3 className="font-bold" style={{ color: colors.textPrimary }}>
                      {strings.page} {idx + 1}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleViewPage(url)}
                      style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {strings.viewOnline}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        haptic.light();
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `lease-page-${idx + 1}`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {isImage(url) && (
                  <img
                    src={url}
                    alt={`${strings.page} ${idx + 1}`}
                    className="w-full rounded-lg border"
                    style={{ borderColor: colors.borderColor }}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LeaseViewer() {
  return (
    <AuthGuard>
      <LeaseViewerContent />
    </AuthGuard>
  );
}