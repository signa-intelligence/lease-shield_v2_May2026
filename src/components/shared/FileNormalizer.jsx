/**
 * FileNormalizer - Handles Android Google Drive content:// URIs and normalizes files
 * 
 * Android Google Drive file picker returns content:// URIs which fail to upload.
 * This utility ensures all files are converted to real File objects before upload.
 */

export const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};

// DEPRECATED: Use getDeviceContext from DeviceContext.js instead
export const detectPlatform = () => {
  console.warn('detectPlatform is deprecated. Use getDeviceContext from DeviceContext.js');
  const ua = navigator.userAgent.toLowerCase();
  return {
    isAndroid: /android/.test(ua),
    isIOS: /iphone|ipad|ipod/.test(ua),
    isChrome: /chrome/.test(ua) && !/edg/.test(ua),
    isSafari: /safari/.test(ua) && !/chrome/.test(ua),
    platform: /android/.test(ua) ? 'android' : /iphone|ipad|ipod/.test(ua) ? 'ios' : 'desktop'
  };
};

export const isContentUri = (file) => {
  // Check if file is actually a content:// URI
  // This happens when Android file picker returns Drive files
  if (!file) return false;
  
  // Check file.name or file.path for content:// pattern
  const name = file.name || '';
  const path = file.path || '';
  
  return name.startsWith('content://') || path.startsWith('content://');
};

export const isPDFFile = async (file) => {
  try {
    // Method 1: Check MIME type
    if (file.type === 'application/pdf') return true;
    
    // Method 2: Check file extension
    const ext = file.name.toLowerCase().split('.').pop();
    if (ext === 'pdf') return true;
    
    // Method 3: Read first bytes for PDF magic number
    const slice = file.slice(0, 5);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const header = String.fromCharCode(...bytes);
    
    return header === '%PDF-';
  } catch (err) {
    console.error('PDF detection failed:', err);
    return false;
  }
};

export const preflightCheck = async (file, requestId) => {
  const log = (msg, data) => {
    console.log(`[${requestId}] Preflight: ${msg}`, data || '');
  };

  try {
    log('Starting preflight check', { name: file.name, size: file.size, type: file.type });

    // Try to read first 64KB or full file if smaller
    const checkSize = Math.min(file.size, 64 * 1024);
    const slice = file.slice(0, checkSize);
    
    const canRead = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      const timeout = setTimeout(() => {
        reader.abort();
        reject(new Error('PREFLIGHT_TIMEOUT: File read timeout'));
      }, 5000);

      reader.onload = () => {
        clearTimeout(timeout);
        resolve(true);
      };

      reader.onerror = (e) => {
        clearTimeout(timeout);
        reject(new Error('PREFLIGHT_READ_FAILED: Cannot access file'));
      };

      reader.readAsArrayBuffer(slice);
    });

    log('Preflight passed', { canRead, bytesChecked: checkSize });
    return { success: true, readable: true };

  } catch (err) {
    log('Preflight failed', { error: err.message });
    return { success: false, error: err.message };
  }
};

export const normalizeFile = async (file, requestId) => {
  const log = (msg, data) => {
    console.log(`[${requestId}] FileNormalizer: ${msg}`, data || '');
  };

  try {
    log('Starting file normalization', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });

    // Detect if this is a content URI or problematic file object
    const isContentURI = isContentUri(file);
    const hasZeroSize = file.size === 0;
    const hasBadMime = !file.type || file.type === '';

    log('File analysis', {
      isContentURI,
      hasZeroSize,
      hasBadMime,
      needsNormalization: isContentURI || hasZeroSize || hasBadMime
    });

    // If file looks good, validate type and return as-is
    if (!isContentURI && !hasZeroSize && !hasBadMime) {
      const isPDF = await isPDFFile(file);
      const ext = file.name.toLowerCase().split('.').pop();
      const isImage = ['png', 'jpg', 'jpeg'].includes(ext) || file.type.startsWith('image/');
      
      if (!isPDF && !isImage) {
        throw new Error('FILE_TYPE_INVALID: Only PDF, PNG, and JPG files are supported');
      }
      log('File OK, no normalization needed');
      return { file, normalized: false };
    }

    // NORMALIZATION REQUIRED
    log('⚠️ File needs normalization - attempting to create real File object');

    // Step 1: Try to read file as Blob using FileReader
    const fileBlob = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const arrayBuffer = e.target.result;
        log('FileReader success', { bytes: arrayBuffer.byteLength });
        
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        resolve(blob);
      };
      
      reader.onerror = (e) => {
        log('❌ FileReader failed', e);
        reject(new Error('FILE_READ_FAILED: Cannot read file content'));
      };
      
      reader.readAsArrayBuffer(file);
    });

    // Step 2: Validate blob size
    if (!fileBlob || fileBlob.size === 0) {
      throw new Error('BLOB_EMPTY: File content is empty after reading');
    }

    log('Blob created successfully', { size: fileBlob.size });

    // Step 3: Verify file type (PDF or image)
    const slice = fileBlob.slice(0, 5);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const header = String.fromCharCode(...bytes);
    
    // Determine if PDF or image
    const ext = file.name?.toLowerCase().split('.').pop() || '';
    const isPDF = header === '%PDF-';
    const isImage = ['png', 'jpg', 'jpeg'].includes(ext);
    
    if (!isPDF && !isImage) {
      log('❌ Not a valid PDF or image', { header, ext });
      throw new Error('FILE_TYPE_INVALID: Only PDF, PNG, and JPG files are supported');
    }

    // Step 4: Create new File object with correct metadata
    const mimeType = isPDF ? 'application/pdf' : 
                     ext === 'png' ? 'image/png' : 'image/jpeg';
    const filename = file.name || `lease_${Date.now()}.${isPDF ? 'pdf' : 'jpg'}`;
    const normalizedFile = new File([fileBlob], filename, {
      type: mimeType,
      lastModified: file.lastModified || Date.now()
    });

    log('✅ File normalized successfully', {
      name: normalizedFile.name,
      size: normalizedFile.size,
      type: normalizedFile.type
    });

    return { file: normalizedFile, normalized: true };

  } catch (err) {
    log('❌ Normalization failed', {
      error: err.message,
      code: err.code
    });
    throw err;
  }
};

export const normalizeFiles = async (files, requestId) => {
  const results = [];
  
  for (let i = 0; i < files.length; i++) {
    try {
      const { file: normalizedFile, normalized } = await normalizeFile(files[i], requestId);
      results.push({
        original: files[i],
        normalized: normalizedFile,
        wasNormalized: normalized,
        success: true
      });
    } catch (err) {
      results.push({
        original: files[i],
        error: err.message,
        success: false
      });
    }
  }
  
  return results;
};