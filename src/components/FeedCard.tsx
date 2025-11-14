import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ExternalLink, Bookmark, BookmarkCheck, ThumbsDown } from 'lucide-react';
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
  isSaved?: boolean;
  onEngagement?: (data: EngagementData) => void;
  onSave?: (url: string, title: string) => Promise<void>;
  onUnsave?: (url: string) => Promise<void>;
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
  isSaved: initialSavedState = false,
  onEngagement,
  onSave,
  onUnsave,
  onDislike,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [timer, setTimer] = useState<EngagementTimer | null>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isSaved, setIsSaved] = useState(initialSavedState);
  const [isSaving, setIsSaving] = useState(false);
  
  // Use refs to avoid stale closures in intersection observer
  const isVisibleRef = useRef(false);
  const timerRef = useRef<EngagementTimer | null>(null);
  const hasScrolledRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => {
    isVisibleRef.current = isVisible;
  }, [isVisible]);

  useEffect(() => {
    timerRef.current = timer;
  }, [timer]);

  useEffect(() => {
    hasScrolledRef.current = hasScrolled;
  }, [hasScrolled]);

  // Update saved state when initialSavedState changes (when savedPosts data updates)
  useEffect(() => {
    setIsSaved(initialSavedState);
  }, [initialSavedState]);

  // Convex mutation hook
  const logEngagement = useLogEngagement();

  // Throttle engagement logging to prevent excessive calls
  const lastLoggedTimeRef = useRef<number>(0);
  const THROTTLE_INTERVAL = 5000; // 5 seconds minimum between logs

  // Handle engagement logging
  const handleEngagementLog = useCallback(async (
    timeSpent: number,
    scrolled: boolean,
    action?: 'open' | 'save' | 'not-interested'
  ) => {
    try {
      // Throttle engagement logging to prevent spam
      const now = Date.now();
      if (!action && (now - lastLoggedTimeRef.current) < THROTTLE_INTERVAL) {
        return; // Skip this log if too recent and not an action
      }
      lastLoggedTimeRef.current = now;

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
    if (!cardRef.current) return;

    const cardElement = cardRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isCurrentlyVisible = entry.isIntersecting;

        if (isCurrentlyVisible && !isVisibleRef.current) {
          // Card entered viewport - start timer
          setIsVisible(true);
          const newTimer = startEngagementTimer();
          setTimer(newTimer);
        } else if (!isCurrentlyVisible && isVisibleRef.current) {
          // Card left viewport - stop timer and log engagement
          setIsVisible(false);
          if (timerRef.current) {
            const timeSpent = stopEngagementTimer(timerRef.current);
            handleEngagementLog(timeSpent, hasScrolledRef.current);
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

    observer.observe(cardElement);

    return () => {
      observer.unobserve(cardElement);
      // Clean up timer on unmount only
      if (timerRef.current) {
        const timeSpent = stopEngagementTimer(timerRef.current);
        handleEngagementLog(timeSpent, hasScrolledRef.current);
      }
    };
  }, []); // No dependencies to prevent recreation

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

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    
    try {
      if (timer) {
        const timeSpent = stopEngagementTimer(timer);
        handleEngagementLog(timeSpent, hasScrolled, 'save');
        setTimer(null); // Reset timer after action
      }
      
      if (isSaved) {
        // Unsave the post
        if (onUnsave) {
          await onUnsave(url);
          setIsSaved(false);
        }
      } else {
        // Save the post
        if (onSave) {
          await onSave(url, title);
          setIsSaved(true);
        }
      }
    } catch (error) {
      console.error('Error toggling save state:', error);
    } finally {
      setIsSaving(false);
    }
  }, [timer, hasScrolled, handleEngagementLog, url, title, isSaved, isSaving, onSave, onUnsave]);

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
            disabled={isSaving}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors duration-200 flex-1 justify-center text-sm font-medium ${
              isSaved
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            {isSaving ? 'Saving...' : (isSaved ? 'Saved' : 'Save')}
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