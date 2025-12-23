/**
 * DeviceContext - Accurate runtime platform and environment detection
 * CRITICAL: Do NOT hardcode platform. Always read from actual runtime.
 */

export const getDeviceContext = () => {
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  
  // User Agent Data API (modern browsers)
  const uaData = navigator.userAgentData ? {
    mobile: navigator.userAgentData.mobile,
    platform: navigator.userAgentData.platform,
    brands: navigator.userAgentData.brands?.map(b => `${b.brand}/${b.version}`) || []
  } : null;

  // Android detection
  const isAndroidUA = /Android/i.test(ua);
  const isAndroidPlatform = /Android/i.test(platform);
  const isAndroid = isAndroidUA || isAndroidPlatform || (uaData?.platform === 'Android');

  // iOS detection
  const isIOSUA = /iPhone|iPad|iPod/i.test(ua);
  const isIOSPlatform = /iPhone|iPad|iPod/i.test(platform);
  const isIOS = isIOSUA || isIOSPlatform;

  // WebView detection
  const isWebView = 
    /(wv|Version\/\d+\.\d+.*Chrome\/)/i.test(ua) ||
    /FB_IAB|FBAN|FBAV/i.test(ua) ||
    typeof window.AndroidBridge !== 'undefined' ||
    typeof window.webkit?.messageHandlers !== 'undefined';

  // Native wrapper detection
  const isCapacitor = typeof window.Capacitor !== 'undefined';
  const isCordova = typeof window.cordova !== 'undefined';
  const isNativeWrapper = isCapacitor || isCordova || isWebView;

  // PWA detection
  const isPWA = 
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://');

  // Browser detection
  const isChrome = /Chrome/i.test(ua) && !/Edg/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/Chrome/i.test(ua);
  const isFirefox = /Firefox/i.test(ua);

  // Determine runtime type
  let runtime = 'browser';
  let wrapperName = 'none';
  
  if (isCapacitor) {
    runtime = 'native';
    wrapperName = 'capacitor';
  } else if (isCordova) {
    runtime = 'native';
    wrapperName = 'cordova';
  } else if (isWebView) {
    runtime = 'webview';
    wrapperName = isAndroid ? 'android-webview' : 'ios-webview';
  } else if (isPWA) {
    runtime = 'pwa';
    wrapperName = 'standalone';
  }

  // Determine platform
  let detectedPlatform = 'unknown';
  if (isAndroid) detectedPlatform = 'android';
  else if (isIOS) detectedPlatform = 'ios';
  else if (/Mac/i.test(platform)) detectedPlatform = 'macos';
  else if (/Win/i.test(platform)) detectedPlatform = 'windows';
  else if (/Linux/i.test(platform) && !isAndroid) detectedPlatform = 'linux';

  return {
    // Core detection
    platform: detectedPlatform,
    isAndroid,
    isIOS,
    isDesktop: !isAndroid && !isIOS,
    
    // Runtime environment
    runtime,
    wrapperName,
    isNativeWrapper,
    isWebView,
    isPWA,
    
    // Browser
    browser: isChrome ? 'chrome' : isSafari ? 'safari' : isFirefox ? 'firefox' : 'unknown',
    isChrome,
    isSafari,
    isFirefox,
    
    // Raw data
    userAgent: ua,
    navigatorPlatform: platform,
    uaData,
    
    // Capabilities
    supportsFileAPI: typeof File !== 'undefined' && typeof FileReader !== 'undefined',
    supportsFormData: typeof FormData !== 'undefined',
    
    // Timestamp
    detectedAt: new Date().toISOString()
  };
};

export const logDeviceContext = (requestId) => {
  const ctx = getDeviceContext();
  console.log(`[${requestId}] Device Context:`, ctx);
  return ctx;
};