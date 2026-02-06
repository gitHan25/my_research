'use client';

import { ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavigationButtonsProps {
  onPrevious: () => void;
  onNext: () => void;
  onSkip: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  isLast: boolean;
}

export function NavigationButtons({
  onPrevious,
  onNext,
  onSkip,
  hasPrevious,
  hasNext,
  isLast,
}: NavigationButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      <Button
        variant="outline"
        size="lg"
        onClick={onPrevious}
        disabled={!hasPrevious}
        className="border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-50"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Previous
        <span className="ml-2 rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-zinc-500">←</span>
      </Button>

      <Button
        variant="outline"
        size="lg"
        onClick={onSkip}
        disabled={!hasNext && isLast}
        className="border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-50"
      >
        <SkipForward className="mr-1 h-4 w-4" />
        Skip
        <span className="ml-2 rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-zinc-500">S</span>
      </Button>

      <Button
        variant="outline"
        size="lg"
        onClick={onNext}
        disabled={!hasNext}
        className="border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-50"
      >
        Next
        <ChevronRight className="ml-1 h-4 w-4" />
        <span className="ml-2 rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-zinc-500">→</span>
      </Button>
    </div>
  );
}

export default NavigationButtons;
