import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { haptic } from "../shared/HapticFeedback";

const disclaimerStrings = {
  en: {
    title: "Lease Scan Disclaimer",
    shortText: "This scan provides general information only. Lease Shield is not a law firm and does not provide legal advice. Results may vary.",
    viewFull: "View full disclaimer",
    hideFull: "Hide full disclaimer",
    checkbox: "I agree to the disclaimer",
    button: "Agree and Continue",
    cancel: "Cancel",
    fullText: {
      p1: "Lease Shield provides automated lease analysis, practical guidance, and document templates to help users better understand rental agreements and common risk areas. All information is provided for general informational purposes only.",
      p2: "Lease Shield is not a law firm and does not provide legal advice or legal representation. Use of this service does not create a lawyer-client relationship.",
      p3: "While Lease Shield uses structured analysis and up-to-date reference data, results may vary depending on document quality, language, and jurisdiction. Lease Shield does not warrant that scan results, recommendations, or generated documents are complete, error-free, or suitable for every situation.",
      responsibleTitle: "You remain responsible for:",
      responsibilities: [
        "Reviewing and understanding your lease documents",
        "Confirming the accuracy of all information",
        "Seeking independent professional or legal advice where appropriate",
        "Deciding whether and how to rely on any outputs provided"
      ],
      p4: "Lease Shield is not a party to any lease agreement and is not responsible for decisions made, disputes arising, or outcomes resulting from use of this service.",
      p5: "By continuing, you acknowledge that Lease Shield is a support and insight tool, and that you use it at your own discretion and risk."
    }
  },
  th: {
    title: "ข้อจำกัดความรับผิดชอบการสแกน",
    shortText: "การสแกนนี้ให้ข้อมูลทั่วไปเท่านั้น Lease Shield ไม่ใช่สำนักงานกฎหมายและไม่ให้คำปรึกษาทางกฎหมาย ผลลัพธ์อาจแตกต่างกัน",
    viewFull: "ดูข้อจำกัดฉบับเต็ม",
    hideFull: "ซ่อนข้อจำกัดฉบับเต็ม",
    checkbox: "ฉันยอมรับข้อจำกัดความรับผิดชอบ",
    button: "ยอมรับและดำเนินการต่อ",
    cancel: "ยกเลิก",
    fullText: {
      p1: "Lease Shield ให้บริการวิเคราะห์สัญญาเช่าอัตโนมัติ คำแนะนำเชิงปฏิบัติ และเทมเพลตเอกสาร ข้อมูลทั้งหมดมีไว้เพื่อวัตถุประสงค์ในการให้ข้อมูลทั่วไปเท่านั้น",
      p2: "Lease Shield ไม่ใช่สำนักงานกฎหมาย และไม่ให้คำปรึกษาด้านกฎหมายหรือการเป็นตัวแทนทางกฎหมาย",
      p3: "ผลลัพธ์อาจแตกต่างกันไปตามคุณภาพเอกสาร ภาษา และเขตอำนาจศาล",
      responsibleTitle: "คุณยังคงมีหน้าที่รับผิดชอบในการ:",
      responsibilities: ["ตรวจสอบและทำความเข้าใจเอกสารสัญญาเช่าของคุณ", "ยืนยันความถูกต้องของข้อมูลทั้งหมด", "ขอคำปรึกษาจากผู้เชี่ยวชาญหรือทนายความอิสระเมื่อจำเป็น", "ตัดสินใจว่าจะพึ่งพาผลลัพธ์ที่ให้มาหรือไม่"],
      p4: "Lease Shield ไม่ได้เป็นคู่สัญญาในสัญญาเช่าใด ๆ และไม่รับผิดชอบต่อการตัดสินใจที่ทำหรือผลลัพธ์ที่เกิดจากการใช้บริการนี้",
      p5: "เมื่อดำเนินการต่อ คุณรับทราบว่า Lease Shield เป็นเครื่องมือช่วยเหลือและให้ข้อมูลเชิงลึก"
    }
  },
  zh: {
    title: "租约扫描免责声明",
    shortText: "此扫描仅提供一般信息。Lease Shield不是律师事务所，不提供法律建议。结果可能有所不同。",
    viewFull: "查看完整免责声明",
    hideFull: "隐藏完整免责声明",
    checkbox: "我同意免责声明",
    button: "同意并继续",
    cancel: "取消",
    fullText: {
      p1: "Lease Shield 提供自动化租约分析、实用指导和文档模板。所有信息仅供一般参考之用。",
      p2: "Lease Shield 不是律师事务所，不提供法律意见或法律代理服务。",
      p3: "结果可能因文档质量、语言和司法管辖区而异。",
      responsibleTitle: "您仍需承担以下责任：",
      responsibilities: ["审阅并理解您的租赁文件", "确认所有信息的准确性", "在适当情况下寻求独立的专业或法律意见", "决定是否以及如何依赖所提供的内容"],
      p4: "Lease Shield 不是任何租约协议的当事方，对因使用本服务而产生的结果不承担责任。",
      p5: "继续操作即表示您确认 Lease Shield 是一种支持和洞察工具。"
    }
  },
  ja: {
    title: "賃貸契約スキャン免責事項",
    shortText: "このスキャンは一般的な情報のみを提供します。Lease Shieldは法律事務所ではなく、法律上のアドバイスは提供しません。結果は異なる場合があります。",
    viewFull: "免責事項の全文を表示",
    hideFull: "全文を非表示",
    checkbox: "免責事項に同意します",
    button: "同意して続行",
    cancel: "キャンセル",
    fullText: {
      p1: "Lease Shield は自動リース分析、実用的なガイダンス、および文書テンプレートを提供します。",
      p2: "Lease Shield は法律事務所ではなく、法律助言や法的代理を提供しません。",
      p3: "結果は文書の品質、言語、および管轄区域によって異なる場合があります。",
      responsibleTitle: "以下については利用者が責任を負います：",
      responsibilities: ["賃貸契約書類の確認と理解", "すべての情報の正確性の確認", "必要に応じて独立した専門家または法律助言を求めること", "提供された出力に依拠するかどうかを決定すること"],
      p4: "Lease Shield はいかなる賃貸契約の当事者でもなく、本サービスの利用から生じた結果について責任を負いません。",
      p5: "続行することで、Lease Shield がサポートおよび洞察ツールであることを認識したものとします。"
    }
  },
  ko: {
    title: "임대 스캔 면책 조항",
    shortText: "이 스캔은 일반 정보만 제공합니다. Lease Shield는 법률 회사가 아니며 법률 자문을 제공하지 않습니다. 결과는 다를 수 있습니다.",
    viewFull: "전체 면책 조항 보기",
    hideFull: "전체 면책 조항 숨기기",
    checkbox: "면책 조항에 동의합니다",
    button: "동의 후 계속",
    cancel: "취소",
    fullText: {
      p1: "Lease Shield는 자동 임대 분석, 실용적인 지침 및 문서 템플릿을 제공합니다.",
      p2: "Lease Shield는 법률사무소가 아니며 법률 자문 또는 법률 대리를 제공하지 않습니다.",
      p3: "결과는 문서 품질, 언어 및 관할 구역에 따라 달라질 수 있습니다.",
      responsibleTitle: "귀하는 다음에 대한 책임이 있습니다:",
      responsibilities: ["임대차 계약 문서 검토 및 이해", "모든 정보의 정확성 확인", "적절한 경우 독립적인 전문가 또는 법률 자문 구하기", "제공된 결과물을 신뢰할지 여부 결정"],
      p4: "Lease Shield는 어떠한 임대 계약의 당사자도 아니며 본 서비스 사용으로 인한 결과에 책임을 지지 않습니다.",
      p5: "계속 진행하면 Lease Shield가 지원 및 분석 도구임을 인정하는 것입니다."
    }
  },
  ru: {
    title: "Отказ от ответственности",
    shortText: "Это сканирование предоставляет только общую информацию. Lease Shield не является юридической фирмой и не предоставляет юридические консультации. Результаты могут различаться.",
    viewFull: "Показать полный отказ от ответственности",
    hideFull: "Скрыть полный текст",
    checkbox: "Я соглашаюсь с отказом от ответственности",
    button: "Согласиться и продолжить",
    cancel: "Отмена",
    fullText: {
      p1: "Lease Shield предоставляет автоматизированный анализ договора аренды, практическое руководство и шаблоны документов.",
      p2: "Lease Shield не является юридической фирмой и не предоставляет юридические консультации.",
      p3: "Результаты могут различаться в зависимости от качества документа, языка и юрисдикции.",
      responsibleTitle: "Вы несете ответственность за:",
      responsibilities: ["Просмотр и понимание ваших документов аренды", "Подтверждение точности всей информации", "Обращение за независимой консультацией при необходимости", "Решение о том, полагаться ли на предоставленные результаты"],
      p4: "Lease Shield не является стороной какого-либо договора аренды и не несет ответственности за принятые решения.",
      p5: "Продолжая, вы признаете, что Lease Shield является инструментом поддержки и аналитики."
    }
  }
};

export default function DisclaimerModal({ isOpen, onClose, onAccept, language, isDarkMode }) {
  const [checked, setChecked] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const t = disclaimerStrings[language] || disclaimerStrings.en;
  
  const colors = {
    cardBg: isDarkMode ? '#2A2D30' : '#FFFFFF',
    textPrimary: isDarkMode ? '#ECEFED' : '#1A1D1F',
    textSecondary: isDarkMode ? '#9CA3AF' : '#6B7280',
    borderColor: isDarkMode ? '#3A3D40' : '#E5E7EB',
    expandBg: isDarkMode ? '#374151' : '#F9FAFB',
    checkboxBg: isDarkMode ? '#374151' : '#F3F4F6',
  };

  const handleAccept = () => {
    if (!checked) return;
    haptic.medium();
    setChecked(false);
    setExpanded(false);
    onAccept();
  };

  const handleClose = () => {
    haptic.light();
    setChecked(false);
    setExpanded(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-md w-[92vw] p-0"
        style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}
      >
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-lg font-bold flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            {t.title}
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-2">
          {/* Short disclaimer text */}
          <p className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
            {t.shortText}
          </p>

          {/* Expandable full text */}
          <button
            onClick={() => {
              haptic.light();
              setExpanded(!expanded);
            }}
            className="flex items-center gap-1 mt-3 text-xs font-semibold"
            style={{ color: '#0C3B2E', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {expanded ? t.hideFull : t.viewFull}
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {expanded && (
            <div
              className="mt-3 p-3 rounded-lg text-xs leading-relaxed space-y-2 max-h-48 overflow-y-auto"
              style={{ backgroundColor: colors.expandBg, color: colors.textSecondary, WebkitOverflowScrolling: 'touch' }}
            >
              <p>{t.fullText.p1}</p>
              <p>{t.fullText.p2}</p>
              <p>{t.fullText.p3}</p>
              <p className="font-semibold" style={{ color: colors.textPrimary }}>{t.fullText.responsibleTitle}</p>
              <ul className="list-disc pl-4 space-y-1">
                {t.fullText.responsibilities.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
              <p>{t.fullText.p4}</p>
              <p className="font-semibold">{t.fullText.p5}</p>
            </div>
          )}
        </div>

        {/* Checkbox + Buttons */}
        <div className="px-5 pb-5 pt-3 space-y-3">
          <label
            className="flex items-center gap-3 p-3 rounded-lg cursor-pointer"
            style={{ backgroundColor: colors.checkboxBg }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => {
                haptic.light();
                setChecked(e.target.checked);
              }}
              className="w-5 h-5 flex-shrink-0"
              style={{ accentColor: '#0C3B2E' }}
            />
            <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
              {t.checkbox}
            </span>
          </label>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              style={{ borderColor: colors.borderColor, color: colors.textPrimary }}
            >
              {t.cancel}
            </Button>
            <Button
              onClick={handleAccept}
              disabled={!checked}
              className="flex-1"
              style={{
                backgroundColor: checked ? '#0C3B2E' : '#9CA3AF',
                color: '#FFFFFF',
                cursor: checked ? 'pointer' : 'not-allowed',
                opacity: checked ? 1 : 0.6
              }}
            >
              {t.button}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}