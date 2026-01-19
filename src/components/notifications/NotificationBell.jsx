import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Bell, X, MessageCircle, Mail } from 'lucide-react';

export default function NotificationBell({ userEmail, isDarkMode = false }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch notifications
  useEffect(() => {
    if (userEmail) {
      fetchNotifications();
      // Refresh every 60 seconds
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [userEmail]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchNotifications() {
    if (!userEmail) return;
    setLoading(true);
    try {
      const logs = await base44.entities.NotificationLog.filter(
        { user_email: userEmail, is_dismissed: { $ne: true } },
        '-created_date',
        20
      );
      setNotifications(logs || []);
      setUnreadCount((logs || []).filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleNotificationClick(notification) {
    // Mark as read
    try {
      await base44.entities.NotificationLog.update(notification.id, { is_read: true });
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
    
    // Close dropdown
    setIsOpen(false);
    
    // Refresh list
    fetchNotifications();
  }

  async function handleDismiss(e, notificationId) {
    e.stopPropagation();
    e.preventDefault();
    
    try {
      await base44.entities.NotificationLog.update(notificationId, { is_dismissed: true });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  }

  function getNotificationIcon(type) {
    const icons = {
      '30d_deposit': '💰',
      '7d_deposit': '⚠️',
      '3d_deposit': '🚨',
      'overdue_deposit': '❗',
      '30d_notice': '📅',
      '7d_notice': '⏰',
      '3d_notice': '🔴',
      '0d_notice': '🚨',
      'rent_reminder': '💵',
      'maintenance_update': '🔧'
    };
    return icons[type] || '🔔';
  }

  function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  function getNavigationUrl(notification) {
    if (notification.related_entity_type === 'deposit') {
      return createPageUrl('DepositTracker');
    } else if (notification.related_entity_type === 'lease') {
      return createPageUrl('LeaseDetails') + `?id=${notification.related_entity_id}`;
    } else if (notification.related_entity_type === 'maintenance') {
      return createPageUrl('MaintenanceTracker');
    } else if (notification.notification_type?.includes('case')) {
      return createPageUrl('Cases');
    }
    return createPageUrl('Dashboard');
  }

  const colors = isDarkMode ? {
    bg: '#1F2937',
    cardBg: '#374151',
    borderColor: 'rgba(255,255,255,0.1)',
    textPrimary: '#F9FAFB',
    textSecondary: '#D1D5DB',
    hoverBg: '#4B5563',
    unreadBg: '#1E3A5F'
  } : {
    bg: '#FFFFFF',
    cardBg: '#FFFFFF',
    borderColor: '#E5E7EB',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    hoverBg: '#F9FAFB',
    unreadBg: '#EFF6FF'
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        style={{
          position: 'relative',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          backgroundColor: isOpen ? (isDarkMode ? '#374151' : '#F3F4F6') : 'transparent',
          transition: 'background-color 0.2s'
        }}
      >
        <Bell 
          className="w-5 h-5" 
          style={{ color: isDarkMode ? '#F9FAFB' : '#0C3B2E' }} 
        />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            backgroundColor: '#DC2626',
            color: 'white',
            borderRadius: '10px',
            padding: '1px 5px',
            fontSize: '10px',
            fontWeight: 'bold',
            minWidth: '16px',
            textAlign: 'center',
            lineHeight: '14px'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '48px',
          right: '0',
          width: '360px',
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: '480px',
          overflowY: 'auto',
          backgroundColor: colors.cardBg,
          border: `1px solid ${colors.borderColor}`,
          borderRadius: '12px',
          boxShadow: isDarkMode 
            ? '0 10px 40px rgba(0,0,0,0.5)' 
            : '0 10px 40px rgba(0,0,0,0.15)',
          zIndex: 1000
        }}>
          {/* Header */}
          <div style={{
            padding: '16px',
            borderBottom: `1px solid ${colors.borderColor}`,
            fontWeight: '600',
            fontSize: '15px',
            color: colors.textPrimary,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span style={{
                backgroundColor: '#DC2626',
                color: 'white',
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {unreadCount} new
              </span>
            )}
          </div>

          {/* Notification List */}
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: colors.textSecondary }}>
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: colors.textSecondary }}>
              <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No notifications</p>
            </div>
          ) : (
            notifications.map(notification => (
              <Link
                key={notification.id}
                to={getNavigationUrl(notification)}
                onClick={() => handleNotificationClick(notification)}
                style={{
                  display: 'block',
                  padding: '14px 16px',
                  borderBottom: `1px solid ${colors.borderColor}`,
                  cursor: 'pointer',
                  backgroundColor: notification.is_read ? colors.cardBg : colors.unreadBg,
                  textDecoration: 'none',
                  position: 'relative',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.hoverBg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = notification.is_read ? colors.cardBg : colors.unreadBg;
                }}
              >
                {/* Dismiss X */}
                <button
                  onClick={(e) => handleDismiss(e, notification.id)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.5,
                    transition: 'opacity 0.2s, background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#4B5563' : '#E5E7EB';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.5';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <X className="w-4 h-4" style={{ color: colors.textSecondary }} />
                </button>

                {/* Content */}
                <div style={{ paddingRight: '28px' }}>
                  <div style={{ 
                    fontSize: '13px', 
                    fontWeight: notification.is_read ? '400' : '600',
                    marginBottom: '4px',
                    color: colors.textPrimary,
                    lineHeight: '1.4'
                  }}>
                    <span style={{ marginRight: '6px' }}>
                      {getNotificationIcon(notification.notification_type)}
                    </span>
                    {notification.message_preview?.substring(0, 80) || 'Notification'}
                    {notification.message_preview?.length > 80 && '...'}
                  </div>
                  <div style={{ 
                    fontSize: '11px', 
                    color: colors.textSecondary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '6px'
                  }}>
                    <span>{formatRelativeTime(notification.created_date)}</span>
                    {notification.channel && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '2px 6px',
                        backgroundColor: notification.channel === 'LINE' 
                          ? (isDarkMode ? '#166534' : '#DCFCE7') 
                          : (isDarkMode ? '#1E40AF' : '#DBEAFE'),
                        color: notification.channel === 'LINE' 
                          ? (isDarkMode ? '#BBF7D0' : '#166534') 
                          : (isDarkMode ? '#BFDBFE' : '#1E40AF'),
                        borderRadius: '10px',
                        fontSize: '10px',
                        fontWeight: '500'
                      }}>
                        {notification.channel === 'LINE' ? (
                          <MessageCircle className="w-3 h-3" />
                        ) : (
                          <Mail className="w-3 h-3" />
                        )}
                        {notification.channel}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}

          {/* Footer - View All */}
          {notifications.length > 0 && (
            <Link
              to={createPageUrl('Dashboard')}
              onClick={() => setIsOpen(false)}
              style={{
                display: 'block',
                padding: '12px 16px',
                textAlign: 'center',
                color: '#0C3B2E',
                fontSize: '13px',
                fontWeight: '600',
                textDecoration: 'none',
                borderTop: `1px solid ${colors.borderColor}`
              }}
            >
              View all notifications
            </Link>
          )}
        </div>
      )}
    </div>
  );
}