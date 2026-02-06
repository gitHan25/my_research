'use client';

import { ThumbsUp, ThumbsDown, Minus, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SentimentLabel } from '@/types';
import { cn } from '@/lib/utils';

interface LabelDropdownProps {
  value: SentimentLabel | null;
  onChange: (label: SentimentLabel) => void;
  disabled?: boolean;
}

const labelOptions: { value: SentimentLabel; label: string; icon: React.ReactNode; color: string }[] = [
  {
    value: 'positive',
    label: 'Positive',
    icon: <ThumbsUp className="h-3.5 w-3.5" />,
    color: 'text-green-400',
  },
  {
    value: 'negative',
    label: 'Negative',
    icon: <ThumbsDown className="h-3.5 w-3.5" />,
    color: 'text-red-400',
  },
  {
    value: 'neutral',
    label: 'Neutral',
    icon: <Minus className="h-3.5 w-3.5" />,
    color: 'text-amber-400',
  },
];

export function LabelDropdown({ value, onChange, disabled }: LabelDropdownProps) {
  const selectedOption = value ? labelOptions.find((opt) => opt.value === value) : null;

  return (
    <Select
      value={value || undefined}
      onValueChange={(val) => onChange(val as SentimentLabel)}
      disabled={disabled}
    >
      <SelectTrigger
        className={cn(
          'w-[130px] border-zinc-700 bg-zinc-800/50',
          selectedOption?.color || 'text-zinc-500'
        )}
      >
        <SelectValue placeholder="Select...">
          {selectedOption && (
            <div className="flex items-center gap-2">
              {selectedOption.icon}
              <span>{selectedOption.label}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="border-zinc-700 bg-zinc-900">
        {labelOptions.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className={cn('cursor-pointer', option.color)}
          >
            <div className="flex items-center gap-2">
              {option.icon}
              <span>{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default LabelDropdown;
