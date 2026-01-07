/* Cloudflare Worker - Lease Scan (Real Pipeline)
   Requires env.OPENAI_API_KEY for OpenAI fallback.
*/
export default {
  async fetch(request, env) {
    const t0 = Date.now();
    const stages = [];
    const warnings = [];
    const stage = async (name, fn) => {
      const s = Date.now();
      try { const out = await fn(); stages.push({ stage: name, ms: Date.now()-s }); return out; }
      catch (e) { stages.push({ stage: name, ms: Date.now()-s, note: String(e?.message||e) }); throw e; }
    };

    const respond = (obj) => new Response(JSON.stringify(obj), { status: 200, headers: { 'Content-Type': 'application/json' } });

    if (request.method !== 'POST') {
      return respond({ ok:false, step:'ENTRY', error_code:'METHOD_NOT_ALLOWED', message:'POST required' });
    }

    let body = {};
    try { body = await request.json(); } catch {}
    const leaseId = body?.leaseId; const fileUrl = body?.fileUrl; const language = body?.language || 'en';
    if (!leaseId || !fileUrl) {
      return respond({ ok:false, step:'INPUT_VALIDATION', error_code:'MISSING_PARAMS', message:'leaseId and fileUrl are required' });
    }

    const OPENAI_API_KEY = env.OPENAI_API_KEY;

    const fetchBinary = async (url) => {
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) {
        return { error: true, status: res.status, message: `DOWNLOAD_FAILED_${res.status}` };
      }
      const contentType = res.headers.get('content-type') || '';
      const ab = await res.arrayBuffer();
      return { error: false, ab, contentType };
    };

    const isPdf = (ct, url) => (ct||'').toLowerCase().includes('application/pdf') || (String(url||'').toLowerCase().endsWith('.pdf'));
    const isDocx = (ct, url) => (ct||'').toLowerCase().includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') || (String(url||'').toLowerCase().endsWith('.docx'));

    const extractPdfTextNaive = (ab) => {
      const src = new TextDecoder('latin1').decode(new Uint8Array(ab));
      let text = '';
      const btEt = /BT([\s\S]*?)ET/gm; let m;
      while ((m = btEt.exec(src)) !== null) {
        const block = m[1];
        const tj = /\((.*?)\)\s*Tj/gm; let tm; while((tm = tj.exec(block))!==null) text += tm[1] + '\n';
        const tja = /\[([\s\S]*?)\]\s*TJ/gm; let ta; while((ta = tja.exec(block))!==null){ const arr = ta[1].match(/\((.*?)\)/gm)||[]; for(const p of arr){ text += p.slice(1,-1) + ' '; } text += '\n'; }
      }
      text = text.replace(/\\\)/g, ')').replace(/\\\(/g, '(').replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t');
      text = text.replace(/[ \t]+/g, ' ').replace(/\r/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
      return text;
    };

    const extractDocxText = async (ab) => {
      try {
        const s = new TextDecoder('utf-8').decode(new Uint8Array(ab));
        if (/^PK\x03\x04/.test(s)) { throw new Error('DOCX_ZIP_UNSUPPORTED'); }
        const stripped = s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        return stripped.length > 0 ? stripped : '';
      } catch (e) {
        warnings.push('DOCX extract not supported in this environment');
        return '';
      }
    };

    const chunkText = (text, maxLen=10000, overlap=600) => {
      const out=[]; let i=0; while(i<text.length){ const end=Math.min(i+maxLen, text.length); out.push(text.slice(i,end)); if(end>=text.length) break; i=end - Math.min(overlap,end); } return out;
    };

    const llmCall = async (chunk, idx) => {
      if (!OPENAI_API_KEY) throw new Error('NO_OPENAI_KEY');
      const messages = [
        { role: 'system', content: 'You analyze residential leases. Output strict JSON only.' },
        { role: 'user', content: `CHUNK_INDEX: ${idx}\nReturn strictly JSON with keys {"clauses":[],"top_risks":[],"missing_clauses":[]} for this text:\n${chunk}` }
      ];
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini', temperature: 0.1, response_format: { type: 'json_object' }, messages })
      });
      if (!resp.ok) throw new Error(`LLM_${resp.status}`);
      const j = await resp.json();
      let out; try { out = JSON.parse(j?.choices?.[0]?.message?.content || '{}'); } catch { out = {}; }
      return {
        clauses: Array.isArray(out.clauses) ? out.clauses : [],
        top_risks: Array.isArray(out.top_risks) ? out.top_risks : [],
        missing_clauses: Array.isArray(out.missing_clauses) ? out.missing_clauses : []
      };
    };

    const normalizeTitle = (s)=>String(s||'').toLowerCase().replace(/\s+/g,' ').trim();
    const first80 = (s)=>String(s||'').slice(0,80).toLowerCase().trim();

    try {
      console.log('[WORKER] DOWNLOAD_FILE');
      const bin = await stage('DOWNLOAD_FILE', ()=>fetchBinary(fileUrl));
      if (bin.error) {
        return respond({ ok:false, step:'DOWNLOAD_FILE', error_code:String(bin.message||'DOWNLOAD_FAILED'), message:'Failed to fetch fileUrl', retryable:false, debugLog:{ status:bin.status }, leaseId });
      }
      console.log('[WORKER] EXTRACT_TEXT');
      let extracted = '';
      await stage('EXTRACT_TEXT', async () => {
        if (isPdf(bin.contentType, fileUrl)) {
          try { extracted = extractPdfTextNaive(bin.ab); } catch(e){ warnings.push('PDF extract failed'); extracted=''; }
          if ((extracted||'').length < 100) warnings.push('PDF text extraction very short');
        } else if (isDocx(bin.contentType, fileUrl)) {
          extracted = await extractDocxText(bin.ab);
        } else {
          try { extracted = new TextDecoder('utf-8').decode(new Uint8Array(bin.ab)); } catch { extracted=''; }
        }
      });

      if (!extracted || extracted.length < 200) {
        return respond({ ok:false, step:'EXTRACT_TEXT', error_code:'UNSUPPORTED_PDF_TEXT', message:'Unable to extract sufficient text', retryable:false, debugLog:{ text_length: extracted?.length||0, warnings, stages }, leaseId });
      }

      console.log('[WORKER] CHUNK');
      const chunks = await stage('CHUNK', ()=>chunkText(extracted, 9000, 600));

      console.log('[WORKER] LLM_CALL');
      let mergedClauses = []; let mergedRisks = []; let mergedMissing = [];
      await stage('LLM_CALL', async () => {
        for (let i=0;i<chunks.length;i++){
          const r = await llmCall(chunks[i], i);
          for (const c of r.clauses){
            const key = normalizeTitle(c.title)+'::'+first80(c.original_text);
            if (!mergedClauses.some(x => (normalizeTitle(x.title)+'::'+first80(x.original_text))===key)){
              mergedClauses.push({
                clause_id: c.clause_id || `C${mergedClauses.length+1}`,
                title: c.title || null,
                original_text: c.original_text || '',
                plain_english: c.plain_english || '',
                risk_level: c.risk_level || 'none',
                risk_summary: c.risk_summary || '',
                landlord_favorable: typeof c.landlord_favorable==='boolean'?c.landlord_favorable:null,
                tenant_favorable: typeof c.tenant_favorable==='boolean'?c.tenant_favorable:null,
                recommendation: { fix: c?.recommendation?.fix || '', suggested_wording: c?.recommendation?.suggested_wording || '' },
                law_refs: Array.isArray(c.law_refs)?c.law_refs:[]
              });
            }
          }
          for (const tr of r.top_risks){
            const k=(tr.title||'').toLowerCase().trim()+'::'+first80(tr.why);
            if (!mergedRisks.some(x => (x.title||'').toLowerCase().trim()+'::'+first80(x.why)===k)){
              mergedRisks.push({ title: tr.title||'Risk', why: tr.why||'', severity: tr.severity||'med' });
            }
          }
          for (const mc of r.missing_clauses){ const key=String(mc||'').toLowerCase().trim(); if (key && !mergedMissing.some(x=>String(x).toLowerCase().trim()===key)) mergedMissing.push(mc); }
        }
      });

      console.log('[WORKER] MERGE');
      await stage('MERGE', async ()=>{});

      const sevMap = { none:0, low:15, med:40, high:70, critical:90 };
      const clauseScore = mergedClauses.length ? mergedClauses.reduce((a,c)=>a+(sevMap[c.risk_level]??40),0)/mergedClauses.length : 0;
      const riskScoreTop = mergedRisks.length ? mergedRisks.reduce((a,r)=>a+(sevMap[r.severity]??40),0)/mergedRisks.length : 0;
      const risk_score = Math.round(0.65*clauseScore + 0.35*riskScoreTop);

      const scan_full = {
        meta: { language_detected: language, source_file_url: fileUrl, text_length: extracted.length, chunks: chunks.length },
        risk_score,
        summary: { top_risks: mergedRisks.slice(0,10) },
        clauses: mergedClauses,
        debug: { warnings, stages }
      };

      console.log('[WORKER] DONE');
      return respond({ ok:true, scanId:null, leaseId, scan_full, debugLog: { stages } });
    } catch (e) {
      warnings.push(String(e?.message||e));
      stages.push({ stage:'DONE', ms: Date.now()-t0, note:'UNHANDLED' });
      return respond({ ok:false, step:'UNHANDLED', error_code:'EXCEPTION', message:String(e?.message||e), retryable:false, debugLog:{ warnings, stages }, leaseId });
    }
  }
};