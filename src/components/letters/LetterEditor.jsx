import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Edit2, Check, X } from "lucide-react";

/**
 * LetterEditor - Field-based editing of LetterDocument
 * Users edit specific fields, not raw text
 */

export default function LetterEditor({ letterDoc, onSave, onCancel, isDarkMode = false, language = 'en' }) {
  const [editing, setEditing] = useState(true);
  const [formData, setFormData] = useState(() => {
    // Extract editable fields from letter blocks
    const data = {
      date: '',
      recipient_name: '',
      recipient_address: '',
      subject_detail: '',
      bullets: [],
      closing: '',
      signature_name: '',
      signature_address: '',
      signature_phone: '',
      signature_email: ''
    };

    letterDoc?.blocks?.forEach(block => {
      if (block.type === 'date') data.date = block.value;
      if (block.type === 'recipient') {
        data.recipient_name = block.lines?.[0] || '';
        data.recipient_address = block.lines?.slice(1).join('\n') || '';
      }
      if (block.type === 'subject') {
        const match = block.value.match(/Subject: (.+)/);
        data.subject_detail = match ? match[1] : block.value;
      }
      if (block.type === 'bullets') data.bullets = [...(block.items || [])];
      if (block.type === 'closing') data.closing = block.value;
      if (block.type === 'signature') {
        data.signature_name = block.lines?.[0] || '';
        const lines = block.lines || [];
        data.signature_address = lines.slice(1, lines.length - 2).join('\n');
        data.signature_phone = lines[lines.length - 2] || '';
        data.signature_email = lines[lines.length - 1] || '';
      }
    });

    return data;
  });

  const colors = isDarkMode ? {
    bg: '#2A2D30',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    border: 'rgba(255,255,255,0.1)',
    fieldBg: '#374151'
  } : {
    bg: '#FFFFFF',
    text: '#1A1D1F',
    textSecondary: '#64748b',
    border: '#E5E7EB',
    fieldBg: '#F8FAFC'
  };

  const handleSave = () => {
    // Rebuild LetterDocument from edited fields
    const updatedDoc = {
      ...letterDoc,
      blocks: [
        { type: 'date', value: formData.date },
        { type: 'recipient', lines: [formData.recipient_name, formData.recipient_address].filter(Boolean) },
        { type: 'subject', value: `Subject: ${formData.subject_detail}` },
        ...letterDoc.blocks.filter(b => b.type === 'paragraph'),
        { type: 'bullets', items: formData.bullets.filter(Boolean) },
        { type: 'closing', value: formData.closing },
        { type: 'signature', lines: [
          formData.signature_name,
          formData.signature_address,
          formData.signature_phone,
          formData.signature_email
        ].filter(Boolean) }
      ]
    };

    onSave(updatedDoc);
  };

  const addBullet = () => {
    setFormData(prev => ({ ...prev, bullets: [...prev.bullets, ''] }));
  };

  const updateBullet = (index, value) => {
    const newBullets = [...formData.bullets];
    newBullets[index] = value;
    setFormData(prev => ({ ...prev, bullets: newBullets }));
  };

  const removeBullet = (index) => {
    setFormData(prev => ({ ...prev, bullets: prev.bullets.filter((_, i) => i !== index) }));
  };

  return (
    <Card className="border-none shadow-lg" style={{ backgroundColor: colors.bg }}>
      <CardContent className="p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
              {language === 'th' ? 'ชื่อผู้รับ' : 'Recipient Name'}
            </label>
            <Input
              value={formData.recipient_name}
              onChange={(e) => setFormData(prev => ({ ...prev, recipient_name: e.target.value }))}
              style={{ backgroundColor: colors.fieldBg, borderColor: colors.border, color: colors.text }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
              {language === 'th' ? 'ชื่อผู้ลงนาม' : 'Signature Name'}
            </label>
            <Input
              value={formData.signature_name}
              onChange={(e) => setFormData(prev => ({ ...prev, signature_name: e.target.value }))}
              style={{ backgroundColor: colors.fieldBg, borderColor: colors.border, color: colors.text }}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
            {language === 'th' ? 'หัวข้อจดหมาย' : 'Subject Line'}
          </label>
          <Input
            value={formData.subject_detail}
            onChange={(e) => setFormData(prev => ({ ...prev, subject_detail: e.target.value }))}
            style={{ backgroundColor: colors.fieldBg, borderColor: colors.border, color: colors.text }}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>
            {language === 'th' ? 'ประเด็นเจรจา' : 'Negotiation Points'} ({formData.bullets.length})
          </label>
          <div className="space-y-2">
            {formData.bullets.map((bullet, i) => (
              <div key={i} className="flex gap-2">
                <Textarea
                  value={bullet}
                  onChange={(e) => updateBullet(i, e.target.value)}
                  rows={2}
                  className="flex-1 text-sm"
                  style={{ backgroundColor: colors.fieldBg, borderColor: colors.border, color: colors.text }}
                  placeholder={`${language === 'th' ? 'ประเด็น' : 'Point'} ${i + 1}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeBullet(i)}
                  className="flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addBullet}
              className="w-full"
              style={{ borderColor: colors.border, color: colors.text }}
            >
              + {language === 'th' ? 'เพิ่มประเด็น' : 'Add Point'}
            </Button>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            style={{ borderColor: colors.border, color: colors.text }}
          >
            <X className="w-4 h-4 mr-2" />
            {language === 'th' ? 'ยกเลิก' : 'Cancel'}
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1"
            style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
          >
            <Check className="w-4 h-4 mr-2" />
            {language === 'th' ? 'บันทึก' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}