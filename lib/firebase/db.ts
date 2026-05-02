/**
 * Firestore Database Service
 * 
 * Provides database operations for the CDSA Labeling Platform.
 * Handles CRUD operations for users, datasets, and comments.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  increment,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from './config';
import {
  User,
  Dataset,
  DatasetCreateData,
  Comment,
  CommentCreateData,
  SentimentLabel,
  PaginatedResponse,
  Annotation,
  AnnotationCreateData,
} from '@/types';

// ============================================
// Collection References
// ============================================

const COLLECTIONS = {
  USERS: 'users',
  DATASETS: 'datasets',
  COMMENTS: 'comments',
  ANNOTATIONS: 'annotations',
} as const;

// ============================================
// User Operations
// ============================================

/**
 * Get all users
 */
export async function getAllUsers(): Promise<User[]> {
  const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
  return usersSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as User[];
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
  if (!userDoc.exists()) return null;
  return { id: userDoc.id, ...userDoc.data() } as User;
}

// ============================================
// Dataset Operations
// ============================================

/**
 * Create a new dataset
 */
export async function createDataset(data: DatasetCreateData): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTIONS.DATASETS), {
    ...data,
    labeledCount: 0,
    status: 'active',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Get all datasets
 */
export async function getDatasets(): Promise<Dataset[]> {
  const datasetsSnapshot = await getDocs(
    query(collection(db, COLLECTIONS.DATASETS), orderBy('createdAt', 'desc'))
  );
  return datasetsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Dataset[];
}

/**
 * Get dataset by ID
 */
export async function getDatasetById(datasetId: string): Promise<Dataset | null> {
  const datasetDoc = await getDoc(doc(db, COLLECTIONS.DATASETS, datasetId));
  if (!datasetDoc.exists()) return null;
  return { id: datasetDoc.id, ...datasetDoc.data() } as Dataset;
}

/**
 * Update dataset labeled count
 */
export async function updateDatasetLabeledCount(
  datasetId: string,
  incrementBy: number = 1
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.DATASETS, datasetId), {
    labeledCount: increment(incrementBy),
  });
}

/**
 * Update dataset status
 */
export async function updateDatasetStatus(
  datasetId: string,
  status: 'active' | 'completed'
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.DATASETS, datasetId), {
    status,
  });
}

/**
 * Delete dataset, all its comments, and all annotations
 */
export async function deleteDataset(datasetId: string): Promise<void> {
  // Delete all comments in the dataset
  const commentsQuery = query(
    collection(db, COLLECTIONS.COMMENTS),
    where('datasetId', '==', datasetId)
  );
  const commentsSnapshot = await getDocs(commentsQuery);
  
  // Delete all annotations for this dataset
  const annotationsQuery = query(
    collection(db, COLLECTIONS.ANNOTATIONS),
    where('datasetId', '==', datasetId)
  );
  const annotationsSnapshot = await getDocs(annotationsQuery);
  
  // Use multiple batches if needed (max 500 operations per batch)
  const BATCH_SIZE = 500;
  const allDocs = [...commentsSnapshot.docs, ...annotationsSnapshot.docs];
  
  for (let i = 0; i < allDocs.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = allDocs.slice(i, i + BATCH_SIZE);
    chunk.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  }
  
  // Delete the dataset itself
  await deleteDoc(doc(db, COLLECTIONS.DATASETS, datasetId));
}

/**
 * Update dataset metadata (name, description)
 */
export async function updateDataset(
  datasetId: string,
  data: { name?: string; description?: string }
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.DATASETS, datasetId), data);
}

/**
 * Count the actual comments in Firestore for a dataset and update totalComments.
 * Use this to repair a dataset whose totalComments was saved incorrectly on upload.
 */
export async function syncDatasetCommentCount(datasetId: string): Promise<number> {
  const q = query(
    collection(db, COLLECTIONS.COMMENTS),
    where('datasetId', '==', datasetId)
  );
  const snapshot = await getDocs(q);
  const actualCount = snapshot.size;
  await updateDoc(doc(db, COLLECTIONS.DATASETS, datasetId), {
    totalComments: actualCount,
  });
  return actualCount;
}

// ============================================
// Comment Operations
// ============================================

/**
 * Add comments from CSV (batch operation)
 */
export async function addCommentsFromCSV(
  datasetId: string,
  comments: CommentCreateData[]
): Promise<void> {
  // Firestore batch limit is 500, so we need to chunk
  const BATCH_SIZE = 500;
  
  for (let i = 0; i < comments.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = comments.slice(i, i + BATCH_SIZE);
    
    chunk.forEach((comment) => {
      const docRef = doc(collection(db, COLLECTIONS.COMMENTS));
      batch.set(docRef, {
        ...comment,
        label: null,
        labeledBy: null,
        labeledAt: null,
        createdAt: serverTimestamp(),
      });
    });
    
    await batch.commit();
  }
}

/**
 * Get comments with pagination using index-based page offsets.
 * Uses where('index', '>=', startIndex) instead of cursor snapshots to avoid
 * the null-cursor restart bug that occurred when a page returned 0 results.
 */
export async function getCommentsPaginated(
  datasetId: string,
  pageSize: number = 20,
  pageNumber: number = 1
): Promise<PaginatedResponse<Comment>> {
  const startIndex = (pageNumber - 1) * pageSize;

  const q = query(
    collection(db, COLLECTIONS.COMMENTS),
    where('datasetId', '==', datasetId),
    where('index', '>=', startIndex),
    orderBy('index', 'asc'),
    limit(pageSize + 1)
  );

  const snapshot = await getDocs(q);
  const docs = snapshot.docs;
  const hasMore = docs.length > pageSize;

  const data = (hasMore ? docs.slice(0, -1) : docs).map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Comment[];

  return {
    data,
    hasMore,
    lastDoc: null,
    total: data.length,
  };
}

/**
 * Get comment by index in dataset
 */
export async function getCommentByIndex(
  datasetId: string,
  index: number
): Promise<Comment | null> {
  const q = query(
    collection(db, COLLECTIONS.COMMENTS),
    where('datasetId', '==', datasetId),
    where('index', '==', index),
    limit(1)
  );
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Comment;
}

/**
 * Get comment by ID
 */
export async function getCommentById(commentId: string): Promise<Comment | null> {
  const commentDoc = await getDoc(doc(db, COLLECTIONS.COMMENTS, commentId));
  if (!commentDoc.exists()) return null;
  return { id: commentDoc.id, ...commentDoc.data() } as Comment;
}

/**
 * Update comment label
 */
export async function updateCommentLabel(
  commentId: string,
  label: SentimentLabel,
  userId: string
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.COMMENTS, commentId), {
    label,
    labeledBy: userId,
    labeledAt: serverTimestamp(),
  });
}

/**
 * Clear comment label (for undo)
 */
export async function clearCommentLabel(commentId: string): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.COMMENTS, commentId), {
    label: null,
    labeledBy: null,
    labeledAt: null,
  });
}

/**
 * Get unlabeled comments count
 */
export async function getUnlabeledCount(datasetId: string): Promise<number> {
  const q = query(
    collection(db, COLLECTIONS.COMMENTS),
    where('datasetId', '==', datasetId),
    where('label', '==', null)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.size;
}

/**
 * Get all comments for export (no pagination)
 */
export async function getAllCommentsForExport(
  datasetId: string,
  labeledOnly: boolean = false
): Promise<Comment[]> {
  let q = query(
    collection(db, COLLECTIONS.COMMENTS),
    where('datasetId', '==', datasetId),
    orderBy('index', 'asc')
  );
  
  if (labeledOnly) {
    q = query(q, where('label', '!=', null));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Comment[];
}

/**
 * Get labeling progress stats
 */
export async function getProgressStats(datasetId: string): Promise<{
  total: number;
  labeled: number;
  remaining: number;
  percentage: number;
}> {
  const dataset = await getDatasetById(datasetId);
  if (!dataset) {
    return { total: 0, labeled: 0, remaining: 0, percentage: 0 };
  }
  
  const total = dataset.totalComments;
  const labeled = dataset.labeledCount;
  const remaining = total - labeled;
  const percentage = total > 0 ? Math.round((labeled / total) * 100) : 0;
  
  return { total, labeled, remaining, percentage };
}

// ============================================
// Annotation Operations (Multi-Annotator)
// ============================================

/**
 * Create or update an annotation for a comment by a user.
 * Each user can have only one annotation per comment.
 */
export async function upsertAnnotation(
  data: AnnotationCreateData
): Promise<string> {
  // Check if annotation already exists for this user + comment
  const existingQuery = query(
    collection(db, COLLECTIONS.ANNOTATIONS),
    where('commentId', '==', data.commentId),
    where('userId', '==', data.userId),
    limit(1)
  );
  
  const existingSnapshot = await getDocs(existingQuery);
  
  if (!existingSnapshot.empty) {
    // Update existing annotation
    const existingDoc = existingSnapshot.docs[0];
    await updateDoc(existingDoc.ref, {
      label: data.label,
      updatedAt: serverTimestamp(),
    });
    return existingDoc.id;
  } else {
    // Create new annotation
    const docRef = await addDoc(collection(db, COLLECTIONS.ANNOTATIONS), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }
}

/**
 * Get all annotations by a specific user for a dataset.
 * Returns a Map keyed by commentId for easy lookup.
 */
export async function getUserAnnotations(
  datasetId: string,
  userId: string
): Promise<Map<string, Annotation>> {
  const q = query(
    collection(db, COLLECTIONS.ANNOTATIONS),
    where('datasetId', '==', datasetId),
    where('userId', '==', userId)
  );
  
  const snapshot = await getDocs(q);
  const annotationsMap = new Map<string, Annotation>();
  
  snapshot.docs.forEach((doc) => {
    const annotation = { id: doc.id, ...doc.data() } as Annotation;
    annotationsMap.set(annotation.commentId, annotation);
  });
  
  return annotationsMap;
}

/**
 * Get user's labeling progress for a dataset.
 */
export async function getUserProgress(
  datasetId: string,
  userId: string
): Promise<{ labeled: number; total: number; percentage: number }> {
  const dataset = await getDatasetById(datasetId);
  if (!dataset) {
    return { labeled: 0, total: 0, percentage: 0 };
  }
  
  const annotations = await getUserAnnotations(datasetId, userId);
  const labeled = annotations.size;
  const total = dataset.totalComments;
  const percentage = total > 0 ? Math.round((labeled / total) * 100) : 0;
  
  return { labeled, total, percentage };
}

/**
 * Get all annotations for a dataset (admin use).
 */
export async function getAllAnnotationsForDataset(
  datasetId: string
): Promise<Annotation[]> {
  const q = query(
    collection(db, COLLECTIONS.ANNOTATIONS),
    where('datasetId', '==', datasetId)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Annotation[];
}

/**
 * Get annotations grouped by user for admin progress view.
 */
export async function getAnnotationsByUser(
  datasetId: string
): Promise<Map<string, { userId: string; userEmail: string; count: number }>> {
  const annotations = await getAllAnnotationsForDataset(datasetId);
  const userStats = new Map<string, { userId: string; userEmail: string; count: number }>();
  
  annotations.forEach((annotation) => {
    const existing = userStats.get(annotation.userId);
    if (existing) {
      existing.count++;
    } else {
      userStats.set(annotation.userId, {
        userId: annotation.userId,
        userEmail: annotation.userEmail,
        count: 1,
      });
    }
  });
  
  return userStats;
}

/**
 * Delete an annotation (for undo functionality).
 */
export async function deleteAnnotation(annotationId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.ANNOTATIONS, annotationId));
}

/**
 * Get annotations for export - either for a specific user or all.
 */
export async function getAnnotationsForExport(
  datasetId: string,
  userId?: string
): Promise<Annotation[]> {
  let q = query(
    collection(db, COLLECTIONS.ANNOTATIONS),
    where('datasetId', '==', datasetId)
  );
  
  if (userId) {
    q = query(q, where('userId', '==', userId));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Annotation[];
}

