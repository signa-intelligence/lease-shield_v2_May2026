import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { createDepositReminderFlex } from './lineFlexTemplates.js';

/**
 * TEST: Send a single Flex message to verify it works
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.line_messaging_token) {
      return Response.json({ error: 'No LINE token found' }, { status: 400 });
    }

    const language = user.language || 'en';
    
    console.log('🧪 Creating test Flex message...');
    
    // Create a test Flex message
    const flexMessage = createDepositReminderFlex({
      days: -11,
      depositAmount: 45000,
      propertyAddress: '63 main street',
      expectedDate: 'Nov 1, 2025',
      urgency: 'critical'
    }, language);
    
    console.log('📦 Flex message structure:', JSON.stringify(flexMessage, null, 2));
    
    // Send it
    console.log('📤 Sending Flex message to LINE...');
    const response = await base44.functions.invoke('sendLineMessage', {
      internal_secret: Deno.env.get('INTERNAL_FUNCTION_SECRET'),
      userId: user.line_messaging_token,
      flexMessage: flexMessage
    });
    
    console.log('✅ Response from sendLineMessage:', response.data);
    
    return Response.json({
      success: true,
      message: 'Test Flex message sent! Check your LINE.',
      response: response.data
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});