/**
 * Environment configuration checker for CurioFeed
 * Validates that all required environment variables are set
 */

export interface EnvConfig {
  convexUrl: string;
  clerkPublishableKey: string;
  firecrawlApiKey?: string;
}

export interface EnvCheckResult {
  isValid: boolean;
  missing: string[];
  warnings: string[];
  config: Partial<EnvConfig>;
}

/**
 * Checks if all required environment variables are configured
 */
export function checkEnvironmentConfig(): EnvCheckResult {
  const missing: string[] = [];
  const warnings: string[] = [];
  const config: Partial<EnvConfig> = {};

  // Check required variables
  const convexUrl = import.meta.env.VITE_CONVEX_URL;
  if (!convexUrl) {
    missing.push('VITE_CONVEX_URL');
  } else {
    config.convexUrl = convexUrl;
    
    // Validate Convex URL format
    if (!convexUrl.includes('.convex.cloud')) {
      warnings.push('VITE_CONVEX_URL should point to a .convex.cloud domain');
    }
  }

  const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (!clerkKey) {
    missing.push('VITE_CLERK_PUBLISHABLE_KEY');
  } else {
    config.clerkPublishableKey = clerkKey;
    
    // Validate Clerk key format
    if (!clerkKey.startsWith('pk_')) {
      warnings.push('VITE_CLERK_PUBLISHABLE_KEY should start with "pk_"');
    }
  }

  // Check optional variables
  const firecrawlKey = import.meta.env.FIRECRAWL_API_KEY;
  if (firecrawlKey) {
    config.firecrawlApiKey = firecrawlKey;
  } else {
    warnings.push('FIRECRAWL_API_KEY not set - content scraping may not work');
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
    config,
  };
}

/**
 * Logs environment configuration status to console
 */
export function logEnvironmentStatus(): void {
  const result = checkEnvironmentConfig();
  
  if (result.isValid) {
    console.log('✅ Environment configuration is valid');
    
    if (result.warnings.length > 0) {
      console.warn('⚠️ Environment warnings:');
      result.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
  } else {
    console.error('❌ Environment configuration is invalid');
    console.error('Missing required variables:');
    result.missing.forEach(missing => console.error(`  - ${missing}`));
    
    console.error('\nPlease create a .env.local file with the required variables.');
    console.error('See CONVEX_SETUP.md for detailed setup instructions.');
  }
}

/**
 * React hook for environment configuration checking
 * (Optional - import useEffect from React to use this)
 */
export function useEnvironmentCheck() {
  const result = checkEnvironmentConfig();
  
  // Log status on mount (uncomment and import useEffect to use)
  // useEffect(() => {
  //   logEnvironmentStatus();
  // }, []);

  return result;
}