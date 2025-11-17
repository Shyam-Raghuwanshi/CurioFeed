import { createRouter, createRoute, createRootRoute, Outlet, Navigate } from '@tanstack/react-router'
import { useAuth } from '@clerk/clerk-react'
import { useOnboarding } from './context/OnboardingContext'
import SignUpPage from './components/SignUpPage'
import SignInPage from './components/SignInPage'
import OnboardingPage from './components/OnboardingPage'
import FeedPage from './components/FeedPage'
import LandingPage from './components/LandingPage'
import DebugAIUsage from './components/DebugAIUsage'

// Root route
const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-gray-50">
      <Outlet />
    </div>
  ),
})

// Loading component for auth checks
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
}

// Index route (/) - Shows landing page for non-authenticated users
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: function IndexComponent() {
    const { isSignedIn, isLoaded } = useAuth()
    const { isOnboardingCompleted, isLoading: onboardingLoading } = useOnboarding()

    if (!isLoaded || onboardingLoading) return <LoadingSpinner />
    
    if (isSignedIn) {
      if (isOnboardingCompleted) {
        return <Navigate to="/feed" replace />
      } else {
        return <Navigate to="/onboarding" replace />
      }
    } else {
      return <LandingPage />
    }
  },
})

// Signup route
const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signup',
  component: function SignupComponent() {
    const { isSignedIn, isLoaded } = useAuth()
    const { isOnboardingCompleted, isLoading: onboardingLoading } = useOnboarding()

    if (!isLoaded || onboardingLoading) return <LoadingSpinner />
    
    if (isSignedIn) {
      if (isOnboardingCompleted) {
        return <Navigate to="/feed" replace />
      } else {
        return <Navigate to="/onboarding" replace />
      }
    }

    return <SignUpPage />
  },
})

// Signin route
const signinRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sign-in',
  component: function SigninComponent() {
    const { isSignedIn, isLoaded } = useAuth()
    const { isOnboardingCompleted, isLoading: onboardingLoading } = useOnboarding()

    if (!isLoaded || onboardingLoading) return <LoadingSpinner />
    
    if (isSignedIn) {
      if (isOnboardingCompleted) {
        return <Navigate to="/feed" replace />
      } else {
        return <Navigate to="/onboarding" replace />
      }
    }

    return <SignInPage />
  },
})

// Onboarding route
const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/onboarding',
  component: function OnboardingComponent() {
    const { isSignedIn, isLoaded } = useAuth()
    const { isOnboardingCompleted, isLoading: onboardingLoading } = useOnboarding()

    if (!isLoaded || onboardingLoading) return <LoadingSpinner />
    
    if (!isSignedIn) {
      return <Navigate to="/signup" replace />
    }

    if (isOnboardingCompleted) {
      return <Navigate to="/feed" replace />
    }

    return <OnboardingPage />
  },
})

// Feed route (protected)
const feedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/feed',
  component: function FeedComponent() {
    const { isSignedIn, isLoaded } = useAuth()
    const { isOnboardingCompleted, isLoading: onboardingLoading } = useOnboarding()

    if (!isLoaded || onboardingLoading) return <LoadingSpinner />
    
    if (!isSignedIn) {
      return <Navigate to="/signup" replace />
    }

    if (!isOnboardingCompleted) {
      return <Navigate to="/onboarding" replace />
    }

    return <FeedPage />
  },
})

// Saved route (protected)
const savedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/saved',
  component: function SavedComponent() {
    const { isSignedIn, isLoaded } = useAuth()
    const { isOnboardingCompleted, isLoading: onboardingLoading } = useOnboarding()

    if (!isLoaded || onboardingLoading) return <LoadingSpinner />
    
    if (!isSignedIn) {
      return <Navigate to="/signup" replace />
    }

    if (!isOnboardingCompleted) {
      return <Navigate to="/onboarding" replace />
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Posts</h1>
            <p className="text-gray-600">Your saved articles and content</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No saved posts yet</h3>
            <p className="text-gray-600 mb-6">Start saving interesting articles from your feed</p>
            <a 
              href="/feed" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Feed
            </a>
          </div>
        </div>
      </div>
    )
  },
})

// Debug route (for testing AI usage)
const debugRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/debug-ai',
  component: DebugAIUsage,
})

// Catch-all route for undefined paths
const catchAllRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$',
  component: function CatchAllComponent() {
    const { isSignedIn, isLoaded } = useAuth()
    const { isOnboardingCompleted, isLoading: onboardingLoading } = useOnboarding()

    if (!isLoaded || onboardingLoading) return <LoadingSpinner />
    
    // Redirect to appropriate page based on auth status
    if (isSignedIn) {
      if (isOnboardingCompleted) {
        return <Navigate to="/feed" replace />
      } else {
        return <Navigate to="/onboarding" replace />
      }
    } else {
      return <Navigate to="/" replace />
    }
  },
})

// Create the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  signupRoute,
  signinRoute,
  onboardingRoute,
  feedRoute,
  savedRoute,
  debugRoute,
  catchAllRoute,
])

// Create the router
export const router = createRouter({ routeTree })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}