import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Loader2, CheckCircle2, Upload, X, Crown, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RESOLVE_PRICING, hasMemberPricing, getMembershipInfo, getResolvePricingForUser } from "../components/shared/resolvePricing";
import { ToastProvider, useToast } from "../components/shared/Toast";
import AuthGuard from "../components/shared/AuthGuard";
import MobileFormInput from "../components/shared/MobileFormInput";
import { haptic } from "../components/shared/HapticFeedback";
import PageHeader from "../components/shared/PageHeader";
import ProgressBar from "../components/shared/ProgressBar";
import TrustBadge from "../components/shared/TrustBadge";

function ResolveCaseContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    type: 'deposit',
    dispute_amount: '',
    summary: '',
    landlord_name: '',
    landlord_email: '',
    property_address: '',
    evidence_files: []
  });
  const [uploading, setUploading] = useState(false);
  const [autoFilledFromDeposit, setAutoFilledFromDeposit] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [freeResolveEligible, setFreeResolveEligible] = useState(false);
  const [eligibilityData, setEligibilityData] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Check free Resolve eligibility on mount
  React.useEffect(() => {
    if (user?.id) {
      setCheckingEligibility(true);
      base44.functions.invoke('isFreeResolveEligible', { userId: user.id })
        .then(response => {
          console.log('🎯 [RESOLVE_PAGE] Eligibility check result:', response.data);
          setFreeResolveEligible(response.data?.eligible || false);
          setEligibilityData(response.data);
        })
        .catch(error => {
          console.error('❌ [RESOLVE_PAGE] Eligibility check failed:', error);
          setFreeResolveEligible(false);
        })
        .finally(() => {
          setCheckingEligibility(false);
        });
    }
  }, [user?.id]);

  const { data: deposits = [] } = useQuery({
    queryKey: ['deposits'],
    queryFn: () => base44.entities.DepositTracker.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  // Auto-fill from deposit if coming from deposit tracker
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const depositIdParam = urlParams.get('depositId');
    
    if (depositIdParam && deposits.length > 0) {
      const deposit = deposits.find(d => d.id === depositIdParam);
      if (deposit) {
        setFormData(prev => ({
          ...prev,
          type: 'deposit',
          dispute_amount: deposit.deposit_amount?.toString() || '',
          property_address: deposit.property_address || '',
          summary: language === 'th'
            ? `เงินมัดจำ ฿${deposit.deposit_amount?.toLocaleString()} ยังไม่ได้รับคืน`
            : language === 'ru'
            ? `Депозит ฿${deposit.deposit_amount?.toLocaleString()} не возвращён`
            : `Security deposit of ฿${deposit.deposit_amount?.toLocaleString()} not returned`,
          landlord_name: user?.landlord_name || '',
          landlord_email: user?.landlord_email || ''
        }));
        setAutoFilledFromDeposit(true);
      }
    }
  }, [deposits, user, language]);

  const colors = isDarkMode ? {
    bg: '#111827',
    cardBg: '#2A2D30',
    textPrimary: '#F9FAFB',
    textSecondary: '#D1D5DB',
    borderColor: 'rgba(255,255,255,0.1)',
    fieldBg: '#374151'
  } : {
    bg: '#F3F6F5',
    cardBg: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    borderColor: 'rgba(12,59,46,0.08)',
    fieldBg: '#F8FAFC'
  };

  const createCaseMutation = useMutation({
    mutationFn: async ({ caseData, useFreeEntitlement }) => {
      /**
       * ═══════════════════════════════════════════════════════════════
       * CASE CREATION - OWNERSHIP BINDING FIX
       * ═══════════════════════════════════════════════════════════════
       * 
       * CRITICAL BUG IDENTIFIED:
       * Cases were being created with user_email = signaconsultants@gmail.com
       * (admin account) instead of the actual logged-in tenant.
       * 
       * ROOT CAUSE:
       * - RLS uses user_email field for ownership: WHERE user_email = {{user.email}}
       * - Cases created without explicit user_email binding
       * - Frontend auth.me() was being called, but user_email still wrong
       * 
       * SOLUTION:
       * - Explicitly verify authenticated user in mutation
       * - Force user_email = authenticatedUser.email (from auth token)
       * - Never trust user_email from form data or props
       * - Log everything for verification
       * 
       * VERIFICATION:
       * After this fix, new cases should show:
       * - user_email = <tenant's actual email>
       * - created_by = <tenant's actual email>
       * - Case visible in tenant's "My Cases" page
       * - Case visible in Ops Console (admins see all cases)
       * ═══════════════════════════════════════════════════════════════
       */
      
      // Step 1: Get REAL authenticated user from auth token
      const authenticatedUser = await base44.auth.me();
      if (!authenticatedUser) {
        console.error('[CASE_CREATION] ❌ Not authenticated - blocking creation');
        throw new Error('Not authenticated');
      }
      
      console.log('[CASE_CREATION] ✅ Authenticated user verified:', {
        id: authenticatedUser.id,
        email: authenticatedUser.email,
        full_name: authenticatedUser.full_name,
        plan_tier: authenticatedUser.plan_tier
      });
      
      // Step 2: Build secure case with FORCED user binding
      // NEVER trust caseData.user_email - always override with auth user
      const secureCase = {
        ...caseData,
        user_email: authenticatedUser.email,  // CRITICAL: Force from auth token
        created_by: authenticatedUser.email   // Redundant but safe
      };
      
      console.log('[CASE_CREATION] 📦 Case data prepared with FORCED user binding:', {
        user_email: secureCase.user_email,
        created_by: secureCase.created_by,
        case_number: secureCase.case_number,
        type: secureCase.type,
        dispute_amount: secureCase.dispute_amount,
        property_address: secureCase.property_address,
        landlord_name: secureCase.landlord_name,
        status: secureCase.status
      });
      
      // Step 3: Create case in database
      const createdCase = await base44.entities.Case.create(secureCase);
      
      // Step 4: CRITICAL VERIFICATION - Confirm user_email persisted correctly
      console.log('[CASE_CREATION] ✅ Case created - VERIFYING user binding:', {
        id: createdCase.id,
        case_number: createdCase.case_number,
        user_email: createdCase.user_email,
        created_by: createdCase.created_by,
        status: createdCase.status,
        OWNERSHIP_CHECK: createdCase.user_email === authenticatedUser.email ? '✅ CORRECT' : '❌ MISMATCH'
      });
      
      // Step 5: Throw error if user_email is wrong (should never happen)
      if (createdCase.user_email !== authenticatedUser.email) {
        console.error('[CASE_CREATION] 🚨 CRITICAL: Case created with WRONG user_email!', {
          expected: authenticatedUser.email,
          actual: createdCase.user_email,
          caseId: createdCase.id
        });
        throw new Error(`Ownership binding failed: case created with wrong user_email (${createdCase.user_email} instead of ${authenticatedUser.email})`);
      }
      
      console.log('[CASE_CREATION] ✅ OWNERSHIP VERIFIED - case belongs to:', authenticatedUser.email);
      
      // WORKFLOW FIX: Send admin notification
      try {
        await base44.functions.invoke('notifyAdminNewCase', {
          caseNumber: createdCase.case_number,
          tenantName: authenticatedUser.full_name,
          tenantEmail: createdCase.user_email,
          landlordName: createdCase.landlord_name,
          propertyAddress: createdCase.property_address,
          disputeAmount: createdCase.dispute_amount,
          planTier: authenticatedUser.plan_tier,
          caseId: createdCase.id
        });
        console.log('[RESOLVE_FLOW] Admin notification sent');
      } catch (notifyError) {
        console.error('[RESOLVE_FLOW] Admin notification failed (non-blocking):', notifyError);
      }
      
      return { 
        createdCase, 
        userId: authenticatedUser.id, 
        userEmail: authenticatedUser.email 
      };
    },
    onSuccess: async ({ createdCase, userId, userEmail, useFreeEntitlement }) => {
      console.log('[RESOLVE_FLOW] ✅ Case created successfully:', {
        id: createdCase.id,
        case_number: createdCase.case_number,
        status: createdCase.status,
        user_email: createdCase.user_email,
        useFreeEntitlement
      });
      
      // Invalidate queries to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ['cases'] });
      
      // If using free entitlement, activate case directly
      if (useFreeEntitlement) {
        console.log('🎁 [RESOLVE_FLOW] Using free Resolve entitlement');
        try {
          const activateResponse = await base44.functions.invoke('createResolveCaseFree', {
            caseId: createdCase.id
          });
          
          if (activateResponse.data?.success) {
            toast.success(
              language === 'th' ? '✅ คดีถูกเปิดโดยใช้สิทธิ์ Resolve ฟรี'
              : language === 'zh' ? '✅ 案件已使用免费Resolve权益激活'
              : language === 'ja' ? '✅ 無料Resolve権利を使用してケースが開設されました'
              : language === 'ko' ? '✅ 무료 Resolve 권한으로 사례 개설됨'
              : language === 'ru' ? '✅ Дело открыто с использованием бесплатного Resolve'
              : '✅ Case opened using free Resolve entitlement'
            );
            navigate(createPageUrl("cases"));
            return;
          } else {
            throw new Error('Failed to activate free case');
          }
        } catch (freeError) {
          console.error('❌ [RESOLVE_FLOW] Free activation failed:', freeError);
          toast.error(
            language === 'th' ? 'ไม่สามารถใช้สิทธิ์ฟรีได้ กรุณาชำระเงิน'
            : 'Failed to use free entitlement. Please proceed to payment.'
          );
        }
      }
      
      // Standard paid flow - Create Stripe checkout
      const pricing = getResolvePricingForUser(user);
      
      const response = await base44.functions.invoke('createResolveCheckout', {
        userId: userId,
        userEmail: userEmail,
        caseId: createdCase.id,
        priceType: pricing.priceType,
        amount: pricing.amount
      });
      
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    },
    onError: (error) => {
      console.error('[RESOLVE_FLOW] Case creation or checkout failed:', error);
      const errorMessage = error?.message || 'Unknown error';
      toast.error(
        language === 'th' ? 'ไม่สามารถส่งคดีได้: ' + errorMessage
        : language === 'zh' ? '提交案件失败: ' + errorMessage
        : language === 'ja' ? 'ケース送信失敗: ' + errorMessage
        : language === 'ko' ? '사례 제출 실패: ' + errorMessage
        : language === 'ru' ? 'Ошибка отправки дела: ' + errorMessage
        : 'Failed to submit case: ' + errorMessage
      );
    }
  });

  // ROOT CAUSE FIX #8: Properly handle file uploads with error handling
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    haptic.light();
    setUploading(true);
    try {
      const uploadResults = [];
      
      // Upload files sequentially to avoid overwhelming the system
      for (const file of Array.from(files)) {
        try {
          const result = await base44.integrations.Core.UploadFile({ file });
          uploadResults.push({
            success: true,
            file_url: result.file_url,
            fileName: file.name
          });
        } catch (uploadError) {
          uploadResults.push({
            success: false,
            fileName: file.name,
            error: uploadError.message
          });
        }
      }
      
      // Check if any uploads succeeded
      const successfulUploads = uploadResults.filter(r => r.success);
      const failedUploads = uploadResults.filter(r => !r.success);
      
      if (successfulUploads.length > 0) {
        const newFiles = successfulUploads.map((result, idx) => ({
          id: `file-${Date.now()}-${idx}`,
          url: result.file_url,
          type: 'photo',
          label: result.fileName,
          uploaded_date: new Date().toISOString()
        }));
        
        setFormData(prev => ({
          ...prev,
          evidence_files: [...prev.evidence_files, ...newFiles]
        }));
        
        toast.success(
          language === 'th' ? `อัปโหลดสำเร็จ ${successfulUploads.length} ไฟล์`
          : language === 'zh' ? `成功上传 ${successfulUploads.length} 个文件`
          : language === 'ja' ? `${successfulUploads.length}ファイルのアップロード成功`
          : language === 'ko' ? `${successfulUploads.length}개 파일 업로드 성공`
          : language === 'ru' ? `Успешно загружено ${successfulUploads.length} файлов`
          : `${successfulUploads.length} file(s) uploaded successfully`
        );
      }
      
      if (failedUploads.length > 0) {
        toast.error(
          language === 'th' ? `ไม่สามารถอัปโหลด ${failedUploads.length} ไฟล์`
          : language === 'zh' ? `${failedUploads.length} 个文件上传失败`
          : language === 'ja' ? `${failedUploads.length}ファイルのアップロード失敗`
          : language === 'ko' ? `${failedUploads.length}개 파일 업로드 실패`
          : language === 'ru' ? `Не удалось загрузить ${failedUploads.length} файлов`
          : `Failed to upload ${failedUploads.length} file(s)`
        );
      }
    } catch (error) {
      toast.error(
        language === 'th' ? 'เกิดข้อผิดพลาดในการอัปโหลด'
        : language === 'zh' ? '上传出错'
        : language === 'ja' ? 'アップロードエラー'
        : language === 'ko' ? '업로드 오류'
        : language === 'ru' ? 'Ошибка загрузки'
        : 'Upload error'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (fileId) => {
    haptic.light();
    setFormData(prev => ({
      ...prev,
      evidence_files: prev.evidence_files.filter(f => f.id !== fileId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.type || !formData.dispute_amount || !formData.summary) {
      toast.error(
        language === 'th' ? 'กรุณากรอกข้อมูลให้ครบถ้วน'
        : language === 'zh' ? '请填写所有必填字段'
        : language === 'ja' ? '必須項目をすべて入力してください'
        : language === 'ko' ? '모든 필수 항목을 입력하세요'
        : language === 'ru' ? 'Пожалуйста, заполните все обязательные поля'
        : 'Please fill in all required fields'
      );
      haptic.error();
      return;
    }

    haptic.medium();

    try {
      // CRITICAL FIX: Use unified membership system
      const membershipForCase = getMembershipInfo(user);
      const isMember = membershipForCase.qualifiesForMemberBenefits;
      const planTier = user?.plan_tier?.toLowerCase() || 'free';
      const tierLevel = planTier === 'lite' ? 'L' : planTier === 'protect' ? 'P' : planTier === 'secure' ? 'S' : 'F';
      
      const caseNumberResponse = await base44.functions.invoke('generateCaseNumber', {
        isMember: isMember,
        fastTrack: false,
        tierLevel: tierLevel
      });
      
      if (!caseNumberResponse.data?.case_number) {
        throw new Error('Failed to generate case number');
      }
      
      const caseNumber = caseNumberResponse.data.case_number;

      // Map evidence to clean array (no file objects)
      const evidenceData = formData.evidence_files.map(file => ({
        id: file.id,
        url: file.url,
        type: file.type || 'photo',
        label: file.label,
        uploaded_date: file.uploaded_date
      }));

      /**
       * ═══════════════════════════════════════════════════════════════
       * CASE DATA CONSTRUCTION
       * ═══════════════════════════════════════════════════════════════
       * 
       * CRITICAL: user_email is set here, but will be RE-FORCED in the
       * mutation to use auth.me() to prevent any tampering.
       * 
       * This user.email is just for logging/consistency - the mutation
       * will override it with the authenticated user's email.
       * ═══════════════════════════════════════════════════════════════
       */
      const caseData = {
        case_number: caseNumber,
        user_email: user.email, // Will be re-forced in mutation from auth token
        type: formData.type,
        dispute_amount: parseFloat(formData.dispute_amount),
        summary: formData.summary,
        landlord_name: formData.landlord_name || user?.landlord_name || '',
        landlord_email: formData.landlord_email || user?.landlord_email || '',
        property_address: formData.property_address || '',
        evidence: evidenceData,
        status: 'awaiting_payment',
        is_member_at_creation: membershipForCase.qualifiesForMemberBenefits,
        flags: {
          priority: membershipForCase.qualifiesForMemberBenefits
        },
        timeline: [
          {
            timestamp: new Date().toISOString(),
            event: `Case ${caseNumber} created - awaiting payment (${membershipForCase.plan.toUpperCase()}, ${membershipForCase.qualifiesForMemberBenefits ? 'member' : 'public'} rate)`,
            actor: user.email,
            meta: {
              plan: membershipForCase.plan,
              membershipDays: membershipForCase.membershipDays,
              reason: membershipForCase.reason
            }
          }
        ]
      };

      // Pass case data to mutation with free entitlement flag
      createCaseMutation.mutate({ 
        caseData,
        useFreeEntitlement: freeResolveEligible
      });
    } catch (error) {
      toast.error(
        language === 'th' ? 'ไม่สามารถส่งคดีได้: ' + error.message
        : language === 'zh' ? '提交案件失败: ' + error.message
        : language === 'ja' ? 'ケース送信失敗: ' + error.message
        : language === 'ko' ? '사례 제출 실패: ' + error.message
        : language === 'ru' ? 'Ошибка отправки дела: ' + error.message
        : 'Failed to submit case: ' + error.message
      );
    }
  };

  const strings = {
    en: {
      title: "Open a Case",
      subtitle: "Get help resolving your rental dispute",
      autoFilled: "Auto-filled from overdue deposit",
      caseType: "Case Type",
      depositCase: "Deposit Not Returned",
      earlyTermCase: "Early Termination Issue",
      damagesCase: "Damages Dispute",
      otherCase: "Other Issue",
      disputeAmount: "Amount in Dispute",
      disputePlaceholder: "10000",
      propertAddress: "Property Address",
      addressPlaceholder: "123 Main St, Bangkok",
      summary: "Case Summary",
      summaryPlaceholder: "Describe your situation in detail...",
      landlordInfo: "Landlord Information",
      landlordName: "Landlord Name",
      landlordEmail: "Landlord Email",
      evidence: "Supporting Evidence",
      evidenceDesc: "Upload photos, receipts, or documents",
      uploadFiles: "Upload Files",
      uploading: "Uploading...",
      removeFile: "Remove",
      submit: "Submit Case",
      creating: "Creating case...",
      submitting: "Submitting & proceeding to payment...",
      required: "Required",
      optional: "Optional",
      caseDetails: "Case Details",
      autoFilledMsg: "Deposit data has been pre-filled. You can edit as needed.",
      resolveService: "Resolve Your Dispute",
      resolvePricing: "Service Pricing",
      memberPrice: "Member Price",
      publicPrice: "Public Price",
      perCase: "per case",
      savingsNote: "Save ฿{amount} vs public rate",
      upgradeToMemberRate: "Members pay ฿{memberPrice} per case. Upgrade your plan to unlock the member rate.",
      whatsIncluded: "What's Included:",
      reviewDocs: "Professional review of your documents",
      recommendActions: "Recommended action plan & strategy",
      templateLetters: "Customized legal template letters",
      memberSince: "Member since",
      memberPricingUnlocked: "member pricing unlocked",
      memberPricingUnlocksIn: "Member pricing unlocks after 30 days of active membership. Your member rate will apply to cases submitted after",
      membersPayAfter30Days: "Members pay ฿2,490 per case after 30 days. You can join today for additional benefits.",
      newMembershipNote: "Your new membership will apply member rates to future cases. This case is billed at the public rate.",
      memberRateExplanation: "Member rates apply after 30 days of active Lite, Protect or Secure membership. Upgrades during case submission apply to future cases only."
    },
    th: {
      title: "เปิดคดี",
      subtitle: "รับความช่วยเหลือในการแก้ไขข้อพิพาทเช่า",
      autoFilled: "กรอกอัตโนมัติจากเงินมัดจำที่เกินกำหนด",
      caseType: "ประเภทคดี",
      depositCase: "เงินมัดจำยังไม่ได้คืน",
      earlyTermCase: "ปัญหาการยกเลิกสัญญาก่อนกำหนด",
      damagesCase: "ข้อพิพาทความเสียหาย",
      otherCase: "ปัญหาอื่นๆ",
      disputeAmount: "จำนวนเงินที่พิพาท",
      disputePlaceholder: "10000",
      propertAddress: "ที่อยู่ทรัพย์สิน",
      addressPlaceholder: "123 ถ.สุขุมวิท กรุงเทพฯ",
      summary: "สรุปคดี",
      summaryPlaceholder: "อธิบายสถานการณ์ของคุณอย่างละเอียด...",
      landlordInfo: "ข้อมูลเจ้าของบ้าน",
      landlordName: "ชื่อเจ้าของบ้าน",
      landlordEmail: "อีเมลเจ้าของบ้าน",
      evidence: "หลักฐานประกอบ",
      evidenceDesc: "อัปโหลดรูปภาพ ใบเสร็จ หรือเอกสาร",
      uploadFiles: "อัปโหลดไฟล์",
      uploading: "กำลังอัปโหลด...",
      removeFile: "ลบ",
      submit: "ส่งคดี",
      creating: "กำลังสร้างคดี...",
      submitting: "กำลังส่งและไปชำระเงิน...",
      required: "จำเป็น",
      optional: "ไม่บังคับ",
      caseDetails: "รายละเอียดคดี",
      autoFilledMsg: "ข้อมูลเงินมัดจำได้ถูกกรอกให้อัตโนมัติ คุณสามารถแก้ไขได้",
      resolveService: "แก้ไขข้อพิพาทของคุณ",
      resolvePricing: "ราคาบริการ",
      memberPrice: "ราคาสมาชิก",
      publicPrice: "ราคาทั่วไป",
      perCase: "ต่อคดี",
      savingsNote: "ประหยัด ฿{amount} เมื่อเทียบกับราคาทั่วไป",
      upgradeToMemberRate: "สมาชิกจ่าย ฿{memberPrice} ต่อคดี อัปเกรดแผนของคุณเพื่อปลดล็อกราคาสมาชิก",
      whatsIncluded: "รวมถึง:",
      reviewDocs: "ตรวจสอบเอกสารโดยผู้เชี่ยวชาญ",
      recommendActions: "แผนปฏิบัติการและกลยุทธ์ที่แนะนำ",
      templateLetters: "จดหมายตัวอย่างกฎหมายที่ปรับแต่ง",
      memberSince: "สมาชิกตั้งแต่",
      memberPricingUnlocked: "ปลดล็อกราคาสมาชิกแล้ว",
      memberPricingUnlocksIn: "ราคาสมาชิกจะปลดล็อกหลังจากสมาชิกครบ 30 วัน ราคาสมาชิกจะใช้กับคดีที่ส่งหลังวันที่",
      membersPayAfter30Days: "สมาชิกจ่าย ฿2,490 ต่อคดีหลังครบ 30 วัน คุณสามารถเข้าร่วมวันนี้เพื่อรับสิทธิพิเศษเพิ่มเติม",
      newMembershipNote: "การเป็นสมาชิกใหม่ของคุณจะใช้ราคาสมาชิกกับคดีในอนาคต คดีนี้จะคิดราคาทั่วไป",
      memberRateExplanation: "ราคาสมาชิกใช้งานได้หลังสมาชิก Lite, Protect หรือ Secure ครบ 30 วัน การอัปเกรดระหว่างส่งคดีจะมีผลกับคดีในอนาคตเท่านั้น"
    },
    zh: {
      title: "开启案件",
      subtitle: "获得解决租赁纠纷的帮助",
      autoFilled: "从逾期押金自动填充",
      caseType: "案件类型",
      depositCase: "押金未退还",
      earlyTermCase: "提前终止问题",
      damagesCase: "损害纠纷",
      otherCase: "其他问题",
      disputeAmount: "争议金额",
      disputePlaceholder: "10000",
      propertAddress: "物业地址",
      addressPlaceholder: "123 Main St, Bangkok",
      summary: "案件摘要",
      summaryPlaceholder: "详细描述您的情况...",
      landlordInfo: "房东信息",
      landlordName: "房东姓名",
      landlordEmail: "房东电子邮件",
      evidence: "支持证据",
      evidenceDesc: "上传照片、收据或文件",
      uploadFiles: "上传文件",
      uploading: "上传中...",
      removeFile: "移除",
      submit: "提交案件",
      creating: "创建案件中...",
      submitting: "提交并进入支付...",
      required: "必填",
      optional: "可选",
      caseDetails: "案件详情",
      autoFilledMsg: "押金数据已预填。您可以根据需要进行编辑。",
      resolveService: "解决您的纠纷",
      resolvePricing: "服务定价",
      memberPrice: "会员价格",
      publicPrice: "公开价格",
      perCase: "每案",
      savingsNote: "比公开价节省฿{amount}",
      upgradeToMemberRate: "会员每案支付฿{memberPrice}。升级您的计划以解锁会员价格。",
      whatsIncluded: "包含内容：",
      reviewDocs: "专业文档审查",
      recommendActions: "推荐行动计划和策略",
      templateLetters: "定制法律模板信函",
      memberSince: "会员始于",
      memberPricingUnlocked: "会员定价已解锁",
      memberPricingUnlocksIn: "会员定价在活跃会员30天后解锁。您的会员价格将适用于之后提交的案件",
      membersPayAfter30Days: "会员30天后每案支付฿2,490。您可以今天加入以获得更多福利。",
      newMembershipNote: "您的新会员资格将对未来案件适用会员价格。此案件按公开价格计费。",
      memberRateExplanation: "会员价格在Lite、Protect或Secure会员30天后生效。案件提交期间的升级仅适用于未来的案件。"
    },
    ja: {
      title: "ケースを開く",
      subtitle: "賃貸紛争の解決を支援します",
      autoFilled: "期限超過の敷金から自動入力",
      caseType: "ケースタイプ",
      depositCase: "敷金が返還されていない",
      earlyTermCase: "早期終了問題",
      damagesCase: "損害紛争",
      otherCase: "その他の問題",
      disputeAmount: "紛争金額",
      disputePlaceholder: "10000",
      propertAddress: "物件住所",
      addressPlaceholder: "123 Main St, Bangkok",
      summary: "ケース概要",
      summaryPlaceholder: "状況を詳しく説明してください...",
      landlordInfo: "家主情報",
      landlordName: "家主名",
      landlordEmail: "家主メール",
      evidence: "裏付け証拠",
      evidenceDesc: "写真、領収書、または書類をアップロード",
      uploadFiles: "ファイルをアップロード",
      uploading: "アップロード中...",
      removeFile: "削除",
      submit: "ケースを送信",
      creating: "ケース作成中...",
      submitting: "提出して支払いへ...",
      required: "必須",
      optional: "オプション",
      caseDetails: "ケース詳細",
      autoFilledMsg: "敷金データが事前入力されました。必要に応じて編集できます。",
      resolveService: "紛争を解決する",
      resolvePricing: "サービス価格",
      memberPrice: "会員価格",
      publicPrice: "公開価格",
      perCase: "ケースごと",
      savingsNote: "公開価格より฿{amount}お得",
      upgradeToMemberRate: "会員はケースごとに฿{memberPrice}を支払います。プランをアップグレードして会員価格を解除してください。",
      whatsIncluded: "含まれるもの：",
      reviewDocs: "プロフェッショナルな書類審査",
      recommendActions: "推奨される行動計画と戦略",
      templateLetters: "カスタマイズされた法的テンプレートレター",
      memberSince: "会員登録日",
      memberPricingUnlocked: "会員価格が解除されました",
      memberPricingUnlocksIn: "会員価格は30日のアクティブな会員資格後に解除されます。会員価格は次の日以降に提出されたケースに適用されます",
      membersPayAfter30Days: "会員は30日後にケースごとに฿2,490を支払います。今日参加して追加の特典を受け取りましょう。",
      newMembershipNote: "新しい会員資格は今後のケースに会員価格を適用します。このケースは公開価格で請求されます。",
      memberRateExplanation: "会員価格はLite、Protect、Secureの会員登録後30日で適用されます。ケース提出中のアップグレードは今後のケースにのみ適用されます。"
    },
    ko: {
      title: "사례 열기",
      subtitle: "임대 분쟁 해결 도움 받기",
      autoFilled: "연체 보증금에서 자동 입력됨",
      caseType: "사례 유형",
      depositCase: "보증금 미반환",
      earlyTermCase: "조기 종료 문제",
      damagesCase: "손해 분쟁",
      otherCase: "기타 문제",
      disputeAmount: "분쟁 금액",
      disputePlaceholder: "10000",
      propertAddress: "부동산 주소",
      addressPlaceholder: "123 Main St, Bangkok",
      summary: "사례 요약",
      summaryPlaceholder: "상황을 자세히 설명하세요...",
      landlordInfo: "집주인 정보",
      landlordName: "집주인 이름",
      landlordEmail: "집주인 이메일",
      evidence: "증빙 자료",
      evidenceDesc: "사진, 영수증 또는 문서 업로드",
      uploadFiles: "파일 업로드",
      uploading: "업로드 중...",
      removeFile: "제거",
      submit: "사례 제출",
      creating: "사례 생성 중...",
      submitting: "제출 및 결제 진행 중...",
      required: "필수",
      optional: "선택사항",
      caseDetails: "사례 상세정보",
      autoFilledMsg: "보증금 데이터가 미리 채워졌습니다. 필요에 따라 편집할 수 있습니다.",
      resolveService: "분쟁 해결",
      resolvePricing: "서비스 가격",
      memberPrice: "회원 가격",
      publicPrice: "공개 가격",
      perCase: "사례당",
      savingsNote: "공개 가격보다 ฿{amount} 절약",
      upgradeToMemberRate: "회원은 사례당 ฿{memberPrice}를 지불합니다. 회원 가격을 잠금 해제하려면 플랜을 업그레이드하세요.",
      whatsIncluded: "포함 내용:",
      reviewDocs: "전문 문서 검토",
      recommendActions: "권장 실행 계획 및 전략",
      templateLetters: "맞춤형 법적 템플릿 레터",
      memberSince: "회원 가입일",
      memberPricingUnlocked: "회원 가격이 잠금 해제됨",
      memberPricingUnlocksIn: "회원 가격은 30일의 활성 회원 자격 후에 잠금 해제됩니다. 회원 가격은 다음 날짜 이후에 제출된 사례에 적용됩니다",
      membersPayAfter30Days: "회원은 30일 후 사례당 ฿2,490를 지불합니다. 오늘 가입하여 추가 혜택을 받으세요.",
      newMembershipNote: "새 회원 자격은 향후 사례에 회원 가격을 적용합니다. 이 사례는 공개 가격으로 청구됩니다.",
      memberRateExplanation: "회원 요금은 Lite, Protect 또는 Secure 회원 가입 30일 후 적용됩니다. 사례 제출 중 업그레이드는 향후 사례에만 적용됩니다.",
      cancel: "취소"
    },
    ru: {
      title: "Открыть дело",
      subtitle: "Получите помощь в решении спора по аренде",
      autoFilled: "Заполнено автоматически из просроченного депозита",
      caseType: "Тип дела",
      depositCase: "Депозит не возвращён",
      earlyTermCase: "Досрочное расторжение",
      damagesCase: "Спор о повреждениях",
      otherCase: "Другая проблема",
      disputeAmount: "Сумма спора",
      disputePlaceholder: "10000",
      propertAddress: "Адрес недвижимости",
      addressPlaceholder: "123 Main St, Bangkok",
      summary: "Описание дела",
      summaryPlaceholder: "Подробно опишите вашу ситуацию...",
      landlordInfo: "Данные владельца",
      landlordName: "Имя владельца",
      landlordEmail: "Email владельца",
      evidence: "Подтверждающие материалы",
      evidenceDesc: "Загрузите фотографии, квитанции или документы",
      uploadFiles: "Загрузить файлы",
      uploading: "Загрузка...",
      removeFile: "Удалить",
      submit: "Отправить дело",
      creating: "Создание дела...",
      submitting: "Отправка и переход к оплате...",
      required: "Обязательно",
      optional: "Необязательно",
      caseDetails: "Информация по делу",
      autoFilledMsg: "Данные депозита были предварительно заполнены. Вы можете их отредактировать.",
      resolveService: "Решите свой спор",
      resolvePricing: "Стоимость услуги",
      memberPrice: "Тариф участника",
      publicPrice: "Публичный тариф",
      perCase: "за одно дело",
      savingsNote: "Экономия ฿{amount} от публичного тарифа",
      upgradeToMemberRate: "Участники сервиса платят ฿{memberPrice} за одно дело. Обновите тариф, чтобы получить льготную цену.",
      whatsIncluded: "Что входит в услугу:",
      reviewDocs: "Профессиональный анализ ваших документов",
      recommendActions: "Рекомендованный план действий и стратегия",
      templateLetters: "Индивидуально подготовленные шаблоны юридических писем",
      memberSince: "Участник с",
      memberPricingUnlocked: "Тариф участника активирован",
      memberPricingUnlocksIn: "Тариф участника активируется после 30 дней активного членства. Ваш тариф применится к делам, поданным после",
      membersPayAfter30Days: "Участники платят ฿2,490 за дело через 30 дней. Присоединяйтесь сегодня для дополнительных преимуществ.",
      newMembershipNote: "Ваше новое членство применит тарифы участника к будущим делам. Это дело оплачивается по публичному тарифу.",
      memberRateExplanation: "Тарифы участника действуют через 30 дней активного членства Lite, Protect или Secure. Обновления во время подачи дела применяются только к будущим делам.",
      cancel: "Отмена"
    }
  };

  const str = strings[language] || strings.en;

  return (
    <div className="min-h-screen p-4 md:p-6 page-transition" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title={str.title}
          subtitle={str.subtitle}
          icon={Shield}
          iconColor="#DC2626"
          showBack={true}
          isDarkMode={isDarkMode}
        />

        {autoFilledFromDeposit && (
          <div className="mb-6 p-4 rounded-lg border-2 animate-pulse" style={{
            backgroundColor: isDarkMode ? '#1E4435' : '#ECFDF5',
            borderColor: '#10B981'
          }}>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-sm" style={{ color: '#10B981' }}>
                  🛡️ {str.autoFilled}
                </p>
                <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                  {str.autoFilledMsg}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Free Resolve Entitlement Banner */}
        {freeResolveEligible && (
          <Card className="border-none shadow-xl mb-6" style={{ 
            backgroundColor: isDarkMode ? '#1E3A2E' : '#ECFDF5',
            borderLeft: '6px solid #10B981'
          }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                  flexShrink: 0
                }}>
                  <Crown className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1" style={{ color: '#10B981' }}>
                    {language === 'th' ? '🎁 ใช้ Resolve ฟรี (รวมในแผน Secure)'
                    : language === 'zh' ? '🎁 使用免费Resolve（包含在Secure计划中）'
                    : language === 'ja' ? '🎁 無料Resolveを使用（Secureプランに含まれます）'
                    : language === 'ko' ? '🎁 무료 Resolve 사용（Secure 플랜 포함）'
                    : language === 'ru' ? '🎁 Использовать бесплатный Resolve（включен в Secure）'
                    : '🎁 Use Free Resolve Case (included in Annual Secure)'}
                  </h3>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {language === 'th' ? 'คุณมีสิทธิ์ 1 คดี Resolve ฟรีต่อปี • ไม่มีค่าใช้จ่าย'
                    : language === 'zh' ? '您有权每年获得1个免费Resolve案件 • 无费用'
                    : language === 'ja' ? '年間1件の無料Resolveケースの権利があります • 費用なし'
                    : language === 'ko' ? '연간 1건의 무료 Resolve 케이스 권한 • 무료'
                    : language === 'ru' ? 'У вас есть право на 1 бесплатное дело Resolve в год • Без оплаты'
                    : 'You have 1 free Resolve case per year • No charge'}
                  </p>
                  {eligibilityData?.period_end && (
                    <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                      {language === 'th' ? `รีเซ็ตเมื่อ: ${new Date(eligibilityData.period_end).toLocaleDateString()}`
                      : language === 'zh' ? `重置于: ${new Date(eligibilityData.period_end).toLocaleDateString()}`
                      : language === 'ja' ? `リセット: ${new Date(eligibilityData.period_end).toLocaleDateString()}`
                      : language === 'ko' ? `초기화: ${new Date(eligibilityData.period_end).toLocaleDateString()}`
                      : language === 'ru' ? `Сброс: ${new Date(eligibilityData.period_end).toLocaleDateString()}`
                      : `Resets: ${new Date(eligibilityData.period_end).toLocaleDateString()}`}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ineligibility Messages */}
        {!freeResolveEligible && eligibilityData?.reason === 'grace_period' && (
          <Card className="border-none shadow-lg mb-6" style={{ 
            backgroundColor: isDarkMode ? '#2A2020' : '#FEF3C7',
            borderLeft: '4px solid #F59E0B'
          }}>
            <CardContent className="p-4">
              <p className="text-sm font-semibold mb-1" style={{ color: isDarkMode ? '#FCD34D' : '#92400E' }}>
                ⏳ {language === 'th' ? `Resolve ฟรีจะปลดล็อกในอีก ${eligibilityData.days_remaining} วัน`
                : language === 'zh' ? `免费Resolve将在${eligibilityData.days_remaining}天后解锁`
                : language === 'ja' ? `無料Resolveはあと${eligibilityData.days_remaining}日で解除されます`
                : language === 'ko' ? `무료 Resolve는 ${eligibilityData.days_remaining}일 후 잠금 해제됩니다`
                : language === 'ru' ? `Бесплатный Resolve разблокируется через ${eligibilityData.days_remaining} дн.`
                : `Free Resolve unlocks in ${eligibilityData.days_remaining} days`}
              </p>
              <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                {language === 'th' ? 'สิทธิ์ Resolve ฟรีใช้ได้หลังจาก 7 วันของการเป็นสมาชิก Annual Secure'
                : language === 'zh' ? '免费Resolve权益在Annual Secure会员7天后可用'
                : language === 'ja' ? '無料Resolve権利はAnnual Secure会員資格の7日後に利用可能'
                : language === 'ko' ? '무료 Resolve 권한은 Annual Secure 회원 7일 후 사용 가능'
                : language === 'ru' ? 'Бесплатный Resolve доступен через 7 дней участия в Annual Secure'
                : 'Free Resolve available after 7 days of Annual Secure membership'}
              </p>
            </CardContent>
          </Card>
        )}

        {!freeResolveEligible && eligibilityData?.reason === 'subscription_not_active' && (
          <Card className="border-none shadow-lg mb-6" style={{ 
            backgroundColor: isDarkMode ? '#2A2020' : '#FEE2E2',
            borderLeft: '4px solid #EF4444'
          }}>
            <CardContent className="p-4">
              <p className="text-sm font-semibold" style={{ color: isDarkMode ? '#FCA5A5' : '#991B1B' }}>
                ⚠️ {language === 'th' ? 'การสมัครสมาชิกไม่ทำงาน กรุณาต่ออายุเพื่อเข้าถึงสิทธิ์'
                : language === 'zh' ? '会员资格未激活。请续订以访问权益'
                : language === 'ja' ? '会員資格がアクティブではありません。特典にアクセスするには更新してください'
                : language === 'ko' ? '회원 자격이 활성화되지 않았습니다. 혜택을 이용하려면 갱신하세요'
                : language === 'ru' ? 'Членство не активно. Пожалуйста, продлите для доступа к льготам'
                : 'Membership not active. Please renew to access included benefits.'}
              </p>
            </CardContent>
          </Card>
        )}

        {!freeResolveEligible && eligibilityData?.reason === 'scheduled_cancellation' && (
          <Card className="border-none shadow-lg mb-6" style={{ 
            backgroundColor: isDarkMode ? '#2A2020' : '#FEE2E2',
            borderLeft: '4px solid #EF4444'
          }}>
            <CardContent className="p-4">
              <p className="text-sm font-semibold" style={{ color: isDarkMode ? '#FCA5A5' : '#991B1B' }}>
                ⚠️ {language === 'th' ? 'การสมัครสมาชิกกำลังจะยกเลิก สิทธิ์พิเศษไม่พร้อมใช้งาน'
                : language === 'zh' ? '订阅计划取消中。特殊权益不可用'
                : language === 'ja' ? 'サブスクリプションキャンセル予定。特典利用不可'
                : language === 'ko' ? '구독이 취소 예정입니다. 혜택을 이용할 수 없습니다'
                : language === 'ru' ? 'Подписка отменяется. Льготы недоступны'
                : 'Subscription scheduled to cancel. Benefits unavailable.'}
              </p>
            </CardContent>
          </Card>
        )}

        {!freeResolveEligible && eligibilityData?.reason === 'not_annual_secure' && (
          <Card className="border-none shadow-lg mb-6" style={{ 
            backgroundColor: isDarkMode ? '#2A2020' : '#FEF3C7',
            borderLeft: '4px solid #F59E0B'
          }}>
            <CardContent className="p-4">
              <p className="text-sm font-semibold" style={{ color: isDarkMode ? '#FCD34D' : '#92400E' }}>
                ℹ️ {language === 'th' ? 'Resolve ฟรีรวมอยู่ในแผน Annual Secure เท่านั้น'
                : language === 'zh' ? '免费Resolve仅包含在Annual Secure计划中'
                : language === 'ja' ? '無料ResolveはAnnual Secureプランにのみ含まれます'
                : language === 'ko' ? '무료 Resolve는 Annual Secure 플랜에만 포함됩니다'
                : language === 'ru' ? 'Бесплатный Resolve включен только в годовой план Secure'
                : 'Free Resolve is included with Annual Secure only.'}
              </p>
            </CardContent>
          </Card>
        )}

        {!freeResolveEligible && eligibilityData?.reason === 'already_used' && (
          <Card className="border-none shadow-lg mb-6" style={{ 
            backgroundColor: isDarkMode ? '#2A2020' : '#FEE2E2',
            borderLeft: '4px solid #EF4444'
          }}>
            <CardContent className="p-4">
              <p className="text-sm font-semibold mb-1" style={{ color: isDarkMode ? '#FCA5A5' : '#991B1B' }}>
                ⚠️ {language === 'th' ? 'คุณใช้ Resolve ฟรีไปแล้วในรอบนี้'
                : language === 'zh' ? '您已在本期使用了免费Resolve'
                : language === 'ja' ? '今期の無料Resolveは既に使用済みです'
                : language === 'ko' ? '이번 기간에 무료 Resolve를 이미 사용했습니다'
                : language === 'ru' ? 'Вы уже использовали бесплатный Resolve в этом периоде'
                : 'Free Resolve already used this period'}
              </p>
              {eligibilityData?.period_end && (
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  {language === 'th' ? `รีเซ็ตเมื่อ: ${new Date(eligibilityData.period_end).toLocaleDateString()}`
                  : language === 'zh' ? `重置于: ${new Date(eligibilityData.period_end).toLocaleDateString()}`
                  : language === 'ja' ? `リセット: ${new Date(eligibilityData.period_end).toLocaleDateString()}`
                  : language === 'ko' ? `초기화: ${new Date(eligibilityData.period_end).toLocaleDateString()}`
                  : language === 'ru' ? `Сброс: ${new Date(eligibilityData.period_end).toLocaleDateString()}`
                  : `Resets: ${new Date(eligibilityData.period_end).toLocaleDateString()}`}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Resolve Service Pricing */}
        <Card className="border-none shadow-xl mb-6" style={{ 
          backgroundColor: colors.cardBg,
          borderLeft: freeResolveEligible ? '4px solid #10B981' : (hasMemberPricing(user) ? '4px solid #10B981' : '4px solid #C7A338')
        }}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6" style={{ color: freeResolveEligible ? '#10B981' : (hasMemberPricing(user) ? '#10B981' : '#C7A338') }} />
              <CardTitle style={{ color: colors.textPrimary }}>{str.resolveService}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-bold mb-3" style={{ color: colors.textSecondary }}>
                {str.whatsIncluded}
              </h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#10B981' }} />
                  <span className="text-sm" style={{ color: colors.textPrimary }}>{str.reviewDocs}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#10B981' }} />
                  <span className="text-sm" style={{ color: colors.textPrimary }}>{str.recommendActions}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#10B981' }} />
                  <span className="text-sm" style={{ color: colors.textPrimary }}>{str.templateLetters}</span>
                </li>
              </ul>
            </div>

            <div className="border-t pt-4" style={{ borderColor: colors.borderColor }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold" style={{ color: colors.textSecondary }}>
                 {str.resolvePricing}
                </span>
                {freeResolveEligible ? (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                    <Crown className="w-3 h-3 mr-1" />
                    {language === 'th' ? 'ฟรี'
                    : language === 'zh' ? '免费'
                    : language === 'ja' ? '無料'
                    : language === 'ko' ? '무료'
                    : language === 'ru' ? 'Бесплатно'
                    : 'FREE'}
                  </Badge>
                ) : (() => {
                 const membership = getMembershipInfo(user);
                 const daysRemaining = membership.daysUntilMemberBenefits;

                 if (membership.qualifiesForMemberBenefits) {
                    return (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                        <Crown className="w-3 h-3 mr-1" />
                        {str.memberPrice}
                      </Badge>
                    );
                  } else if (membership.isPaidPlan && daysRemaining > 0) {
                    return (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                        {language === 'th' ? `อีก ${daysRemaining} วัน` 
                        : language === 'zh' ? `${daysRemaining}天`
                        : language === 'ja' ? `あと${daysRemaining}日`
                        : language === 'ko' ? `${daysRemaining}일`
                        : language === 'ru' ? `${daysRemaining} дн.`
                        : `${daysRemaining} days`}
                      </Badge>
                    );
                  }
                  return null;
                })()}
              </div>

              {freeResolveEligible ? (
                <>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold" style={{ color: '#10B981' }}>
                      ฿0
                    </span>
                    <span className="text-sm line-through" style={{ color: colors.textSecondary }}>
                      ฿{RESOLVE_PRICING.MEMBER_RATE.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg" style={{ 
                    backgroundColor: isDarkMode ? '#1E4435' : '#D1FAE5' 
                  }}>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-semibold" style={{ color: '#10B981' }}>
                      {language === 'th' ? 'รวมในการสมัคร Secure รายปีของคุณ • ฟรี'
                      : language === 'zh' ? '包含在您的年度Secure订阅中 • 免费'
                      : language === 'ja' ? '年間Secureサブスクリプションに含まれています • 無料'
                      : language === 'ko' ? '연간 Secure 구독에 포함 • 무료'
                      : language === 'ru' ? 'Включено в вашу годовую подписку Secure • Бесплатно'
                      : 'Included in your Annual Secure subscription • Free'}
                    </span>
                  </div>
                </>
              ) : (() => {
                const membership = getMembershipInfo(user);
                const daysRemaining = membership.daysUntilMemberBenefits;
                
                if (membership.qualifiesForMemberBenefits) {
                  // Qualified for member rate
                  return (
                    <>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold" style={{ color: '#10B981' }}>
                          ฿{RESOLVE_PRICING.MEMBER_RATE.toLocaleString()}
                        </span>
                        <span className="text-sm" style={{ color: colors.textSecondary }}>
                          {str.perCase}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg" style={{ 
                        backgroundColor: isDarkMode ? '#1E4435' : '#ECFDF5' 
                      }}>
                        <TrendingDown className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-semibold" style={{ color: '#10B981' }}>
                          {str.savingsNote.replace('{amount}', RESOLVE_PRICING.SAVINGS.toLocaleString())}
                        </span>
                      </div>
                    </>
                  );
                } else if (membership.isPaidPlan && daysRemaining > 0) {
                  // Paid plan but under 30 days - show public rate with countdown
                  return (
                    <>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
                          ฿{RESOLVE_PRICING.PUBLIC_RATE.toLocaleString()}
                        </span>
                        <span className="text-sm" style={{ color: colors.textSecondary }}>
                          {str.perCase}
                        </span>
                      </div>
                      <div className="p-3 rounded-lg space-y-2" style={{ 
                        backgroundColor: isDarkMode ? '#3A2D1C' : '#FEF3C7',
                        border: `1px solid ${isDarkMode ? '#F59E0B' : '#FCD34D'}`
                      }}>
                        <p className="text-xs font-semibold" style={{ color: isDarkMode ? '#FCD34D' : '#92400E' }}>
                          {language === 'th' ? `🕐 อยู่ในช่วง 30 วันแรกของการเป็นสมาชิก`
                          : language === 'zh' ? `🕐 在会员资格的前30天内`
                          : language === 'ja' ? `🕐 会員資格の最初の30日以内`
                          : language === 'ko' ? `🕐 회원 자격의 첫 30일 이내`
                          : language === 'ru' ? `🕐 В первых 30 днях членства`
                          : `🕐 Within first 30 days of membership`}
                        </p>
                        <p className="text-xs" style={{ color: isDarkMode ? '#FCD34D' : '#92400E' }}>
                          {language === 'th' ? `ราคาสมาชิก ฿${RESOLVE_PRICING.MEMBER_RATE.toLocaleString()} จะใช้ได้ในอีก ${daysRemaining} วัน`
                          : language === 'zh' ? `会员价格 ฿${RESOLVE_PRICING.MEMBER_RATE.toLocaleString()} 将在 ${daysRemaining} 天后生效`
                          : language === 'ja' ? `会員価格 ฿${RESOLVE_PRICING.MEMBER_RATE.toLocaleString()} はあと ${daysRemaining} 日で有効`
                          : language === 'ko' ? `회원 가격 ฿${RESOLVE_PRICING.MEMBER_RATE.toLocaleString()} 은 ${daysRemaining}일 후 활성화`
                          : language === 'ru' ? `Тариф участника ฿${RESOLVE_PRICING.MEMBER_RATE.toLocaleString()} через ${daysRemaining} дн.`
                          : `Member rate ฿${RESOLVE_PRICING.MEMBER_RATE.toLocaleString()} unlocks in ${daysRemaining} days`}
                        </p>
                      </div>
                    </>
                  );
                } else {
                  // Free plan or no membership
                  return (
                    <>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
                          ฿{RESOLVE_PRICING.PUBLIC_RATE.toLocaleString()}
                        </span>
                        <span className="text-sm" style={{ color: colors.textSecondary }}>
                          {str.perCase}
                        </span>
                      </div>
                      <div className="p-3 rounded-lg" style={{ 
                        backgroundColor: isDarkMode ? '#3A2D1C' : '#FEF3C7',
                        border: `1px solid ${isDarkMode ? '#F59E0B' : '#FCD34D'}`
                      }}>
                        <p className="text-xs" style={{ color: isDarkMode ? '#FCD34D' : '#92400E' }}>
                          {str.upgradeToMemberRate.replace('{memberPrice}', RESOLVE_PRICING.MEMBER_RATE.toLocaleString())}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2 w-full"
                          onClick={() => navigate(createPageUrl("account") + '?showPlans=true')}
                          style={{
                            borderColor: '#C7A338',
                            color: '#C7A338'
                          }}
                        >
                          {language === 'th' ? 'ดูแผน' : language === 'zh' ? '查看计划' : language === 'ja' ? 'プランを見る' : language === 'ko' ? '플랜 보기' : language === 'ru' ? 'Посмотреть тарифы' : 'View Plans'}
                        </Button>
                      </div>
                    </>
                  );
                }
              })()}
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
            <CardHeader>
              <CardTitle style={{ color: colors.textPrimary }}>{str.caseDetails}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                  {str.caseType} <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: colors.fieldBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary,
                    fontSize: '16px',
                    borderRadius: '12px',
                    border: `2px solid ${colors.borderColor}`,
                    minHeight: '48px'
                  }}
                >
                  <option value="deposit">{str.depositCase}</option>
                  <option value="early_termination">{str.earlyTermCase}</option>
                  <option value="damages">{str.damagesCase}</option>
                  <option value="other">{str.otherCase}</option>
                </select>
              </div>

              <MobileFormInput
                label={`${str.disputeAmount} (฿)`}
                type="number"
                value={formData.dispute_amount}
                onChange={(e) => setFormData({...formData, dispute_amount: e.target.value})}
                placeholder={str.disputePlaceholder}
                required
                colors={colors}
                min={0}
              />

              <MobileFormInput
                label={`${str.propertAddress} (${str.optional})`}
                value={formData.property_address}
                onChange={(e) => setFormData({...formData, property_address: e.target.value})}
                placeholder={str.addressPlaceholder}
                colors={colors}
              />

              <MobileFormInput
                label={str.summary}
                value={formData.summary}
                onChange={(e) => setFormData({...formData, summary: e.target.value})}
                placeholder={str.summaryPlaceholder}
                multiline
                rows={6}
                required
                colors={colors}
              />
            </CardContent>
          </Card>

          {/* Landlord Info */}
          <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
            <CardHeader>
              <CardTitle style={{ color: colors.textPrimary }}>{str.landlordInfo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <MobileFormInput
                label={str.landlordName}
                value={formData.landlord_name}
                onChange={(e) => setFormData({...formData, landlord_name: e.target.value})}
                colors={colors}
              />
              <MobileFormInput
                label={str.landlordEmail}
                type="email"
                value={formData.landlord_email}
                onChange={(e) => setFormData({...formData, landlord_email: e.target.value})}
                colors={colors}
              />
            </CardContent>
          </Card>

          {/* Evidence Upload */}
          <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
            <CardHeader>
              <CardTitle style={{ color: colors.textPrimary }}>{str.evidence}</CardTitle>
              <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>{str.evidenceDesc}</p>
            </CardHeader>
            <CardContent>
              {/* Privacy Notice - Consent (before evidence upload) */}
              <div className="mb-4 p-4 rounded-lg" style={{
                backgroundColor: isDarkMode ? '#1F2937' : '#F0FDF4',
                border: `2px solid ${isDarkMode ? '#10B981' : '#86EFAC'}`
              }}>
                <p className="text-xs font-semibold leading-relaxed" style={{ color: isDarkMode ? '#10B981' : '#047857' }}>
                  {language === 'th' 
                    ? '🔒 ความเป็นส่วนตัวของคุณ: โดยการเริ่ม Resolve Case คุณยินยอมให้เอกสารที่คุณส่งได้รับการตรวจสอบโดยเจ้าหน้าที่ Resolve Case ของ Lease Shield เพื่อวัตถุประสงค์ในการแก้ไข เอกสารที่ไม่ได้ส่งยังคงเป็นส่วนตัวและไม่สามารถเข้าถึงได้'
                    : language === 'zh'
                      ? '🔒 您的隐私：通过启动Resolve案件，您同意您提交的文档将由Lease Shield Resolve案件负责人审查以供解决之用。未提交的文档保持私密且无法访问。'
                      : language === 'ja'
                        ? '🔒 あなたのプライバシー：Resolveケースを開始することにより、提出したドキュメントがLease Shield Resolveケース担当者によって解決目的で確認されることに同意します。提出されていないドキュメントは非公開のままでアクセスできません。'
                        : language === 'ko'
                          ? '🔒 귀하의 개인정보: Resolve 케이스를 시작함으로써 귀하가 제출한 문서가 해결 목적으로 Lease Shield Resolve 케이스 담당자에 의해 검토되는 것에 동의합니다. 제출되지 않은 문서는 비공개로 유지되며 액세스할 수 없습니다.'
                          : language === 'ru'
                            ? '🔒 Ваша конфиденциальность: Открывая дело Resolve, вы соглашаетесь на то, что отправленные вами документы будут проверены сотрудниками Lease Shield по делам Resolve для целей разрешения. Неотправленные документы остаются приватными и недоступными.'
                            : '🔒 Your Privacy: By starting a Resolve Case, you consent to the documents you submit being reviewed by Lease Shield Resolve Case Officers for resolution purposes. Documents not submitted remain private and inaccessible.'}
                </p>
              </div>
              <label>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  disabled={uploading}
                />
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all"
                  style={{
                    borderColor: colors.borderColor,
                    backgroundColor: isDarkMode ? '#353A3D' : '#F9FAFB'
                  }}
                >
                  <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: colors.textSecondary }} />
                  <p className="font-semibold" style={{ color: colors.textPrimary }}>
                    {uploading ? str.uploading : str.uploadFiles}
                  </p>
                </div>
              </label>

              {formData.evidence_files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {formData.evidence_files.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-3 rounded-lg" style={{
                      backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6'
                    }}>
                      <span className="text-sm" style={{ color: colors.textPrimary }}>{file.label}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(file.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {createCaseMutation.isPending && (
            <Card className="border-none shadow-lg mb-6" style={{ backgroundColor: colors.cardBg }}>
              <CardContent className="p-6">
                <ProgressBar
                  value={50}
                  label={str.submitting}
                  showPercentage={false}
                  color="#DC2626"
                  isDarkMode={isDarkMode}
                  animated={true}
                />
              </CardContent>
            </Card>
          )}

          {/* Trust Badge - before submit */}
          <div className="mb-4">
            <TrustBadge language={language} isDarkMode={isDarkMode} />
          </div>

          <Button
            type="submit"
            disabled={createCaseMutation.isPending || uploading || checkingEligibility}
            className="w-full btn-interaction"
            style={{
              backgroundColor: createCaseMutation.isPending || uploading || checkingEligibility ? '#9CA3AF' : (freeResolveEligible ? '#10B981' : '#DC2626'),
              color: '#FFFFFF',
              padding: '18px',
              fontSize: '18px',
              fontWeight: '700',
              borderRadius: '12px',
              minHeight: '64px',
              border: freeResolveEligible ? '2px solid #059669' : 'none'
            }}
          >
            {createCaseMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {str.submitting}
              </>
            ) : freeResolveEligible ? (
              <>
                <Crown className="w-5 h-5 mr-2" />
                {language === 'th' ? 'ส่งคดี（ใช้สิทธิ์ฟรี）'
                : language === 'zh' ? '提交案件（使用免费权益）'
                : language === 'ja' ? 'ケースを送信（無料権利を使用）'
                : language === 'ko' ? '사례 제출（무료 권한 사용）'
                : language === 'ru' ? 'Отправить дело（использовать бесплатное право）'
                : 'Submit Case (Use Free Entitlement)'}
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 mr-2" />
                {str.submit}
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ResolveCase() {
  return (
    <AuthGuard>
      <ToastProvider>
        <ResolveCaseContent />
      </ToastProvider>
    </AuthGuard>
  );
}