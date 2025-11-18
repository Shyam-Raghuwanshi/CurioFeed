import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ExternalLink, Bookmark, BookmarkCheck, ThumbsDown, Sparkles, ChevronDown, Brain, Search, Lightbulb, TrendingUp, GitCompare } from 'lucide-react';
import {
  startEngagementTimer,
  stopEngagementTimer,
  createEngagementData,
  useLogEngagement,
  type EngagementTimer
} from '../utils/engagement';
import { type AIResponse, prepareSummarizeArticle, prepareDeepResearch, prepareFindRelatedTopics, prepareExtractKeyInsights, prepareAnalyzeTrends, prepareCompareAndContrast } from '../services/aiService';
import { api } from '../../convex/_generated/api';
import { useAction } from 'convex/react';
import AIResultModal from './AIResultModal';
import UpgradeNotification from './UpgradeNotification';

// AI Feature type definition
type AIFeatureType = 'summarizeArticle' | 'deepResearch' | 'findRelatedTopics' | 'extractKeyInsights' | 'analyzeTrends' | 'compareAndContrast';

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
  isDisliked?: boolean;
  onEngagement?: (data: EngagementData) => void;
  onSave?: (url: string, title: string) => Promise<void>;
  onUnsave?: (url: string) => Promise<void>;
  onDislike?: (url: string, title: string, source: string) => void;
  onUndislike?: (url: string) => void;
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
  isDisliked: initialDislikedState = false,
  onEngagement,
  onSave,
  onUnsave,
  onDislike,
  onUndislike,
}) => {
  const makePerplexityRequest = useAction(api.autumnAI.makePerplexityRequest);
  const cardRef = useRef<HTMLDivElement>(null);
  const aiDropdownRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [timer, setTimer] = useState<EngagementTimer | null>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isSaved, setIsSaved] = useState(initialSavedState);
  const [isSaving, setIsSaving] = useState(false);
  const [isDisliked, setIsDisliked] = useState(initialDislikedState);
  const [isDisliking, setIsDisliking] = useState(false);
  
  // AI dropdown state
  const [showAIDropdown, setShowAIDropdown] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [currentAIFeature, setCurrentAIFeature] = useState<string>('');
  const [aiResult, setAiResult] = useState<AIResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  
  // Upgrade notification state
  const [showUpgradeNotification, setShowUpgradeNotification] = useState(false);
  
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

  // Handle click outside to close AI dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (aiDropdownRef.current && !aiDropdownRef.current.contains(event.target as Node)) {
        setShowAIDropdown(false);
      }
    };

    if (showAIDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAIDropdown]);

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

  const handleDislike = useCallback(async () => {
    if (isDisliking) return;
    
    setIsDisliking(true);
    try {
      if (timer) {
        const timeSpent = stopEngagementTimer(timer);
        handleEngagementLog(timeSpent, hasScrolled, 'not-interested');
        setTimer(null); // Reset timer after action
      }
      
      if (isDisliked) {
        // Undislike the post
        if (onUndislike) {
          onUndislike(url);
        }
        setIsDisliked(false);
      } else {
        // Dislike the post
        if (onDislike) {
          onDislike(url, title, source);
        }
        setIsDisliked(true);
      }
    } catch (error) {
      console.error('Error toggling dislike state:', error);
    } finally {
      setIsDisliking(false);
    }
  }, [timer, hasScrolled, handleEngagementLog, url, title, source, isDisliked, isDisliking, onDislike, onUndislike]);

  // AI feature handlers
  const handleAIFeature = useCallback(async (featureKey: AIFeatureType, featureName: string) => {
    setCurrentAIFeature(featureName);
    setAiModalOpen(true);
    setAiLoading(true);
    setShowAIDropdown(false);

    try {
      let result: AIResponse;
      
      switch (featureKey) {
        case 'summarizeArticle': {
          const requestData = prepareSummarizeArticle(`${title}\n\n${excerpt}`);
          result = await makePerplexityRequest({
            ...requestData,
            userId
          });
          break;
        }
        case 'deepResearch': {
          const requestData = prepareDeepResearch(title);
          result = await makePerplexityRequest({
            ...requestData,
            userId
          });
          break;
        }
        case 'findRelatedTopics': {
          const requestData = prepareFindRelatedTopics(interest);
          result = await makePerplexityRequest({
            ...requestData,
            userId
          });
          break;
        }
        case 'extractKeyInsights': {
          const requestData = prepareExtractKeyInsights(`${title}\n\n${excerpt}`);
          result = await makePerplexityRequest({
            ...requestData,
            userId
          });
          break;
        }
        case 'analyzeTrends': {
          const requestData = prepareAnalyzeTrends(interest);
          result = await makePerplexityRequest({
            ...requestData,
            userId
          });
          break;
        }
        case 'compareAndContrast': {
          const requestData = prepareCompareAndContrast(title, interest);
          result = await makePerplexityRequest({
            ...requestData,
            userId
          });
          break;
        }
        default:
          throw new Error('Unknown AI feature');
      }
      
      setAiResult(result);
      
      // Check if we should show upgrade notification based on the result
      if (result.success && result.upgradeRequired) {
        setTimeout(() => setShowUpgradeNotification(true), 2000);
      }
    } catch (error) {
      console.error('AI feature error:', error);
      setAiResult({
        success: false,
        content: '',
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        usageRemaining: 0,
        upgradeRequired: true
      });
    } finally {
      setAiLoading(false);
    }
  }, [title, excerpt, url, interest]);

  // AI features configuration
  const aiFeaturesList = [
    {
      key: 'summarizeArticle' as AIFeatureType,
      name: 'Smart Summary',
      icon: Brain,
      description: 'Get a comprehensive AI-generated summary'
    },
    {
      key: 'deepResearch' as AIFeatureType,
      name: 'Deep Research',
      icon: Search,
      description: 'Explore the topic with latest insights'
    },
    {
      key: 'findRelatedTopics' as AIFeatureType,
      name: 'Related Topics',
      icon: Lightbulb,
      description: 'Discover connected topics you\'ll love'
    },
    {
      key: 'extractKeyInsights' as AIFeatureType,
      name: 'Key Insights',
      icon: Sparkles,
      description: 'Extract strategic implications'
    },
    {
      key: 'analyzeTrends' as AIFeatureType,
      name: 'Trend Analysis',
      icon: TrendingUp,
      description: 'Analyze trends and predictions'
    },
    {
      key: 'compareAndContrast' as AIFeatureType,
      name: 'Compare & Contrast',
      icon: GitCompare,
      description: 'Compare with similar approaches'
    }
  ];


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
            disabled={isDisliking}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors duration-200 flex-1 justify-center text-sm font-medium ${
              isDisliked
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-gray-600 text-white hover:bg-gray-700'
            } ${isDisliking ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ThumbsDown size={16} />
            {isDisliking ? 'Processing...' : (isDisliked ? 'Disliked' : 'Not interested')}
          </button>
        </div>

        {/* AI Features Section */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div ref={aiDropdownRef}>
            <button
              onClick={() => setShowAIDropdown(!showAIDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 transition-all duration-200 w-full justify-center text-sm font-medium shadow-lg hover:shadow-xl"
            >
              <Sparkles size={16} className="animate-pulse" />
              <span className="font-medium">AI Assistant</span>
              <ChevronDown size={16} className={`transition-transform duration-200 ${showAIDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* AI Features Dropdown */}
            {showAIDropdown && (
              <div className=" top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-10 overflow-hidden">
                <div className="py-2">
                  {aiFeaturesList.map((feature) => {
                    const IconComponent = feature.icon;
                    return (
                      <button
                        key={feature.key}
                        onClick={() => handleAIFeature(feature.key, feature.name)}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-200 w-full text-left group"
                      >
                        <div className="p-1.5 bg-gray-100 group-hover:bg-purple-100 rounded-lg transition-colors duration-200">
                          <IconComponent size={16} className="text-gray-600 group-hover:text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">{feature.name}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">{feature.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Result Modal */}
      <AIResultModal
        isOpen={aiModalOpen}
        onClose={() => {
          setAiModalOpen(false);
          setAiResult(null);
          setCurrentAIFeature('');
        }}
        title={title}
        featureTitle={currentAIFeature}
        content={aiResult}
        isLoading={aiLoading}
        originalUrl={url}
      />

      {/* Upgrade Notification */}
      <UpgradeNotification
        isVisible={showUpgradeNotification}
        onClose={() => setShowUpgradeNotification(false)}
        onUpgrade={() => {
          // In a real app, this would open upgrade/pricing page
          alert('Upgrade to Pro for unlimited AI features!\n\n🚀 Unlimited AI requests\n💎 Advanced AI models\n⚡ Faster responses\n📊 Usage analytics');
          setShowUpgradeNotification(false);
        }}
      />
    </div>
  );
};

export default FeedCard;