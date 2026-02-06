/**
 * TypeScript Type Definitions
 * 
 * This file contains all the type definitions for the CDSA Labeling Platform.
 * Based on the Firestore database schema defined in prd.md
 */

import { Timestamp } from 'firebase/firestore';

// ============================================
// User Types
// ============================================

export type UserRole = 'admin' | 'labeler';
export type UserStatus = 'pending' | 'active' | 'rejected';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
}

export interface UserCreateData {
  email: string;
  displayName: string;
  role: UserRole;
  status?: UserStatus;
}

// ============================================
// Dataset Types
// ============================================

export type DatasetStatus = 'active' | 'completed';

export interface Dataset {
  id: string;
  name: string;
  fileName: string;
  totalComments: number;
  labeledCount: number;
  createdBy: string;
  createdAt: Timestamp;
  status: DatasetStatus;
}

export interface DatasetCreateData {
  name: string;
  fileName: string;
  totalComments: number;
  createdBy: string;
}

// ============================================
// Comment Types
// ============================================

export type SentimentLabel = 'positive' | 'negative' | 'neutral';

export interface Comment {
  id: string;
  datasetId: string;
  index: number;
  text: string;
  videoId?: string;
  videoTitle?: string;
  channelName?: string;
  originalLikes?: number;
  llmLabel?: SentimentLabel;  // LLM-generated label for validation
  label: SentimentLabel | null;
  labeledBy: string | null;
  labeledAt: Timestamp | null;
  createdAt: Timestamp;
}

export interface CommentCreateData {
  datasetId: string;
  index: number;
  text: string;
  videoId?: string;
  videoTitle?: string;
  channelName?: string;
  originalLikes?: number;
  llmLabel?: SentimentLabel;  // LLM-generated label for validation
}

export interface CommentUpdateData {
  label: SentimentLabel;
  labeledBy: string;
  labeledAt: Timestamp;
}

// ============================================
// Annotation Types (Multi-Annotator Support)
// ============================================

/**
 * Represents a single labeler's annotation for a comment.
 * Each labeler has their own annotation per comment.
 */
export interface Annotation {
  id: string;
  commentId: string;
  datasetId: string;
  userId: string;
  userEmail: string;
  label: SentimentLabel;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Validation tracking (for LLM validation workflow)
  isValidation?: boolean;        // True if this is a validation vs manual label
  agreedWithLlm?: boolean;       // True if user agreed with LLM's label
  originalLlmLabel?: SentimentLabel; // LLM's original label before correction
}

export interface AnnotationCreateData {
  commentId: string;
  datasetId: string;
  userId: string;
  userEmail: string;
  label: SentimentLabel;
}

/**
 * Comment with the current user's annotation merged in for UI display.
 * Used in labeling views to show the user's own label.
 */
export interface CommentWithUserLabel extends Comment {
  userLabel: SentimentLabel | null;
  userAnnotationId: string | null;
}

// ============================================
// CSV Import Types
// ============================================

export interface CSVRow {
  text: string;
  video_id?: string;
  video_title?: string;
  channel_name?: string;
  likes?: string | number;
}

export interface CSVParseResult {
  data: CSVRow[];
  errors: string[];
  totalRows: number;
}

// ============================================
// UI State Types
// ============================================

export type LabelingView = 'card' | 'table';

export interface LabelingState {
  currentIndex: number;
  view: LabelingView;
  isLoading: boolean;
  isSaving: boolean;
}

export interface ProgressStats {
  total: number;
  labeled: number;
  remaining: number;
  percentage: number;
}

// ============================================
// Auth Types
// ============================================

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  lastDoc: unknown;
  total: number;
}
