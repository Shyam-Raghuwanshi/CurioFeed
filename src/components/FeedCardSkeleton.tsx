import React from 'react';

interface FeedCardSkeletonProps {
  count?: number;
}

const FeedCardSkeleton: React.FC<FeedCardSkeletonProps> = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden animate-pulse"
        >
          {/* Image Skeleton */}
          <div className="h-48 bg-gray-300"></div>

          {/* Content Skeleton */}
          <div className="p-4">
            {/* Title Skeleton */}
            <div className="h-6 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>

            {/* Source Skeleton */}
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>

            {/* Excerpt Skeleton */}
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3"></div>
            </div>

            {/* Buttons Skeleton */}
            <div className="flex gap-2">
              <div className="h-10 bg-gray-300 rounded flex-1"></div>
              <div className="h-10 bg-gray-300 rounded flex-1"></div>
              <div className="h-10 bg-gray-300 rounded flex-1"></div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default FeedCardSkeleton;