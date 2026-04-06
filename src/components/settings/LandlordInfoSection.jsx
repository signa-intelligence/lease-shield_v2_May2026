import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { User, MessageCircle, CheckCircle2, Copy, Share2, Save, Loader2 } from "lucide-react";
import { haptic } from "../shared/HapticFeedback";

export default function LandlordInfoSection({
  user, colors, isDarkMode, language, strings,
  landlordData, setLandlordData, handleLandlordUpdate,
  updateProfileMutation, copiedLink, handleCopyLink, handleShareLink,
  onOpenLineModal
}) {
  return (
    <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
      <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2 mb-1" style={{ color: colors.textPrimary }}>
              <User className="w-5 h-5 text-ls-forest" />
              {strings.landlordInfo}
            </CardTitle>
            <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.landlordInfoDesc}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-6 p-4 rounded-xl border-2 border-dashed" style={{
          backgroundColor: isDarkMode ? '#2A2D30' : '#F0FDF4',
          borderColor: isDarkMode ? '#10B981' : '#86EFAC'
        }}>
          <div className="flex items-start gap-3 mb-3">
            <div style={{
              width: '40px', height: '40px', backgroundColor: '#10B981',
              borderRadius: '10px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0
            }}>
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold mb-1" style={{ color: colors.textPrimary }}>{strings.landlordLineConnect}</h4>
              <p className="text-xs mb-3" style={{ color: colors.textSecondary }}>{strings.connectLineOADesc}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    haptic.light();
                    onOpenLineModal({ type: 'landlord', depositId: null, propertyAddress: null });
                  }}
                  style={{
                    padding: '10px 20px', borderRadius: '10px', backgroundColor: '#06C755',
                    color: '#FFFFFF', border: 'none', fontWeight: 'bold', fontSize: '14px',
                    cursor: 'pointer', transition: 'all 0.2s', display: 'flex',
                    alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(6,199,85,0.3)'
                  }}
                >
                  <MessageCircle className="w-4 h-4" />
                  {language === 'th' ? 'เชื่อมต่อ LINE เจ้าของบ้าน' : 'Connect Landlord LINE'}
                </button>
                <button
                  onClick={() => handleCopyLink('landlord')}
                  style={{
                    padding: '8px 16px', borderRadius: '8px',
                    backgroundColor: copiedLink === 'landlord' ? '#10B981' : (isDarkMode ? '#353A3D' : '#FFFFFF'),
                    color: copiedLink === 'landlord' ? '#FFFFFF' : colors.textPrimary,
                    border: `2px solid ${copiedLink === 'landlord' ? '#10B981' : colors.borderColor}`,
                    fontWeight: 'bold', fontSize: '13px', cursor: 'pointer',
                    transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  {copiedLink === 'landlord' ? (
                    <><CheckCircle2 className="w-4 h-4" />{strings.linkCopied}</>
                  ) : (
                    <><Copy className="w-4 h-4" />{strings.copyLink}</>
                  )}
                </button>
                <button
                  onClick={() => handleShareLink('landlord')}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', backgroundColor: '#10B981',
                    color: '#FFFFFF', border: '2px solid #10B981', fontWeight: 'bold',
                    fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <Share2 className="w-4 h-4" />
                  {strings.shareLink}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 text-center">
          <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>{strings.orManualEntry}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="landlord_name" style={{ color: colors.textPrimary }}>{strings.landlordName}</Label>
            <Input id="landlord_name" value={landlordData.landlord_name}
              onChange={(e) => setLandlordData({...landlordData, landlord_name: e.target.value})}
              placeholder={language === 'th' ? 'ชื่อเจ้าของบ้าน' : 'Landlord name'} className="mt-2"
              style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }} />
          </div>
          <div>
            <Label htmlFor="landlord_email" style={{ color: colors.textPrimary }}>{strings.landlordEmail}</Label>
            <Input id="landlord_email" type="email" value={landlordData.landlord_email}
              onChange={(e) => setLandlordData({...landlordData, landlord_email: e.target.value})}
              placeholder="landlord@example.com" className="mt-2"
              style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }} />
          </div>
          <div>
            <Label htmlFor="landlord_phone" style={{ color: colors.textPrimary }}>{strings.landlordPhone}</Label>
            <Input id="landlord_phone" value={landlordData.landlord_phone}
              onChange={(e) => setLandlordData({...landlordData, landlord_phone: e.target.value})}
              placeholder="+66 XX XXX XXXX" className="mt-2"
              style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }} />
          </div>
          <div>
            <Label htmlFor="landlord_line" style={{ color: colors.textPrimary }}>{strings.landlordLine}</Label>
            <Input id="landlord_line" value={landlordData.landlord_line}
              onChange={(e) => setLandlordData({...landlordData, landlord_line: e.target.value})}
              placeholder="@lineid" className="mt-2"
              style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="landlord_address" style={{ color: colors.textPrimary }}>{strings.landlordAddress}</Label>
            <Textarea id="landlord_address" value={landlordData.landlord_address}
              onChange={(e) => setLandlordData({...landlordData, landlord_address: e.target.value})}
              placeholder={language === 'th' ? 'ที่อยู่เจ้าของบ้าน' : 'Landlord address'} className="mt-2" rows={2}
              style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }} />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={handleLandlordUpdate} disabled={updateProfileMutation.isPending}
            style={{
              padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px',
              border: 'none', backgroundColor: updateProfileMutation.isPending ? '#9CA3AF' : '#0C3B2E',
              color: '#FFFFFF', cursor: updateProfileMutation.isPending ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 6px rgba(12, 59, 46, 0.3)', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              opacity: updateProfileMutation.isPending ? 0.6 : 1
            }}
          >
            {updateProfileMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" />{language === 'th' ? 'กำลังบันทึก...' : 'Saving...'}</>
            ) : (
              <><Save className="w-4 h-4" />{strings.saveContactInfo}</>
            )}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}