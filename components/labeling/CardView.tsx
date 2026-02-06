'use client';

import { AnimatePresence } from 'framer-motion';
import { CommentCard } from './CommentCard';
import { LabelButtons } from './LabelButtons';
import { NavigationButtons } from './NavigationButtons';
import { LabelingProgress } from './LabelingProgress';
import { KeyboardHints } from './KeyboardHints';
import { CommentWithUserLabel, SentimentLabel } from '@/types';

interface CardViewProps {
  comments: CommentWithUserLabel[];
  currentIndex: number;
  totalComments: number;
  labeledCount: number;
  isSaving: boolean;
  onLabelSelect: (label: SentimentLabel) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSkip: () => void;
}

export function CardView({
  comments,
  currentIndex,
  totalComments,
  labeledCount,
  isSaving,
  onLabelSelect,
  onPrevious,
  onNext,
  onSkip,
}: CardViewProps) {
  const currentComment = comments[currentIndex];

  if (!currentComment) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 rounded-full bg-zinc-800 p-6">
          <span className="text-4xl">🎉</span>
        </div>
        <h3 className="text-xl font-semibold text-zinc-100">All Done!</h3>
        <p className="mt-2 text-zinc-400">
          You&apos;ve labeled all comments in this dataset.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <LabelingProgress
        current={currentIndex}
        total={totalComments}
        labeled={labeledCount}
        isSaving={isSaving}
      />

      {/* Comment Card */}
      <AnimatePresence mode="wait">
        <CommentCard
          key={currentComment.id}
          comment={currentComment}
          index={currentIndex}
          total={totalComments}
        />
      </AnimatePresence>

      {/* Label Buttons */}
      <div className="py-4">
        <LabelButtons
          selectedLabel={currentComment.userLabel}
          onLabelSelect={onLabelSelect}
          disabled={isSaving}
        />
      </div>

      {/* Navigation */}
      <NavigationButtons
        onPrevious={onPrevious}
        onNext={onNext}
        onSkip={onSkip}
        hasPrevious={currentIndex > 0}
        hasNext={currentIndex < comments.length - 1}
        isLast={currentIndex === totalComments - 1}
      />

      {/* Keyboard Hints */}
      <div className="mt-8">
        <KeyboardHints />
      </div>
    </div>
  );
}

export default CardView;
