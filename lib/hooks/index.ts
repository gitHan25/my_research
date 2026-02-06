/**
 * Hooks Index
 * 
 * Re-exports all custom hooks for easy importing.
 */

export { useAuth, default as useAuthDefault } from './useAuth';
export { useAutoSave, default as useAutoSaveDefault } from './useAutoSave';
export { useComments, default as useCommentsDefault } from './useComments';
export { useAnnotations, default as useAnnotationsDefault } from './useAnnotations';
export { useDatasets, default as useDatasetsDefault } from './useDatasets';
export {
  useKeyboardShortcuts,
  getLabelFromKey,
  KEYBOARD_SHORTCUTS,
  default as useKeyboardShortcutsDefault,
} from './useKeyboardShortcuts';

