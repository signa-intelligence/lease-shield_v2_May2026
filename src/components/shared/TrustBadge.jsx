import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { haptic } from './HapticFeedback';

export default function TrustBadge({ language = 'en', isDarkMode = false }) {
  const [showModal, setShowModal] = useState(false);

  const colors = isDarkMode ? {
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.2)',
    text: '#10B981',
    modalBg: '#2A2D30',
    modalText: '#F9FAFB',
    modalSecondary: '#D1D5DB'
  } : {
    bg: 'rgba(16, 185, 129, 0.04)',
    border: 'rgba(16, 185, 129, 0.15)',
    text: '#047857',
    modalBg: '#FFFFFF',
    modalText: '#0F172A',
    modalSecondary: '#475569'
  };

  const t = {
    en: {
      line1: 'Your files stay private',
      line2: 'Only shared if you submit them to a Resolve Case',
      learnMore: 'Learn more',
      modalTitle: 'How document access works',
      modalP1: 'Lease Shield staff cannot view your files by default.',
      modalP2: 'Only Lease Shield Resolve Case Officers can access files you submit.',
      modalP3: 'Files outside an active Resolve Case remain private.',
      gotIt: 'Got it'
    },
    th: {
      line1: 'ไฟล์ของคุณเป็นส่วนตัว',
      line2: 'แชร์ได้เฉพาะเมื่อคุณส่งไฟล์ไปยัง Resolve Case',
      learnMore: 'เรียนรู้เพิ่มเติม',
      modalTitle: 'การเข้าถึงเอกสารทำงานอย่างไร',
      modalP1: 'พนักงาน Lease Shield ไม่สามารถดูไฟล์ของคุณโดยค่าเริ่มต้น',
      modalP2: 'เฉพาะเจ้าหน้าที่ Resolve Case ของ Lease Shield เท่านั้นที่สามารถเข้าถึงไฟล์ที่คุณส่ง',
      modalP3: 'ไฟล์นอก Resolve Case ที่ทำงานอยู่ยังคงเป็นส่วนตัว',
      gotIt: 'เข้าใจแล้ว'
    },
    zh: {
      line1: '您的文件保持私密',
      line2: '仅在您提交到Resolve案件时共享',
      learnMore: '了解更多',
      modalTitle: '文档访问如何工作',
      modalP1: 'Lease Shield员工默认无法查看您的文件。',
      modalP2: '只有Lease Shield Resolve案件负责人可以访问您提交的文件。',
      modalP3: '活动Resolve案件之外的文件保持私密。',
      gotIt: '知道了'
    },
    ja: {
      line1: 'ファイルは非公開のままです',
      line2: 'Resolveケースに提出した場合のみ共有されます',
      learnMore: '詳細を見る',
      modalTitle: 'ドキュメントアクセスの仕組み',
      modalP1: 'Lease Shieldスタッフはデフォルトであなたのファイルを表示できません。',
      modalP2: 'Lease Shield Resolveケース担当者のみが、あなたが提出したファイルにアクセスできます。',
      modalP3: 'アクティブなResolveケース外のファイルは非公開のままです。',
      gotIt: '了解'
    },
    ko: {
      line1: '귀하의 파일은 비공개로 유지됩니다',
      line2: 'Resolve 케이스에 제출한 경우에만 공유됩니다',
      learnMore: '자세히 알아보기',
      modalTitle: '문서 액세스 작동 방식',
      modalP1: 'Lease Shield 직원은 기본적으로 귀하의 파일을 볼 수 없습니다.',
      modalP2: 'Lease Shield Resolve 케이스 담당자만 귀하가 제출한 파일에 액세스할 수 있습니다.',
      modalP3: '활성 Resolve 케이스 외부의 파일은 비공개로 유지됩니다.',
      gotIt: '알겠습니다'
    },
    ru: {
      line1: 'Ваши файлы остаются приватными',
      line2: 'Передаются только при отправке в дело Resolve',
      learnMore: 'Подробнее',
      modalTitle: 'Как работает доступ к документам',
      modalP1: 'Сотрудники Lease Shield по умолчанию не могут просматривать ваши файлы.',
      modalP2: 'Только сотрудники Lease Shield по делам Resolve могут получить доступ к файлам, которые вы отправляете.',
      modalP3: 'Файлы вне активного дела Resolve остаются приватными.',
      gotIt: 'Понятно'
    }
  };

  const strings = t[language] || t.en;

  return (
    <>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 16px',
          backgroundColor: colors.bg,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          maxWidth: '100%',
          width: '100%'
        }}
      >
        <Shield 
          className="w-4 h-4 flex-shrink-0" 
          style={{ color: colors.text }}
        />
        <div className="flex-1 min-w-0">
          <p 
            className="text-xs font-semibold leading-tight" 
            style={{ color: colors.text }}
          >
            🔒 {strings.line1}
          </p>
          <p 
            className="text-xs leading-tight mt-0.5" 
            style={{ color: colors.text, opacity: 0.85 }}
          >
            {strings.line2}
          </p>
        </div>
        <button
          onClick={() => {
            haptic.light();
            setShowModal(true);
          }}
          className="text-xs font-semibold underline whitespace-nowrap flex-shrink-0"
          style={{
            color: colors.text,
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer'
          }}
        >
          {strings.learnMore}
        </button>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent
          style={{
            backgroundColor: colors.modalBg,
            maxWidth: '500px',
            width: '95vw'
          }}
        >
          <DialogHeader>
            <DialogTitle 
              className="flex items-center gap-2 text-lg"
              style={{ color: colors.modalText }}
            >
              <Shield className="w-5 h-5 text-emerald-600" />
              {strings.modalTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <p className="text-sm leading-relaxed" style={{ color: colors.modalText }}>
              • {strings.modalP1}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: colors.modalText }}>
              • {strings.modalP2}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: colors.modalText }}>
              • {strings.modalP3}
            </p>
            <Button
              onClick={() => {
                haptic.light();
                setShowModal(false);
              }}
              className="w-full mt-4"
              style={{
                backgroundColor: '#047857',
                color: '#FFFFFF',
                minHeight: '44px',
                fontWeight: '600'
              }}
            >
              {strings.gotIt}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}