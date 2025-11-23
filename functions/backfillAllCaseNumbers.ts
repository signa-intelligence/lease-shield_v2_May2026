import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Backfills case numbers for all cases that have _backfill_needed flag
 * Assigns sequential case numbers based on creation date
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin authentication
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - admin only' }, { status: 401 });
    }

    console.log('[BACKFILL] Starting backfill for cases with _backfill_needed flag...');

    // Get cases needing backfill
    const casesNeedingNumbers = await base44.asServiceRole.entities.Case.filter({ 
      _backfill_needed: true 
    });
    
    console.log('[BACKFILL] Found', casesNeedingNumbers.length, 'cases needing numbers');

    if (casesNeedingNumbers.length === 0) {
      return Response.json({ 
        success: true, 
        message: 'No cases need backfilling',
        stats: { backfilled: 0 }
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
        // Determine user's tier at time of case creation
        const isMember = caseRecord.is_member_at_creation || false;
        const planTier = 'free'; // Default for old cases without tier info
        const tierLevel = 'F';
        const fastTrack = caseRecord.fast_track || false;

        // Generate case number
        const response = await base44.asServiceRole.functions.invoke('generateCaseNumber', {
          isMember: isMember,
          fastTrack: fastTrack,
          tierLevel: tierLevel
        });
        
        const caseNumber = response.data?.case_number;

        if (!caseNumber) {
          console.error('[BACKFILL] Failed to generate number for case:', caseRecord.id);
          errors.push({ caseId: caseRecord.id, error: 'No case number returned' });
          continue;
        }

        // Update case - remove backfill flag and add case number
        const updateData = {
          case_number: caseNumber
        };
        
        // Remove the temporary flag
        const currentData = { ...caseRecord };
        delete currentData._backfill_needed;
        
        await base44.asServiceRole.entities.Case.update(caseRecord.id, {
          ...currentData,
          ...updateData
        });

        console.log(`[BACKFILL] ✅ ${caseRecord.id.slice(0, 8)} → ${caseNumber}`);
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
        total_processed: sortedCases.length,
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