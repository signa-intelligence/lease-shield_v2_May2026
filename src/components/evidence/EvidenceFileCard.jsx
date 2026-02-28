import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Camera, FileVideo, Mail, HelpCircle, Eye, Download, Edit2, Trash2, Folder, Loader2 } from "lucide-react";
import { format } from "date-fns";
import SwipeToDelete from "../shared/SwipeToDelete";
import LazyImage from "../shared/LazyImage";
import { CTA_COLOR } from "../shared/featureTheme";

const DOC_ICONS = { lease: FileText, receipt: FileText, photo: Camera, video: FileVideo, letter: Mail, other: HelpCircle };

export default function EvidenceFileCard({
  doc, config, language, colors, isDarkMode, isSelected, bulkMode, isOptimistic,
  strings, onCardClick, onView, onDownload, onEdit, onDelete, onSwipeDelete, onMove
}) {
  const Icon = DOC_ICONS[doc.type] || HelpCircle;
  const isImage = doc.file_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isVideo = doc.file_url?.match(/\.(mp4|mov|avi)$/i);
  const label = language === 'zh' ? config.label_zh : language === 'ja' ? config.label_ja : language === 'ko' ? config.label_ko : language === 'th' ? config.label_th : language === 'ru' ? config.label_ru : config.label_en;

  return (
    <SwipeToDelete onDelete={() => onSwipeDelete(doc.id)} deleteLabel={strings.delete} colors={colors} disabled={isOptimistic}>
      <Card
        className={`overflow-hidden border-none shadow-lg hover:shadow-xl transition-all relative ${isSelected ? 'ring-2' : ''} ${isOptimistic ? 'opacity-60' : ''}`}
        style={{
          backgroundColor: colors.cardBg,
          borderColor: isSelected ? '#0C3B2E' : colors.borderColor,
          borderLeft: isSelected ? '4px solid #0C3B2E' : undefined
        }}
        onClick={() => !isOptimistic && onCardClick(doc)}
      >
        {isOptimistic && (
          <div className="absolute inset-0 bg-black/10 z-10 flex items-center justify-center rounded-lg">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
        )}

        {isImage ? (
          <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative">
            <LazyImage src={doc.file_url} alt={doc.label || doc.type} className="w-full h-full object-cover" loadingColor="#0C3B2E"
              fallback={<div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700"><FileText className="w-12 h-12 text-gray-400" /></div>}
            />
            <button onClick={(e) => { e.stopPropagation(); onView(doc); }} className="absolute top-2 right-2 p-2 bg-black/50 rounded-lg backdrop-blur-sm hover:bg-black/70" disabled={isOptimistic}>
              <Eye className="w-4 h-4 text-white" />
            </button>
          </div>
        ) : isVideo ? (
          <div className="aspect-video bg-gray-900 relative">
            <video src={doc.file_url} className="w-full h-full object-cover" controls preload="metadata" />
          </div>
        ) : (
          <div className="aspect-video flex flex-col items-center justify-center p-4" style={{ backgroundColor: config.bgColor, color: 'white' }}>
            <Icon className="w-12 h-12 mb-2" />
            <span className="text-sm font-semibold text-center break-words">{doc.label || label}</span>
          </div>
        )}

        <CardContent className="p-4">
          {bulkMode && (
            <div className="absolute top-4 right-4 z-10">
              <Checkbox checked={isSelected} onCheckedChange={() => onCardClick(doc)} onClick={(e) => e.stopPropagation()} disabled={isOptimistic} />
            </div>
          )}

          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: config.bgColor }}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <Badge className="mb-2" style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6', color: colors.textPrimary }}>{label}</Badge>
              <h3 className="font-bold text-sm truncate" style={{ color: colors.textPrimary }}>{doc.label || label}</h3>
              <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>{format(new Date(doc.created_date), 'MMM d, yyyy')}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={(e) => { e.stopPropagation(); onView(doc); }} disabled={isOptimistic}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6', color: colors.textPrimary }}>
              <Eye className="w-3 h-3 inline mr-1" />{strings.view}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDownload(doc); }} disabled={isOptimistic}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ backgroundColor: CTA_COLOR, color: '#FFFFFF' }}>
              <Download className="w-3 h-3 inline mr-1" />{strings.download}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onMove(doc.id); }} disabled={isOptimistic}
              className="py-2 px-3 rounded-lg text-xs font-semibold transition-all"
              style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6', color: colors.textPrimary }}
              title="Move to folder">
              <Folder className="w-3 h-3" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onEdit(doc); }} disabled={isOptimistic}
              className="py-2 px-3 rounded-lg text-xs font-semibold transition-all"
              style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6', color: colors.textPrimary }}>
              <Edit2 className="w-3 h-3" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }} disabled={isOptimistic}
              className="py-2 px-3 rounded-lg text-xs font-semibold transition-all"
              style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </CardContent>
      </Card>
    </SwipeToDelete>
  );
}