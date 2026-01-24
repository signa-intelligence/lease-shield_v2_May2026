import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Check, Trash2, ExternalLink, CheckCheck } from 'lucide-react';

export default function NotificationPanel({ language = 'en', isDarkMode = false }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });
  
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      if (!currentUser) return [];
      
      const result = await base44.entities.NotificationLog.filter(
        { user_email: currentUser.email },
        '-created_date',
        50
      );
      return result || [];
    },
    enabled: isOpen
  });
  
  const unreadCount = notifications.filter(n => !n.is_read && !n.is_dismissed).length;
  
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      await base44.entities.NotificationLog.update(notificationId, {
        is_read: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
  
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(
        unread.map(n => 
          base44.entities.NotificationLog.update(n.id, { is_read: true })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (notificationId) => {
      await base44.entities.NotificationLog.delete(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
  
  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    
    if (notification.related_entity_type && notification.related_entity_id) {
      const routeMap = {
        'deposit': `/propertytracker`,
        'lease': `/propertytracker`,
        'property': `/propertytracker`,
        'case': `/cases`,
        'maintenance': `/maintenance-tracker`
      };
      
      const route = routeMap[notification.related_entity_type] || '/dashboard';
      navigate(route);
      setIsOpen(false);
    }
  };
  
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return language === 'th' ? 'เมื่อสักครู่' : 'Just now';
    if (diffMins < 60) return language === 'th' ? `${diffMins} นาทีที่แล้ว` : `${diffMins}m ago`;
    if (diffHours < 24) return language === 'th' ? `${diffHours} ชั่วโมงที่แล้ว` : `${diffHours}h ago`;
    if (diffDays < 7) return language === 'th' ? `${diffDays} วันที่แล้ว` : `${diffDays}d ago`;
    return date.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US');
  };

  const t = {
    en: {
      notifications: 'Notifications',
      unread: 'unread',
      markAllRead: 'Mark all read',
      noNotifications: 'No notifications yet',
      showMore: 'Show more',
      showLess: 'Show less',
      delete: 'Delete',
      view: 'View'
    },
    th: {
      notifications: 'การแจ้งเตือน',
      unread: 'ยังไม่ได้อ่าน',
      markAllRead: 'อ่านทั้งหมด',
      noNotifications: 'ยังไม่มีการแจ้งเตือน',
      showMore: 'แสดงเพิ่มเติม',
      showLess: 'แสดงน้อยลง',
      delete: 'ลบ',
      view: 'ดู'
    }
  };

  const strings = t[language] || t.en;

  const colors = isDarkMode ? {
    bg: '#1F2937',
    cardBg: '#2A2D30',
    textPrimary: '#F9FAFB',
    textSecondary: '#D1D5DB',
    borderColor: 'rgba(255,255,255,0.1)',
    unreadBg: '#1E3A5F',
    hoverBg: '#374151'
  } : {
    bg: '#FFFFFF',
    cardBg: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    borderColor: '#E2E8F0',
    unreadBg: '#EFF6FF',
    hoverBg: '#F8FAFC'
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-opacity-80 transition"
        style={{
          backgroundColor: isOpen ? (isDarkMode ? '#374151' : '#F3F4F6') : 'transparent'
        }}
      >
        <Bell className="w-6 h-6" style={{ color: isDarkMode ? '#F9FAFB' : '#0C3B2E' }} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-20 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          <div 
            className="notification-panel absolute right-0 top-12 bg-white rounded-lg shadow-2xl z-50 flex flex-col"
            style={{
              width: '96vw',
              maxWidth: '420px',
              maxHeight: '600px',
              backgroundColor: colors.cardBg,
              borderColor: colors.borderColor,
              border: `1px solid ${colors.borderColor}`
            }}
          >
            <div className="p-4 border-b flex items-center justify-between" style={{ borderBottomColor: colors.borderColor }}>
              <div>
                <h3 className="font-semibold text-lg" style={{ color: colors.textPrimary }}>
                  {strings.notifications}
                </h3>
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  {unreadCount} {strings.unread}
                </p>
              </div>
              <div className="flex gap-2 items-center">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    disabled={markAllReadMutation.isPending}
                    className="text-xs hover:underline font-semibold px-2 py-1 rounded"
                    style={{ 
                      color: '#0C3B2E',
                      backgroundColor: isDarkMode ? 'rgba(199,163,56,0.1)' : 'rgba(12,59,46,0.05)'
                    }}
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setIsOpen(false)}>
                  <X className="w-5 h-5" style={{ color: colors.textSecondary }} />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto flex-1">
              {isLoading ? (
                <div className="p-4 text-center" style={{ color: colors.textSecondary }}>
                  <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-[#0C3B2E] rounded-full mx-auto mb-2"></div>
                  {language === 'th' ? 'กำลังโหลด...' : 'Loading...'}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center" style={{ color: colors.textSecondary }}>
                  <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>{strings.noNotifications}</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 border-b transition cursor-pointer"
                    style={{
                      backgroundColor: !notification.is_read ? colors.unreadBg : colors.cardBg,
                      borderBottomColor: colors.borderColor
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.hoverBg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = !notification.is_read ? colors.unreadBg : colors.cardBg;
                    }}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div 
                        className="flex-1 min-w-0"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <p className={`text-sm ${!notification.is_read ? 'font-semibold' : ''}`} style={{ color: colors.textPrimary }}>
                          {notification.message_preview || notification.message || 'Notification'}
                        </p>
                        
                        {expandedId === notification.id && notification.message_preview && (
                          <p className="text-xs mt-2 whitespace-pre-wrap" style={{ color: colors.textSecondary }}>
                            {notification.message || notification.message_preview}
                          </p>
                        )}
                        
                        {notification.message_preview && notification.message !== notification.message_preview && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedId(expandedId === notification.id ? null : notification.id);
                            }}
                            className="text-xs hover:underline mt-1"
                            style={{ color: '#0C3B2E' }}
                          >
                            {expandedId === notification.id ? strings.showLess : strings.showMore}
                          </button>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: colors.textSecondary }}>
                          <span>{formatTime(notification.created_date)}</span>
                          {notification.channel && (
                            <>
                              <span>•</span>
                              <span>{notification.channel}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-1 flex-shrink-0">
                        {!notification.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsReadMutation.mutate(notification.id);
                            }}
                            disabled={markAsReadMutation.isPending}
                            className="p-1.5 rounded transition"
                            title={strings.markAllRead}
                            style={{
                              backgroundColor: isDarkMode ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.1)'
                            }}
                          >
                            <Check className="w-4 h-4 text-green-600" />
                          </button>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(language === 'th' ? 'ลบการแจ้งเตือนนี้?' : 'Delete this notification?')) {
                              deleteMutation.mutate(notification.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 rounded transition"
                          title={strings.delete}
                          style={{
                            backgroundColor: isDarkMode ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.1)'
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {notifications.length > 10 && (
              <div className="p-3 border-t text-center" style={{ 
                borderTopColor: colors.borderColor,
                backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB'
              }}>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/timeline');
                  }}
                  className="text-xs hover:underline font-semibold"
                  style={{ color: '#0C3B2E' }}
                >
                  {language === 'th' ? 'ดูการแจ้งเตือนทั้งหมด' : 'View all notifications'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
      
      <style>{`
        @media (max-width: 640px) {
          .notification-panel {
            position: fixed;
            right: 0;
            left: 0;
            width: 100% !important;
            max-width: 100% !important;
            top: 60px;
            max-height: calc(100vh - 60px);
            border-radius: 0;
          }
        }
      `}</style>
    </div>
  );
}