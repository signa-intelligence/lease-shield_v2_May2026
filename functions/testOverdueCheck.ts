import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * SIMPLIFIED TEST - Just check if we can find overdue deposits
 * This will tell us EXACTLY what's happening
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all deposits
    const deposits = await base44.asServiceRole.entities.DepositTracker.list();
    
    const now = new Date();
    const results = [];
    
    console.log(`🔍 Found ${deposits.length} deposits total`);
    
    for (const deposit of deposits) {
      const expectedDate = deposit.expected_return_date ? new Date(deposit.expected_return_date) : null;
      const daysDiff = expectedDate ? Math.floor((expectedDate - now) / (1000 * 60 * 60 * 24)) : null;
      
      results.push({
        id: deposit.id,
        status: deposit.status,
        expected_return_date: deposit.expected_return_date,
        daysDiff: daysDiff,
        isOverdue: daysDiff !== null && daysDiff < 0,
        created_by: deposit.created_by,
        property_address: deposit.property_address,
        deposit_amount: deposit.deposit_amount
      });
      
      console.log(`📊 Deposit ${deposit.id}: ${daysDiff} days (${deposit.status})`);
    }
    
    const overdueDeposits = results.filter(r => r.isOverdue && r.status === 'tracking');
    
    console.log(`🚨 Found ${overdueDeposits.length} OVERDUE deposits with status='tracking'`);
    
    return Response.json({
      success: true,
      total_deposits: deposits.length,
      overdue_deposits: overdueDeposits.length,
      details: results,
      overdue_list: overdueDeposits
    });
    
  } catch (error) {
    console.error('❌ Test error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});