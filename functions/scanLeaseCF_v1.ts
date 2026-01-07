Deno.serve(async (req) => {
  const bodyText = await req.text();
  let leaseId = null, fileUrl = null, language = null;
  try {
    const parsed = JSON.parse(bodyText || '{}');
    leaseId = parsed.leaseId ?? null;
    fileUrl = parsed.fileUrl ?? null;
    language = parsed.language ?? null;
  } catch (_) {}

  console.log("SCAN_CF_V1_CALLED", { leaseId, fileUrl, language });

  const cfRes = await fetch("https://lease-scan-worker-01.steve-l.workers.dev", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: bodyText || "{}",
  });

  const text = await cfRes.text();
  return new Response(text, {
    status: 200,
    headers: { "content-type": cfRes.headers.get("content-type") || "application/json" },
  });
});