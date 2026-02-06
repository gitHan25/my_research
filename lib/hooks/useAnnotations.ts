'use client';

/**
 * useAnnotations Hook
 * 
 * Manages user-specific annotations for the multi-annotator labeling system.
 * Each labeler has their own set of annotations, completely independent from others.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getUserAnnotations, 
  upsertAnnotation, 
  deleteAnnotation,
  getUserProgress 
} from '@/lib/firebase/db';
import { Annotation, SentimentLabel } from '@/types';
import { toast } from 'sonner';

interface ValidationMetadata {
  isValidation?: boolean;
  agreedWithLlm?: boolean;
  originalLlmLabel?: SentimentLabel;
}

const DEBOUNCE_MS = 1000;
const UNDO_WINDOW_MS = 5000;

interface UseAnnotationsOptions {
  datasetId: string;
  userId: string;
  userEmail: string;
}

interface UseAnnotationsReturn {
  annotations: Map<string, Annotation>;
  progress: { labeled: number; total: number; percentage: number };
  isLoading: boolean;
  isSaving: boolean;
  showUndo: boolean;
  lastSaved: { commentId: string; label: SentimentLabel; annotationId: string } | null;
  saveAnnotation: (commentId: string, label: SentimentLabel, validationMeta?: ValidationMetadata) => void;
  undoAnnotation: () => Promise<void>;
  getAnnotationForComment: (commentId: string) => SentimentLabel | null;
  refreshAnnotations: () => Promise<void>;
}

export function useAnnotations({
  datasetId,
  userId,
  userEmail,
}: UseAnnotationsOptions): UseAnnotationsReturn {
  const [annotations, setAnnotations] = useState<Map<string, Annotation>>(new Map());
  const [progress, setProgress] = useState({ labeled: 0, total: 0, percentage: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showUndo, setShowUndo] = useState(false);
  const [lastSaved, setLastSaved] = useState<{
    commentId: string;
    label: SentimentLabel;
    annotationId: string;
    previousLabel: SentimentLabel | null;
    previousAnnotationId: string | null;
  } | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load annotations on mount
  const loadAnnotations = useCallback(async () => {
    if (!datasetId || !userId) return;
    
    setIsLoading(true);
    try {
      const [annotationsMap, progressData] = await Promise.all([
        getUserAnnotations(datasetId, userId),
        getUserProgress(datasetId, userId),
      ]);
      
      setAnnotations(annotationsMap);
      setProgress(progressData);
    } catch (error) {
      console.error('Error loading annotations:', error);
      toast.error('Failed to load labeling data');
    } finally {
      setIsLoading(false);
    }
  }, [datasetId, userId]);

  useEffect(() => {
    loadAnnotations();
  }, [loadAnnotations]);

  // Get annotation for a specific comment
  const getAnnotationForComment = useCallback((commentId: string): SentimentLabel | null => {
    const annotation = annotations.get(commentId);
    return annotation?.label ?? null;
  }, [annotations]);

  // Save annotation with debounce
  const saveAnnotation = useCallback((commentId: string, label: SentimentLabel, validationMeta?: ValidationMetadata) => {
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

    // Get previous state for undo
    const previousAnnotation = annotations.get(commentId);
    const previousLabel = previousAnnotation?.label ?? null;
    const previousAnnotationId = previousAnnotation?.id ?? null;

    // Optimistic update
    const tempAnnotation: Annotation = {
      id: previousAnnotationId || 'temp',
      commentId,
      datasetId,
      userId,
      userEmail,
      label,
      createdAt: previousAnnotation?.createdAt ?? new Date() as any,
      updatedAt: new Date() as any,
    };

    setAnnotations((prev) => {
      const updated = new Map(prev);
      updated.set(commentId, tempAnnotation);
      return updated;
    });

    // Update progress optimistically if this is a new annotation
    if (!previousAnnotation) {
      setProgress((prev) => ({
        ...prev,
        labeled: prev.labeled + 1,
        percentage: prev.total > 0 ? Math.round(((prev.labeled + 1) / prev.total) * 100) : 0,
      }));
    }

    setIsSaving(true);

    // Debounce the actual save
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const annotationId = await upsertAnnotation({
          commentId,
          datasetId,
          userId,
          userEmail,
          label,
          ...validationMeta,
        });

        // Update with real annotation ID
        setAnnotations((prev) => {
          const updated = new Map(prev);
          const existing = updated.get(commentId);
          if (existing) {
            updated.set(commentId, { ...existing, id: annotationId });
          }
          return updated;
        });

        // Set last saved for undo
        setLastSaved({
          commentId,
          label,
          annotationId,
          previousLabel,
          previousAnnotationId,
        });
        setShowUndo(true);

        // Auto-hide undo after window expires
        undoTimeoutRef.current = setTimeout(() => {
          setShowUndo(false);
          setLastSaved(null);
        }, UNDO_WINDOW_MS);

      } catch (error) {
        console.error('Error saving annotation:', error);
        toast.error('Failed to save label');
        
        // Revert optimistic update on error
        setAnnotations((prev) => {
          const updated = new Map(prev);
          if (previousAnnotation) {
            updated.set(commentId, previousAnnotation);
          } else {
            updated.delete(commentId);
          }
          return updated;
        });

        if (!previousAnnotation) {
          setProgress((prev) => ({
            ...prev,
            labeled: Math.max(0, prev.labeled - 1),
            percentage: prev.total > 0 ? Math.round((Math.max(0, prev.labeled - 1) / prev.total) * 100) : 0,
          }));
        }
      } finally {
        setIsSaving(false);
      }
    }, DEBOUNCE_MS);
  }, [annotations, datasetId, userId, userEmail]);

  // Undo last annotation
  const undoAnnotation = useCallback(async () => {
    if (!lastSaved) return;

    // Clear undo timeout
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

    const { commentId, annotationId, previousLabel, previousAnnotationId } = lastSaved;

    try {
      if (previousLabel === null) {
        // This was a new annotation - delete it
        await deleteAnnotation(annotationId);
        
        setAnnotations((prev) => {
          const updated = new Map(prev);
          updated.delete(commentId);
          return updated;
        });

        setProgress((prev) => ({
          ...prev,
          labeled: Math.max(0, prev.labeled - 1),
          percentage: prev.total > 0 ? Math.round((Math.max(0, prev.labeled - 1) / prev.total) * 100) : 0,
        }));
      } else {
        // Revert to previous label
        await upsertAnnotation({
          commentId,
          datasetId,
          userId,
          userEmail,
          label: previousLabel,
        });

        setAnnotations((prev) => {
          const updated = new Map(prev);
          const existing = updated.get(commentId);
          if (existing) {
            updated.set(commentId, { ...existing, label: previousLabel });
          }
          return updated;
        });
      }

      setShowUndo(false);
      setLastSaved(null);
      toast.success('Label undone');
    } catch (error) {
      console.error('Error undoing annotation:', error);
      toast.error('Failed to undo');
    }
  }, [lastSaved, datasetId, userId, userEmail]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    };
  }, []);

  return {
    annotations,
    progress,
    isLoading,
    isSaving,
    showUndo,
    lastSaved: lastSaved ? { 
      commentId: lastSaved.commentId, 
      label: lastSaved.label, 
      annotationId: lastSaved.annotationId 
    } : null,
    saveAnnotation,
    undoAnnotation,
    getAnnotationForComment,
    refreshAnnotations: loadAnnotations,
  };
}

export default useAnnotations;
