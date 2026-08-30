import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// ─────────────────────────────────────────────────────────────────────────────
// checkLegalBlockCurrency
//
// Runs quarterly. Checks whether the Thai residential leasing framework that
// analyzeLease grades against has been superseded, and emails ops if it looks
// like it has.
//
// DELIBERATELY DOES NOT EDIT THE PROMPT. The thresholds in analyzeLease drive
// clause severity on every scan a tenant sees. An unattended model rewriting
// them is how a wrong figure reaches a real tenant with nobody watching. This
// job raises a flag; a human makes the change and bumps LAW_BLOCK_VERSION.
//
// Keep IN SYNC with the law block in base44/functions/analyzeLease/entry.ts.
// ─────────────────────────────────────────────────────────────────────────────

const LAW_BLOCK_VERSION = '2568-2025-r1';
const CURRENT_NOTIFICATION = 'B.E. 2568 (2025)';
const CURRENT_GAZETTED = '2025-06-06';
const CURRENT_IN_FORCE = '2025-09-04';
const OPS_EMAIL = 'ops@leaseshield.asia';

// The framework has been replaced three times since 2018 (2561 -> 2562 -> 2568),
// roughly every 3-4 years, so this is a live maintenance risk rather than a
// theoretical one.
const KNOWN_HISTORY = [
  'B.E. 2561 (2018), in force 1 May 2018',
  'B.E. 2562 (2019), in force 29 January 2020',
  'B.E. 2568 (2025), in force 4 September 2025 - CURRENT'
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Combined guard: platform-injected header for scheduled runs, or an
    // explicit secret for manual invocation.
    let body: any = {};
    try { body = await req.clone().json(); } catch (_e) { body = {}; }
    const expectedSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET');
    const providedSecret = req.headers.get('x-internal-secret') || body?.internal_secret;
    const serviceAuth = req.headers.get('base44-service-authorization');
    if (!serviceAuth && (!expectedSecret || providedSecret !== expectedSecret)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const inForce = new Date(CURRENT_IN_FORCE);
    const monthsOld = Math.floor(
      (Date.now() - inForce.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    );

    // Attempt an automated check. Treated as a HINT ONLY: the model may be
    // wrong or out of date, so its answer never gates anything by itself.
    let finding = 'Automated check unavailable, manual verification required.';
    let looksSuperseded = false;

    if (OPENAI_API_KEY) {
      try {
        const r = await fetch('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            tools: [{ type: 'web_search_preview' }],
            input: `Search for the current Notification of the Contract Committee on residential property leasing as a contract-controlled business in Thailand.

Our records say the current one is ${CURRENT_NOTIFICATION}, gazetted ${CURRENT_GAZETTED}, in force ${CURRENT_IN_FORCE}.

Answer ONLY in this format:
STATUS: CURRENT or SUPERSEDED or UNCLEAR
LATEST: <name and in-force date of the newest notification you find>
CHANGES: <one line on what changed, or "none">
SOURCES: <two URLs>`
          })
        });
        const data = await r.json();
        const text = (data.output ?? [])
          .flatMap((o: any) => o?.content ?? [])
          .map((c: any) => c?.text ?? '')
          .join('\n')
          .trim();
        if (text) {
          finding = text;
          looksSuperseded = /STATUS:\s*SUPERSEDED/i.test(text);
        }
      } catch (e) {
        finding = `Automated check failed: ${e.message}. Manual verification required.`;
      }
    }

    const flagged = looksSuperseded || monthsOld >= 36;

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;">
  <div style="background:${flagged ? '#991B1B' : '#0C3B2E'};color:white;padding:24px;text-align:center;">
    <h1 style="margin:0;font-size:20px;">${flagged ? 'Lease Scan legal block may be out of date' : 'Quarterly legal block check'}</h1>
  </div>
  <div style="padding:28px 20px;">
    <p style="font-size:15px;">The severity thresholds in the Lease Scan analyser are graded against <strong>${CURRENT_NOTIFICATION}</strong>, in force since ${CURRENT_IN_FORCE} and now about <strong>${monthsOld} months</strong> old.</p>

    <div style="background:${flagged ? '#FEE2E2' : '#F8FAFC'};border-left:4px solid ${flagged ? '#DC2626' : '#0C3B2E'};padding:14px;margin:20px 0;border-radius:4px;">
      <p style="margin:0;font-weight:600;font-size:14px;">Automated check</p>
      <pre style="margin:8px 0 0;white-space:pre-wrap;font-family:inherit;font-size:13px;">${finding.replace(/</g, '&lt;')}</pre>
      <p style="margin:10px 0 0;font-size:12px;color:#666;">This is a hint, not a verification. Confirm against the Royal Gazette or a Thai firm's summary before changing anything.</p>
    </div>

    <p style="font-size:14px;font-weight:600;margin-top:24px;">If it has been replaced</p>
    <ol style="font-size:14px;padding-left:20px;">
      <li>Update the THAI LAW REFERENCE BLOCK in <code>base44/functions/analyzeLease/entry.ts</code></li>
      <li>Bump <code>LAW_BLOCK_VERSION</code> (currently <code>${LAW_BLOCK_VERSION}</code>) in both that file and this one</li>
      <li>Re-scan a known bad lease and confirm severities still land correctly</li>
    </ol>

    <p style="font-size:14px;font-weight:600;margin-top:20px;">Replacement history</p>
    <ul style="font-size:13px;color:#555;padding-left:20px;">
      ${KNOWN_HISTORY.map(h => `<li>${h}</li>`).join('')}
    </ul>
    <p style="font-size:13px;color:#666;">Replaced roughly every three to four years, so this will come round again.</p>
  </div>
  <div style="background:#f5f5f5;padding:16px;text-align:center;color:#999;font-size:11px;">
    <p style="margin:0;">Lease Shield internal notice, no action needed by users</p>
  </div>
</body></html>`;

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Lease Shield <notifications@leaseshield.asia>',
        to: [OPS_EMAIL],
        subject: flagged
          ? `Action needed: Lease Scan legal block may be superseded (${LAW_BLOCK_VERSION})`
          : `Quarterly check: Lease Scan legal block ${LAW_BLOCK_VERSION} still current`,
        html
      })
    });

    const emailData = await emailRes.json();
    console.log(`[LEGAL_BLOCK_CHECK] version=${LAW_BLOCK_VERSION} monthsOld=${monthsOld} flagged=${flagged}`);

    return Response.json({
      ok: true,
      law_block_version: LAW_BLOCK_VERSION,
      months_since_in_force: monthsOld,
      flagged,
      finding,
      email_id: emailData?.id ?? null
    });
  } catch (error) {
    console.error('[LEGAL_BLOCK_CHECK_ERROR]', error.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});
