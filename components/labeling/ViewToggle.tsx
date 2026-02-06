'use client';

import { motion } from 'framer-motion';
import { LayoutGrid, Table } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'card' | 'table';

interface ViewToggleProps {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export function ViewToggle({ mode, onModeChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-zinc-900 p-1">
      <ToggleButton
        icon={<LayoutGrid className="h-4 w-4" />}
        label="Card"
        isActive={mode === 'card'}
        onClick={() => onModeChange('card')}
      />
      <ToggleButton
        icon={<Table className="h-4 w-4" />}
        label="Table"
        isActive={mode === 'table'}
        onClick={() => onModeChange('table')}
      />
    </div>
  );
}

interface ToggleButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function ToggleButton({ icon, label, isActive, onClick }: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        isActive ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
      )}
    >
      {isActive && (
        <motion.div
          layoutId="viewToggle"
          className="absolute inset-0 rounded-md bg-zinc-800"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
        />
      )}
      <span className="relative z-10">{icon}</span>
      <span className="relative z-10">{label}</span>
    </button>
  );
}

export default ViewToggle;
