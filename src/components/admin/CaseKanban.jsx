import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scale, User, DollarSign, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { borderRadius, shadows, transitions } from '@/utils/designSystem';

const STATUS_COLUMNS = [
  { 
    key: 'pending_review', 
    label: 'Pending Review',
    labelTh: 'รอตรวจสอบ',
    color: '#F59E0B',
    bgColor: '#FEF3C7'
  },
  { 
    key: 'under_review', 
    label: 'Under Review',
    labelTh: 'กำลังตรวจสอบ',
    color: '#3B82F6',
    bgColor: '#DBEAFE'
  },
  { 
    key: 'ready_drafts', 
    label: 'Drafts Ready',
    labelTh: 'ร่างพร้อม',
    color: '#8B5CF6',
    bgColor: '#EDE9FE'
  },
  { 
    key: 'client_review', 
    label: 'Client Review',
    labelTh: 'ลูกค้าตรวจสอบ',
    color: '#6366F1',
    bgColor: '#E0E7FF'
  },
  { 
    key: 'in_progress', 
    label: 'In Progress',
    labelTh: 'ดำเนินการ',
    color: '#0EA5E9',
    bgColor: '#E0F2FE'
  },
  { 
    key: 'resolved', 
    label: 'Resolved',
    labelTh: 'แก้ไขแล้ว',
    color: '#10B981',
    bgColor: '#D1FAE5'
  },
];

const CaseKanban = ({ cases = [], users = [], onUpdateStatus, language = 'en', colors }) => {
  const navigate = useNavigate();
  const [draggedCase, setDraggedCase] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const handleDragStart = (e, caseItem) => {
    setDraggedCase(caseItem);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, columnKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnKey);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e, columnKey) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (draggedCase && draggedCase.status !== columnKey) {
      onUpdateStatus(draggedCase.id, columnKey);
    }
    setDraggedCase(null);
  };

  const getCasesByStatus = (status) => {
    return cases.filter(c => c.status === status);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '600px' }}>
      {STATUS_COLUMNS.map((column) => {
        const columnCases = getCasesByStatus(column.key);
        const isDragOver = dragOverColumn === column.key;

        return (
          <div
            key={column.key}
            className="flex-shrink-0"
            style={{
              width: '320px',
              transition: transitions.base,
            }}
            onDragOver={(e) => handleDragOver(e, column.key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.key)}
          >
            {/* Column Header */}
            <div
              className="sticky top-0 z-10 p-4 rounded-t-xl mb-2"
              style={{
                backgroundColor: column.bgColor,
                borderBottom: `3px solid ${column.color}`,
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm" style={{ color: column.color }}>
                  {language === 'th' ? column.labelTh : column.label}
                </h3>
                <Badge
                  style={{
                    backgroundColor: column.color,
                    color: '#FFFFFF',
                    minWidth: '24px',
                    height: '24px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {columnCases.length}
                </Badge>
              </div>
            </div>

            {/* Drop Zone */}
            <div
              className="space-y-3 p-2 rounded-b-xl min-h-[500px]"
              style={{
                backgroundColor: isDragOver ? `${column.color}10` : 'transparent',
                border: isDragOver ? `2px dashed ${column.color}` : '2px dashed transparent',
                transition: transitions.fast,
              }}
            >
              {columnCases.map((caseItem) => {
                const tenant = users.find(u => u.email === caseItem.user_email);
                const assignee = users.find(u => u.email === caseItem.assignee_id);
                const isDragging = draggedCase?.id === caseItem.id;

                return (
                  <Card
                    key={caseItem.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, caseItem)}
                    onClick={() => navigate(createPageUrl("CaseDetails") + `?caseId=${caseItem.id}`)}
                    className="cursor-move hover:shadow-lg transition-all border-none"
                    style={{
                      backgroundColor: colors.cardBg,
                      opacity: isDragging ? 0.5 : 1,
                      transform: isDragging ? 'rotate(3deg) scale(0.95)' : 'none',
                      boxShadow: shadows.md,
                      borderRadius: borderRadius.lg,
                    }}
                  >
                    <CardContent className="p-4">
                      {/* Case Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Scale className="w-4 h-4 flex-shrink-0" style={{ color: column.color }} />
                          <h4 className="font-bold text-sm" style={{ color: colors.textPrimary }}>
                            {caseItem.case_number || `#${caseItem.id.slice(0, 8)}`}
                          </h4>
                        </div>
                        {caseItem.flags?.urgent && (
                          <Badge className="bg-red-100 text-red-700 text-xs">
                            {language === 'th' ? 'ด่วน' : 'URGENT'}
                          </Badge>
                        )}
                      </div>

                      {/* Tenant */}
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-3 h-3 text-slate-400" />
                        <p className="text-xs truncate" style={{ color: colors.textSecondary }}>
                          {tenant?.full_name || caseItem.user_email}
                        </p>
                      </div>

                      {/* Amount */}
                      <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="w-3 h-3 text-emerald-600" />
                        <p className="text-sm font-bold text-emerald-600">
                          ฿{caseItem.dispute_amount?.toLocaleString()}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: colors.borderColor }}>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="text-xs" style={{ color: colors.textSecondary }}>
                            {format(new Date(caseItem.created_date), 'MMM d')}
                          </span>
                        </div>
                        {assignee && (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ backgroundColor: column.color }}
                            title={assignee.full_name}
                          >
                            {assignee.full_name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {columnCases.length === 0 && (
                <div
                  className="p-8 text-center rounded-lg"
                  style={{
                    backgroundColor: `${column.color}05`,
                    border: `1px dashed ${column.color}30`,
                  }}
                >
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {language === 'th' ? 'ไม่มีคดี' : 'No cases'}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CaseKanban;