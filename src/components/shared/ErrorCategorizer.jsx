/**
 * ErrorCategorizer - Classifies errors into specific categories instead of generic "Network Error"
 */

export const ERROR_CATEGORIES = {
  UPLOAD_FAILED: {
    code: 'UPLOAD_FAILED',
    title: 'Upload Failed',
    description: 'File could not be read or uploaded'
  },
  REQUEST_TIMEOUT: {
    code: 'REQUEST_TIMEOUT',
    title: 'Request Timed Out',
    description: 'Operation took too long'
  },
  HTTP_ERROR: {
    code: 'HTTP_ERROR',
    title: 'Server Error',
    description: 'Server returned an error response'
  },
  BACKEND_VALIDATION_ERROR: {
    code: 'BACKEND_VALIDATION_ERROR',
    title: 'Validation Error',
    description: 'File or data validation failed'
  },
  ANALYSIS_ERROR: {
    code: 'ANALYSIS_ERROR',
    title: 'Analysis Failed',
    description: 'AI analysis encountered an error'
  },
  CORS_OR_BLOCKED: {
    code: 'CORS_OR_BLOCKED',
    title: 'Access Blocked',
    description: 'Network request blocked'
  },
  AUTH_ERROR: {
    code: 'AUTH_ERROR',
    title: 'Authentication Error',
    description: 'Not authorized to perform this action'
  },
  FILE_TYPE_INVALID: {
    code: 'FILE_TYPE_INVALID',
    title: 'Invalid File Type',
    description: 'File is not a valid PDF'
  },
  FILE_SIZE_EXCEEDED: {
    code: 'FILE_SIZE_EXCEEDED',
    title: 'File Too Large',
    description: 'File exceeds maximum size'
  },
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    title: 'Network Error',
    description: 'Network connection failed'
  }
};

export const categorizeError = (error, context = {}) => {
  const errorMessage = error?.message || error?.toString() || '';
  const errorDetails = error?.details || '';
  const httpStatus = context.httpStatus || error?.status;
  
  // File validation errors
  if (errorMessage.includes('FILE_TYPE_INVALID') || errorMessage.includes('not a valid PDF')) {
    return ERROR_CATEGORIES.FILE_TYPE_INVALID;
  }
  
  if (errorMessage.includes('FILE_SIZE') || errorMessage.includes('too large')) {
    return ERROR_CATEGORIES.FILE_SIZE_EXCEEDED;
  }
  
  if (errorMessage.includes('FILE_READ_FAILED') || errorMessage.includes('BLOB_EMPTY')) {
    return ERROR_CATEGORIES.UPLOAD_FAILED;
  }
  
  // Timeout errors
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return ERROR_CATEGORIES.REQUEST_TIMEOUT;
  }
  
  // Auth errors
  if (httpStatus === 401 || httpStatus === 403 || errorMessage.includes('Unauthorized')) {
    return ERROR_CATEGORIES.AUTH_ERROR;
  }
  
  // Validation errors
  if (errorMessage.includes('validation') || errorMessage.includes('invalid') || errorMessage.includes('schema')) {
    return ERROR_CATEGORIES.BACKEND_VALIDATION_ERROR;
  }
  
  // Analysis-specific errors
  if (errorMessage.includes('analysis') || errorMessage.includes('scan') || errorMessage.includes('InvokeLLM')) {
    return ERROR_CATEGORIES.ANALYSIS_ERROR;
  }
  
  // HTTP errors
  if (httpStatus && httpStatus >= 400) {
    return ERROR_CATEGORIES.HTTP_ERROR;
  }
  
  // CORS/blocked
  if (errorMessage.includes('CORS') || errorMessage.includes('blocked') || errorMessage.includes('Failed to fetch')) {
    return ERROR_CATEGORIES.CORS_OR_BLOCKED;
  }
  
  // Generic network error (last resort)
  if (errorMessage.includes('network') || errorMessage.includes('connection')) {
    return ERROR_CATEGORIES.NETWORK_ERROR;
  }
  
  // Default to analysis error if unknown
  return ERROR_CATEGORIES.ANALYSIS_ERROR;
};

export const formatErrorForUser = (error, requestId, language = 'en') => {
  const category = categorizeError(error, {
    httpStatus: error?.status || error?.response?.status
  });
  
  // Special handling for Google Drive/file access errors
  const isFileAccessError = 
    error?.message?.includes('PREFLIGHT') ||
    error?.message?.includes('FILE_READ_FAILED') ||
    error?.message?.includes('content://') ||
    error?.message?.includes('DocumentProvider');

  const translations = {
    en: {
      [ERROR_CATEGORIES.UPLOAD_FAILED.code]: isFileAccessError
        ? 'Could not read file from Google Drive. Please download the file to your device or choose from Files app.'
        : 'Failed to read or upload file',
      [ERROR_CATEGORIES.REQUEST_TIMEOUT.code]: 'Operation timed out - please try a smaller file',
      [ERROR_CATEGORIES.HTTP_ERROR.code]: 'Server error occurred',
      [ERROR_CATEGORIES.BACKEND_VALIDATION_ERROR.code]: 'File validation failed',
      [ERROR_CATEGORIES.ANALYSIS_ERROR.code]: 'AI analysis failed',
      [ERROR_CATEGORIES.CORS_OR_BLOCKED.code]: 'Request was blocked - check connection',
      [ERROR_CATEGORIES.AUTH_ERROR.code]: 'Authentication failed',
      [ERROR_CATEGORIES.FILE_TYPE_INVALID.code]: 'Only PDF, PNG, and JPG files are supported',
      [ERROR_CATEGORIES.FILE_SIZE_EXCEEDED.code]: 'File size exceeds 10MB limit',
      [ERROR_CATEGORIES.NETWORK_ERROR.code]: 'Network connection failed'
    },
    th: {
      [ERROR_CATEGORIES.UPLOAD_FAILED.code]: isFileAccessError
        ? 'ไม่สามารถอ่านไฟล์จาก Google Drive กรุณาดาวน์โหลดไฟล์ไปยังอุปกรณ์ของคุณหรือเลือกจากแอปไฟล์'
        : 'ไม่สามารถอ่านหรืออัปโหลดไฟล์',
      [ERROR_CATEGORIES.REQUEST_TIMEOUT.code]: 'หมดเวลา - กรุณาใช้ไฟล์ที่เล็กกว่า',
      [ERROR_CATEGORIES.HTTP_ERROR.code]: 'เกิดข้อผิดพลาดเซิร์ฟเวอร์',
      [ERROR_CATEGORIES.BACKEND_VALIDATION_ERROR.code]: 'การตรวจสอบไฟล์ล้มเหลว',
      [ERROR_CATEGORIES.ANALYSIS_ERROR.code]: 'การวิเคราะห์ AI ล้มเหลว',
      [ERROR_CATEGORIES.CORS_OR_BLOCKED.code]: 'คำขอถูกบล็อก - ตรวจสอบการเชื่อมต่อ',
      [ERROR_CATEGORIES.AUTH_ERROR.code]: 'การตรวจสอบสิทธิ์ล้มเหลว',
      [ERROR_CATEGORIES.FILE_TYPE_INVALID.code]: 'รองรับเฉพาะไฟล์ PDF, PNG และ JPG',
      [ERROR_CATEGORIES.FILE_SIZE_EXCEEDED.code]: 'ไฟล์เกินขนาดจำกัด 10MB',
      [ERROR_CATEGORIES.NETWORK_ERROR.code]: 'การเชื่อมต่อเครือข่ายล้มเหลว'
    },
    ru: {
      [ERROR_CATEGORIES.UPLOAD_FAILED.code]: isFileAccessError
        ? 'Не удалось прочитать файл из Google Drive. Скачайте файл на устройство или выберите из приложения Файлы.'
        : 'Не удалось прочитать или загрузить файл',
      [ERROR_CATEGORIES.REQUEST_TIMEOUT.code]: 'Превышено время ожидания - попробуйте файл меньшего размера',
      [ERROR_CATEGORIES.HTTP_ERROR.code]: 'Произошла ошибка сервера',
      [ERROR_CATEGORIES.BACKEND_VALIDATION_ERROR.code]: 'Проверка файла не удалась',
      [ERROR_CATEGORIES.ANALYSIS_ERROR.code]: 'Анализ ИИ не удался',
      [ERROR_CATEGORIES.CORS_OR_BLOCKED.code]: 'Запрос заблокирован - проверьте соединение',
      [ERROR_CATEGORIES.AUTH_ERROR.code]: 'Ошибка аутентификации',
      [ERROR_CATEGORIES.FILE_TYPE_INVALID.code]: 'Поддерживаются только PDF, PNG и JPG файлы',
      [ERROR_CATEGORIES.FILE_SIZE_EXCEEDED.code]: 'Размер файла превышает лимит 10 МБ',
      [ERROR_CATEGORIES.NETWORK_ERROR.code]: 'Ошибка сетевого подключения'
    }
  };
  
  const localizedMessages = translations[language] || translations.en;
  const message = localizedMessages[category.code] || category.description;
  
  return {
    category: category.code,
    title: category.title,
    message,
    requestId,
    details: error?.details || error?.message || ''
  };
};

export const createDebugLog = (requestId, stages) => {
  const ua = navigator.userAgent.toLowerCase();
  const platform = {
    isAndroid: /android/.test(ua),
    isIOS: /iphone|ipad|ipod/.test(ua),
    isChrome: /chrome/.test(ua) && !/edg/.test(ua),
    isSafari: /safari/.test(ua) && !/chrome/.test(ua),
    platform: /android/.test(ua) ? 'android' : /iphone|ipad|ipod/.test(ua) ? 'ios' : 'desktop'
  };

  return {
    requestId,
    timestamp: new Date().toISOString(),
    stages,
    platform,
    userAgent: navigator.userAgent
  };
};