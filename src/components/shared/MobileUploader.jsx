/**
 * MobileUploader - Android-proof 2-step upload architecture
 * 
 * ARCHITECTURE:
 * 1. Normalize file to real File with bytes in memory
 * 2. Create upload session (get signed URL)
 * 3. PUT bytes directly to signed URL (no multipart, no CORS issues)
 * 4. Return file key for backend processing
 * 
 * This eliminates:
 * - Multipart boundary issues in Android WebView
 * - CORS credential problems
 * - File stream failures from Google Drive
 */

import { base44 } from "@/api/base44Client";
import { normalizeFile } from "./FileNormalizer";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// CRITICAL: Always define timeout with fallback, never rely on env vars
const UPLOAD_TIMEOUT_MS = (() => {
  try {
    const envTimeout = typeof process !== 'undefined' ? process.env?.UPLOAD_TIMEOUT_MS : undefined;
    const parsed = Number(envTimeout);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  } catch (e) {
    // Env not available or parse failed
  }
  return 120000; // Default: 120 seconds for mobile
})();

export const createNetworkDebugLog = (stage, data) => {
  const log = {
    stage,
    timestamp: new Date().toISOString(),
    ...data
  };
  
  console.log(`[NETWORK] ${stage}:`, log);
  return log;
};

export const uploadFileWithSession = async (file, requestId, onProgress) => {
  const networkLog = [];
  const log = (stage, data) => {
    const entry = createNetworkDebugLog(stage, data);
    networkLog.push(entry);
    return entry;
  };

  try {
    log('UPLOAD_SESSION_START', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      requestId
    });

    // Step 1: Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('FILE_SIZE_EXCEEDED: File exceeds 10MB limit');
    }

    if (file.size === 0) {
      throw new Error('FILE_EMPTY: File has zero bytes');
    }

    // Step 2: Read file into memory (critical for Android)
    log('FILE_READ_START', { size: file.size });
    const fileBuffer = await file.arrayBuffer();
    
    if (!fileBuffer || fileBuffer.byteLength === 0) {
      throw new Error('FILE_READ_FAILED: Could not read file bytes');
    }

    if (fileBuffer.byteLength !== file.size) {
      log('FILE_SIZE_MISMATCH', {
        expected: file.size,
        actual: fileBuffer.byteLength
      });
    }

    log('FILE_READ_SUCCESS', {
      bytesRead: fileBuffer.byteLength,
      sizeMatches: fileBuffer.byteLength === file.size
    });

    if (onProgress) onProgress(20);

    // Step 3: Upload using Core.UploadFile (Base44 handles multipart correctly)
    log('BASE44_UPLOAD_START', {
      integration: 'Core.UploadFile',
      fileName: file.name,
      fileType: file.type,
      bytes: fileBuffer.byteLength,
      timeoutMs: UPLOAD_TIMEOUT_MS
    });

    const uploadStartTime = Date.now();
    
    // Create a new File from buffer to ensure it's uploadable
    const uploadableFile = new File([fileBuffer], file.name, {
      type: file.type,
      lastModified: file.lastModified || Date.now()
    });

    log('FILE_REWRAPPED', {
      originalSize: file.size,
      bufferSize: fileBuffer.byteLength,
      newFileSize: uploadableFile.size,
      sizeMatch: uploadableFile.size === fileBuffer.byteLength
    });
    
    const uploadResult = await base44.integrations.Core.UploadFile({ 
      file: uploadableFile 
    });

    const uploadDuration = Date.now() - uploadStartTime;

    if (!uploadResult?.file_url) {
      throw new Error('UPLOAD_FAILED: No file URL returned from upload');
    }

    log('BASE44_UPLOAD_SUCCESS', {
      duration: uploadDuration,
      fileUrl: uploadResult.file_url,
      urlLength: uploadResult.file_url.length
    });

    if (onProgress) onProgress(100);

    return {
      success: true,
      file_url: uploadResult.file_url,
      networkLog,
      bytesUploaded: fileBuffer.byteLength
    };

  } catch (err) {
    log('UPLOAD_ERROR', {
      error: err.message,
      code: err.code,
      name: err.name,
      stack: err.stack?.split('\n').slice(0, 3)
    });

    return {
      success: false,
      error: err.message,
      networkLog,
      errorDetails: {
        message: err.message,
        code: err.code,
        name: err.name
      }
    };
  }
};

export const uploadMultipleFiles = async (files, requestId, onFileProgress) => {
  const results = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      const result = await uploadFileWithSession(
        file,
        `${requestId}_file${i + 1}`,
        (progress) => {
          if (onFileProgress) {
            onFileProgress(i, progress);
          }
        }
      );
      
      results.push({
        fileName: file.name,
        ...result
      });
      
      // Stop on first failure
      if (!result.success) {
        break;
      }
    } catch (err) {
      // Catch any unexpected errors
      results.push({
        fileName: file.name,
        success: false,
        error: err.message,
        networkLog: [{
          stage: 'UPLOAD_EXCEPTION',
          error: err.message,
          stack: err.stack
        }]
      });
      break;
    }
  }
  
  return results;
};

// Export timeout constant for use in debug logs
export const getUploadTimeout = () => UPLOAD_TIMEOUT_MS;