import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * TEST: Check user notification settings
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get current user (from request token)
    const currentUser = await base44.auth.me();
    
    if (!currentUser) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get user's overdue deposits
    const deposits = await base44.asServiceRole.entities.DepositTracker.filter({
      created_by: currentUser.email,
      status: 'tracking'
    });
    
    const now = new Date();
    const overdueDeposits = deposits.filter(d => {
      if (!d.expected_return_date) return false;
      const daysDiff = Math.floor((new Date(d.expected_return_date) - now) / (1000 * 60 * 60 * 24));
      return daysDiff < 0;
    });
    
    const result = {
      user_email: currentUser.email,
      notification_settings: {
        email_notifications: currentUser.email_notifications,
        line_notifications: currentUser.line_notifications,
        line_messaging_token: currentUser.line_messaging_token ? 'SET' : 'NOT SET',
        line_messaging_token_length: currentUser.line_messaging_token?.length || 0
      },
      notification_preferences: currentUser.notification_preferences || {},
      quiet_hours: currentUser.quiet_hours || {},
      notification_timezone: currentUser.notification_timezone || 'NOT SET',
      overdue_deposits: {
        count: overdueDeposits.length,
        deposits: overdueDeposits.map(d => ({
          id: d.id,
          amount: d.deposit_amount,
          property: d.property_address,
          expected_return: d.expected_return_date,
          days_overdue: Math.abs(Math.floor((new Date(d.expected_return_date) - now) / (1000 * 60 * 60 * 24)))
        }))
      }
    };
    
    console.log('🔍 User Settings Check:', JSON.stringify(result, null, 2));
    
    return Response.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('❌ Test error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});