import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Home, 
  DollarSign, 
  Calendar, 
  Bell,
  ArrowRight,
  Edit2
} from "lucide-react";
import { haptic } from "../shared/HapticFeedback";

export default function ScanReviewConfirmation({
  reviewData,
  onConfirm,
  onEdit,
  colors,
  language = 'en',
  isDarkMode = false
}) {
  const t = {
    en: {
      title: "Review Extracted Details",
      subtitle: "Confirm the information we found in your lease",
      propertyAddress: "Property Address",
      monthlyRent: "Monthly Rent",
      rentDueDay: "Rent Due Day",
      depositAmount: "Deposit Amount",
      leaseStart: "Lease Start",
      leaseEnd: "Lease End",
      noticePeriod: "Notice Period",
      depositDueDate: "Deposit Due Date",
      expectedReturnDate: "Expected Return Date",
      noticeDeadline: "Notice Deadline",
      estimated: "Estimated",
      needsReview: "Needs Review",
      notSpecified: "Not specified",
      days: "days",
      confirmAndSave: "Confirm & Save",
      editDetails: "Edit Details",
      autoPopulated: "Auto-populated from scan",
      day: "Day"
    },
    th: {
      title: "ตรวจสอบรายละเอียดที่ดึงมา",
      subtitle: "ยืนยันข้อมูลที่เราพบในสัญญาเช่าของคุณ",
      propertyAddress: "ที่อยู่ทรัพย์สิน",
      monthlyRent: "ค่าเช่ารายเดือน",
      rentDueDay: "วันที่ครบกำหนดค่าเช่า",
      depositAmount: "จำนวนเงินมัดจำ",
      leaseStart: "วันเริ่มสัญญา",
      leaseEnd: "วันสิ้นสุดสัญญา",
      noticePeriod: "ระยะเวลาแจ้งล่วงหน้า",
      depositDueDate: "วันครบกำหนดเงินมัดจำ",
      expectedReturnDate: "วันที่คาดว่าจะได้รับคืน",
      noticeDeadline: "กำหนดเวลาแจ้งล่วงหน้า",
      estimated: "คำนวณโดยระบบ",
      needsReview: "ต้องตรวจสอบ",
      notSpecified: "ไม่ระบุ",
      days: "วัน",
      confirmAndSave: "ยืนยันและบันทึก",
      editDetails: "แก้ไขรายละเอียด",
      autoPopulated: "กรอกอัตโนมัติจากการสแกน",
      day: "วันที่"
    }
  };

  const strings = t[language] || t.en;
  const summary = reviewData?.summary || {};
  const estimatedFields = reviewData?.estimated_fields || {};

  const InfoRow = ({ label, value, isEstimated, needsReview: needsReviewFlag }) => (
    <div className="flex items-start justify-between gap-4 py-3 border-b" style={{ borderColor: colors.borderColor }}>
      <span className="text-sm font-semibold flex-shrink-0" style={{ color: colors.textSecondary }}>
        {label}
      </span>
      <div className="text-right flex-1 min-w-0">
        <div className="text-sm font-bold" style={{ color: colors.textPrimary }}>
          {value || strings.notSpecified}
        </div>
        {isEstimated && (
          <Badge className="mt-1 text-xs bg-amber-100 text-amber-800">
            {strings.estimated}
          </Badge>
        )}
        {needsReviewFlag && (
          <Badge className="mt-1 text-xs bg-blue-100 text-blue-800">
            {strings.needsReview}
          </Badge>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card className="border-2 border-dashed" style={{ 
        backgroundColor: colors.cardBg,
        borderColor: '#0C3B2E'
      }}>
        <CardHeader style={{ backgroundColor: isDarkMode ? '#1E3A2E' : '#ECFDF5' }}>
          <CardTitle className="flex items-center gap-3" style={{ color: colors.textPrimary }}>
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <div>
              <div className="text-lg font-bold">{strings.title}</div>
              <div className="text-sm font-normal" style={{ color: colors.textSecondary }}>
                {strings.subtitle}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-1">
            <InfoRow 
              label={strings.propertyAddress} 
              value={summary.property_address}
            />
            <InfoRow 
              label={strings.monthlyRent} 
              value={summary.monthly_rent > 0 ? `฿${summary.monthly_rent.toLocaleString()}` : null}
            />
            <InfoRow 
              label={strings.rentDueDay} 
              value={summary.rent_due_day !== 'Not specified' ? `${strings.day} ${summary.rent_due_day}` : null}
              needsReview={estimatedFields.rent_due_day_missing}
            />
            <InfoRow 
              label={strings.depositAmount} 
              value={summary.deposit_amount > 0 ? `฿${summary.deposit_amount.toLocaleString()}` : null}
            />
            <InfoRow 
              label={strings.leaseStart} 
              value={summary.lease_start}
            />
            <InfoRow 
              label={strings.leaseEnd} 
              value={summary.lease_end}
            />
            <InfoRow 
              label={strings.noticePeriod} 
              value={summary.notice_period_days !== 'Not specified' ? `${summary.notice_period_days} ${strings.days}` : null}
            />
            <InfoRow 
              label={strings.depositDueDate} 
              value={summary.deposit_due_date}
              isEstimated={estimatedFields.deposit_due_date}
            />
            <InfoRow 
              label={strings.expectedReturnDate} 
              value={summary.expected_return_date}
              isEstimated={estimatedFields.expected_return_date}
            />
            {summary.notice_deadline && (
              <InfoRow 
                label={strings.noticeDeadline} 
                value={summary.notice_deadline ? new Date(summary.notice_deadline).toISOString().split('T')[0] : null}
              />
            )}
          </div>

          {/* Warning for estimated fields */}
          {(estimatedFields.deposit_due_date || estimatedFields.expected_return_date || estimatedFields.rent_due_day_missing) && (
            <div className="mt-4 p-4 rounded-lg border-l-4" style={{
              backgroundColor: isDarkMode ? '#3A2D1C' : '#FFF7ED',
              borderLeftColor: '#F59E0B'
            }}>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: isDarkMode ? '#FCD34D' : '#B45309' }}>
                    {language === 'th' ? 'มีฟิลด์ที่คำนวณโดยระบบ' : 'Some fields were estimated'}
                  </p>
                  <p className="text-xs" style={{ color: isDarkMode ? '#FDE68A' : '#92400E' }}>
                    {language === 'th' 
                      ? 'ฟิลด์ที่ไม่มีในสัญญาถูกคำนวณโดยค่าเริ่มต้น คุณสามารถแก้ไขได้ในหน้า Property Tracker'
                      : 'Fields not explicitly stated in the lease were calculated using defaults. You can edit them in Property Tracker.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                haptic.light();
                onEdit();
              }}
              className="flex-1"
              style={{ minHeight: '48px' }}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              {strings.editDetails}
            </Button>
            <Button
              onClick={() => {
                haptic.medium();
                onConfirm();
              }}
              className="flex-1 text-white"
              style={{ 
                minHeight: '48px',
                backgroundColor: '#0C3B2E'
              }}
            >
              {strings.confirmAndSave}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}