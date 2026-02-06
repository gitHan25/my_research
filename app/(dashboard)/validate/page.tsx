'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, ChevronLeft, ChevronRight, LayoutGrid, Table2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ValidationCard, ValidationButtons, ValidationTableView } from '@/components/validation';
import { useAuthContext } from '@/providers';
import { useDatasets, useAnnotations } from '@/lib/hooks';
import { getCommentsPaginated } from '@/lib/firebase/db';
import { CommentWithUserLabel, SentimentLabel, Comment, Dataset } from '@/types';
import { toast } from 'sonner';

type ViewMode = 'card' | 'table';

export default function ValidatePage() {
  const { user } = useAuthContext();
  const { datasets, isLoading: datasetsLoading } = useDatasets();

  // State
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [comments, setComments] = useState<(Comment & { llmLabel?: SentimentLabel })[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Get annotations hook for saving validations
  const {
    annotations,
    saveAnnotation,
    isSaving,
    isLoading: annotationsLoading,
  } = useAnnotations({
    datasetId: selectedDatasetId || '',
    userId: user?.id || '',
    userEmail: user?.email || '',
  });

  // Filter datasets that have LLM labels
  const validatableDatasets = useMemo(() => {
    return datasets;
  }, [datasets]);

  // Auto-select first dataset
  useEffect(() => {
    if (validatableDatasets.length > 0 && !selectedDatasetId) {
      setSelectedDatasetId(validatableDatasets[0].id);
    }
  }, [validatableDatasets, selectedDatasetId]);

  // Load comments when dataset changes
  useEffect(() => {
    if (!selectedDatasetId) return;

    const loadComments = async () => {
      setIsLoading(true);
      try {
        const result = await getCommentsPaginated(selectedDatasetId, 500);
        setComments(result.data as (Comment & { llmLabel?: SentimentLabel })[]);
        setCurrentIndex(0);
        setCurrentPage(1);
      } catch (error) {
        console.error('Error loading comments:', error);
        toast.error('Failed to load comments');
      } finally {
        setIsLoading(false);
      }
    };

    loadComments();
  }, [selectedDatasetId]);

  // Merge comments with user annotations
  const commentsWithLabels: (CommentWithUserLabel & { llmLabel?: SentimentLabel })[] = useMemo(() => {
    return comments.map((comment) => {
      const annotation = annotations.get(comment.id);
      return {
        ...comment,
        userLabel: annotation?.label || null,
        userAnnotationId: annotation?.id || null,
      };
    });
  }, [comments, annotations]);

  // Filter comments that have LLM labels
  const llmLabeledComments = useMemo(() => {
    return commentsWithLabels.filter((c) => c.llmLabel);
  }, [commentsWithLabels]);

  // Calculate agreement stats
  const agreementStats = useMemo(() => {
    const validated = llmLabeledComments.filter((c) => c.userLabel !== null);
    const agreed = validated.filter((c) => c.userLabel === c.llmLabel);
    return {
      total: llmLabeledComments.length,
      validated: validated.length,
      agreed: agreed.length,
      agreementRate: validated.length > 0 ? (agreed.length / validated.length) * 100 : 0,
    };
  }, [llmLabeledComments]);

  // Current comment (for card view)
  const currentComment = llmLabeledComments[currentIndex];

  // Navigation (card view)
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < llmLabeledComments.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, llmLabeledComments.length]);

  // Handle agree (card view)
  const handleAgree = useCallback(async () => {
    if (!currentComment || !currentComment.llmLabel) return;

    try {
      await saveAnnotation(currentComment.id, currentComment.llmLabel, {
        isValidation: true,
        agreedWithLlm: true,
        originalLlmLabel: currentComment.llmLabel,
      });
      toast.success('Agreed with LLM label');
      
      if (currentIndex < llmLabeledComments.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Error saving validation:', error);
      toast.error('Failed to save validation');
    }
  }, [currentComment, saveAnnotation, currentIndex, llmLabeledComments.length]);

  // Handle disagree (card view)
  const handleDisagree = useCallback(async (correctLabel: SentimentLabel) => {
    if (!currentComment || !currentComment.llmLabel) return;

    try {
      await saveAnnotation(currentComment.id, correctLabel, {
        isValidation: true,
        agreedWithLlm: false,
        originalLlmLabel: currentComment.llmLabel,
      });
      toast.success(`Corrected to: ${correctLabel}`);
      
      if (currentIndex < llmLabeledComments.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Error saving validation:', error);
      toast.error('Failed to save validation');
    }
  }, [currentComment, saveAnnotation, currentIndex, llmLabeledComments.length]);

  // Handle agree (table view) - by commentId
  const handleAgreeTable = useCallback(async (commentId: string, llmLabel: SentimentLabel) => {
    try {
      await saveAnnotation(commentId, llmLabel, {
        isValidation: true,
        agreedWithLlm: true,
        originalLlmLabel: llmLabel,
      });
      toast.success('Agreed with LLM label');
    } catch (error) {
      console.error('Error saving validation:', error);
      toast.error('Failed to save validation');
    }
  }, [saveAnnotation]);

  // Handle disagree (table view) - by commentId
  const handleDisagreeTable = useCallback(async (commentId: string, correctLabel: SentimentLabel) => {
    const comment = llmLabeledComments.find(c => c.id === commentId);
    if (!comment?.llmLabel) return;

    try {
      await saveAnnotation(commentId, correctLabel, {
        isValidation: true,
        agreedWithLlm: false,
        originalLlmLabel: comment.llmLabel,
      });
      toast.success(`Corrected to: ${correctLabel}`);
    } catch (error) {
      console.error('Error saving validation:', error);
      toast.error('Failed to save validation');
    }
  }, [saveAnnotation, llmLabeledComments]);

  // Keyboard shortcuts (card view only)
  useEffect(() => {
    if (viewMode !== 'card') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          handlePrevious();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          handleNext();
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          handleAgree();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, handlePrevious, handleNext, handleAgree]);

  // Loading state
  if (datasetsLoading || isLoading || annotationsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  // No datasets with LLM labels
  if (llmLabeledComments.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="mb-6 rounded-full bg-amber-500/20 p-6">
          <Bot className="h-12 w-12 text-amber-500" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-100">No LLM Labels Found</h2>
        <p className="mt-2 max-w-md text-zinc-400">
          Upload a CSV file with an &apos;llm_label&apos; column to use the validation feature.
          This column should contain the LLM&apos;s predicted labels (positive, negative, neutral).
        </p>
        {user?.role === 'admin' && (
          <Link href="/admin/upload">
            <Button className="mt-6 bg-blue-600 hover:bg-blue-500">
              Upload Dataset with LLM Labels
            </Button>
          </Link>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Validate LLM Labels</h1>
          <p className="mt-1 text-zinc-400">
            Review and validate the LLM&apos;s predictions
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800/50 p-1">
            <button
              onClick={() => setViewMode('card')}
              className={`rounded px-3 py-1.5 text-sm transition-colors ${
                viewMode === 'card'
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`rounded px-3 py-1.5 text-sm transition-colors ${
                viewMode === 'table'
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Table2 className="h-4 w-4" />
            </button>
          </div>

          {/* Dataset selector */}
          <select
            value={selectedDatasetId || ''}
            onChange={(e) => setSelectedDatasetId(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-100"
          >
            {validatableDatasets.map((dataset: Dataset) => (
              <option key={dataset.id} value={dataset.id}>
                {dataset.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Card View */}
      {viewMode === 'card' && (
        <>
          {/* Agreement Stats */}
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-500/20 p-2">
                    <Bot className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Validation Progress</p>
                    <p className="text-lg font-semibold text-zinc-100">
                      {agreementStats.validated} / {agreementStats.total} validated
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-zinc-400">Agreement Rate</p>
                  <p className="text-2xl font-bold text-green-400">
                    {agreementStats.agreementRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-zinc-500">
                    {agreementStats.agreed} / {agreementStats.validated} agreed with LLM
                  </p>
                </div>
              </div>
              <Progress
                value={(agreementStats.validated / agreementStats.total) * 100}
                className="h-2 bg-zinc-800"
              />
            </CardContent>
          </Card>

          {/* Current Comment Card */}
          {currentComment && (
            <>
              <AnimatePresence mode="wait">
                <ValidationCard
                  key={currentComment.id}
                  comment={currentComment}
                  index={currentIndex}
                  total={llmLabeledComments.length}
                />
              </AnimatePresence>

              {/* Validation Buttons */}
              <div className="py-4">
                <ValidationButtons
                  llmLabel={currentComment.llmLabel!}
                  currentLabel={currentComment.userLabel}
                  onAgree={handleAgree}
                  onDisagree={handleDisagree}
                  disabled={isSaving}
                />
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="border-zinc-700 bg-zinc-800/50"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-zinc-500">
                  {currentIndex + 1} / {llmLabeledComments.length}
                </span>
                <Button
                  variant="outline"
                  onClick={handleNext}
                  disabled={currentIndex >= llmLabeledComments.length - 1}
                  className="border-zinc-700 bg-zinc-800/50"
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              {/* Keyboard Hints */}
              <div className="mt-6 text-center text-xs text-zinc-600">
                <span className="rounded bg-zinc-800 px-2 py-1 font-mono">Enter</span> Agree
                <span className="mx-4">|</span>
                <span className="rounded bg-zinc-800 px-2 py-1 font-mono">←</span>
                <span className="rounded bg-zinc-800 px-2 py-1 font-mono">→</span> Navigate
              </div>
            </>
          )}
        </>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <ValidationTableView
          comments={llmLabeledComments}
          agreementStats={agreementStats}
          isSaving={isSaving}
          isLoading={isLoading}
          currentPage={currentPage}
          pageSize={pageSize}
          onAgree={handleAgreeTable}
          onDisagree={handleDisagreeTable}
          onPageChange={setCurrentPage}
        />
      )}
    </motion.div>
  );
}
