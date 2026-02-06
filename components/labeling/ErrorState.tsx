'use client';

import { FileX, AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  type?: 'empty' | 'error';
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'Failed to load data. Please try again.',
  onRetry,
  type = 'error',
}: ErrorStateProps) {
  const Icon = type === 'empty' ? FileX : AlertTriangle;
  const colorClass = type === 'empty' ? 'text-zinc-500 bg-zinc-800' : 'text-amber-500 bg-amber-500/10';

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className={`mb-6 rounded-full p-6 ${colorClass}`}>
        <Icon className={`h-12 w-12 ${type === 'error' ? 'text-amber-500' : 'text-zinc-500'}`} />
      </div>
      <h2 className="text-xl font-semibold text-zinc-100">{title}</h2>
      <p className="mt-2 max-w-md text-zinc-400">
        {description}
      </p>
      {onRetry && (
        <Button 
          variant={type === 'empty' ? 'default' : 'outline'}
          className="mt-6 gap-2"
          onClick={onRetry}
        >
          {type === 'error' && <RefreshCcw className="h-4 w-4" />}
          {type === 'empty' ? 'Upload Dataset' : 'Try Again'}
        </Button>
      )}
    </div>
  );
}
