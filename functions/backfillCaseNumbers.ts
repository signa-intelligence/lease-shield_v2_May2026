import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin authentication
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - admin only' }, { status: 401 });
    }

    console.log('[BACKFILL] Starting case number backfill...');

    // Get all cases
    const allCases = await base44.asServiceRole.entities.Case.list();
    console.log('[BACKFILL] Total cases found:', allCases.length);

    // Filter cases without case_number
    const casesNeedingNumbers = allCases.filter(c => !c.case_number);
    console.log('[BACKFILL] Cases needing numbers:', casesNeedingNumbers.length);

    if (casesNeedingNumbers.length === 0) {
      return Response.json({ 
        success: true, 
        message: 'No cases need backfilling',
        stats: {
          total_cases: allCases.length,
          already_numbered: allCases.length,
          backfilled: 0
        }
      });
    }

    // Sort by creation date to maintain chronological order
    const sortedCases = casesNeedingNumbers.sort((a, b) => 
      new Date(a.created_date).getTime() - new Date(b.created_date).getTime()
    );

    let backfilled = 0;
    const errors = [];

    // Backfill each case
    for (const caseRecord of sortedCases) {
      try {
        // Generate case number
        const response = await base44.asServiceRole.functions.invoke('generateCaseNumber');
        const caseNumber = response.data?.case_number;

        if (!caseNumber) {
          console.error('[BACKFILL] Failed to generate number for case:', caseRecord.id);
          errors.push({ caseId: caseRecord.id, error: 'No case number returned' });
          continue;
        }

        // Update case
        await base44.asServiceRole.entities.Case.update(caseRecord.id, {
          case_number: caseNumber
        });

        console.log(`[BACKFILL] ✅ Updated case ${caseRecord.id} with number ${caseNumber}`);
        backfilled++;
      } catch (err) {
        console.error(`[BACKFILL] ❌ Error updating case ${caseRecord.id}:`, err.message);
        errors.push({ caseId: caseRecord.id, error: err.message });
      }
    }

    console.log('[BACKFILL] Complete:', backfilled, 'cases backfilled');

    return Response.json({
      success: true,
      message: `Backfilled ${backfilled} case numbers`,
      stats: {
        total_cases: allCases.length,
        already_numbered: allCases.length - casesNeedingNumbers.length,
        backfilled: backfilled,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('❌ Backfill error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});