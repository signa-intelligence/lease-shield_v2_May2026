import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown, ChevronUp, Edit2, CheckCircle2, Trash2, Archive, Hash, Mic, Video, MoreVertical
} from "lucide-react";
import { format } from "date-fns";
import { haptic } from "../shared/HapticFeedback";
import SwipeToDelete from "../shared/SwipeToDelete";
import LazyImage from "../shared/LazyImage";
import MaintenanceCompletionSection from "./MaintenanceCompletionSection";
import ReimbursementSection from "./ReimbursementSection";

export default function MaintenanceRequestCard({
  request,
  colors,
  isDarkMode,
  strings,
  language,
  getStatusColor,
  handleSwipeDelete,
  handleSwipeComplete,
  handleEditMaintenance,
  handleCloseMaintenance,
  handleDeleteMaintenance,
  expanded,
  onToggle,
  toast
}) {
  return (
    <SwipeToDelete
      onDelete={() => handleSwipeDelete(request)}
      onComplete={() => handleSwipeComplete(request)}
      deleteLabel={strings.delete}
      completeLabel={strings.close}
      colors={colors}
    >
      <div
        className="p-4 rounded-lg border-2 cursor-pointer transition-all"
        style={{ borderColor: colors.borderColor, backgroundColor: colors.cardBg }}
        onClick={() => { haptic.light(); onToggle(); }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {request.request_number && (
                <Badge
                  className="font-mono text-xs"
                  style={{
                    backgroundColor: isDarkMode ? colors.inputBg : '#F3F4F6',
                    color: colors.maintenanceAccent,
                    border: `1px solid ${colors.maintenanceAccent}`,
                    fontWeight: 'bold'
                  }}
                >
                  <Hash className="w-3 h-3 mr-1" />
                  {request.request_number}
                </Badge>
              )}
              <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
              {request.priority && request.priority !== 'medium' && (
                <Badge className={
                  request.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                  request.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'
                }>{request.priority}</Badge>
              )}
            </div>
            <h4 className="font-bold text-base sm:text-lg" style={{ color: colors.textPrimary }}>{request.issue_title}</h4>
          </div>
          {expanded ? <ChevronUp className="w-5 h-5 flex-shrink-0" style={{ color: colors.textSecondary }} /> : <ChevronDown className="w-5 h-5 flex-shrink-0" style={{ color: colors.textSecondary }} />}
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: colors.borderColor }} onClick={(e) => e.stopPropagation()}>
            <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>{request.description}</p>

            {request.photo_urls && request.photo_urls.length > 0 && (
              <div className="mb-3">
                <div className="grid grid-cols-4 gap-2">
                  {request.photo_urls.map((url, index) => (
                    <LazyImage key={index} src={url} alt={`Issue ${index + 1}`} className="w-full h-20 object-cover rounded-lg border cursor-pointer" style={{ borderColor: colors.borderColor }} loadingColor="#F59E0B" onClick={() => { haptic.light(); window.open(url, '_blank')}} />
                  ))}
                </div>
              </div>
            )}

            {request.voice_notes && request.voice_notes.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>🎤 {request.voice_notes.length} {strings.voiceNotesAdded}</p>
                <div className="space-y-1">
                  {request.voice_notes.map((url, index) => (
                    <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded text-xs" style={{ backgroundColor: isDarkMode ? '#4C1D95' : '#F3E8FF', border: '1px solid #8B5CF6', color: colors.textPrimary, textDecoration: 'none' }}>
                      <Mic className="w-3 h-3 text-purple-600" />{strings.voiceNote} {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {request.videos && request.videos.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>🎥 {request.videos.length} {strings.videosAdded}</p>
                <div className="space-y-1">
                  {request.videos.map((url, index) => (
                    <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded text-xs" style={{ backgroundColor: isDarkMode ? '#7F1D1D' : '#FEE2E2', border: '1px solid #EF4444', color: colors.textPrimary, textDecoration: 'none' }}>
                      <Video className="w-3 h-3 text-red-600" />{strings.video} {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {request.communication_log && request.communication_log.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>{strings.communicationLog}</p>
                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {request.communication_log.map((log, idx) => (
                    <div key={idx} className="p-2 rounded-lg text-xs" style={{
                      backgroundColor: log.sender === 'tenant' ? (isDarkMode ? '#1E3A5F' : '#EFF6FF') : log.sender === 'landlord' ? (isDarkMode ? '#3A2D1C' : '#FFF7ED') : log.sender === 'juristic' ? (isDarkMode ? '#2D1C3A' : '#FAF5FF') : (isDarkMode ? colors.fieldBg : '#F3F4F6'),
                      borderLeft: `3px solid ${log.sender === 'tenant' ? '#3B82F6' : log.sender === 'landlord' ? '#F59E0B' : log.sender === 'juristic' ? '#8B5CF6' : '#6B7280'}`
                    }}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-semibold" style={{ color: colors.textPrimary }}>
                          {log.sender === 'tenant' ? '👤' : log.sender === 'landlord' ? '🏠' : log.sender === 'juristic' ? '🏢' : '⚙️'} {log.sender_name || log.sender}
                        </span>
                        <span style={{ color: colors.textSecondary, fontSize: '10px' }}>
                          {new Date(log.timestamp).toLocaleString(language === 'th' ? 'th-TH' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ color: colors.textPrimary }}>{log.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 text-xs mb-3" style={{ color: colors.textSecondary }}>
              <span>📅 {format(new Date(request.reported_date), 'MMM d, yyyy')}</span>
              <span>🏷️ {request.category}</span>
              <span>⚡ {request.priority}</span>
              {request.photo_urls && request.photo_urls.length > 0 && <span>📸 {request.photo_urls.length}</span>}
              {request.voice_notes && request.voice_notes.length > 0 && <span>🎤 {request.voice_notes.length}</span>}
              {request.videos && request.videos.length > 0 && <span>🎥 {request.videos.length}</span>}
            </div>

            {/* Completion & Reimbursement sections */}
            <MaintenanceCompletionSection request={request} colors={colors} isDarkMode={isDarkMode} language={language} toast={toast} />
            <ReimbursementSection request={request} colors={colors} isDarkMode={isDarkMode} language={language} toast={toast} />

            <div className="flex items-center gap-2 flex-wrap pt-3 border-t mt-3" style={{ borderColor: colors.borderColor }}>
              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); haptic.light(); handleEditMaintenance(request); }} style={{ minHeight: '36px' }}>
                <Edit2 className="w-3 h-3 mr-1" />{strings.edit}
              </Button>
              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleCloseMaintenance(request); }} className="text-emerald-600 border-emerald-600 hover:bg-emerald-50" style={{ minHeight: '36px' }}>
                <CheckCircle2 className="w-3 h-3 mr-1" />{strings.close}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()} style={{ minHeight: '36px' }}>
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCloseMaintenance(request); }}>
                    <Archive className="w-4 h-4 mr-2" />{language === 'th' ? 'เก็บไว้' : 'Archive'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteMaintenance(request); }} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />{language === 'th' ? 'ลบอย่างถาวร' : 'Delete'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </div>
    </SwipeToDelete>
  );
}