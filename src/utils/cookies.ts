// Cookie management utilities for CurioFeed
// Handles onboarding completion status and other app cookies

export interface CookieOptions {
  days?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

/**
 * Sets a cookie with the specified name, value, and options
 * @param name - Cookie name
 * @param value - Cookie value
 * @param options - Cookie options (expiration, path, etc.)
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  try {
    const {
      days = 30, // Default to 30 days
      path = '/',
      domain,
      secure = false,
      sameSite = 'Lax'
    } = options;

    let cookieString = `${name}=${encodeURIComponent(value)}`;

    // Set expiration date
    if (days > 0) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      cookieString += `; expires=${date.toUTCString()}`;
    }

    // Add other options
    cookieString += `; path=${path}`;
    
    if (domain) {
      cookieString += `; domain=${domain}`;
    }
    
    if (secure) {
      cookieString += `; secure`;
    }
    
    cookieString += `; SameSite=${sameSite}`;

    console.log('Setting cookie:', cookieString);
    document.cookie = cookieString;
    console.log('All cookies after set:', document.cookie);
  } catch (error) {
    console.error('Error setting cookie:', error);
  }
}

/**
 * Gets a cookie value by name
 * @param name - Cookie name
 * @returns Cookie value or null if not found
 */
export function getCookie(name: string): string | null {
  try {
    if (typeof document === 'undefined') {
      // SSR protection
      return null;
    }

    // Use a more robust regex approach like the user's version
    const escapedName = name.replace(/([.*+?^${}()|[\]\\])/g, '\\$1');
    const match = document.cookie.match(new RegExp(`(^| )${escapedName}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : null;
  } catch (error) {
    console.error('Error getting cookie:', error);
    return null;
  }
}

/**
 * Deletes a cookie by setting its expiration to the past
 * @param name - Cookie name
 * @param options - Cookie options (path, domain)
 */
export function deleteCookie(name: string, options: Omit<CookieOptions, 'days'> = {}): void {
  try {
    const { path = '/', domain } = options;
    
    let cookieString = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
    
    if (domain) {
      cookieString += `; domain=${domain}`;
    }
    
    document.cookie = cookieString;
  } catch (error) {
    console.error('Error deleting cookie:', error);
  }
}

/**
 * Checks if a cookie exists
 * @param name - Cookie name
 * @returns True if cookie exists, false otherwise
 */
export function cookieExists(name: string): boolean {
  return getCookie(name) !== null;
}

// Specific cookie constants for CurioFeed
export const COOKIE_NAMES = {
  ONBOARDING_COMPLETED: 'onboardingCompleted',
  USER_PREFERENCES: 'userPreferences',
  THEME: 'theme',
} as const;

// Type for cookie names
export type CookieName = typeof COOKIE_NAMES[keyof typeof COOKIE_NAMES];

/**
 * Sets the onboarding completed cookie
 * @param userId - User ID to associate with completion
 */
export function setOnboardingCompletedCookie(userId: string): void {
  console.log('Setting onboarding cookie for userId:', userId);
  
  // Use the most basic approach that definitely works
  const cookieName = 'onboardingCompleted';
  const expirationDate = new Date();
  expirationDate.setFullYear(expirationDate.getFullYear() + 1); // 1 year from now
  
  const cookieValue = `${cookieName}=${userId}; expires=${expirationDate.toUTCString()}; path=/`;
  document.cookie = cookieValue;
  
  console.log('Cookie string set:', cookieValue);
  console.log('All cookies after set:', document.cookie);
  
  // Verify immediately
  const verify = document.cookie.split(';').find(c => c.trim().startsWith(cookieName));
  console.log('Immediate verification:', verify);
}

/**
 * Gets the onboarding completed cookie value
 * @returns User ID if onboarding completed, null otherwise
 */
export function getOnboardingCompletedCookie(): string | null {
  const cookieName = 'onboardingCompleted';
  const match = document.cookie.split(';').find(c => c.trim().startsWith(cookieName + '='));
  if (match) {
    return match.split('=')[1];
  }
  return null;
}

/**
 * Checks if onboarding is completed via cookie
 * @param userId - Optional user ID to match against cookie value
 * @returns True if onboarding completed, false otherwise
 */
export function isOnboardingCompletedByCookie(userId?: string): boolean {
  const cookieValue = getOnboardingCompletedCookie();
  
  if (!cookieValue) {
    return false;
  }
  
  // If userId provided, check if it matches the cookie value
  if (userId) {
    return cookieValue === userId;
  }
  
  // Otherwise, just check if cookie exists
  return true;
}

/**
 * Clears the onboarding completed cookie
 */
export function clearOnboardingCompletedCookie(): void {
  deleteCookie(COOKIE_NAMES.ONBOARDING_COMPLETED);
}

/**
 * Clears all CurioFeed related cookies
 */
export function clearAllCookies(): void {
  Object.values(COOKIE_NAMES).forEach(cookieName => {
    deleteCookie(cookieName);
  });
}

/**
 * Test function for debugging cookies
 */
export function testCookies(): void {
  console.log('Testing cookie functionality...');
  console.log('Current cookies before test:', document.cookie);
  
  // Test setting a cookie
  console.log('Setting test cookie...');
  document.cookie = 'onboardingCompleted=test-user-123; path=/';
  
  console.log('Current cookies after set:', document.cookie);
  
  // Test getting the cookie
  const retrieved = getOnboardingCompletedCookie();
  console.log('Retrieved cookie value:', retrieved);
  
  // Test with our function
  setOnboardingCompletedCookie('test-user-456');
  const retrieved2 = getOnboardingCompletedCookie();
  console.log('Retrieved after function call:', retrieved2);
}

// Make test function available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).testCookies = testCookies;
  console.log('testCookies() function is available in browser console');
}