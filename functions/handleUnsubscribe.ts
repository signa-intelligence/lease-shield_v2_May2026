import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    
    const userEmail = url.searchParams.get('email');
    const unsubscribeType = url.searchParams.get('type'); // 'support', 'marketing' (NOT 'notification' for critical emails)
    const token = url.searchParams.get('token');

    if (!userEmail || !unsubscribeType || !token) {
      return new Response('Invalid unsubscribe link', { status: 400 });
    }

    // Block unsubscribe from critical notifications
    if (unsubscribeType === 'notification') {
      return Response.redirect(`https://app.leaseshield.asia/email-preferences?error=critical&email=${userEmail}`, 302);
    }

    const user = await base44.asServiceRole.auth.admin.getUserByEmail(userEmail);
    
    if (!user || user.user_metadata?.unsubscribe_token !== token) {
      return new Response('Invalid unsubscribe token', { status: 401 });
    }

    const currentPrefs = user.user_metadata?.email_preferences || {
      support_emails: true,
      notification_emails: true,
      marketing_emails: true
    };

    const updatedPrefs = { ...currentPrefs };
    
    if (unsubscribeType === 'support') {
      updatedPrefs.support_emails = false;
    } else if (unsubscribeType === 'marketing') {
      updatedPrefs.marketing_emails = false;
    }

    await base44.asServiceRole.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        email_preferences: updatedPrefs
      }
    });

    console.log(`✅ ${userEmail} unsubscribed from ${unsubscribeType} emails`);

    return Response.redirect(`https://app.leaseshield.asia/email-preferences?status=unsubscribed&type=${unsubscribeType}&email=${userEmail}&token=${token}`, 302);

  } catch (error) {
    console.error('Unsubscribe error:', error);
    return new Response('Error processing unsubscribe', { status: 500 });
  }
});