
import { createBrowserRouter } from "react-router-dom";
import Home from "./Home";
import SignInPage from "./components/SignInPage";
import SignUpPage from "./components/SignUpPage";
import OnboardingPage from "./components/OnboardingPage";
import ProtectedRoute from "./components/ProtectedRoute";
import FeedPage from "./components/FeedPage";

// Define your routes
const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/sign-in",
    element: <SignInPage />,
  },
  {
    path: "/sign-up", 
    element: <SignUpPage />,
  },
  {
    path: "/onboarding",
    element: <OnboardingPage />,
  },
  {
    path: "/feed",
    element: (
      <ProtectedRoute>
        <FeedPage />
      </ProtectedRoute>
    ),
  },
]);

export default router;

  