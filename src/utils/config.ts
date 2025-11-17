/**
 * Configuration utilities for the app
 */

/**
 * Get the API base URL based on environment
 * In development: use localhost:3001
 * In production: use the deployed Railway URL
 */
export const getApiBaseUrl = (): string => {
  // Check if we have an explicit API base URL set
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  if (envApiUrl) {
    return envApiUrl;
  }

  // Fallback to detecting environment
  if (import.meta.env.DEV) {
    // Development mode - use localhost
    return 'http://localhost:3001';
  } else {
    // Production mode - use current domain (since API and frontend are served from same server)
    return window.location.origin;
  }
};

/**
 * Build a full API URL from a relative path
 */
export const buildApiUrl = (path: string): string => {
  const baseUrl = getApiBaseUrl();
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};