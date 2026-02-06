'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Bot, Check, X, CornerDownLeft } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CommentWithUserLabel, SentimentLabel } from '@/types';
import { cn } from '@/lib/utils';

interface ValidationTableViewProps {
  comments: (CommentWithUserLabel & { llmLabel?: SentimentLabel })[];
  agreementStats: {
    total: number;
    validated: number;
    agreed: number;
    agreementRate: number;
  };
  isSaving: boolean;
  isLoading: boolean;
  currentPage: number;
  pageSize: number;
  onAgree: (commentId: string, llmLabel: SentimentLabel) => void;
  onDisagree: (commentId: string, correctLabel: SentimentLabel) => void;
  onPageChange: (page: number) => void;
}

const labelColors: Record<SentimentLabel, string> = {
  positive: 'border-green-500/50 bg-green-500/20 text-green-400',
  negative: 'border-red-500/50 bg-red-500/20 text-red-400',
  neutral: 'border-amber-500/50 bg-amber-500/20 text-amber-400',
};

export function ValidationTableView({
  comments,
  agreementStats,
  isSaving,
  isLoading,
  currentPage,
  pageSize,
  onAgree,
  onDisagree,
  onPageChange,
}: ValidationTableViewProps) {
  const [jumpToPage, setJumpToPage] = useState<string>('');
  const [showCorrectionFor, setShowCorrectionFor] = useState<string | null>(null);
  
  const totalPages = Math.ceil(agreementStats.total / pageSize);
  const startIndex = (currentPage - 1) * pageSize;

  // Get current page of comments
  const paginatedComments = comments.slice(startIndex, startIndex + pageSize);

  const handleJumpToPage = useCallback(() => {
    const pageNum = parseInt(jumpToPage, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
      setJumpToPage('');
    }
  }, [jumpToPage, totalPages, onPageChange]);

  const handleJumpKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleJumpToPage();
    }
  }, [handleJumpToPage]);

  const handleAgreeClick = (comment: CommentWithUserLabel & { llmLabel?: SentimentLabel }) => {
    if (comment.llmLabel) {
      onAgree(comment.id, comment.llmLabel);
    }
  };

  const handleDisagreeClick = (commentId: string) => {
    setShowCorrectionFor(showCorrectionFor === commentId ? null : commentId);
  };

  const handleCorrectionSelect = (commentId: string, label: SentimentLabel) => {
    onDisagree(commentId, label);
    setShowCorrectionFor(null);
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-purple-400" />
            <span className="text-sm text-zinc-400">
              <span className="font-semibold text-zinc-100">{agreementStats.validated}</span> / {agreementStats.total} validated
            </span>
          </div>
          <div className="h-4 w-px bg-zinc-700" />
          <span className="text-sm">
            Agreement: <span className="font-semibold text-green-400">{agreementStats.agreementRate.toFixed(1)}%</span>
          </span>
        </div>
        <div className="text-sm text-zinc-500">
          Page {currentPage} of {totalPages}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="w-[60px] text-zinc-400">#</TableHead>
              <TableHead className="text-zinc-400">Comment</TableHead>
              <TableHead className="w-[100px] text-zinc-400">LLM Label</TableHead>
              <TableHead className="w-[120px] text-zinc-400">Status</TableHead>
              <TableHead className="w-[200px] text-zinc-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedComments.map((comment, idx) => (
              <TableRow
                key={comment.id}
                className="border-zinc-800 transition-colors hover:bg-zinc-800/50"
              >
                {/* Index */}
                <TableCell className="font-mono text-sm text-zinc-500">
                  {startIndex + idx + 1}
                </TableCell>

                {/* Comment Text */}
                <TableCell className="max-w-[400px]">
                  <p className="line-clamp-2 text-sm text-zinc-200">
                    {comment.text}
                  </p>
                </TableCell>

                {/* LLM Label */}
                <TableCell>
                  {comment.llmLabel && (
                    <Badge
                      variant="outline"
                      className={cn('text-xs', labelColors[comment.llmLabel])}
                    >
                      {comment.llmLabel}
                    </Badge>
                  )}
                </TableCell>

                {/* Validation Status */}
                <TableCell>
                  {comment.userLabel ? (
                    comment.userLabel === comment.llmLabel ? (
                      <Badge variant="outline" className="border-green-500/50 bg-green-500/20 text-green-400 text-xs">
                        <Check className="mr-1 h-3 w-3" />
                        Agreed
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-500/50 bg-amber-500/20 text-amber-400 text-xs">
                        <X className="mr-1 h-3 w-3" />
                        Corrected
                      </Badge>
                    )
                  ) : (
                    <span className="text-xs text-zinc-500">Pending</span>
                  )}
                </TableCell>

                {/* Actions */}
                <TableCell>
                  {showCorrectionFor === comment.id ? (
                    <div className="flex items-center gap-1">
                      {(['positive', 'negative', 'neutral'] as SentimentLabel[])
                        .filter(l => l !== comment.llmLabel)
                        .map((label) => (
                          <Button
                            key={label}
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCorrectionSelect(comment.id, label);
                            }}
                            disabled={isSaving}
                            className={cn('h-7 px-2 text-xs', labelColors[label])}
                          >
                            {label.charAt(0).toUpperCase()}
                          </Button>
                        ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAgreeClick(comment);
                        }}
                        disabled={isSaving || !comment.llmLabel}
                        className={cn(
                          'h-7 border-green-500/50 hover:bg-green-500/20 hover:text-green-400',
                          comment.userLabel === comment.llmLabel && 'bg-green-500/20 text-green-400'
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDisagreeClick(comment.id);
                        }}
                        disabled={isSaving || !comment.llmLabel}
                        className={cn(
                          'h-7 border-red-500/50 hover:bg-red-500/20 hover:text-red-400',
                          comment.userLabel && comment.userLabel !== comment.llmLabel && 'bg-red-500/20 text-red-400'
                        )}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className="border-zinc-700 bg-zinc-800/50"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">Go to page:</span>
          <div className="relative">
            <Input
              type="number"
              min={1}
              max={totalPages}
              value={jumpToPage}
              onChange={(e) => setJumpToPage(e.target.value)}
              onKeyDown={handleJumpKeyDown}
              placeholder={String(currentPage)}
              className="h-8 w-16 border-zinc-700 bg-zinc-800/50 text-center text-sm"
            />
            <button
              onClick={handleJumpToPage}
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded bg-zinc-700 p-1 hover:bg-zinc-600"
            >
              <CornerDownLeft className="h-3 w-3 text-zinc-400" />
            </button>
          </div>
          <span className="text-sm text-zinc-500">of {totalPages}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          className="border-zinc-700 bg-zinc-800/50"
        >
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default ValidationTableView;
