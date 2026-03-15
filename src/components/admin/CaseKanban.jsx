import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  GripVertical, 
  DollarSign, 
  Calendar, 
  User, 
  Mail, 
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Edit2,
  Search,
  Filter,
  X,
  Crown,
  Zap,
  UserCheck
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const STATUS_COLUMNS = [
  { id: 'awaiting_payment', label: 'Awaiting Payment', labelTh: 'รอชำระเงิน', color: '#DC2626', icon: AlertCircle },
  { id: 'intake', label: 'Intake', labelTh: 'รับเรื่อง', color: '#64748b', icon: Clock },
  { id: 'pending_review', label: 'Pending Review', labelTh: 'รอตรวจสอบ', color: '#F59E0B', icon: AlertCircle },
  { id: 'under_review', label: 'Under Review', labelTh: 'กำลังตรวจสอบ', color: '#3B82F6', icon: MessageSquare },
  { id: 'ready_drafts', label: 'Ready Drafts', labelTh: 'ร่างพร้อม', color: '#8B5CF6', icon: Edit2 },
  { id: 'client_review', label: 'Client Review', labelTh: 'ลูกค้าตรวจสอบ', color: '#EC4899', icon: User },
  { id: 'in_progress', label: 'In Progress', labelTh: 'ดำเนินการ', color: '#10B981', icon: CheckCircle2 },
  { id: 'resolved', label: 'Resolved', labelTh: 'แก้ไขแล้ว', color: '#059669', icon: CheckCircle2 },
];

export default function CaseKanban({ cases = [], onStatusChange, onAssign, users = [], colors, language = 'en', onCaseClick }) {
  const adminUsers = users.filter(u => 
    u.access_level === 'va' || u.access_level === 'admin' || u.access_level === 'super_admin' || u.role === 'admin'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const navigate = useNavigate();

  const t = {
    en: {
      searchPlaceholder: "Search cases...",
      filterAll: "All Types",
      noCases: "No cases in this column",
      dragToMove: "Drag to move status",
    },
    th: {
      searchPlaceholder: "ค้นหาคดี...",
      filterAll: "ทุกประเภท",
      noCases: "ไม่มีคดีในคอลัมน์นี้",
      dragToMove: "ลากเพื่อเปลี่ยนสถานะ",
    },
    zh: {
      searchPlaceholder: "搜索案件...",
      filterAll: "所有类型",
      noCases: "此列中无案件",
      dragToMove: "拖动以移动状态",
    },
    ja: {
      searchPlaceholder: "ケースを検索...",
      filterAll: "すべてのタイプ",
      noCases: "この列にケースはありません",
      dragToMove: "ドラッグしてステータスを移動",
    },
    ko: {
      searchPlaceholder: "사례 검색...",
      filterAll: "모든 유형",
      noCases: "이 열에 사례 없음",
      dragToMove: "상태를 이동하려면 드래그",
    }
  };

  const strings = t[language] || t.en;

  // Filter cases
  const filteredCases = cases.filter(c => {
    const matchesSearch = !searchQuery || 
      c.case_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.landlord_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || c.type === filterType;
    
    return matchesSearch && matchesType;
  });

  // Group cases by status with fallback mapping
  const casesByStatus = STATUS_COLUMNS.reduce((acc, column) => {
    acc[column.id] = filteredCases.filter(c => c.status === column.id);
    return acc;
  }, {});

  // Handle cases with unknown/unmapped statuses -> fallback to pending_review
  const unmappedCases = filteredCases.filter(c => !STATUS_COLUMNS.find(col => col.id === c.status));
  if (unmappedCases.length > 0) {
    console.warn('⚠️ [KANBAN] Found cases with unmapped statuses:', unmappedCases.map(c => ({ id: c.id, status: c.status })));
    // Add to pending_review as fallback
    casesByStatus['pending_review'] = [...(casesByStatus['pending_review'] || []), ...unmappedCases];
  }

  console.log('📊 [KANBAN] Cases grouped by status:', 
    Object.entries(casesByStatus).map(([status, cases]) => ({ status, count: cases.length }))
  );

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    const caseId = draggableId;
    
    if (onStatusChange) {
      onStatusChange(caseId, newStatus);
    }
  };

  const getCaseTypeColor = (type) => {
    switch (type) {
      case 'deposit': return 'bg-blue-100 text-blue-800';
      case 'early_termination': return 'bg-purple-100 text-purple-800';
      case 'damages': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCaseTypeLabel = (type) => {
    const labels = {
      deposit: language === 'th' ? 'มัดจำ' : language === 'zh' ? '押金' : language === 'ja' ? '敷金' : language === 'ko' ? '보증금' : 'Deposit',
      early_termination: language === 'th' ? 'ยกเลิก' : language === 'zh' ? '提前终止' : language === 'ja' ? '早期解約' : language === 'ko' ? '조기 종료' : 'Early Term',
      damages: language === 'th' ? 'ความเสียหาย' : language === 'zh' ? '损害' : language === 'ja' ? '損害' : language === 'ko' ? '손해' : 'Damages',
      other: language === 'th' ? 'อื่นๆ' : language === 'zh' ? '其他' : language === 'ja' ? 'その他' : language === 'ko' ? '기타' : 'Other'
    };
    return labels[type] || type;
  };

  const getPriorityIndicator = (caseItem) => {
    // UNIFIED SYSTEM: Show priority badge for member benefit cases
    if (caseItem.flags?.priority) {
      return (
        <Badge className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 flex items-center gap-1">
          <Crown className="w-3 h-3" />
          {language === 'th' ? 'สมาชิก' : language === 'zh' ? '会员' : language === 'ja' ? 'メンバー' : language === 'ko' ? '회원' : 'Member'}
        </Badge>
      );
    }
    if (caseItem.flags?.urgent) return '🔥';
    if (caseItem.flags?.high_risk) return '⚠️';
    return null;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search & Filter Bar */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: colors.textSecondary }} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={strings.searchPlaceholder}
            className="pl-10"
            style={{
              backgroundColor: colors.inputBg,
              borderColor: colors.borderColor,
              color: colors.textPrimary
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <X className="w-4 h-4" style={{ color: colors.textSecondary }} />
            </button>
          )}
        </div>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 rounded-lg border-2"
          style={{
            backgroundColor: colors.inputBg,
            borderColor: colors.borderColor,
            color: colors.textPrimary
          }}
        >
          <option value="all">{strings.filterAll}</option>
          <option value="deposit">Deposit</option>
          <option value="early_termination">Early Termination</option>
          <option value="damages">Damages</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
            {STATUS_COLUMNS.map((column) => {
              const ColumnIcon = column.icon;
              const columnCases = casesByStatus[column.id] || [];
              
              return (
                <div
                  key={column.id}
                  className="flex-shrink-0"
                  style={{ width: '320px' }}
                >
                  {/* Column Header */}
                  <div
                    className="p-3 rounded-t-xl mb-2"
                    style={{
                      backgroundColor: column.color,
                    }}
                  >
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-2">
                        <ColumnIcon className="w-4 h-4" />
                        <h3 className="font-bold text-sm">
                          {language === 'th' ? column.labelTh : column.label}
                        </h3>
                      </div>
                      <Badge 
                        className="bg-white/20 text-white border-white/30"
                        style={{ fontSize: '11px' }}
                      >
                        {columnCases.length}
                      </Badge>
                    </div>
                  </div>

                  {/* Droppable Area */}
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="rounded-b-xl p-2 min-h-[500px] transition-colors"
                        style={{
                          backgroundColor: snapshot.isDraggingOver 
                            ? `${column.color}15`
                            : colors.bg,
                          border: `2px dashed ${snapshot.isDraggingOver ? column.color : colors.borderColor}`,
                        }}
                      >
                        {columnCases.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <ColumnIcon 
                              className="w-10 h-10 mb-2" 
                              style={{ color: colors.textSecondary, opacity: 0.3 }} 
                            />
                            <p className="text-xs" style={{ color: colors.textSecondary }}>
                              {strings.noCases}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {columnCases.map((caseItem, index) => (
                              <Draggable
                                key={caseItem.id}
                                draggableId={caseItem.id}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    style={{
                                      ...provided.draggableProps.style,
                                      transform: snapshot.isDragging 
                                        ? provided.draggableProps.style?.transform 
                                        : 'none',
                                    }}
                                  >
                                    <Card
                                      className="cursor-pointer hover:shadow-lg transition-all border-none"
                                      style={{
                                        backgroundColor: colors.cardBg,
                                        opacity: snapshot.isDragging ? 0.8 : 1,
                                        transform: snapshot.isDragging ? 'rotate(2deg)' : 'none',
                                      }}
                                      onClick={() => onCaseClick ? onCaseClick(caseItem) : navigate(createPageUrl("CaseDetails") + `?caseId=${caseItem.id}&from=ops`)}
                                    >
                                      <CardContent className="p-4">
                                        {/* Drag Handle */}
                                        <div
                                          {...provided.dragHandleProps}
                                          className="flex items-center justify-center mb-2 cursor-grab active:cursor-grabbing"
                                        >
                                          <GripVertical className="w-4 h-4" style={{ color: colors.textSecondary }} />
                                        </div>

                                        {/* Case Number & Priority */}
                                        <div className="flex flex-col gap-2 mb-3">
                                         <div className="flex items-center justify-between">
                                           <span className="font-bold text-sm" style={{ color: colors.textPrimary }}>
                                             {caseItem.case_number}
                                           </span>
                                           {(caseItem.flags?.urgent || caseItem.flags?.high_risk) && (
                                             <span className="text-lg">
                                               {caseItem.flags?.urgent ? '🔥' : '⚠️'}
                                             </span>
                                           )}
                                         </div>
                                         {caseItem.flags?.priority && (
                                           <Badge className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 flex items-center gap-1 w-fit">
                                             <Crown className="w-3 h-3" />
                                             {language === 'th' ? 'สมาชิก' : language === 'zh' ? '会员' : language === 'ja' ? 'メンバー' : language === 'ko' ? '회원' : 'Member'}
                                           </Badge>
                                         )}
                                        </div>

                                        {/* Type Badge */}
                                        <Badge className={`${getCaseTypeColor(caseItem.type)} mb-3 text-xs`}>
                                          {getCaseTypeLabel(caseItem.type)}
                                        </Badge>

                                        {/* Landlord */}
                                        {caseItem.landlord_name && (
                                          <div className="flex items-center gap-2 mb-2">
                                            <User className="w-3 h-3 flex-shrink-0" style={{ color: colors.textSecondary }} />
                                            <p className="text-xs truncate" style={{ color: colors.textSecondary }}>
                                              {caseItem.landlord_name}
                                            </p>
                                          </div>
                                        )}

                                        {/* Dispute Amount */}
                                        {caseItem.dispute_amount > 0 && (
                                          <div className="flex items-center gap-2 mb-2">
                                            <DollarSign className="w-3 h-3 flex-shrink-0" style={{ color: colors.textSecondary }} />
                                            <p className="text-xs font-semibold" style={{ color: '#C7A338' }}>
                                              ฿{caseItem.dispute_amount.toLocaleString()}
                                            </p>
                                          </div>
                                        )}

                                        {/* Created Date */}
                                        <div className="flex items-center gap-2 text-xs" style={{ color: colors.textSecondary }}>
                                          <Calendar className="w-3 h-3 flex-shrink-0" />
                                          <span>{format(new Date(caseItem.created_date), 'MMM d, yyyy')}</span>
                                        </div>

                                        {/* Summary Preview */}
                                        {caseItem.summary && (
                                          <p className="text-xs mt-2 line-clamp-2" style={{ color: colors.textSecondary }}>
                                            {caseItem.summary}
                                          </p>
                                        )}

                                        {/* Assign Dropdown */}
                                        {onAssign && adminUsers.length > 0 && (
                                          <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${colors.borderColor}` }}
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                              <UserCheck className="w-3 h-3" style={{ color: colors.textSecondary }} />
                                              <span className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
                                                {language === 'th' ? 'มอบหมาย' : 'Assign'}
                                              </span>
                                            </div>
                                            <select
                                              value={caseItem.assignee_id || ''}
                                              onChange={(e) => {
                                                e.stopPropagation();
                                                onAssign(caseItem.id, e.target.value);
                                              }}
                                              className="w-full text-xs rounded-md px-2 py-1.5"
                                              style={{
                                                backgroundColor: colors.fieldBg || colors.bg,
                                                borderColor: colors.borderColor,
                                                color: colors.textPrimary,
                                                border: `1px solid ${colors.borderColor}`,
                                              }}
                                            >
                                              <option value="">{language === 'th' ? 'ยังไม่มอบหมาย' : 'Unassigned'}</option>
                                              {adminUsers.map(u => (
                                                <option key={u.id} value={u.email}>
                                                  {u.full_name || u.email}
                                                </option>
                                              ))}
                                            </select>
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}