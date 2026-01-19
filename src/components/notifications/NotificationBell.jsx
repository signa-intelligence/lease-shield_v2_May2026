import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell({ base44, userEmail }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [userEmail]);

  async function fetchNotifications() {
    try {
      const logs = await base44.entities.NotificationLog.list({
        filter: { user_email: userEmail, is_dismissed: false },
        sort: [{ field: 'created_date', direction: 'desc' }],
        limit: 20
      });
      setNotifications(logs.items || []);
      setUnreadCount(logs.items?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }

  async function handleNotificationClick(notification) {
    await base44.entities.NotificationLog.update(notification.id, { is_read: true });
    const leaseId = notification.related_entity_id;
    if (notification.related_entity_type === 'deposit' || 
        notification.related_entity_type === 'lease' ||
        notification.related_entity_type === 'maintenance') {
      navigate(`/property/${leaseId}`);
    } else if (notification.notification_type.includes('case')) {
      navigate('/cases');
    }
    setIsOpen(false);
    fetchNotifications();
  }

  async function handleDismiss(e, notificationId) {
    e.stopPropagation();
    try {
      await base44.entities.NotificationLog.update(notificationId, { is_dismissed: true });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to dismiss:', error);
    }
  }

  function getNotificationIcon(type) {
    const icons = {
      '30d_deposit': '💰', '7d_deposit': '⚠️', '3d_deposit': '🚨',
      'overdue_deposit': '❗', '30d_notice': '📅', '7d_notice': '⏰',
      '3d_notice': '🔴', '0d_notice': '🚨', 'rent_reminder': '💵',
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

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative', background: 'transparent', border: 'none',
          cursor: 'pointer', fontSize: '24px', padding: '8px', color: '#374151'
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '4px', right: '4px', backgroundColor: '#DC2626',
            color: 'white', borderRadius: '10px', padding: '2px 6px', fontSize: '11px',
            fontWeight: 'bold', minWidth: '18px', textAlign: 'center'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '45px', right: '0', width: '380px',
          maxHeight: '500px', overflowY: 'auto', backgroundColor: 'white',
          border: '1px solid #E5E7EB', borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 1000
        }}>
          <div style={{
            padding: '16px', borderBottom: '1px solid #E5E7EB',
            fontWeight: 'bold', fontSize: '16px'
          }}>
            Notifications ({unreadCount} unread)
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
              No notifications
            </div>
          ) : (
            notifications.map(notification => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                style={{
                  padding: '16px', borderBottom: '1px solid #F3F4F6',
                  cursor: 'pointer', position: 'relative',
                  backgroundColor: notification.is_read ? 'white' : '#EFF6FF',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 
                  notification.is_read ? 'white' : '#EFF6FF'}
              >
                <button
                  onClick={(e) => handleDismiss(e, notification.id)}
                  style={{
                    position: 'absolute', top: '8px', right: '8px',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontSize: '16px', color: '#9CA3AF', padding: '4px',
                    width: '24px', height: '24px', borderRadius: '4px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                    e.currentTarget.style.color = '#374151';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#9CA3AF';
                  }}
                >
                  ✕
                </button>

                <div style={{ paddingRight: '24px' }}>
                  <div style={{ 
                    fontSize: '14px', marginBottom: '4px', color: '#111827',
                    fontWeight: notification.is_read ? 'normal' : 'bold'
                  }}>
                    {getNotificationIcon(notification.notification_type)} {notification.message_preview}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>
                    {formatRelativeTime(notification.created_date)}
                  </div>
                  {notification.channel && (
                    <div style={{ marginTop: '6px' }}>
                      <span style={{
                        fontSize: '10px', padding: '2px 6px', borderRadius: '10px',
                        fontWeight: '500',
                        backgroundColor: notification.channel === 'LINE' ? '#DCFCE7' : '#DBEAFE',
                        color: notification.channel === 'LINE' ? '#166534' : '#1E40AF'
                      }}>
                        {notification.channel === 'LINE' ? '💬' : '📧'} {notification.channel}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}