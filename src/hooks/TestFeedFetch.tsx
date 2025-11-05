import React from 'react';
import { useFeedFetch } from './useFeedFetch';
import { type Interest } from '../utils/constants';

/**
 * Test component to verify useFeedFetch hook functionality
 * This component can be temporarily imported in your main app for testing
 */
export const TestFeedFetch: React.FC = () => {
  const testEngagementData = [
    { interest: 'Tech', avgEngagementScore: 85, totalEngagements: 10 },
    { interest: 'Design', avgEngagementScore: 70, totalEngagements: 5 },
  ];

  const { data, isLoading, error, refetch, isRefetching } = useFeedFetch(
    'Tech' as Interest,
    'test-user-123',
    testEngagementData,
    { totalItems: 10, retryAttempts: 2 }
  );

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">useFeedFetch Hook Test</h2>
      
      <div className="mb-4 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Hook State:</h3>
        <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
        <p>Refetching: {isRefetching ? 'Yes' : 'No'}</p>
        <p>Error: {error || 'None'}</p>
        <p>Data count: {data.length}</p>
      </div>

      <div className="mb-4">
        <button
          onClick={refetch}
          disabled={isLoading || isRefetching}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isRefetching ? 'Refetching...' : 'Refetch Data'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          <h3 className="font-semibold">Error:</h3>
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="font-semibold">Feed Data ({data.length} items):</h3>
        {data.map((item) => (
          <div key={item.url} className="p-4 border rounded-lg">
            <h4 className="font-medium">{item.title}</h4>
            <p className="text-sm text-gray-600">{item.source}</p>
            <p className="text-sm">{item.excerpt}</p>
            <p className="text-xs text-blue-600">Interest: {item.interest}</p>
          </div>
        ))}
      </div>

      {data.length === 0 && !isLoading && !error && (
        <p className="text-gray-500 text-center py-8">No data available</p>
      )}
    </div>
  );
};

export default TestFeedFetch;