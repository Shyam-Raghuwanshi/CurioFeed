import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ExternalLink, Bookmark, ThumbsDown } from 'lucide-react';

// TypeScript interfaces
export interface FeedCardProps {
  title: string;
  url: string;
  source: string;
  excerpt: string;
  imageUrl?: string;
  onEngagement: (data: EngagementData) => void;
  onSave: (url: string, title: string) => void;
  onDislike: (url: string) => void;
}

export interface EngagementData {
  linkUrl: string;
  timeSpent: number; // in milliseconds
  scrolled: boolean;
  action: 'open' | 'save' | 'dislike' | 'view';
  engagement_score: number;
}

const FeedCard: React.FC<FeedCardProps> = ({
  title,
  url,
  source,
  excerpt,
  imageUrl,
  onEngagement,
  onSave,
  onDislike,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);

  // Calculate engagement score based on time spent and action
  const calculateEngagementScore = useCallback((timeSpentMs: number, action: string): number => {
    let score = 0;
    
    // Base score for time spent
    if (timeSpentMs > 2000) score += 50; // 2+ seconds viewing
    
    // Action bonuses/penalties
    switch (action) {
      case 'open':
        score += 30;
        break;
      case 'save':
        score += 20;
        break;
      case 'dislike':
        score -= 20;
        break;
      default:
        break;
    }
    
    // Cap at 100
    return Math.min(100, Math.max(0, score));
  }, []);

  // Track engagement when visibility changes
  const trackEngagement = useCallback((action: 'open' | 'save' | 'dislike' | 'view') => {
    const currentTime = Date.now();
    const finalTimeSpent = startTime ? currentTime - startTime : timeSpent;
    
    const engagementData: EngagementData = {
      linkUrl: url,
      timeSpent: finalTimeSpent,
      scrolled: action !== 'dislike', // Assume scrolled unless explicitly disliked
      action,
      engagement_score: calculateEngagementScore(finalTimeSpent, action)
    };
    
    onEngagement(engagementData);
  }, [startTime, timeSpent, url, onEngagement, calculateEngagementScore]);

  // Intersection Observer for viewport detection
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isCurrentlyVisible = entry.isIntersecting;
        
        if (isCurrentlyVisible && !isVisible) {
          // Card entered viewport
          setIsVisible(true);
          setStartTime(Date.now());
        } else if (!isCurrentlyVisible && isVisible) {
          // Card left viewport
          setIsVisible(false);
          if (startTime) {
            const currentTimeSpent = Date.now() - startTime;
            setTimeSpent(prev => prev + currentTimeSpent);
            trackEngagement('view');
          }
          setStartTime(null);
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
    };
  }, [isVisible, startTime, trackEngagement]);

  // Handle button actions
  const handleOpen = useCallback(() => {
    trackEngagement('open');
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [url, trackEngagement]);

  const handleSave = useCallback(() => {
    trackEngagement('save');
    onSave(url, title);
  }, [url, title, onSave, trackEngagement]);

  const handleDislike = useCallback(() => {
    trackEngagement('dislike');
    onDislike(url);
  }, [url, onDislike, trackEngagement]);

  // Placeholder image URL
  const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-family='Arial, sans-serif' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E";

  return (
    <div 
      ref={cardRef}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 overflow-hidden"
    >
      {/* Image Section */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        <img
          src={imageUrl || placeholderImage}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = placeholderImage;
          }}
        />
      </div>

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