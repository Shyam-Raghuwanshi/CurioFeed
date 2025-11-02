import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

// This component is for admin use to migrate existing users
// Can be temporarily added to any page to run the migration
export default function MigrationHelper() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const migrateUsers = useMutation(api.users.migrateExistingUsers);

  const runMigration = async () => {
    setIsRunning(true);
    setResult(null);
    
    try {
      const migrationResult = await migrateUsers({});
      setResult(`✅ ${migrationResult.message}`);
    } catch (error) {
      setResult(`❌ Migration failed: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg">
      <h3 className="text-sm font-semibold mb-2">Admin: User Migration</h3>
      <button
        onClick={runMigration}
        disabled={isRunning}
        className="bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
      >
        {isRunning ? 'Running...' : 'Migrate Existing Users'}
      </button>
      {result && (
        <p className="text-xs mt-2 break-words max-w-xs">{result}</p>
      )}
    </div>
  );
}