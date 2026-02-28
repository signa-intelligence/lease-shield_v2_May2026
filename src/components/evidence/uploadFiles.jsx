import { base44 } from "@/api/base44Client";

/**
 * Upload files one at a time with retry logic and size validation.
 * Returns { results: [{result, fileIndex}], failedFiles: [string] }
 */
export async function uploadFilesSequentially(allFilesToUpload, { language = 'en', onProgress }) {
  const results = [];
  const failedFiles = [];
  const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB platform limit per file

  for (let i = 0; i < allFilesToUpload.length; i++) {
    const file = allFilesToUpload[i];
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    const sizeKB = (file.size / 1024).toFixed(1);
    console.log(`[EV] Uploading ${i + 1}/${allFilesToUpload.length}: ${file.name} (${file.type}, ${sizeKB}KB)`);

    // Pre-check: skip files that are too large for the platform
    if (file.size > MAX_UPLOAD_SIZE) {
      const errMsg = language === 'th'
        ? `ไฟล์ใหญ่เกินไป (${sizeMB} MB) — สูงสุด 10 MB`
        : `File too large (${sizeMB} MB) — max 10 MB`;
      console.error(`[EV] ❌ SKIPPED ${file.name}: ${errMsg}`);
      failedFiles.push(`${file.name} (${errMsg})`);
      if (onProgress) onProgress(i, allFilesToUpload.length);
      continue;
    }

    if (i > 0) await new Promise(r => setTimeout(r, file.size > 1024 * 1024 ? 1500 : 800));

    let uploaded = false;
    let lastErr = '';
    for (let attempt = 1; attempt <= 3 && !uploaded; attempt++) {
      try {
        const result = await base44.integrations.Core.UploadFile({ file });
        if (!result?.file_url) {
          lastErr = `No URL returned: ${JSON.stringify(result)}`;
          console.error(`[EV] No URL (attempt ${attempt}) ${file.name}:`, lastErr);
          if (attempt < 3) { await new Promise(r => setTimeout(r, 2000 * attempt)); continue; }
        } else {
          console.log(`[EV] ✅ ${file.name} → ${result.file_url.substring(0, 60)}...`);
          results.push({ result, fileIndex: i });
          uploaded = true;
        }
      } catch (uploadErr) {
        const status = uploadErr?.response?.status;
        const isNetworkError = !status && (uploadErr?.message === 'Network Error' || uploadErr?.code === 'ERR_NETWORK');
        const msg = uploadErr?.response?.data?.message || uploadErr?.response?.data?.error || uploadErr?.message || String(uploadErr);
        lastErr = `${status || 'Network Error'}: ${msg}`;
        console.error(`[EV] ❌ (attempt ${attempt}) ${file.name}: ${lastErr}`, { type: file.type, size: file.size, isNetworkError, status });
        const shouldRetry = !status || status >= 500 || isNetworkError;
        if (attempt < 3 && shouldRetry) { await new Promise(r => setTimeout(r, 3000 * attempt)); continue; }
      }
    }
    if (!uploaded) failedFiles.push(`${file.name} (${lastErr})`);
    if (onProgress) onProgress(i, allFilesToUpload.length);
  }

  return { results, failedFiles };
}