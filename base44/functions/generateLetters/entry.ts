import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * DEPRECATED: This function has been replaced by generatePhase1Letter
 * 
 * This stub exists to prevent the old function from being used.
 * All letter generation should use: generatePhase1Letter
 */

Deno.serve(async (req) => {
  return Response.json({
    ok: false,
    error: "This function is deprecated. Please use 'generatePhase1Letter' instead.",
    migration: {
      oldFunction: "generateLetters",
      newFunction: "generatePhase1Letter",
      usage: "await base44.functions.invoke('generatePhase1Letter', { caseId, subject })"
    }
  }, { status: 410 }); // 410 Gone
});