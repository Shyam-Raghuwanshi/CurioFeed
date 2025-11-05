
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./tanstack-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { OnboardingProvider } from "./context/OnboardingContext";
import { ToastContainer } from "./components/Toast";
import { logEnvironmentStatus } from "./utils/envCheck";

const queryClient = new QueryClient();

// Initialize Convex client
const convexUrl = import.meta.env.VITE_CONVEX_URL;
if (!convexUrl) {
  throw new Error("Missing VITE_CONVEX_URL environment variable. Please check your .env.local file.");
}
const convex = new ConvexReactClient(convexUrl);

// Get Clerk publishable key
const clerkPK = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!clerkPK) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY environment variable. Please check your .env.local file.");
}

// Log environment status on startup
logEnvironmentStatus();

function App() {
  return (
    <ClerkProvider publishableKey={clerkPK}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <OnboardingProvider>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
            <ToastContainer />
          </QueryClientProvider>
        </OnboardingProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

export default App;