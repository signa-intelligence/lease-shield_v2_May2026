import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Copy, CheckCircle2, Share2, Loader2, QrCode, ExternalLink, MessageCircle } from "lucide-react";

export default function LineConnectionModal({ connectionType, propertyAddress, depositId, onClose, language, isDarkMode }) {
  const [connectionUrl, setConnectionUrl] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('qr');

  const lang = language || 'en';

  useEffect(() => {
    generateConnection();
  }, []);

  const generateConnection = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await base44.functions.invoke('generateLineConnectionLink', {
        connection_type: connectionType,
        deposit_tracker_id: depositId || null
      });
      if (response.data?.success) {
        setConnectionUrl(response.data.connection_url);
        setToken(response.data.token);
      } else {
        setError(response.data?.error || 'Failed to generate link');
      }
    } catch (err) {
      console.error('Error generating connection:', err);
      setError(err.response?.data?.error || err.message || 'Failed to generate connection link');
    } finally {
      setLoading(false);
    }
  };

  const copyInstructions = async () => {
    const steps = connectionType === 'user'
      ? `Connect your LINE to Lease Shield:\n\n1. Add Lease Shield on LINE:\n${connectionUrl}\n\n2. After adding, type this in the chat:\nlink ${token}`
      : `Connect to Lease Shield notifications${propertyAddress ? ' for ' + propertyAddress : ''}:\n\n1. Add Lease Shield on LINE:\n${connectionUrl}\n\n2. After adding, type this in the chat:\nlink ${token}`;
    try {
      await navigator.clipboard.writeText(steps);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = steps;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const shareViaLine = () => {
    const roleLabel = connectionType === 'landlord' ? 'landlord' : connectionType === 'juristic' ? 'juristic office' : 'your account';
    const message = `Connect ${roleLabel} to Lease Shield notifications${propertyAddress ? ' for ' + propertyAddress : ''}.\n\nStep 1: Add Lease Shield as friend:\n${connectionUrl}\n\nStep 2: Type this in the chat:\nlink ${token}`;
    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(message)}`;
    window.open(lineUrl, '_blank');
  };

  const shareNative = async () => {
    const roleLabel = connectionType === 'landlord' ? 'landlord' : connectionType === 'juristic' ? 'juristic office' : 'your account';
    const text = `Connect ${roleLabel} to Lease Shield LINE notifications${propertyAddress ? ' for ' + propertyAddress : ''}.\n\nStep 1: Add Lease Shield as friend:\n${connectionUrl}\n\nStep 2: Type this in the chat:\nlink ${token}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Lease Shield LINE', text }); } catch (e) { if (e.name !== 'AbortError') copyInstructions(); }
    } else { copyInstructions(); }
  };

  const roleTitle = connectionType === 'user'
    ? (lang === 'th' ? 'LINE ของคุณ' : 'Your LINE')
    : connectionType === 'landlord'
      ? (lang === 'th' ? 'LINE เจ้าของบ้าน' : 'Landlord LINE')
      : (lang === 'th' ? 'LINE นิติบุคคล' : 'Juristic LINE');

  const colors = isDarkMode
    ? { bg: '#1F2937', text: '#F9FAFB', textSec: '#D1D5DB', border: 'rgba(255,255,255,0.1)', field: '#374151', accent: '#0C3B2E' }
    : { bg: '#FFFFFF', text: '#0F172A', textSec: '#475569', border: '#E5E7EB', field: '#F8FAFC', accent: '#0C3B2E' };

  const tabs = [
    { key: 'qr', icon: QrCode, label: lang === 'th' ? 'สแกน QR' : 'Scan QR' },
    { key: 'link', icon: Share2, label: lang === 'th' ? 'แชร์ลิงก์' : 'Share Link' },
  ];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 9999, padding: '16px'
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: colors.bg, borderRadius: '16px',
        maxWidth: '440px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 20px 16px', borderBottom: `1px solid ${colors.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: colors.text }}>
              {lang === 'th' ? 'เชื่อมต่อ' : 'Connect'} {roleTitle}
            </h3>
            {propertyAddress && (
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: colors.textSec }}>{propertyAddress}</p>
            )}
          </div>
          <button onClick={onClose} style={{
            width: '36px', height: '36px', borderRadius: '50%', border: 'none',
            background: colors.field, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <X style={{ width: '18px', height: '18px', color: colors.textSec }} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Loader2 style={{ width: '32px', height: '32px', color: '#0C3B2E', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: colors.textSec, fontSize: '14px' }}>
              {lang === 'th' ? 'กำลังสร้างลิงก์...' : 'Generating link...'}
            </p>
          </div>
        ) : error ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ color: '#EF4444', fontSize: '14px', marginBottom: '16px' }}>{error}</p>
            <button onClick={generateConnection} style={{
              padding: '10px 20px', borderRadius: '8px', background: '#0C3B2E',
              color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '600'
            }}>
              {lang === 'th' ? 'ลองอีกครั้ง' : 'Try Again'}
            </button>
          </div>
        ) : (
          <>
            {/* Tab Bar */}
            <div style={{ display: 'flex', padding: '12px 16px 0', gap: '4px' }}>
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                    flex: 1, padding: '10px 8px', borderRadius: '10px 10px 0 0',
                    border: 'none', cursor: 'pointer', fontWeight: isActive ? '700' : '500',
                    fontSize: '13px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: '4px', transition: 'all 0.2s',
                    background: isActive ? (isDarkMode ? '#374151' : '#F0FDF4') : 'transparent',
                    color: isActive ? '#0C3B2E' : colors.textSec,
                    borderBottom: isActive ? '2px solid #0C3B2E' : '2px solid transparent'
                  }}>
                    <Icon style={{ width: '18px', height: '18px' }} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div style={{ padding: '20px' }}>

              {/* TAB 1: Scan QR Code — Opens LINE to add Lease Shield OA */}
              {activeTab === 'qr' && (
                <div>
                  <p style={{ fontSize: '13px', color: colors.textSec, marginBottom: '16px', textAlign: 'center' }}>
                    {connectionType === 'user'
                      ? (lang === 'th' ? 'เพิ่ม Lease Shield เป็นเพื่อนใน LINE แล้วพิมพ์คำสั่งเชื่อมต่อ' : 'Add Lease Shield as a LINE friend, then type the connection command')
                      : (lang === 'th' ? `ให้${connectionType === 'landlord' ? 'เจ้าของบ้าน' : 'นิติบุคคล'}เพิ่ม Lease Shield เป็นเพื่อนใน LINE` : `Have your ${connectionType === 'landlord' ? 'landlord' : 'juristic office'} add Lease Shield as a LINE friend`)}
                  </p>

                  {/* Step 1: Add friend */}
                  <div style={{
                    padding: '16px', background: colors.field,
                    borderRadius: '12px', border: `1px solid ${colors.border}`, marginBottom: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#0C3B2E', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', flexShrink: 0 }}>1</div>
                      <p style={{ fontWeight: '600', fontSize: '14px', color: colors.text, margin: 0 }}>
                        {lang === 'th' ? 'เพิ่ม Lease Shield เป็นเพื่อน' : 'Add Lease Shield as Friend'}
                      </p>
                    </div>
                    <a
                      href={connectionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        width: '100%', padding: '14px', borderRadius: '10px',
                        background: '#06C755', color: '#FFFFFF', fontWeight: '700',
                        fontSize: '15px', textDecoration: 'none',
                        boxShadow: '0 4px 12px rgba(6,199,85,0.3)'
                      }}
                    >
                      <MessageCircle style={{ width: '20px', height: '20px' }} />
                      {lang === 'th' ? 'เปิดใน LINE' : 'Open in LINE'}
                    </a>
                    <p style={{ fontSize: '11px', color: colors.textSec, textAlign: 'center', marginTop: '8px' }}>
                      {lang === 'th' ? 'หรือค้นหา @leaseshield ใน LINE' : 'Or search @leaseshield in LINE'}
                    </p>
                  </div>

                  {/* Step 2: Type link command */}
                  <div style={{
                    padding: '16px', borderRadius: '12px',
                    background: isDarkMode ? '#1E3A2A' : '#F0FDF4',
                    border: '2px solid #10B981'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#10B981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', flexShrink: 0 }}>2</div>
                      <p style={{ fontWeight: '600', fontSize: '14px', color: colors.text, margin: 0 }}>
                        {lang === 'th' ? 'พิมพ์คำสั่งนี้ในแชท Lease Shield' : 'Type this command in Lease Shield chat'}
                      </p>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 14px', background: isDarkMode ? '#0C3B2E' : '#ECFDF5',
                      borderRadius: '8px', marginBottom: '8px'
                    }}>
                      <code style={{
                        flex: 1, fontSize: '14px', fontFamily: 'monospace',
                        color: isDarkMode ? '#A7F3D0' : '#065F46', fontWeight: '700',
                        wordBreak: 'break-all'
                      }}>
                        link {token}
                      </code>
                      <button onClick={() => {
                        navigator.clipboard.writeText(`link ${token}`).then(() => {
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        });
                      }} style={{
                        padding: '6px 10px', borderRadius: '6px', border: 'none',
                        background: copied ? '#10B981' : (isDarkMode ? '#374151' : '#D1FAE5'),
                        color: copied ? '#fff' : '#065F46', cursor: 'pointer',
                        fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap',
                        transition: 'all 0.2s'
                      }}>
                        {copied ? '✓' : (lang === 'th' ? 'คัดลอก' : 'Copy')}
                      </button>
                    </div>
                    <p style={{ fontSize: '11px', color: colors.textSec, margin: 0 }}>
                      {lang === 'th' ? 'พิมพ์คำสั่งนี้ในแชทกับ Lease Shield หลังจากเพิ่มเพื่อนแล้ว' : 'Type this in the Lease Shield chat after adding as friend'}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: Share Link */}
              {activeTab === 'link' && (
                <div>
                  <p style={{ fontSize: '13px', color: colors.textSec, marginBottom: '16px', textAlign: 'center' }}>
                    {connectionType === 'user'
                      ? (lang === 'th' ? 'คัดลอกขั้นตอนเหล่านี้แล้วทำตาม' : 'Copy these steps and follow them')
                      : (lang === 'th' ? `ส่งขั้นตอนเหล่านี้ให้${connectionType === 'landlord' ? 'เจ้าของบ้าน' : 'นิติบุคคล'}ของคุณ` : `Send these steps to your ${connectionType === 'landlord' ? 'landlord' : 'juristic office'}`)}
                  </p>

                  {/* Instructions card */}
                  <div style={{
                    padding: '16px', background: colors.field,
                    borderRadius: '12px', border: `1px solid ${colors.border}`, marginBottom: '16px'
                  }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: colors.text, marginBottom: '8px' }}>
                      {lang === 'th' ? 'ขั้นตอน:' : 'Steps:'}
                    </p>
                    <div style={{ fontSize: '13px', color: colors.text, lineHeight: '1.8' }}>
                      <p style={{ margin: '0 0 6px' }}>
                        <strong>1.</strong> {lang === 'th' ? 'เพิ่ม Lease Shield เป็นเพื่อนใน LINE:' : 'Add Lease Shield as friend on LINE:'}
                      </p>
                      <div style={{
                        padding: '8px', background: isDarkMode ? '#1F2937' : '#fff',
                        borderRadius: '6px', border: `1px solid ${colors.border}`,
                        fontSize: '11px', fontFamily: 'monospace', wordBreak: 'break-all',
                        marginBottom: '10px', color: colors.text
                      }}>
                        {connectionUrl}
                      </div>
                      <p style={{ margin: '0 0 6px' }}>
                        <strong>2.</strong> {lang === 'th' ? 'พิมพ์คำสั่งนี้ในแชท:' : 'Type this command in the chat:'}
                      </p>
                      <div style={{
                        padding: '8px', background: isDarkMode ? '#0C3B2E' : '#ECFDF5',
                        borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace',
                        color: isDarkMode ? '#A7F3D0' : '#065F46', fontWeight: '700',
                        wordBreak: 'break-all'
                      }}>
                        link {token}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <button onClick={copyInstructions} style={{
                      flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
                      cursor: 'pointer', fontWeight: '700', fontSize: '13px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      background: copied ? '#10B981' : (isDarkMode ? '#374151' : '#F3F4F6'),
                      color: copied ? '#fff' : colors.text, transition: 'all 0.2s'
                    }}>
                      {copied ? <CheckCircle2 style={{ width: '16px', height: '16px' }} /> : <Copy style={{ width: '16px', height: '16px' }} />}
                      {copied ? (lang === 'th' ? 'คัดลอกแล้ว!' : 'Copied!') : (lang === 'th' ? 'คัดลอกทั้งหมด' : 'Copy All')}
                    </button>
                    <button onClick={shareViaLine} style={{
                      flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
                      cursor: 'pointer', fontWeight: '700', fontSize: '13px',
                      background: '#06C755', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                    }}>
                      <ExternalLink style={{ width: '16px', height: '16px' }} />
                      {lang === 'th' ? 'ส่งทาง LINE' : 'Send via LINE'}
                    </button>
                  </div>

                  <button onClick={shareNative} style={{
                    width: '100%', padding: '12px', borderRadius: '10px',
                    border: `2px solid ${colors.border}`, cursor: 'pointer',
                    fontWeight: '600', fontSize: '13px', background: 'transparent',
                    color: colors.text, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '6px'
                  }}>
                    <Share2 style={{ width: '16px', height: '16px' }} />
                    {lang === 'th' ? 'แชร์ผ่านช่องทางอื่น' : 'Share via Other Apps'}
                  </button>
                </div>
              )}

              {/* Info banner */}
              <div style={{
                marginTop: '16px', padding: '12px', borderRadius: '10px',
                background: isDarkMode ? '#1E293B' : '#EFF6FF',
                border: `1px solid ${isDarkMode ? '#3B82F680' : '#BFDBFE'}`
              }}>
                <p style={{ fontSize: '12px', color: isDarkMode ? '#93C5FD' : '#1D4ED8', margin: 0 }}>
                  ℹ️ {connectionType === 'user'
                    ? (lang === 'th' ? 'คุณจะเพิ่ม Lease Shield เป็นเพื่อนใน LINE เพื่อรับการแจ้งเตือนของคุณ' : 'You will add Lease Shield as a LINE friend to receive your notifications')
                    : (lang === 'th'
                      ? `${connectionType === 'landlord' ? 'เจ้าของบ้าน' : 'นิติบุคคล'}ของคุณจะเพิ่ม Lease Shield เป็นเพื่อนใน LINE การแจ้งเตือนทั้งหมดจะส่งจากบัญชี Lease Shield`
                      : `Your ${connectionType === 'landlord' ? 'landlord' : 'juristic office'} will add Lease Shield as a LINE friend. All notifications come from the Lease Shield account.`)}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 20px 20px', borderTop: `1px solid ${colors.border}` }}>
              <p style={{ fontSize: '11px', color: colors.textSec, textAlign: 'center', marginBottom: '12px' }}>
                {lang === 'th' ? 'ลิงก์หมดอายุใน 7 วัน' : 'Link expires in 7 days'}
              </p>
              <button onClick={onClose} style={{
                width: '100%', padding: '12px', borderRadius: '10px',
                border: `2px solid ${colors.border}`, background: 'transparent',
                color: colors.textSec, cursor: 'pointer', fontWeight: '600', fontSize: '14px'
              }}>
                {lang === 'th' ? 'ปิด' : 'Close'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}