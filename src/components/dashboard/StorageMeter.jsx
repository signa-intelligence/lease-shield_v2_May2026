import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Database, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function StorageMeter({ storageInfo, userTier, colors, language = 'en' }) {
  if (!storageInfo) {
    return null;
  }

  const totalBytes = storageInfo.total_bytes || 0;
  const limitBytes = storageInfo.tier_limit_bytes || (100 * 1024 * 1024);
  const filesCount = storageInfo.files_count || 0;
  
  const usagePercent = Math.round((totalBytes / limitBytes) * 100);
  const usedMB = (totalBytes / (1024 * 1024)).toFixed(1);
  const usedGB = (totalBytes / (1024 * 1024 * 1024)).toFixed(2);
  const limitGB = (limitBytes / (1024 * 1024 * 1024)).toFixed(0);
  
  const isNearLimit = usagePercent >= 80;
  const isCritical = usagePercent >= 95;
  
  const progressColor = isCritical 
    ? '#EF4444' 
    : isNearLimit 
      ? '#F59E0B' 
      : '#10B981';

  const t = {
    en: {
      storage: 'Storage',
      used: 'used',
      files: 'files',
      nearLimit: 'Running low on storage',
      critical: 'Storage almost full',
      upgrade: 'Upgrade for more storage'
    },
    th: {
      storage: 'พื้นที่จัดเก็บ',
      used: 'ใช้แล้ว',
      files: 'ไฟล์',
      nearLimit: 'พื้นที่จัดเก็บใกล้เต็ม',
      critical: 'พื้นที่จัดเก็บเกือบเต็ม',
      upgrade: 'อัปเกรดเพื่อเพิ่มพื้นที่'
    },
    zh: {
      storage: '存储空间',
      used: '已使用',
      files: '文件',
      nearLimit: '存储空间不足',
      critical: '存储空间即将用完',
      upgrade: '升级以获得更多存储空间'
    },
    ja: {
      storage: 'ストレージ',
      used: '使用済み',
      files: 'ファイル',
      nearLimit: 'ストレージが不足しています',
      critical: 'ストレージがほぼ満杯',
      upgrade: 'ストレージを増やすためにアップグレード'
    },
    ko: {
      storage: '저장소',
      used: '사용됨',
      files: '파일',
      nearLimit: '저장 공간 부족',
      critical: '저장소가 거의 가득 참',
      upgrade: '더 많은 저장소를 위해 업그레이드'
    },
    ru: {
      storage: 'Хранилище',
      used: 'использовано',
      files: 'файлов',
      nearLimit: 'Заканчивается место',
      critical: 'Хранилище почти заполнено',
      upgrade: 'Обновите для большего хранилища'
    }
  };

  const strings = t[language] || t.en;

  return (
    <div style={{
      padding: '16px',
      backgroundColor: colors.fieldBg,
      borderRadius: '12px',
      borderLeft: `4px solid ${progressColor}`
    }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5" style={{ color: progressColor }} />
          <div>
            <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
              {strings.storage}
            </p>
            <p className="text-xs" style={{ color: colors.textSecondary }}>
              {filesCount} {strings.files}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold" style={{ color: colors.textPrimary }}>
            {parseFloat(usedGB) >= 0.1 ? `${usedGB}GB` : `${usedMB}MB`}
          </p>
          <p className="text-xs" style={{ color: colors.textSecondary }}>
            / {limitGB}GB
          </p>
        </div>
      </div>
      
      <Progress 
        value={usagePercent} 
        className="h-2 mb-2"
        style={{
          backgroundColor: colors.borderColor
        }}
      />
      
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold" style={{ color: progressColor }}>
          {usagePercent}% {strings.used}
        </p>
        
        {isNearLimit && (
          <Badge 
            className="text-xs"
            style={{
              backgroundColor: isCritical ? '#FEE2E2' : '#FEF3C7',
              color: isCritical ? '#991B1B' : '#92400E',
              border: `1px solid ${isCritical ? '#FECACA' : '#FDE68A'}`
            }}
          >
            {isCritical ? '⚠️' : '⏰'} {isCritical ? strings.critical : strings.nearLimit}
          </Badge>
        )}
      </div>
      
      {isCritical && (
        <div className="mt-3 p-2 rounded-lg" style={{
          backgroundColor: colors.bg,
          border: '1px solid #EF4444'
        }}>
          <p className="text-xs font-semibold" style={{ color: '#EF4444' }}>
            <AlertTriangle className="w-3 h-3 inline mr-1" />
            {strings.upgrade}
          </p>
        </div>
      )}
    </div>
  );
}