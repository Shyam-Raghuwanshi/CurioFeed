import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ExternalLink, Bookmark, ThumbsDown } from 'lucide-react';
import {
  startEngagementTimer,
  stopEngagementTimer,
  createEngagementData,
  useLogEngagement,
  type EngagementTimer
} from '../utils/engagement';

// TypeScript interfaces
export interface FeedCardProps {
  title: string;
  url: string;
  source: string;
  excerpt: string;
  imageUrl?: string;
  interest: string;
  userId: string;
  onEngagement?: (data: EngagementData) => void;
  onSave?: (url: string, title: string) => void;
  onDislike?: (url: string) => void;
}

export interface EngagementData {
  linkUrl: string;
  timeSpent: number; // in milliseconds
  scrolled: boolean;
  action: 'open' | 'save' | 'not-interested' | 'view';
  engagement_score: number;
}

const FeedCard: React.FC<FeedCardProps> = ({
  title,
  url,
  source,
  excerpt,
  imageUrl: _imageUrl, // Prefix with underscore to indicate intentionally unused
  interest,
  userId,
  onEngagement,
  onSave,
  onDislike,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [timer, setTimer] = useState<EngagementTimer | null>(null);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Convex mutation hook
  const logEngagement = useLogEngagement();

  // Handle engagement logging
  const handleEngagementLog = useCallback(async (
    timeSpent: number,
    scrolled: boolean,
    action?: 'open' | 'save' | 'not-interested'
  ) => {
    try {
      const engagementData = createEngagementData(
        userId,
        url,
        timeSpent,
        scrolled,
        interest,
        action
      );

      // Log to Convex
      await logEngagement({
        ...engagementData,
        timestamp: Date.now()
      });

      // Call parent callback if provided
      if (onEngagement) {
        onEngagement({
          linkUrl: url,
          timeSpent,
          scrolled,
          action: action || 'view',
          engagement_score: engagementData.engagementScore
        });
      }
    } catch (error) {
      console.error('Failed to log engagement:', error);
    }
  }, [userId, url, interest, logEngagement, onEngagement]);

  // Intersection Observer for viewport detection
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isCurrentlyVisible = entry.isIntersecting;

        if (isCurrentlyVisible && !isVisible) {
          // Card entered viewport - start timer
          setIsVisible(true);
          const newTimer = startEngagementTimer();
          setTimer(newTimer);
        } else if (!isCurrentlyVisible && isVisible) {
          // Card left viewport - stop timer and log engagement
          setIsVisible(false);
          if (timer) {
            const timeSpent = stopEngagementTimer(timer);
            handleEngagementLog(timeSpent, hasScrolled);
          }
          setTimer(null);
          setHasScrolled(false);
        }
      },
      {
        threshold: 0.5, // Trigger when 50% of card is visible
        rootMargin: '0px'
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
      // Clean up timer on unmount
      if (timer) {
        const timeSpent = stopEngagementTimer(timer);
        handleEngagementLog(timeSpent, hasScrolled);
      }
    };
  }, [isVisible, timer, hasScrolled, handleEngagementLog]);

  // Track scrolling within the card area
  useEffect(() => {
    const handleScroll = () => {
      if (isVisible) {
        setHasScrolled(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isVisible]);

  // Handle button actions
  const handleOpen = useCallback(() => {
    if (timer) {
      const timeSpent = stopEngagementTimer(timer);
      handleEngagementLog(timeSpent, hasScrolled, 'open');
      setTimer(null); // Reset timer after action
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [timer, hasScrolled, handleEngagementLog, url]);

  const handleSave = useCallback(() => {
    if (timer) {
      const timeSpent = stopEngagementTimer(timer);
      handleEngagementLog(timeSpent, hasScrolled, 'save');
      setTimer(null); // Reset timer after action
    }
    if (onSave) {
      onSave(url, title);
    }
  }, [timer, hasScrolled, handleEngagementLog, url, title, onSave]);

  const handleDislike = useCallback(() => {
    if (timer) {
      const timeSpent = stopEngagementTimer(timer);
      handleEngagementLog(timeSpent, hasScrolled, 'not-interested');
      setTimer(null); // Reset timer after action
    }
    if (onDislike) {
      onDislike(url);
    }
  }, [timer, hasScrolled, handleEngagementLog, url, onDislike]);


  return (
    <div
      ref={cardRef}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 overflow-hidden"
    >

      {/* Content Section */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
          {title}
        </h3>

        {/* Source */}
        <p className="text-sm text-gray-500 mb-2 font-medium">
          {source}
        </p>

        {/* Excerpt */}
        <p className="text-gray-700 text-sm mb-4 line-clamp-3 leading-relaxed">
          {excerpt}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-between">
          <button
            onClick={handleOpen}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 flex-1 justify-center text-sm font-medium"
          >
            <ExternalLink size={16} />
            Open
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 flex-1 justify-center text-sm font-medium"
          >
            <Bookmark size={16} />
            Save
          </button>

          <button
            onClick={handleDislike}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200 flex-1 justify-center text-sm font-medium"
          >
            <ThumbsDown size={16} />
            Not interested
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedCard;