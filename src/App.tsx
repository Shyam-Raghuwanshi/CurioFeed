
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./tanstack-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexReactClient } from "convex/react";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { OnboardingProvider } from "./context/OnboardingContext";
import { ToastContainer } from "./components/Toast";

const queryClient = new QueryClient();

// Initialize Convex client
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL!);

// Get Clerk publishable key
const clerkPK = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPK) {
  throw new Error("Missing Publishable Key");
}

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