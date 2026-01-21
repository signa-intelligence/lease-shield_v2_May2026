import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Admin check
    const caller = await base44.auth.me();
    if (caller?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    console.log('🔧 Fixing Steve\'s email preferences...');

    const user = await base44.asServiceRole.auth.admin.getUserByEmail('steve.l@signa-consultants.com');
    
    if (!user) {
      return Response.json({ error: 'Steve not found' }, { status: 404 });
    }

    console.log('📋 Current metadata:', user.user_metadata);

    await base44.asServiceRole.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        unsubscribed: false,
        unsubscribed_at: null,
        email_preferences: {
          support_emails: true,
          notification_emails: true,
          marketing_emails: true
        }
      }
    });

    console.log('✅ Steve can now receive emails again');

    return Response.json({
      success: true,
      message: 'Steve\'s email preferences have been reset',
      user: {
        email: user.email,
        id: user.id,
        metadata: {
          ...user.user_metadata,
          unsubscribed: false,
          unsubscribed_at: null,
          email_preferences: {
            support_emails: true,
            notification_emails: true,
            marketing_emails: true
          }
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fixing Steve\'s account:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});