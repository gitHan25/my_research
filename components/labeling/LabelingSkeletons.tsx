'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function CardViewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Progress Bar Skeleton */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24 bg-zinc-800" />
          <Skeleton className="h-4 w-12 bg-zinc-800" />
        </div>
        <Skeleton className="h-2 w-full bg-zinc-800" />
      </div>

      {/* Comment Card Skeleton */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full bg-zinc-800" />
              <Skeleton className="h-4 w-32 bg-zinc-800" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full bg-zinc-800" />
          </div>

          <div className="mb-6 h-32 rounded-lg bg-zinc-800/50 p-4" />

          <div className="flex gap-4">
            <Skeleton className="h-4 w-24 bg-zinc-800" />
            <Skeleton className="h-4 w-32 bg-zinc-800" />
            <Skeleton className="h-4 w-20 bg-zinc-800" />
          </div>
        </CardContent>
      </Card>

      {/* Buttons Skeleton */}
      <div className="py-4 flex justify-center gap-3">
        <Skeleton className="h-12 w-32 rounded-xl bg-zinc-800" />
        <Skeleton className="h-12 w-32 rounded-xl bg-zinc-800" />
        <Skeleton className="h-12 w-32 rounded-xl bg-zinc-800" />
      </div>

      {/* Navigation Skeleton */}
      <div className="flex justify-between">
        <Skeleton className="h-10 w-24 bg-zinc-800" />
        <Skeleton className="h-10 w-24 bg-zinc-800" />
      </div>
    </div>
  );
}

export function TableViewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Progress Bar Skeleton */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24 bg-zinc-800" />
          <Skeleton className="h-4 w-12 bg-zinc-800" />
        </div>
        <Skeleton className="h-2 w-full bg-zinc-800" />
      </div>

      {/* Table Skeleton */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="border-b border-zinc-800 p-4">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-10 bg-zinc-800" />
            <Skeleton className="h-4 w-full bg-zinc-800" />
            <Skeleton className="h-4 w-20 bg-zinc-800" />
            <Skeleton className="h-4 w-24 bg-zinc-800" />
          </div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 border-b border-zinc-800/50 p-4 last:border-0">
            <Skeleton className="h-4 w-10 bg-zinc-800" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full bg-zinc-800" />
              <Skeleton className="h-4 w-2/3 bg-zinc-800" />
            </div>
            <Skeleton className="h-4 w-20 bg-zinc-800" />
            <Skeleton className="h-8 w-24 rounded-md bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
