/**
 * Comments Hook
 * 
 * Provides comment data fetching with pagination for the labeling interface.
 * Supports both card view (single comment) and table view (paginated list).
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { DocumentSnapshot } from 'firebase/firestore';
import {
  getCommentsPaginated,
  getCommentByIndex,
  getProgressStats,
} from '@/lib/firebase/db';
import { Comment, ProgressStats } from '@/types';

interface UseCommentsReturn {
  // Data
  comments: Comment[];
  currentComment: Comment | null;
  currentIndex: number;
  progress: ProgressStats;
  
  // Loading states
  isLoading: boolean;
  isLoadingMore: boolean;
  
  // Pagination
  hasMore: boolean;
  loadMore: () => Promise<void>;
  
  // Navigation (for card view)
  goToIndex: (index: number) => Promise<void>;
  goToNext: () => Promise<void>;
  goToPrevious: () => Promise<void>;
  
  // Refresh
  refresh: () => Promise<void>;
  updateCommentInList: (commentId: string, updates: Partial<Comment>) => void;
}

const PAGE_SIZE = 20;

export function useComments(datasetId: string | null): UseCommentsReturn {
  // State
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentComment, setCurrentComment] = useState<Comment | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState<ProgressStats>({
    total: 0,
    labeled: 0,
    remaining: 0,
    percentage: 0,
  });
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Pagination
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);

  /**
   * Fetch initial comments and progress
   */
  const fetchInitialData = useCallback(async () => {
    if (!datasetId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      // Fetch comments and progress in parallel
      const [commentsResult, progressResult] = await Promise.all([
        getCommentsPaginated(datasetId, PAGE_SIZE),
        getProgressStats(datasetId),
      ]);

      setComments(commentsResult.data);
      setHasMore(commentsResult.hasMore);
      setLastDoc(commentsResult.lastDoc as DocumentSnapshot | null);
      setProgress(progressResult);
      
      // Set current comment if we have data
      if (commentsResult.data.length > 0) {
        setCurrentComment(commentsResult.data[0]);
        setCurrentIndex(commentsResult.data[0].index);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [datasetId]);

  // Initial fetch
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  /**
   * Load more comments (pagination)
   */
  const loadMore = useCallback(async () => {
    if (!datasetId || !hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    
    try {
      const result = await getCommentsPaginated(
        datasetId,
        PAGE_SIZE,
        lastDoc || undefined
      );

      setComments((prev) => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setLastDoc(result.lastDoc as DocumentSnapshot | null);
    } catch (error) {
      console.error('Error loading more comments:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [datasetId, hasMore, isLoadingMore, lastDoc]);

  /**
   * Go to specific comment by index (for card view)
   */
  const goToIndex = useCallback(async (index: number) => {
    if (!datasetId) return;
    
    // Check if we already have this comment in memory
    const existingComment = comments.find((c) => c.index === index);
    if (existingComment) {
      setCurrentComment(existingComment);
      setCurrentIndex(index);
      return;
    }

    // Fetch from database
    setIsLoading(true);
    try {
      const comment = await getCommentByIndex(datasetId, index);
      if (comment) {
        setCurrentComment(comment);
        setCurrentIndex(index);
      }
    } catch (error) {
      console.error('Error fetching comment:', error);
    } finally {
      setIsLoading(false);
    }
  }, [datasetId, comments]);

  /**
   * Go to next comment
   */
  const goToNext = useCallback(async () => {
    if (currentIndex < progress.total - 1) {
      await goToIndex(currentIndex + 1);
    }
  }, [currentIndex, progress.total, goToIndex]);

  /**
   * Go to previous comment
   */
  const goToPrevious = useCallback(async () => {
    if (currentIndex > 0) {
      await goToIndex(currentIndex - 1);
    }
  }, [currentIndex, goToIndex]);

  /**
   * Refresh data
   */
  const refresh = useCallback(async () => {
    await fetchInitialData();
  }, [fetchInitialData]);

  /**
   * Update a comment in the local list (for optimistic UI updates)
   */
  const updateCommentInList = useCallback((
    commentId: string,
    updates: Partial<Comment>
  ) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId ? { ...comment, ...updates } : comment
      )
    );
    
    // Also update current comment if it's the same
    setCurrentComment((prev) =>
      prev?.id === commentId ? { ...prev, ...updates } : prev
    );

    // Update progress if label changed
    if (updates.label !== undefined) {
      setProgress((prev) => ({
        ...prev,
        labeled: prev.labeled + 1,
        remaining: prev.remaining - 1,
        percentage: Math.round(((prev.labeled + 1) / prev.total) * 100),
      }));
    }
  }, []);

  return {
    comments,
    currentComment,
    currentIndex,
    progress,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    goToIndex,
    goToNext,
    goToPrevious,
    refresh,
    updateCommentInList,
  };
}

export default useComments;
