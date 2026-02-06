'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SentimentLabel } from '@/types';

interface ValidationButtonsProps {
  llmLabel: SentimentLabel;
  currentLabel: SentimentLabel | null;
  onAgree: () => void;
  onDisagree: (correctLabel: SentimentLabel) => void;
  disabled?: boolean;
}

const labelOptions: { value: SentimentLabel; label: string; icon: React.ReactNode; color: string }[] = [
  {
    value: 'positive',
    label: 'Positive',
    icon: <ThumbsUp className="h-5 w-5" />,
    color: 'bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500/30',
  },
  {
    value: 'negative',
    label: 'Negative',
    icon: <ThumbsDown className="h-5 w-5" />,
    color: 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30',
  },
  {
    value: 'neutral',
    label: 'Neutral',
    icon: <Minus className="h-5 w-5" />,
    color: 'bg-amber-500/20 border-amber-500/50 text-amber-400 hover:bg-amber-500/30',
  },
];

export function ValidationButtons({
  llmLabel,
  currentLabel,
  onAgree,
  onDisagree,
  disabled,
}: ValidationButtonsProps) {
  const [showCorrection, setShowCorrection] = useState(false);
  const alreadyValidated = currentLabel !== null;
  const agreedWithLlm = currentLabel === llmLabel;

  const handleDisagreeClick = () => {
    setShowCorrection(true);
  };

  const handleCorrectionSelect = (label: SentimentLabel) => {
    onDisagree(label);
    setShowCorrection(false);
  };

  const handleAgreeClick = () => {
    onAgree();
    setShowCorrection(false);
  };

  return (
    <div className="space-y-4">
      {/* Main Agree/Disagree buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <motion.button
          onClick={handleAgreeClick}
          disabled={disabled}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'flex items-center gap-3 rounded-xl border-2 px-8 py-4 transition-all duration-200',
            'disabled:cursor-not-allowed disabled:opacity-50',
            alreadyValidated && agreedWithLlm
              ? 'border-green-500 bg-green-500/20 text-green-400 ring-2 ring-green-500/50'
              : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-green-500/50 hover:bg-green-500/10 hover:text-green-400'
          )}
        >
          <Check className="h-6 w-6" />
          <span className="font-semibold text-lg">Agree</span>
        </motion.button>

        <motion.button
          onClick={handleDisagreeClick}
          disabled={disabled}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'flex items-center gap-3 rounded-xl border-2 px-8 py-4 transition-all duration-200',
            'disabled:cursor-not-allowed disabled:opacity-50',
            alreadyValidated && !agreedWithLlm
              ? 'border-red-500 bg-red-500/20 text-red-400 ring-2 ring-red-500/50'
              : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400'
          )}
        >
          <X className="h-6 w-6" />
          <span className="font-semibold text-lg">Disagree</span>
        </motion.button>
      </div>

      {/* Correction options (shown when Disagree is clicked) */}
      <AnimatePresence>
        {showCorrection && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 border-t border-zinc-800">
              <p className="text-center text-sm text-zinc-500 mb-4">
                Select the correct label:
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {labelOptions
                  .filter(opt => opt.value !== llmLabel) // Don't show LLM's label as correction option
                  .map((option) => (
                    <motion.button
                      key={option.value}
                      onClick={() => handleCorrectionSelect(option.value)}
                      disabled={disabled}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        'flex items-center gap-2 rounded-xl border-2 px-6 py-3 transition-all duration-200',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        option.color
                      )}
                    >
                      {option.icon}
                      <span className="font-medium">{option.label}</span>
                    </motion.button>
                  ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ValidationButtons;
