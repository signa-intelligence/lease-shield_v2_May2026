import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const riskIssueSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    rule_id: { type: 'string' },
    category_id: { type: 'string' },
    severity: { type: 'string', enum: ['CRITICAL','HIGH','MEDIUM','LOW'] },
    title: { type: 'string' },
    summary: { type: 'string' },
    why_it_matters: { type: 'string' },
    recommendations: { type: 'array', items: { type: 'string' }, minItems: 1 },
    clause_refs: { type: 'array', minItems: 1, items: { type: 'object', properties: {
      clause_id: { type: 'string' }, page: { type: 'integer' }, snippet: { type: 'string' }
    }, required: ['clause_id','snippet'] } },
    confidence: { type: 'string', enum: ['HIGH','MEDIUM','LOW'] },
    source: { type: 'string', enum: ['RULES','LLM','USER'] }
  },
  required: ['id','rule_id','category_id','severity','title','summary','why_it_matters','recommendations','clause_refs','confidence','source']
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { clauses, ruleIssues, taxonomy, monthly_rent } = await req.json();

    // Build prompt with strict instructions
    const prompt = `You are a senior Thai residential lease lawyer. Review extracted clauses and existing issues.\n`+
      `Use the provided Thailand Residential Lease Risk Taxonomy (version ${taxonomy?.version || 'TH_RES_V1'}) as canonical.\n`+
      `TASKS:\n- Propose additional issues NOT already detected (avoid duplicates).\n- Optionally refine severity ONLY if clearly justified by evidence.\nSTRICT RULES:\n- EVERY issue MUST include an evidence snippet (1–3 lines) from a clause.\n- If you cannot provide a snippet, DO NOT output the issue.\n- Output RiskIssue JSON objects with fields exactly as schema.\n- confidence: HIGH if explicit and strong; MEDIUM if plausible; LOW if tentative.\n- Phrase legality cautiously: 'potentially unenforceable / high risk; confirm with legal counsel'.\nINPUT:
CLAUSES:\n${clauses.map(c=>`[${c.clause_id}|p${c.page_number||1}] ${c.raw_text.substring(0,350)}`).join('\n')}\n\nEXISTING ISSUES (rule-based):\n${(ruleIssues||[]).map(i=>`[${i.rule_id}] ${i.title} @${(i.clause_refs||[]).map(r=>r.clause_id).join(',')}`).join('\n')}\n\nTAXONOMY CATEGORIES:\n${(taxonomy?.categories||[]).map(ct=>`- ${ct.category_id}: ${ct.name_en} -> triggers: ${ct.triggers?.slice(0,6).join('; ')}`).join('\n')}\n\nMonthly rent (if known): ${monthly_rent ?? 'unknown'}`;

    const schema = { type: 'object', properties: { issues: { type: 'array', items: riskIssueSchema } }, required: ['issues'] };

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false,
      response_json_schema: schema
    });

    const out = res?.issues || [];

    // Validate minimal sanity + evidence gating
    const valid = out.filter(it => {
      const ok = it && it.source === 'LLM' && Array.isArray(it.clause_refs) && it.clause_refs.length > 0 &&
        it.title && it.summary && it.why_it_matters && Array.isArray(it.recommendations) && it.recommendations.length > 0 &&
        ['CRITICAL','HIGH','MEDIUM','LOW'].includes(it.severity) && ['HIGH','MEDIUM','LOW'].includes(it.confidence);
      return ok;
    });

    return Response.json({ success: true, issues: valid });
  } catch (e) {
    return Response.json({ success: false, issues: [], error: e.message }, { status: 200 });
  }
});