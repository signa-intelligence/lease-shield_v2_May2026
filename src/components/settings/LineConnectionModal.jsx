import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Copy, CheckCircle2, Share2, Loader2, Camera, ExternalLink } from "lucide-react";

export default function LineConnectionModal({ connectionType, propertyAddress, depositId, onClose, language, isDarkMode }) {
  const [connectionUrl, setConnectionUrl] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('scan');

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

  const copyLink = async () => {
    const fullInstructions = `1. Add LeaseShield on LINE: https://line.me/R/ti/p/@leaseshield\n2. Then type: link ${token}`;
    try {
      await navigator.clipboard.writeText(fullInstructions);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = fullInstructions;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareViaLine = () => {
    const roleLabel = connectionType === 'landlord' ? 'landlord' : connectionType === 'juristic' ? 'juristic office' : 'your account';
    const message = `Connect ${roleLabel} to Lease Shield notifications${propertyAddress ? ' for ' + propertyAddress : ''}.\n\nAfter adding LeaseShield on LINE, type:\nlink ${token}`;
    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(message + '\n\nhttps://line.me/R/ti/p/@leaseshield')}`;
    window.open(lineUrl, '_blank');
  };

  const shareNative = async () => {
    const roleLabel = connectionType === 'landlord' ? 'landlord' : connectionType === 'juristic' ? 'juristic office' : 'your account';
    const text = `Connect ${roleLabel} to Lease Shield LINE notifications${propertyAddress ? ' for ' + propertyAddress : ''}.\n\n1. Add LeaseShield on LINE: https://line.me/R/ti/p/@leaseshield\n2. Then type: link ${token}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Lease Shield LINE', text }); } catch (e) { if (e.name !== 'AbortError') copyLink(); }
    } else { copyLink(); }
  };

  const roleTitle = connectionType === 'user'
    ? (lang === 'th' ? 'LINE ของคุณ' : 'Your LINE')
    : connectionType === 'landlord'
      ? (lang === 'th' ? 'LINE เจ้าของบ้าน' : 'Landlord LINE')
      : (lang === 'th' ? 'LINE นิติบุคคล' : 'Juristic LINE');

  const colors = isDarkMode
    ? { bg: '#1F2937', text: '#F9FAFB', textSec: '#D1D5DB', border: 'rgba(255,255,255,0.1)', field: '#374151' }
    : { bg: '#FFFFFF', text: '#0F172A', textSec: '#475569', border: '#E5E7EB', field: '#F8FAFC' };

  const tabs = [
    { key: 'scan', icon: Camera, label: lang === 'th' ? 'สแกน QR' : 'Scan QR' },
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

              {/* TAB 1: Scan QR */}
              {activeTab === 'scan' && (
                <div>
                  <p style={{ fontSize: '13px', color: colors.textSec, marginBottom: '16px', textAlign: 'center' }}>
                    {connectionType === 'user'
                      ? (lang === 'th' ? 'ใช้กล้อง LINE เพื่อสแกน QR Code และเพิ่ม LeaseShield เป็นเพื่อน' : 'Use LINE\'s camera to scan the QR code and add LeaseShield as friend')
                      : (lang === 'th' ? `ให้${connectionType === 'landlord' ? 'เจ้าของบ้าน' : 'นิติบุคคล'}สแกน QR Code ด้วย LINE` : `Ask your ${connectionType === 'landlord' ? 'landlord' : 'juristic office'} to scan with LINE`)}
                  </p>

                  <div style={{
                    textAlign: 'center', padding: '24px', background: colors.field,
                    borderRadius: '12px', border: `2px dashed ${colors.border}`, marginBottom: '16px'
                  }}>
                    <Camera style={{ width: '48px', height: '48px', color: '#0C3B2E', margin: '0 auto 12px' }} />
                    <p style={{ fontSize: '14px', fontWeight: '600', color: colors.text, marginBottom: '8px' }}>
                      {lang === 'th' ? 'เปิดกล้อง LINE เพื่อสแกน' : 'Open LINE Camera to Scan'}
                    </p>
                    <p style={{ fontSize: '12px', color: colors.textSec, marginBottom: '16px' }}>
                      {lang === 'th' ? 'LINE > แท็บ Home > ไอคอนเพิ่มเพื่อน > QR Code' : 'LINE > Home tab > Add Friend icon > QR Code'}
                    </p>
                    <a
                      href="https://line.me/R/nv/QRCodeReader"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '12px 24px', borderRadius: '10px',
                        background: '#06C755', color: '#FFFFFF', fontWeight: '700',
                        fontSize: '14px', textDecoration: 'none',
                        boxShadow: '0 4px 12px rgba(6,199,85,0.3)'
                      }}
                    >
                      <Camera style={{ width: '18px', height: '18px' }} />
                      {lang === 'th' ? 'เปิดกล้อง LINE' : 'Open LINE Scanner'}
                    </a>
                  </div>

                  <div style={{
                    padding: '12px', borderRadius: '8px',
                    background: isDarkMode ? '#1E3A2A' : '#F0FDF4',
                    border: '1px solid #10B981'
                  }}>
                    <p style={{ fontSize: '12px', color: colors.text, fontWeight: '600', marginBottom: '4px' }}>
                      {lang === 'th' ? 'หลังจากเพิ่มเพื่อนแล้ว ให้พิมพ์:' : 'After adding friend, type:'}
                    </p>
                    <code style={{
                      display: 'block', padding: '8px', background: isDarkMode ? '#0C3B2E' : '#ECFDF5',
                      borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace',
                      color: '#0C3B2E', fontWeight: '700', wordBreak: 'break-all'
                    }}>
                      link {token}
                    </code>
                  </div>
                </div>
              )}

              {/* TAB 2: Share Link */}
              {activeTab === 'link' && (
                <div>
                  <p style={{ fontSize: '13px', color: colors.textSec, marginBottom: '16px', textAlign: 'center' }}>
                    {connectionType === 'user'
                      ? (lang === 'th' ? 'คัดลอกคำสั่งนี้แล้วเปิดใน LINE' : 'Copy these instructions and open in LINE')
                      : (lang === 'th' ? `ส่งคำสั่งเชื่อมต่อให้${connectionType === 'landlord' ? 'เจ้าของบ้าน' : 'นิติบุคคล'}` : `Send connection instructions to your ${connectionType === 'landlord' ? 'landlord' : 'juristic office'}`)}
                  </p>

                  <div style={{
                    padding: '14px', background: colors.field, borderRadius: '10px',
                    border: `1px solid ${colors.border}`, marginBottom: '12px'
                  }}>
                    <p style={{ fontSize: '12px', color: colors.textSec, marginBottom: '6px', fontWeight: '600' }}>
                      {lang === 'th' ? 'ลิงก์เพิ่มเพื่อน:' : 'Add friend link:'}
                    </p>
                    <p style={{
                      fontSize: '11px', color: colors.text, wordBreak: 'break-all',
                      fontFamily: 'monospace', padding: '8px', background: isDarkMode ? '#1F2937' : '#fff',
                      borderRadius: '6px', border: `1px solid ${colors.border}`
                    }}>
                      https://line.me/R/ti/p/@leaseshield
                    </p>
                  </div>

                  <div style={{
                    padding: '14px', background: isDarkMode ? '#1E3A2A' : '#F0FDF4',
                    borderRadius: '10px', border: '1px solid #10B981', marginBottom: '16px'
                  }}>
                    <p style={{ fontSize: '12px', color: colors.text, fontWeight: '600', marginBottom: '4px' }}>
                      {lang === 'th' ? 'คำสั่งเชื่อมต่อ:' : 'Connection command:'}
                    </p>
                    <code style={{
                      display: 'block', padding: '8px', background: isDarkMode ? '#0C3B2E' : '#ECFDF5',
                      borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace',
                      color: '#0C3B2E', fontWeight: '700', wordBreak: 'break-all'
                    }}>
                      link {token}
                    </code>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <button onClick={copyLink} style={{
                      flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
                      cursor: 'pointer', fontWeight: '700', fontSize: '13px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      background: copied ? '#10B981' : (isDarkMode ? '#374151' : '#F3F4F6'),
                      color: copied ? '#fff' : colors.text, transition: 'all 0.2s'
                    }}>
                      {copied ? <CheckCircle2 style={{ width: '16px', height: '16px' }} /> : <Copy style={{ width: '16px', height: '16px' }} />}
                      {copied ? (lang === 'th' ? 'คัดลอกแล้ว!' : 'Copied!') : (lang === 'th' ? 'คัดลอก' : 'Copy All')}
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