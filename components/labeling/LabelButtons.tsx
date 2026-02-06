'use client';

import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SentimentLabel } from '@/types';

interface LabelButtonsProps {
  selectedLabel: SentimentLabel | null;
  onLabelSelect: (label: SentimentLabel) => void;
  disabled?: boolean;
}

const labels: { value: SentimentLabel; label: string; icon: React.ReactNode; color: string; shortcut: string }[] = [
  {
    value: 'positive',
    label: 'Positive',
    icon: <ThumbsUp className="h-5 w-5" />,
    color: 'bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500/30',
    shortcut: '1',
  },
  {
    value: 'negative',
    label: 'Negative',
    icon: <ThumbsDown className="h-5 w-5" />,
    color: 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30',
    shortcut: '2',
  },
  {
    value: 'neutral',
    label: 'Neutral',
    icon: <Minus className="h-5 w-5" />,
    color: 'bg-amber-500/20 border-amber-500/50 text-amber-400 hover:bg-amber-500/30',
    shortcut: '3',
  },
];

export function LabelButtons({ selectedLabel, onLabelSelect, disabled }: LabelButtonsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {labels.map((label) => {
        const isSelected = selectedLabel === label.value;
        
        return (
          <motion.button
            key={label.value}
            onClick={() => onLabelSelect(label.value)}
            disabled={disabled}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'relative flex items-center gap-3 rounded-xl border-2 px-6 py-4 transition-all duration-200',
              'disabled:cursor-not-allowed disabled:opacity-50',
              isSelected
                ? label.color + ' ring-2 ring-offset-2 ring-offset-zinc-950'
                : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800'
            )}
            style={{
              ['--ring-color' as string]: isSelected ? label.color.split(' ')[0].replace('bg-', '').replace('/20', '') : undefined,
            }}
          >
            {isSelected && (
              <motion.div
                layoutId="selectedLabel"
                className={cn('absolute inset-0 rounded-xl', label.color.split(' ')[0])}
                initial={false}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative z-10">{label.icon}</span>
            <span className="relative z-10 font-medium">{label.label}</span>
            <span className="relative z-10 ml-2 rounded bg-zinc-900/50 px-2 py-0.5 font-mono text-xs text-zinc-500">
              {label.shortcut}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

export default LabelButtons;
