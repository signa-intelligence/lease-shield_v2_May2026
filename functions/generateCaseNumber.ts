import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Generate smart case numbers that encode:
 * - Member vs Public (M/P)
 * - Fast Track status (F/-)
 * - Tier level (L/P/S/F for Lite/Protect/Secure/Free)
 * - Month/Year (MMYY)
 * - Sequential number (001-999)
 * 
 * Format: [M/P][F/-][L/P/S/F]-MMYY-XXX
 * Examples:
 * - MF-S-0125-001 (Member, Fast Track, Secure, Jan 2025, #1)
 * - P--F-1224-042 (Public, Standard, Free, Dec 2024, #42)
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { isMember, fastTrack, tierLevel } = await req.json();

    // Validate inputs
    if (typeof isMember !== 'boolean' || typeof fastTrack !== 'boolean') {
      return Response.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    if (!['L', 'P', 'S', 'F'].includes(tierLevel)) {
      return Response.json({ error: 'Invalid tier level' }, { status: 400 });
    }

    // Build case number prefix
    const memberPrefix = isMember ? 'M' : 'P';
    const fastTrackPrefix = fastTrack ? 'F' : '-';
    const tierPrefix = tierLevel; // L/P/S/F

    // Get current month/year
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const monthYear = `${month}${year}`;

    // Build the prefix for this month/year
    const fullPrefix = `${memberPrefix}${fastTrackPrefix}-${tierPrefix}-${monthYear}`;

    console.log('🔢 Generating case number with prefix:', fullPrefix);

    // Get all cases with this prefix to find next sequential number
    const allCases = await base44.asServiceRole.entities.Case.list('-created_date', 1000);
    
    const casesWithPrefix = allCases.filter(c => 
      c.case_number && c.case_number.startsWith(fullPrefix)
    );

    console.log(`📊 Found ${casesWithPrefix.length} cases with prefix ${fullPrefix}`);

    // Extract sequential numbers and find the highest
    let maxSequential = 0;
    casesWithPrefix.forEach(c => {
      const parts = c.case_number.split('-');
      if (parts.length === 3) {
        const seqNumber = parseInt(parts[2]);
        if (!isNaN(seqNumber) && seqNumber > maxSequential) {
          maxSequential = seqNumber;
        }
      }
    });

    // Generate next sequential number
    const nextSequential = maxSequential + 1;
    const sequentialStr = String(nextSequential).padStart(3, '0');

    // Build final case number
    const caseNumber = `${fullPrefix}-${sequentialStr}`;

    console.log('✅ Generated case number:', caseNumber);

    return Response.json({
      success: true,
      caseNumber: caseNumber,
      breakdown: {
        memberStatus: isMember ? 'Member' : 'Public',
        processing: fastTrack ? 'Fast Track' : 'Standard',
        tier: tierLevel === 'L' ? 'Lite' : tierLevel === 'P' ? 'Protect' : tierLevel === 'S' ? 'Secure' : 'Free',
        period: `${month}/${year}`,
        sequential: nextSequential
      }
    });

  } catch (error) {
    console.error('❌ Case number generation error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});