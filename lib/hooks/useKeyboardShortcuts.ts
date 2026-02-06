/**
 * Keyboard Shortcuts Hook
 * 
 * Provides keyboard shortcut handling for the labeling interface.
 * Supports number keys for labels, arrow keys for navigation.
 */

'use client';

import { useEffect, useCallback } from 'react';
import { SentimentLabel } from '@/types';

interface KeyboardShortcutHandlers {
  onLabelPositive?: () => void;
  onLabelNegative?: () => void;
  onLabelNeutral?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onSkip?: () => void;
  onUndo?: () => void;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
}

/**
 * Keyboard shortcut mappings:
 * - 1: Label as Positive
 * - 2: Label as Negative
 * - 3: Label as Neutral
 * - ArrowLeft: Previous comment
 * - ArrowRight: Next comment
 * - S: Skip comment
 * - Z or Ctrl+Z: Undo last label
 */
export function useKeyboardShortcuts(
  handlers: KeyboardShortcutHandlers,
  options: UseKeyboardShortcutsOptions = {}
): void {
  const { enabled = true } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    // Handle shortcuts
    switch (event.key) {
      case '1':
        event.preventDefault();
        handlers.onLabelPositive?.();
        break;
        
      case '2':
        event.preventDefault();
        handlers.onLabelNegative?.();
        break;
        
      case '3':
        event.preventDefault();
        handlers.onLabelNeutral?.();
        break;
        
      case 'ArrowLeft':
        event.preventDefault();
        handlers.onPrevious?.();
        break;
        
      case 'ArrowRight':
        event.preventDefault();
        handlers.onNext?.();
        break;
        
      case 's':
      case 'S':
        event.preventDefault();
        handlers.onSkip?.();
        break;
        
      case 'z':
      case 'Z':
        // Support both 'z' and 'Ctrl+Z' for undo
        if (event.ctrlKey || event.metaKey || !event.ctrlKey) {
          event.preventDefault();
          handlers.onUndo?.();
        }
        break;
        
      default:
        break;
    }
  }, [handlers]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}

/**
 * Get label from keyboard key
 */
export function getLabelFromKey(key: string): SentimentLabel | null {
  switch (key) {
    case '1':
      return 'positive';
    case '2':
      return 'negative';
    case '3':
      return 'neutral';
    default:
      return null;
  }
}

/**
 * Keyboard shortcuts reference for display
 */
export const KEYBOARD_SHORTCUTS = [
  { key: '1', action: 'Label as Positive', category: 'labeling' },
  { key: '2', action: 'Label as Negative', category: 'labeling' },
  { key: '3', action: 'Label as Neutral', category: 'labeling' },
  { key: '←', action: 'Previous comment', category: 'navigation' },
  { key: '→', action: 'Next comment', category: 'navigation' },
  { key: 'S', action: 'Skip comment', category: 'navigation' },
  { key: 'Z', action: 'Undo last label', category: 'action' },
] as const;

export default useKeyboardShortcuts;
