/**
 * DISPOSABLE EMAIL DETECTION & EMAIL NORMALIZATION
 * 
 * Prevents referral fraud via temporary email services and Gmail plus addressing
 */

// Common disposable email domains - expand as abuse patterns discovered
const DISPOSABLE_DOMAINS = [
  // Temporary email services
  'temp-mail.org', 'tempmail.com', 'guerrillamail.com', 'mailinator.com',
  '10minutemail.com', 'throwaway.email', 'trashmail.com', 'getnada.com',
  'maildrop.cc', 'sharklasers.com', 'guerrillamail.info', 'grr.la',
  'guerrillamail.biz', 'guerrillamail.de', 'spam4.me', 'guerrillamail.net',
  'guerrillamail.org', 'guerrillamailblock.com', 'pokemail.net', 'spam.la',
  'tmailinator.com', 'spamgourmet.com', 'mailnesia.com', 'temp-mail.io',
  'dispostable.com', 'fakeinbox.com', 'yopmail.com', '33mail.com',
  'emailondeck.com', 'tempinbox.com', 'anonbox.net', 'mintemail.com',
  'mohmal.com', 'mytemp.email', 'tempmail.net', 'getairmail.com',
  'tempail.com', 'throwawaymail.com', 'guerrillamail.com', 'mailcatch.com',
  'harakirimail.com', 'sogetthis.com', 'spamex.com', 'spambox.us',
  'incognitomail.org', 'mailforspam.com', 'anonymbox.com', 'bugmenot.com',
  'deadaddress.com', 'dodgit.com', 'dontreg.com', 'emailias.com',
  'filzmail.com', 'jetable.org', 'kasmail.com', 'nobulk.com',
  'noclickemail.com', 'despam.it', 'disposeamail.com', 'zoemail.com',
  'mailexpire.com', 'mailfreeonline.com', 'mailin8r.com', 'mailmoat.com',
  'mytrashmail.com', 'nospamfor.us', 'punkass.com', 'put2.net',
  'shortmail.net', 'sneakemail.com', 'sofort-mail.de', 'spamavert.com',
  'spamcannon.com', 'spamcorr.com', 'spamfree24.org', 'spamhole.com',
  'spamify.com', 'tempinbox.co.uk', 'temporaryemail.net', 'thankyou2010.com',
  'trash2009.com', 'trashemail.de', 'trialmail.de', 'wegwerfemail.de',
  'yuurok.com', 'zehnminuten.de', 'zippymail.info'
];

/**
 * Check if email is from a disposable/temporary email service
 */
export function isDisposableEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  const emailLower = email.toLowerCase().trim();
  const domain = emailLower.split('@')[1];
  
  if (!domain) return false;
  
  // Check against blacklist
  if (DISPOSABLE_DOMAINS.includes(domain)) {
    return true;
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\d{5,}@/,           // 5+ consecutive numbers before @
    /temp.*mail/i,       // Contains "tempmail"
    /fake.*mail/i,       // Contains "fakemail"
    /trash.*mail/i,      // Contains "trashmail"
    /disposable/i,       // Contains "disposable"
    /throwaway/i,        // Contains "throwaway"
    /spam.*mail/i        // Contains "spammail"
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(emailLower));
}

/**
 * Normalize email to prevent plus addressing abuse
 * 
 * Gmail/Outlook allow: user+tag@gmail.com → all go to user@gmail.com
 * This prevents users from creating unlimited accounts
 */
export function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return email;
  
  const emailLower = email.toLowerCase().trim();
  const parts = emailLower.split('@');
  
  if (parts.length !== 2) return emailLower;
  
  const [localPart, domain] = parts;
  
  // Remove plus addressing for Gmail/Outlook/Yahoo
  const plusAddressingDomains = [
    'gmail.com', 'googlemail.com', 
    'outlook.com', 'hotmail.com', 'live.com',
    'yahoo.com', 'ymail.com'
  ];
  
  if (plusAddressingDomains.includes(domain)) {
    const normalizedLocal = localPart.split('+')[0];  // Remove everything after +
    
    // Gmail also ignores dots in local part
    if (domain === 'gmail.com' || domain === 'googlemail.com') {
      const withoutDots = normalizedLocal.replace(/\./g, '');
      return `${withoutDots}@${domain}`;
    }
    
    return `${normalizedLocal}@${domain}`;
  }
  
  return emailLower;
}

/**
 * Get list of all domains for admin view
 */
export function getDisposableDomains() {
  return DISPOSABLE_DOMAINS;
}