import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Home, 
  DollarSign, 
  Calendar, 
  Bell,
  ArrowRight,
  Edit2,
  AlertCircle,
  Info
} from "lucide-react";
import { haptic } from "../shared/HapticFeedback";
import MobileFormInput from "../shared/MobileFormInput";

export default function ScanReviewConfirmation({
  reviewData,
  onConfirm,
  onCancel,
  colors,
  language = 'en',
  isDarkMode = false
}) {
  const [formData, setFormData] = useState(reviewData?.summary || {});
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [editing, setEditing] = useState({});
  const t = {
    en: {
      title: "Review Extracted Details",
      subtitle: "Confirm and edit the information we found in your lease",
      propertyAddress: "Property Address",
      monthlyRent: "Monthly Rent (฿)",
      rentDueDay: "Rent Due Day",
      depositAmount: "Deposit Amount (฿)",
      leaseStart: "Lease Start",
      leaseEnd: "Lease End",
      noticePeriod: "Notice Period (Days)",
      depositDueDate: "Deposit Due Date",
      expectedReturnDate: "Expected Return Date",
      estimated: "Estimated",
      needsReview: "Needs Review",
      notSpecified: "Not specified",
      days: "days",
      confirmAndSave: "Save to My Lease Records",
      cancel: "Cancel",
      autoPopulated: "Auto-populated from scan",
      day: "Day",
      disclaimer: "Lease Shield helps organise information but may be incorrect. Always verify against your signed lease.",
      confirmCheckbox: "I confirm I have reviewed these details and will double-check against my lease. I understand I'm responsible for accuracy.",
      edit: "Edit",
      save: "Save",
      warningTitle: "Please review carefully",
      warningDesc: "Some fields were estimated or not found in the lease. Please verify all information."
    },
    th: {
      title: "ตรวจสอบรายละเอียดที่ดึงมา",
      subtitle: "ยืนยันและแก้ไขข้อมูลที่เราพบในสัญญาเช่าของคุณ",
      propertyAddress: "ที่อยู่ทรัพย์สิน",
      monthlyRent: "ค่าเช่ารายเดือน (฿)",
      rentDueDay: "วันที่ครบกำหนดค่าเช่า",
      depositAmount: "จำนวนเงินมัดจำ (฿)",
      leaseStart: "วันเริ่มสัญญา",
      leaseEnd: "วันสิ้นสุดสัญญา",
      noticePeriod: "ระยะเวลาแจ้งล่วงหน้า (วัน)",
      depositDueDate: "วันครบกำหนดเงินมัดจำ",
      expectedReturnDate: "วันที่คาดว่าจะได้รับคืน",
      estimated: "คำนวณโดยระบบ",
      needsReview: "ต้องตรวจสอบ",
      notSpecified: "ไม่ระบุ",
      days: "วัน",
      confirmAndSave: "บันทึกลงบันทึกสัญญาเช่า",
      cancel: "ยกเลิก",
      autoPopulated: "กรอกอัตโนมัติจากการสแกน",
      day: "วันที่",
      disclaimer: "Lease Shield ช่วยจัดระเบียบข้อมูลแต่อาจผิดพลาดได้ ตรวจสอบกับสัญญาที่เซ็นแล้วเสมอ",
      confirmCheckbox: "ข้าพเจ้ายืนยันว่าได้ตรวจสอบรายละเอียดเหล่านี้แล้วและจะตรวจสอบกับสัญญาเช่าอีกครั้ง ข้าพเจ้าเข้าใจว่าข้าพเจ้ามีความรับผิดชอบต่อความถูกต้อง",
      edit: "แก้ไข",
      save: "บันทึก",
      warningTitle: "กรุณาตรวจสอบอย่างละเอียด",
      warningDesc: "บางฟิลด์ถูกคำนวณหรือไม่พบในสัญญา กรุณาตรวจสอบข้อมูลทั้งหมด"
    }
  };

  const strings = t[language] || t.en;
  const estimatedFields = reviewData?.estimated_fields || {};

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    if (!confirmChecked) return;
    haptic.medium();
    onConfirm(formData);
  };

  const EditableField = ({ field, label, value, type = 'text', isEstimated, needsReview: needsReviewFlag }) => {
    const isEditing = editing[field];
    
    return (
      <div className="py-4 border-b" style={{ borderColor: colors.borderColor }}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <Label className="text-sm font-semibold" style={{ color: colors.textSecondary }}>
            {label}
          </Label>
          <button
            onClick={() => {
              haptic.light();
              setEditing(prev => ({ ...prev, [field]: !prev[field] }));
            }}
            className="text-xs font-semibold px-2 py-1 rounded"
            style={{
              color: '#0C3B2E',
              backgroundColor: isDarkMode ? 'rgba(12,59,46,0.1)' : 'rgba(12,59,46,0.05)'
            }}
          >
            {isEditing ? strings.save : strings.edit}
          </button>
        </div>
        
        {isEditing ? (
          <Input
            type={type}
            value={formData[field] || ''}
            onChange={(e) => handleFieldChange(field, type === 'number' ? parseFloat(e.target.value) : e.target.value)}
            className="w-full"
            style={{
              backgroundColor: colors.inputBg,
              borderColor: colors.borderColor,
              color: colors.textPrimary,
              fontSize: '16px'
            }}
            autoFocus
          />
        ) : (
          <div className="text-sm font-bold" style={{ color: colors.textPrimary }}>
            {value || strings.notSpecified}
          </div>
        )}
        
        <div className="flex flex-wrap gap-2 mt-2">
          {isEstimated && (
            <Badge className="text-xs bg-amber-100 text-amber-800">
              {strings.estimated}
            </Badge>
          )}
          {needsReviewFlag && (
            <Badge className="text-xs bg-blue-100 text-blue-800">
              {strings.needsReview}
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-24">
      {/* Header */}
      <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
        <CardHeader style={{ 
          background: isDarkMode 
            ? 'linear-gradient(to right, #1E3A2E, #2A2D30)' 
            : 'linear-gradient(to right, #ECFDF5, #FFFFFF)'
        }}>
          <CardTitle className="flex items-center gap-3" style={{ color: colors.textPrimary }}>
            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xl font-bold">{strings.title}</div>
              <div className="text-sm font-normal" style={{ color: colors.textSecondary }}>
                {strings.subtitle}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Warning banner if estimated fields exist */}
      {(estimatedFields.deposit_due_date || estimatedFields.expected_return_date || estimatedFields.rent_due_day_missing) && (
        <div className="p-4 rounded-lg border-l-4" style={{
          backgroundColor: isDarkMode ? '#3A2D1C' : '#FFF7ED',
          borderLeftColor: '#F59E0B'
        }}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold mb-1" style={{ color: isDarkMode ? '#FCD34D' : '#B45309' }}>
                {strings.warningTitle}
              </p>
              <p className="text-xs" style={{ color: isDarkMode ? '#FDE68A' : '#92400E' }}>
                {strings.warningDesc}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Editable form fields */}
      <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
        <CardContent className="p-6">
          <EditableField
            field="property_address"
            label={strings.propertyAddress}
            value={formData.property_address}
            type="text"
          />
          <EditableField
            field="monthly_rent"
            label={strings.monthlyRent}
            value={formData.monthly_rent > 0 ? formData.monthly_rent : ''}
            type="number"
          />
          <EditableField
            field="rent_due_day"
            label={strings.rentDueDay}
            value={formData.rent_due_day !== 'Not specified' ? formData.rent_due_day : ''}
            type="number"
            needsReview={estimatedFields.rent_due_day_missing}
          />
          <EditableField
            field="deposit_amount"
            label={strings.depositAmount}
            value={formData.deposit_amount > 0 ? formData.deposit_amount : ''}
            type="number"
          />
          <EditableField
            field="lease_start"
            label={strings.leaseStart}
            value={formData.lease_start}
            type="date"
          />
          <EditableField
            field="lease_end"
            label={strings.leaseEnd}
            value={formData.lease_end}
            type="date"
          />
          <EditableField
            field="notice_period_days"
            label={strings.noticePeriod}
            value={formData.notice_period_days !== 'Not specified' ? formData.notice_period_days : ''}
            type="number"
          />
          <EditableField
            field="deposit_due_date"
            label={strings.depositDueDate}
            value={formData.deposit_due_date}
            type="date"
            isEstimated={estimatedFields.deposit_due_date}
          />
          <EditableField
            field="expected_return_date"
            label={strings.expectedReturnDate}
            value={formData.expected_return_date}
            type="date"
            isEstimated={estimatedFields.expected_return_date}
          />
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="p-3 rounded-lg" style={{
        backgroundColor: isDarkMode ? 'rgba(199,163,56,0.1)' : 'rgba(199,163,56,0.05)',
        border: `1px solid ${isDarkMode ? 'rgba(199,163,56,0.3)' : 'rgba(199,163,56,0.2)'}`
      }}>
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed" style={{ color: colors.textPrimary }}>
            {strings.disclaimer}
          </p>
        </div>
      </div>

      {/* Confirmation checkbox */}
      <Card className="border-2" style={{ 
        backgroundColor: colors.cardBg,
        borderColor: confirmChecked ? '#10B981' : colors.borderColor
      }}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="confirm-review"
              checked={confirmChecked}
              onCheckedChange={(checked) => {
                haptic.light();
                setConfirmChecked(checked);
              }}
              className="mt-1"
              style={{ accentColor: '#0C3B2E' }}
            />
            <label htmlFor="confirm-review" className="text-sm font-medium cursor-pointer leading-relaxed" style={{ color: colors.textPrimary }}>
              {strings.confirmCheckbox}
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Fixed bottom action bar */}
      <div 
        className="fixed bottom-0 left-0 right-0 p-4 border-t"
        style={{
          backgroundColor: colors.cardBg,
          borderTopColor: colors.borderColor,
          zIndex: 50,
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom))'
        }}
      >
        <div className="max-w-3xl mx-auto flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              haptic.light();
              onCancel();
            }}
            className="flex-1"
            style={{ minHeight: '52px' }}
          >
            {strings.cancel}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!confirmChecked}
            className="flex-1 text-white"
            style={{ 
              minHeight: '52px',
              backgroundColor: confirmChecked ? '#0C3B2E' : '#9CA3AF',
              cursor: confirmChecked ? 'pointer' : 'not-allowed',
              opacity: confirmChecked ? 1 : 0.6
            }}
          >
            {strings.confirmAndSave}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}