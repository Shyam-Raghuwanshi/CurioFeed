import { api } from "../../convex/_generated/api";
import { useMutation } from "convex/react";

export interface EngagementTimer {
  startTime: number;
  id: string;
}

export interface EngagementData {
  userId: string;
  linkUrl: string;
  timeSpent: number; // in milliseconds
  scrolled: boolean;
  clicked: boolean;
  action?: 'open' | 'save' | 'not-interested';
  engagementScore: number; // 0-100
  interest: string;
  timestamp: Date;
}

/**
 * Starts an engagement timer for tracking user interaction
 * @returns EngagementTimer object with start time and unique ID
 */
export function startEngagementTimer(): EngagementTimer {
  return {
    startTime: Date.now(),
    id: `timer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
}

/**
 * Stops the engagement timer and calculates time spent
 * @param timer - The timer object returned from startEngagementTimer
 * @returns Time spent in milliseconds
 */
export function stopEngagementTimer(timer: EngagementTimer): number {
  if (!timer || !timer.startTime) {
    console.warn('Invalid timer provided to stopEngagementTimer');
    return 0;
  }
  
  const timeSpent = Date.now() - timer.startTime;
  return Math.max(0, timeSpent); // Ensure non-negative
}

/**
 * Calculates engagement score based on user interaction
 * Following the rules from COPILOT_RULES.md:
 * - Base: 0
 * - Add 50 if timeSpent > 2 seconds
 * - Add 30 if user clicked "Open"
 * - Add 20 if user clicked "Save"
 * - Subtract 20 if user clicked "Not interested"
 * - Cap at 100
 * 
 * @param timeSpent - Time spent viewing content in milliseconds
 * @param scrolled - Whether user scrolled while viewing
 * @param action - The action taken by user ('open' | 'save' | 'not-interested')
 * @returns Engagement score (0-100)
 */
export function calculateEngagementScore(
  timeSpent: number,
  scrolled: boolean,
  action?: 'open' | 'save' | 'not-interested'
): number {
  let score = 0;

  // Base scoring for time spent
  if (timeSpent > 2000) { // 2 seconds in milliseconds
    score += 50;
  }

  // Bonus for scrolling (indicates attention)
  if (scrolled) {
    score += 10;
  }

  // Action-based scoring
  switch (action) {
    case 'open':
      score += 30;
      break;
    case 'save':
      score += 20;
      break;
    case 'not-interested':
      score -= 20;
      break;
    default:
      // No action taken, no additional scoring
      break;
  }

  // Cap at 100 and ensure minimum of 0
  return Math.min(100, Math.max(0, score));
}

/**
 * Custom hook to get the logEngagement mutation
 * This should be used in React components that need to log engagement
 */
export function useLogEngagement() {
  return useMutation(api.users.logEngagement);
}

/**
 * Logs engagement data to Convex
 * Note: This function should be called from a React component that has access to Convex hooks
 * Use the useLogEngagement hook instead for React components
 * 
 * @param engagementData - Complete engagement data object
 */
export async function logEngagementData(
  logEngagementMutation: any,
  engagementData: Omit<EngagementData, 'timestamp'>
): Promise<void> {
  try {
    await logEngagementMutation({
      ...engagementData,
      timestamp: Date.now() // Convert to timestamp for Convex
    });
  } catch (error) {
    console.error('Failed to log engagement data:', error);
    // Don't throw - engagement tracking should not break the app
  }
}

/**
 * Helper function to create engagement data object
 */
export function createEngagementData(
  userId: string,
  linkUrl: string,
  timeSpent: number,
  scrolled: boolean,
  interest: string,
  action?: 'open' | 'save' | 'not-interested'
): Omit<EngagementData, 'timestamp'> {
  const engagementScore = calculateEngagementScore(timeSpent, scrolled, action);
  
  return {
    userId,
    linkUrl,
    timeSpent,
    scrolled,
    clicked: !!action,
    action,
    engagementScore,
    interest
  };
}

/**
 * Debounce function to prevent excessive engagement logging
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}