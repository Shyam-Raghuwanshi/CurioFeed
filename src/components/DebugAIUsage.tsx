import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../convex/_generated/api";

export default function DebugAIUsage() {
  const { user } = useUser();
  const userId = user?.id || "";
  
  const usageData = useQuery(api.debug.checkUserAIUsage, 
    userId ? { userId } : "skip"
  );
  const resetUsage = useMutation(api.debug.resetUserAIUsage);
  const setUsage = useMutation(api.debug.setUserAIUsage);

  const handleReset = async () => {
    if (!userId) return;
    try {
      const result = await resetUsage({ userId });
      alert(result.message);
      window.location.reload();
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  const handleSetZero = async () => {
    if (!userId) return;
    try {
      const result = await setUsage({ userId, count: 0, limit: 2 });
      alert(result.message);
      window.location.reload();
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  const handleSetTwo = async () => {
    if (!userId) return;
    try {
      const result = await setUsage({ userId, count: 2, limit: 2 });
      alert(result.message);
      window.location.reload();
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <a href="/sign-in" className="text-blue-600 hover:underline">
            Go to Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">AI Usage Debug Tool</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Info</h2>
          <div className="space-y-2">
            <p><span className="font-medium">User ID:</span> {userId}</p>
            <p><span className="font-medium">Email:</span> {user.emailAddresses[0]?.emailAddress}</p>
          </div>
        </div>

        {usageData ? (
          <>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Current Usage Status</h2>
              <div className="space-y-3">
                <p><span className="font-medium">Today's Date:</span> {usageData.today}</p>
                <p className="text-lg">
                  <span className="font-medium">Status:</span>{" "}
                  <span className={usageData.todayUsage ? "text-orange-600" : "text-green-600"}>
                    {usageData.interpretation}
                  </span>
                </p>
                
                {usageData.todayUsage && (
                  <div className="mt-4 p-4 bg-gray-50 rounded">
                    <h3 className="font-medium mb-2">Today's Record:</h3>
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(usageData.todayUsage, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">All Usage Records</h2>
              {usageData.allUsageRecords.length > 0 ? (
                <div className="space-y-4">
                  {usageData.allUsageRecords.map((record, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded">
                      <p><span className="font-medium">Date:</span> {record.date}</p>
                      <p><span className="font-medium">Used:</span> {record.count} / {record.limit}</p>
                      <p className="text-sm text-gray-600">
                        Last Updated: {new Date(record.lastUpdated).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No usage records found</p>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Actions</h2>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Reset Usage (Give 2 Free Requests)
                </button>
                <button
                  onClick={handleSetZero}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Set to 0/2 (Fresh Start)
                </button>
                <button
                  onClick={handleSetTwo}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Set to 2/2 (Maxed Out - for testing)
                </button>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Note: After clicking a button, the page will reload to show updated data.
              </p>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Loading usage data...</p>
          </div>
        )}

        <div className="mt-8 text-center">
          <a href="/feed" className="text-blue-600 hover:underline">
            Back to Feed
          </a>
        </div>
      </div>
    </div>
  );
}
