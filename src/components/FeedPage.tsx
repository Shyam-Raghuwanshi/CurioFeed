import { UserButton, useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import MigrationHelper from "./MigrationHelper";

export default function FeedPage() {
  const { user } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);

  // If user hasn't completed onboarding, redirect there
  if (currentUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (currentUser === null) {
    window.location.href = "/onboarding";
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CurioFeed</h1>
            <p className="text-sm text-gray-600">Your personalized content feed</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome, {user?.firstName || user?.emailAddresses[0]?.emailAddress}!
            </span>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10"
                }
              }}
            />
          </div>
        </div>
      </header>

      {/* Feed Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Feed</h2>
          
          {/* Show user's interests */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Your Interests:</h3>
            <div className="flex flex-wrap gap-2">
              {currentUser.interests.map((interest: string) => (
                <span
                  key={interest}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>

          {/* Placeholder for feed content */}
          <div className="space-y-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Your personalized feed is being prepared!
              </h3>
              <p className="text-gray-600">
                We're gathering content based on your interests. Check back soon for curated articles and links.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      {/* Temporary migration helper - remove after migration */}
      <MigrationHelper />
    </div>
  );
}