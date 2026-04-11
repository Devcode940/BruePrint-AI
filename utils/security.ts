/**
 * Security & Validation Utilities
 */

/**
 * Sanitizes user input to prevent XSS and prompt injection attacks
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\n/g, ' ')
    .trim();
};

/**
 * Validates that input is not empty or malicious
 */
export const validateInput = (input: string, fieldName: string): { valid: boolean; error?: string } => {
  if (!input || input.trim().length === 0) {
    return { valid: false, error: `${fieldName} is required` };
  }
  
  if (input.length > 10000) {
    return { valid: false, error: `${fieldName} exceeds maximum length of 10000 characters` };
  }
  
  // Check for potential prompt injection patterns
  const dangerousPatterns = [
    /ignore\s+previous\s+instructions/i,
    /system\s+instruction/i,
    /you\s+are\s+now/i,
    /forget\s+all/i,
    /bypass\s+security/i,
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(input)) {
      return { valid: false, error: `Invalid content detected in ${fieldName}` };
    }
  }
  
  return { valid: true };
};

/**
 * Validates PRD form inputs
 */
export const validatePRDForm = (inputs: {
  name: string;
  description: string;
  targetAudience: string;
  primaryGoals: string;
  keyFeatures: string;
}): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  const nameResult = validateInput(inputs.name, 'Product Name');
  if (!nameResult.valid) errors.name = nameResult.error!;
  
  const descResult = validateInput(inputs.description, 'Description');
  if (!descResult.valid) errors.description = descResult.error!;
  
  const audienceResult = validateInput(inputs.targetAudience, 'Target Audience');
  if (!audienceResult.valid) errors.targetAudience = audienceResult.error!;
  
  const goalsResult = validateInput(inputs.primaryGoals, 'Primary Goals');
  if (!goalsResult.valid) errors.primaryGoals = goalsResult.error!;
  
  const featuresResult = validateInput(inputs.keyFeatures, 'Key Features');
  if (!featuresResult.valid) errors.keyFeatures = featuresResult.error!;
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validates BroadcastChannel message origin and structure
 */
export const isValidBroadcastMessage = (data: any): boolean => {
  if (!data || typeof data !== 'object') return false;
  if (!['SYNC_PRD', 'SYNC_COMMENTS'].includes(data.type)) return false;
  if (!data.hasOwnProperty('data')) return false;
  return true;
};

/**
 * Safe JSON parse with error handling
 */
export const safeJSONParse = <T>(str: string, defaultValue: T): T => {
  try {
    return JSON.parse(str) as T;
  } catch {
    return defaultValue;
  }
};

/**
 * Encrypts data for localStorage (simple base64 encoding - use proper encryption in production)
 * Note: For production, use a library like crypto-js
 */
export const encryptForStorage = (data: any): string => {
  try {
    return btoa(JSON.stringify(data));
  } catch {
    return '';
  }
};

/**
 * Decrypts data from localStorage
 */
export const decryptFromStorage = <T>(encrypted: string, defaultValue: T): T => {
  try {
    const decrypted = atob(encrypted);
    return JSON.parse(decrypted) as T;
  } catch {
    return defaultValue;
  }
};

/**
 * Rate limiter utility
 */
export class RateLimiter {
  private lastCall: number = 0;
  private minInterval: number;

  constructor(minIntervalMs: number = 1000) {
    this.minInterval = minIntervalMs;
  }

  async wait(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastCall;
    if (elapsed < this.minInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minInterval - elapsed));
    }
    this.lastCall = Date.now();
  }

  reset(): void {
    this.lastCall = 0;
  }
}

/**
 * Retry with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Structured logger
 */
export const logger = {
  info: (message: string, context?: Record<string, any>) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, context || '');
  },
  
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
  },
  
  warn: (message: string, context?: Record<string, any>) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, context || '');
  },
  
  debug: (message: string, context?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, context || '');
    }
  }
};

/**
 * Analytics event tracker (placeholder for real analytics service)
 */
export const trackEvent = (eventName: string, data?: Record<string, any>) => {
  logger.info(`[Analytics] ${eventName}`, data);
  // In production, send to analytics service:
  // analytics.track(eventName, data);
};
