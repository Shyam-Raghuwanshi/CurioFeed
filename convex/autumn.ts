import { components } from "./_generated/api";
import { Autumn } from "@useautumn/convex";

// Type-safe environment variable access
const getEnvVar = (name: string): string => {
  return (globalThis as any).process?.env?.[name] ?? "";
};

export const autumn = new Autumn(components.autumn, {
  secretKey: getEnvVar("AUTUMN_SECRET_KEY"),
  identify: async (ctx: any) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) return null;

    // Clerk integration - user.subject contains the user ID
    const customerId = user.subject ? String(user.subject) : null;
    
    if (!customerId) return null;

    return {
      customerId: customerId,
      customerData: {
        name: user.name ? String(user.name) : "",
        email: user.email ? String(user.email) : "",
      },
    };
  },
});

/**
 * These exports are required for our react hooks and components
 */
export const {
  track,
  cancel,
  query,
  attach,
  check,
  checkout,
  usage,
  setupPayment,
  createCustomer,
  listProducts,
  billingPortal,
  createReferralCode,
  redeemReferralCode,
  createEntity,
  getEntity,
} = autumn.api();