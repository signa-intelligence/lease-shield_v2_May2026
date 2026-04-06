import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Settings, MessageCircle, CheckCircle2, Copy, Share2, Save, Loader2 } from "lucide-react";
import { haptic } from "../shared/HapticFeedback";

export default function JuristicInfoSection({
  user, colors, isDarkMode, language, strings,
  juristicData, setJuristicData, handleJuristicUpdate,
  updateProfileMutation, copiedLink, handleCopyLink, handleShareLink,
  onOpenLineModal
}) {
  return (
    <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
      <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2 mb-1" style={{ color: colors.textPrimary }}>
              <Settings className="w-5 h-5 text-ls-gold" />
              {strings.juristicInfo}
            </CardTitle>
            <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.juristicInfoDesc}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-6 p-4 rounded-xl border-2 border-dashed" style={{
          backgroundColor: isDarkMode ? '#2A2D30' : '#FFFBEB',
          borderColor: isDarkMode ? '#F59E0B' : '#FDE047'
        }}>
          <div className="flex items-start gap-3 mb-3">
            <div style={{
              width: '40px', height: '40px', backgroundColor: '#F59E0B',
              borderRadius: '10px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0
            }}>
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold mb-1" style={{ color: colors.textPrimary }}>{strings.juristicLineConnect}</h4>
              <p className="text-xs mb-3" style={{ color: colors.textSecondary }}>{strings.connectLineOADesc}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    haptic.light();
                    onOpenLineModal({ type: 'juristic', depositId: null, propertyAddress: null });
                  }}
                  style={{
                    padding: '10px 20px', borderRadius: '10px', backgroundColor: '#F59E0B',
                    color: '#FFFFFF', border: 'none', fontWeight: 'bold', fontSize: '14px',
                    cursor: 'pointer', transition: 'all 0.2s', display: 'flex',
                    alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(245,158,11,0.3)'
                  }}
                >
                  <MessageCircle className="w-4 h-4" />
                  {language === 'th' ? 'เชื่อมต่อ LINE นิติบุคคล' : 'Connect Juristic LINE'}
                </button>
                <button
                  onClick={() => handleCopyLink('juristic')}
                  style={{
                    padding: '8px 16px', borderRadius: '8px',
                    backgroundColor: copiedLink === 'juristic' ? '#F59E0B' : (isDarkMode ? '#353A3D' : '#FFFFFF'),
                    color: copiedLink === 'juristic' ? '#FFFFFF' : colors.textPrimary,
                    border: `2px solid ${copiedLink === 'juristic' ? '#F59E0B' : colors.borderColor}`,
                    fontWeight: 'bold', fontSize: '13px', cursor: 'pointer',
                    transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  {copiedLink === 'juristic' ? (
                    <><CheckCircle2 className="w-4 h-4" />{strings.linkCopied}</>
                  ) : (
                    <><Copy className="w-4 h-4" />{strings.copyLink}</>
                  )}
                </button>
                <button
                  onClick={() => handleShareLink('juristic')}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', backgroundColor: '#F59E0B',
                    color: '#FFFFFF', border: '2px solid #F59E0B', fontWeight: 'bold',
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
            <Label htmlFor="juristic_name" style={{ color: colors.textPrimary }}>{strings.juristicName}</Label>
            <Input id="juristic_name" value={juristicData.juristic_name}
              onChange={(e) => setJuristicData({...juristicData, juristic_name: e.target.value})}
              placeholder={language === 'th' ? 'ชื่อผู้ติดต่อ' : 'Contact name'} className="mt-2"
              style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }} />
          </div>
          <div>
            <Label htmlFor="juristic_email" style={{ color: colors.textPrimary }}>{strings.juristicEmail}</Label>
            <Input id="juristic_email" type="email" value={juristicData.juristic_email}
              onChange={(e) => setJuristicData({...juristicData, juristic_email: e.target.value})}
              placeholder="juristic@example.com" className="mt-2"
              style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }} />
          </div>
          <div>
            <Label htmlFor="juristic_phone" style={{ color: colors.textPrimary }}>{strings.juristicPhone}</Label>
            <Input id="juristic_phone" value={juristicData.juristic_phone}
              onChange={(e) => setJuristicData({...juristicData, juristic_phone: e.target.value})}
              placeholder="+66 XX XXX XXXX" className="mt-2"
              style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }} />
          </div>
          <div>
            <Label htmlFor="juristic_line" style={{ color: colors.textPrimary }}>{strings.juristicLine}</Label>
            <Input id="juristic_line" value={juristicData.juristic_line}
              onChange={(e) => setJuristicData({...juristicData, juristic_line: e.target.value})}
              placeholder="@lineid" className="mt-2"
              style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }} />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={handleJuristicUpdate} disabled={updateProfileMutation.isPending}
            style={{
              padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px',
              border: 'none', backgroundColor: updateProfileMutation.isPending ? '#9CA3AF' : '#C7A338',
              color: updateProfileMutation.isPending ? '#FFFFFF' : '#1A1D1F',
              cursor: updateProfileMutation.isPending ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 6px rgba(199, 163, 56, 0.3)', transition: 'all 0.2s',
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