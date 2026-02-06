'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface LabelingProgressProps {
  current: number;
  total: number;
  labeled: number;
  isSaving?: boolean;
}

export function LabelingProgress({ current, total, labeled, isSaving }: LabelingProgressProps) {
  const percentage = total > 0 ? Math.round((labeled / total) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="flex items-center gap-4">
        <Progress value={percentage} className="h-2 flex-1 bg-zinc-800" />
        <span className="min-w-[4rem] text-right font-mono text-sm text-zinc-400">
          {percentage}%
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>{labeled.toLocaleString()} labeled</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Clock className="h-4 w-4" />
            <span>{(total - labeled).toLocaleString()} remaining</span>
          </div>
        </div>

        {/* Saving indicator */}
        {isSaving && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex items-center gap-2 text-blue-400"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Saving...</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default LabelingProgress;
