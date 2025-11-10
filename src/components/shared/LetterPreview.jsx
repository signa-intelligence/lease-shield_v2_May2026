
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, Loader2, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function LetterPreview({ open, onOpenChange, htmlUrl, docUrl, title }) {
  const [htmlContent, setHtmlContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40',
  } : {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB',
  };

  const t = {
    en: {
      loading: "Loading letter...",
      error: "Failed to load letter",
      download: "Download Word",
      openNew: "Open in New Tab",
      close: "Close"
    },
    th: {
      loading: "กำลังโหลดจดหมาย...",
      error: "ไม่สามารถโหลดจดหมายได้",
      download: "ดาวน์โหลด Word",
      openNew: "เปิดในแท็บใหม่",
      close: "ปิด"
    }
  };

  const strings = t[language];

  useEffect(() => {
    if (open && htmlUrl) {
      setLoading(true);
      setError(null);
      
      fetch(htmlUrl)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch');
          return res.text();
        })
        .then(html => {
          setHtmlContent(html);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error loading letter:', err);
          setError(strings.error);
          setLoading(false);
        });
    }
  }, [open, htmlUrl, strings.error]); // Added strings.error to dependency array

  const handleDownload = () => {
    if (docUrl) {
      window.open(docUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleOpenNew = () => {
    if (htmlUrl) {
      window.open(htmlUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0"
        style={{
          backgroundColor: colors.cardBg,
          borderColor: colors.borderColor
        }}
      >
        <DialogHeader className="flex flex-row items-center justify-between px-4 py-3 flex-shrink-0" style={{
          borderBottom: `1px solid ${colors.borderColor}`
        }}>
          <DialogTitle className="text-sm sm:text-base" style={{ color: colors.textPrimary }}>
            {title || (language === 'th' ? 'ตัวอย่างจดหมาย' : 'Letter Preview')}
          </DialogTitle>
          <div className="flex items-center gap-2">
            {htmlUrl && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenNew}
                className="flex items-center gap-2 text-xs sm:text-sm h-8"
              >
                <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{strings.openNew}</span>
              </Button>
            )}
            {docUrl && (
              <Button
                size="sm"
                onClick={handleDownload}
                className="bg-ls-forest hover:bg-ls-forest/90 text-white flex items-center gap-2 text-xs sm:text-sm h-8"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{strings.download}</span>
              </Button>
            )}
          </div>
        </DialogHeader>

        <div 
          className="flex-1 overflow-y-auto"
          style={{
            backgroundColor: isDarkMode ? '#1A1D1F' : '#F8FAFC'
          }}
        >
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: colors.textSecondary }} />
              <p style={{ color: colors.textSecondary }}>{strings.loading}</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-red-600 mb-4">{error}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                {language === 'th' ? 'ลองอีกครั้ง' : 'Try Again'}
              </Button>
            </div>
          )}

          {!loading && !error && htmlContent && (
            <div 
              className="letter-preview-content"
              style={{
                backgroundColor: '#FFFFFF',
                padding: '20px',
                minHeight: '400px'
              }}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          )}
        </div>

        <style>{`
          .letter-preview-content {
            font-family: Inter, Arial, "Noto Sans Thai", "TH Sarabun New", sans-serif;
          }
          .letter-preview-content * {
            max-width: 100%;
          }
          .letter-preview-content img {
            max-width: 100%;
            height: auto;
          }
          .letter-preview-content > *:first-child {
            margin-top: 0 !important;
            padding-top: 0 !important;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
