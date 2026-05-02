'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ViewToggle, ViewMode, CardView, TableView, CardViewSkeleton, TableViewSkeleton, ErrorState } from '@/components/labeling';
import { useAuthContext } from '@/providers';
import { useKeyboardShortcuts, useAnnotations } from '@/lib/hooks';
import { getCommentsPaginated, getDatasets } from '@/lib/firebase/db';
import { Comment, Dataset, SentimentLabel, CommentWithUserLabel } from '@/types';
import { toast } from 'sonner';
import Link from 'next/link';

const PAGE_SIZE = 20;

export default function LabelingPage() {
  const { user } = useAuthContext();
  
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [comments, setComments] = useState<Comment[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [totalComments, setTotalComments] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Cache for paginated data - stores comments by page number
  const pageCache = useRef<Map<number, Comment[]>>(new Map());
  
  // Multi-annotator hook - each user has their own annotations
  const {
    annotations,
    progress,
    isSaving,
    showUndo,
    lastSaved,
    saveAnnotation,
    undoAnnotation,
    getAnnotationForComment,
  } = useAnnotations({
    datasetId: selectedDataset?.id || '',
    userId: user?.id || '',
    userEmail: user?.email || '',
  });

  // Merge comments with user's annotations for display
  const commentsWithLabels: CommentWithUserLabel[] = useMemo(() => {
    return comments.map((comment) => {
      const annotation = annotations.get(comment.id);
      return {
        ...comment,
        userLabel: annotation?.label ?? null,
        userAnnotationId: annotation?.id ?? null,
      };
    });
  }, [comments, annotations]);

  // Load datasets on mount
  useEffect(() => {
    const loadDatasets = async () => {
      try {
        const data = await getDatasets();
        setDatasets(data);
        if (data.length > 0) {
          setSelectedDataset(data[0]);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading datasets:', error);
        toast.error('Failed to load datasets');
        setError('Failed to load datasets. Please check your connection.');
        setIsLoading(false);
      }
    };
    loadDatasets();
  }, []);

  // Reset cache when dataset changes
  useEffect(() => {
    if (selectedDataset) {
      pageCache.current.clear();
      setCurrentPage(1);
      setCurrentIndex(0);
      setError(null);
    }
  }, [selectedDataset?.id]);

  // Load comments for the current page using index-based pagination
  const loadComments = useCallback(async () => {
    if (!selectedDataset) return;

    const cached = pageCache.current.get(currentPage);
    if (cached) {
      setComments(cached);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await getCommentsPaginated(selectedDataset.id, PAGE_SIZE, currentPage);

      pageCache.current.set(currentPage, result.data);
      setComments(result.data);
      setTotalComments(selectedDataset.totalComments);

      if (viewMode === 'card') {
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments');
      setError('Failed to load comments. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDataset, currentPage, viewMode]);

  // Trigger load when dependencies change
  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Handle label selection - now uses per-user annotations
  const handleLabelSelect = useCallback((label: SentimentLabel) => {
    if (!user || !selectedDataset || commentsWithLabels.length === 0) return;
    
    const comment = commentsWithLabels[currentIndex];
    if (!comment) return;

    // Save annotation for this user
    saveAnnotation(comment.id, label);
  }, [commentsWithLabels, currentIndex, user, selectedDataset, saveAnnotation]);

  // Handle label change in table view
  const handleTableLabelChange = useCallback((commentId: string, label: SentimentLabel) => {
    if (!user || !selectedDataset) return;
    
    // Save annotation for this user
    saveAnnotation(commentId, label);
  }, [user, selectedDataset, saveAnnotation]);

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(commentsWithLabels.length - 1, prev + 1));
  }, [commentsWithLabels.length]);

  const handleSkip = useCallback(() => {
    handleNext();
  }, [handleNext]);

  // Undo handler
  const handleUndo = useCallback(async () => {
    await undoAnnotation();
  }, [undoAnnotation]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onLabelPositive: () => handleLabelSelect('positive'),
    onLabelNegative: () => handleLabelSelect('negative'),
    onLabelNeutral: () => handleLabelSelect('neutral'),
    onPrevious: handlePrevious,
    onNext: handleNext,
    onSkip: handleSkip,
    onUndo: handleUndo,
  }, { enabled: viewMode === 'card' && !isLoading });

  // Show undo toast
  useEffect(() => {
    if (showUndo && lastSaved) {
      toast('Label saved', {
        description: `Marked as ${lastSaved.label}`,
        action: {
          label: 'Undo',
          onClick: handleUndo,
        },
        duration: 5000,
      });
    }
  }, [showUndo, lastSaved, handleUndo]);

  // Error state
  if (error) {
    return (
      <ErrorState 
        title="Something went wrong"
        description={error}
        onRetry={loadComments}
      />
    );
  }

  // Initial loading state (only for datasets)
  if (isLoading && datasets.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  // No datasets state
  if (datasets.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="mb-6 rounded-full bg-zinc-800 p-6">
          <FileText className="h-12 w-12 text-zinc-500" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-100">No Datasets Available</h2>
        <p className="mt-2 max-w-md text-zinc-400">
          There are no datasets to label yet. Ask your admin to upload a CSV file.
        </p>
        {user?.role === 'admin' && (
          <Link href="/admin/upload">
            <Button className="mt-6 bg-blue-600 hover:bg-blue-500">
              Upload Dataset
            </Button>
          </Link>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Labeling</h1>
          <p className="mt-1 text-zinc-400">
            {selectedDataset?.name || 'Select a dataset'}
          </p>
        </div>
        
        <ViewToggle mode={viewMode} onModeChange={setViewMode} />
      </div>

      {/* Dataset selector if multiple datasets */}
      {datasets.length > 1 && (
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="flex flex-wrap items-center gap-2 p-4">
            <span className="text-sm text-zinc-400">Dataset:</span>
            {datasets.map((ds) => (
              <Button
                key={ds.id}
                variant={selectedDataset?.id === ds.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDataset(ds)}
                className={
                  selectedDataset?.id === ds.id
                    ? 'bg-blue-600 hover:bg-blue-500'
                    : 'border-zinc-700 bg-zinc-800/50'
                }
              >
                {ds.name}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Content based on view mode */}
      {viewMode === 'card' ? (
        isLoading && comments.length === 0 ? (
          <CardViewSkeleton />
        ) : commentsWithLabels.length === 0 && !isLoading ? (
          <ErrorState 
            type="empty"
            title="All Done!"
            description="You've labeled all comments in this dataset."
          />
        ) : (
          <CardView
            comments={commentsWithLabels}
            currentIndex={currentIndex}
            totalComments={totalComments}
            labeledCount={progress.labeled}
            isSaving={isSaving}
            onLabelSelect={handleLabelSelect}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onSkip={handleSkip}
          />
        )
      ) : (
        isLoading && comments.length === 0 ? (
          <TableViewSkeleton />
        ) : (
          <TableView
            comments={commentsWithLabels}
            totalComments={totalComments}
            labeledCount={progress.labeled}
            isSaving={isSaving}
            isLoading={isLoading}
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            onLabelChange={handleTableLabelChange}
            onPageChange={setCurrentPage}
          />
        )
      )}
    </motion.div>
  );
}
