/**
 * Auto-Save Hook with Debounce
 * 
 * Provides debounced auto-save functionality for labeling.
 * Saves labels after 1 second delay with undo capability.
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import { updateCommentLabel, clearCommentLabel, updateDatasetLabeledCount } from '@/lib/firebase/db';
import { SentimentLabel } from '@/types';

const DEBOUNCE_MS = 1000; // 1 second debounce
const UNDO_DURATION_MS = 5000; // 5 seconds to undo

interface PendingLabel {
  commentId: string;
  datasetId: string;
  label: SentimentLabel;
  previousLabel: SentimentLabel | null;
  wasNewLabel: boolean; // true if this was first time labeling
}

interface UseAutoSaveReturn {
  saveLabel: (
    commentId: string,
    datasetId: string,
    label: SentimentLabel,
    previousLabel: SentimentLabel | null,
    userId: string
  ) => void;
  undoLabel: () => Promise<void>;
  cancelPending: () => void;
  isSaving: boolean;
  showUndo: boolean;
  lastSaved: PendingLabel | null;
}

export function useAutoSave(): UseAutoSaveReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [showUndo, setShowUndo] = useState(false);
  const [lastSaved, setLastSaved] = useState<PendingLabel | null>(null);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingRef = useRef<PendingLabel | null>(null);
  const userIdRef = useRef<string | null>(null);

  /**
   * Save label with debounce
   */
  const saveLabel = useCallback((
    commentId: string,
    datasetId: string,
    label: SentimentLabel,
    previousLabel: SentimentLabel | null,
    userId: string
  ) => {
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Clear any pending undo timer
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      setShowUndo(false);
    }

    // Store pending label info
    const wasNewLabel = previousLabel === null;
    pendingRef.current = {
      commentId,
      datasetId,
      label,
      previousLabel,
      wasNewLabel,
    };
    userIdRef.current = userId;

    setIsSaving(true);

    // Debounce: wait 1 second before saving
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        // Save to Firestore
        await updateCommentLabel(commentId, label, userId);
        
        // Update dataset count if this was a new label
        if (wasNewLabel) {
          await updateDatasetLabeledCount(datasetId, 1);
        }

        // Store what was saved for undo
        setLastSaved(pendingRef.current);
        setIsSaving(false);
        setShowUndo(true);

        // Hide undo after 5 seconds
        undoTimeoutRef.current = setTimeout(() => {
          setShowUndo(false);
          setLastSaved(null);
        }, UNDO_DURATION_MS);

      } catch (error) {
        console.error('Failed to save label:', error);
        setIsSaving(false);
        // Could add error toast here
      }
    }, DEBOUNCE_MS);
  }, []);

  /**
   * Undo the last saved label
   */
  const undoLabel = useCallback(async () => {
    if (!lastSaved) return;

    // Clear undo timer
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

    setIsSaving(true);
    setShowUndo(false);

    try {
      const { commentId, datasetId, previousLabel, wasNewLabel } = lastSaved;

      if (previousLabel) {
        // Restore previous label
        await updateCommentLabel(commentId, previousLabel, userIdRef.current!);
      } else {
        // Clear the label
        await clearCommentLabel(commentId);
      }

      // Update dataset count if this was a new label
      if (wasNewLabel) {
        await updateDatasetLabeledCount(datasetId, -1);
      }

      setLastSaved(null);
    } catch (error) {
      console.error('Failed to undo label:', error);
    } finally {
      setIsSaving(false);
    }
  }, [lastSaved]);

  /**
   * Cancel any pending save (e.g., when navigating away)
   */
  const cancelPending = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
    setIsSaving(false);
    setShowUndo(false);
    pendingRef.current = null;
  }, []);

  return {
    saveLabel,
    undoLabel,
    cancelPending,
    isSaving,
    showUndo,
    lastSaved,
  };
}

export default useAutoSave;
