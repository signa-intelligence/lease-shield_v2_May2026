import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * TEST: Send a direct test email to current user
 * This bypasses all notification logic to test if email delivery works
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get current user
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    console.log(`📧 Testing direct email send to: ${user.email}`);
    
    // Try to send email using Core integration
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'Lease Shield Test',
        to: user.email,
        subject: '🧪 TEST EMAIL - Lease Shield Notification System',
        body: `Hello ${user.full_name || 'User'},\n\nThis is a test email from Lease Shield.\n\nIf you're seeing this, email delivery is working correctly!\n\n✅ Email service: OPERATIONAL\n📧 Your email: ${user.email}\n⏰ Sent at: ${new Date().toISOString()}\n\n---\nLease Shield Team`
      });
      
      console.log(`✅ Email sent successfully to ${user.email}`);
      
      return Response.json({
        success: true,
        message: 'Test email sent successfully',
        recipient: user.email,
        timestamp: new Date().toISOString()
      });
      
    } catch (emailError) {
      console.error(`❌ Email send failed:`, emailError);
      
      return Response.json({
        success: false,
        error: 'Email send failed',
        details: emailError.message,
        recipient: user.email
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});