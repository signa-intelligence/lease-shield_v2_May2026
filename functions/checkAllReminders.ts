import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { createDepositReminderFlex, createLeaseNoticeFlex, createRentReminderFlex } from './lineFlexTemplates.js';

/**
 * Unified reminder check system with granular user preferences
 * Checks: deposits, leases, rent payments
 * Sends: LINE Flex Messages (primary) with email fallback
 * Logs: All notifications to NotificationLog entity
 * Respects: User preferences, quiet hours, timezone
 */

Deno.serve(async (req) => {
  const diagnostics = {
    deposits_checked: 0,
    overdue_found: 0,
    overdue_details: [],
    users_fetched: {},
    skipped_reasons: [],
    notifications_attempted: 0,
    notifications_sent: 0,
    errors: []
  };

  try {
    const base44 = createClientFromRequest(req);
    
    console.log('🔍 Fetching deposits...');
    const deposits = await base44.asServiceRole.entities.DepositTracker.list();
    console.log(`✅ Found ${deposits.length} total deposits`);
    
    const leases = await base44.asServiceRole.entities.Lease.list();
    console.log(`✅ Found ${leases.length} total leases`);
    
    const now = new Date();
    const notifications = [];
    
    diagnostics.deposits_checked = deposits.length;

    // Cache users we've already fetched
    const userCache = {};
    
    const getUserByEmail = async (email) => {
      if (userCache[email]) {
        console.log(`📦 Using cached user: ${email}`);
        return userCache[email];
      }
      
      console.log(`🔍 Fetching user: ${email}`);
      try {
        const user = await base44.asServiceRole.auth.getUserByEmail(email);
        console.log(`✅ Found user: ${email}`);
        userCache[email] = user;
        diagnostics.users_fetched[email] = 'SUCCESS';
        return user;
      } catch (err) {
        console.error(`❌ Failed to fetch user ${email}:`, err);
        diagnostics.users_fetched[email] = `FAILED: ${err.message}`;
        diagnostics.errors.push(`Failed to fetch user ${email}: ${err.message}`);
        return null;
      }
    };

    // Helper to check if notification is allowed based on user preferences
    const isNotificationAllowed = (user, notificationType) => {
      console.log(`🔍 Checking notification allowed for ${user.email}, type: ${notificationType}`);
      
      const prefs = user.notification_preferences || {};
      console.log(`🔍 User preferences:`, JSON.stringify(prefs));
      
      const typeMap = {
        '30d_deposit': 'deposit_30d',
        '7d_deposit': 'deposit_7d',
        '3d_deposit': 'deposit_3d',
        'overdue_deposit': 'deposit_overdue',
        '30d_notice': 'lease_30d',
        '7d_notice': 'lease_7d',
        '3d_notice': 'lease_3d',
        '0d_notice': 'lease_0d',
        'rent_reminder': 'rent_reminder',
        'maintenance_update': 'maintenance_updates'
      };

      const prefKey = typeMap[notificationType];
      if (prefKey && prefs[prefKey] === false) {
        console.log(`🔕 User ${user.email} disabled ${notificationType} (prefKey: ${prefKey} = false)`);
        diagnostics.skipped_reasons.push(`${user.email}: ${notificationType} disabled in preferences`);
        return false;
      }

      // Check quiet hours
      if (user.quiet_hours?.enabled) {
        const userTimezone = user.notification_timezone || 'Asia/Bangkok';
        const userTime = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
        const currentHour = userTime.getHours();
        const currentMinute = userTime.getMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinute;

        const [startHour, startMin] = (user.quiet_hours.start || '22:00').split(':').map(Number);
        const [endHour, endMin] = (user.quiet_hours.end || '08:00').split(':').map(Number);
        const startTimeInMinutes = startHour * 60 + startMin;
        const endTimeInMinutes = endHour * 60 + endMin;

        let inQuietHours = false;
        if (startTimeInMinutes > endTimeInMinutes) {
          inQuietHours = currentTimeInMinutes >= startTimeInMinutes || currentTimeInMinutes < endTimeInMinutes;
        } else {
          inQuietHours = currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes;
        }

        if (inQuietHours) {
          console.log(`🌙 User ${user.email} in quiet hours, skipping ${notificationType}`);
          diagnostics.skipped_reasons.push(`${user.email}: in quiet hours`);
          return false;
        }
      }

      console.log(`✅ Notification allowed for ${user.email}`);
      return true;
    };

    // Helper to send notification with logging
    const sendNotification = async (user, messageText, subject, flexMessage = null, notificationType = '', relatedEntityType = '', relatedEntityId = '') => {
      console.log(`📤 Attempting to send notification to ${user?.email}, type: ${notificationType}`);
      diagnostics.notifications_attempted++;
      
      if (!user) {
        console.log(`❌ No user provided`);
        diagnostics.errors.push('No user provided for notification');
        return false;
      }

      // Check if notification is allowed
      if (!isNotificationAllowed(user, notificationType)) {
        console.log(`⏭️ Skipping ${notificationType} for ${user.email} (user preferences)`);
        return false;
      }

      let channel = '';
      let success = false;
      let errorMsg = '';

      console.log(`🔍 User notification settings:`, {
        email_notifications: user.email_notifications,
        line_notifications: user.line_notifications,
        line_messaging_token: user.line_messaging_token ? 'SET' : 'NOT SET'
      });

      // Try LINE first if enabled and flex message provided
      if (user.line_messaging_token && user.line_notifications && flexMessage) {
        console.log(`📱 Attempting LINE send to ${user.email}...`);
        try {
          await base44.asServiceRole.functions.invoke('sendLineMessage', {
            userId: user.line_messaging_token,
            flexMessage: flexMessage
          });
          channel = 'LINE';
          success = true;
          console.log(`✅ LINE Flex sent to ${user.email}`);
        } catch (lineError) {
          console.error(`❌ LINE failed for ${user.email}:`, lineError);
          errorMsg = lineError.message;
          diagnostics.errors.push(`LINE failed for ${user.email}: ${lineError.message}`);
        }
      } else {
        console.log(`⏭️ Skipping LINE (token: ${user.line_messaging_token ? 'SET' : 'NOT SET'}, notifications: ${user.line_notifications}, flexMessage: ${flexMessage ? 'YES' : 'NO'})`);
      }

      // Fallback to email
      if (!success && user.email_notifications) {
        console.log(`📧 Attempting email send to ${user.email}...`);
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            from_name: 'Lease Shield',
            to: user.email,
            subject: subject,
            body: messageText
          });
          channel = 'Email';
          success = true;
          console.log(`✅ Email sent to ${user.email}`);
        } catch (emailError) {
          console.error(`❌ Email failed for ${user.email}:`, emailError);
          errorMsg = errorMsg ? `${errorMsg}; Email: ${emailError.message}` : emailError.message;
          diagnostics.errors.push(`Email failed for ${user.email}: ${emailError.message}`);
        }
      } else if (!success) {
        console.log(`⏭️ Skipping email (email_notifications: ${user.email_notifications})`);
      }

      // Log notification attempt
      try {
        await base44.asServiceRole.entities.NotificationLog.create({
          user_email: user.email,
          notification_type: notificationType,
          channel: channel || 'None',
          status: success ? 'sent' : 'failed',
          related_entity_type: relatedEntityType,
          related_entity_id: relatedEntityId,
          message_preview: messageText.substring(0, 200),
          error_message: success ? null : errorMsg
        });
      } catch (logError) {
        console.error('Failed to log notification:', logError);
        diagnostics.errors.push(`Failed to log: ${logError.message}`);
      }

      if (success) {
        diagnostics.notifications_sent++;
      }

      console.log(`📊 Notification result: ${success ? 'SUCCESS' : 'FAILED'} (channel: ${channel || 'none'})`);
      return success;
    };

// ... keep all existing deposit checking code (lines 234-451 from original) ...

    console.log(`✅ Reminder check complete. Sent ${notifications.length} notifications.`);

    return Response.json({ 
      success: true, 
      notifications_sent: notifications.length,
      details: notifications,
      diagnostics: diagnostics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Reminder check error:', error);
    diagnostics.errors.push(`System error: ${error.message}`);
    return Response.json({ 
      error: error.message,
      diagnostics: diagnostics
    }, { status: 500 });
  }
});