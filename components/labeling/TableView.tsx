'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronLeft, ChevronRight, Video, User, CornerDownLeft } from 'lucide-react';
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
import { LabelDropdown } from './LabelDropdown';
import { LabelingProgress } from './LabelingProgress';
import { CommentWithUserLabel, SentimentLabel } from '@/types';
import { cn } from '@/lib/utils';

interface TableViewProps {
  comments: CommentWithUserLabel[];
  totalComments: number;
  labeledCount: number;
  isSaving: boolean;
  isLoading: boolean;
  currentPage: number;
  pageSize: number;
  onLabelChange: (commentId: string, label: SentimentLabel) => void;
  onPageChange: (page: number) => void;
}

export function TableView({
  comments,
  totalComments,
  labeledCount,
  isSaving,
  isLoading,
  currentPage,
  pageSize,
  onLabelChange,
  onPageChange,
}: TableViewProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [jumpToPage, setJumpToPage] = useState<string>('');
  
  const totalPages = Math.ceil(totalComments / pageSize);
  const startIndex = (currentPage - 1) * pageSize;

  const toggleExpand = (commentId: string) => {
    setExpandedRow(expandedRow === commentId ? null : commentId);
  };

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

  return (
    <div className="space-y-6">
      {/* Progress */}
      <LabelingProgress
        current={startIndex}
        total={totalComments}
        labeled={labeledCount}
        isSaving={isSaving}
      />

      {/* Table */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="w-[60px] text-zinc-400">#</TableHead>
              <TableHead className="text-zinc-400">Comment</TableHead>
              <TableHead className="w-[120px] text-zinc-400">Source</TableHead>
              <TableHead className="w-[140px] text-zinc-400">Label</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comments.map((comment, idx) => (
              <TableRow
                key={comment.id}
                className={cn(
                  'border-zinc-800 cursor-pointer transition-colors',
                  expandedRow === comment.id ? 'bg-zinc-800/80' : 'hover:bg-zinc-800/50'
                )}
                onClick={() => toggleExpand(comment.id)}
              >
                <TableCell className="font-mono text-sm text-zinc-500">
                  {startIndex + idx + 1}
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <p className={cn(
                      'text-zinc-200 transition-all',
                      expandedRow !== comment.id && 'line-clamp-2'
                    )}>
                      {comment.text}
                    </p>
                    
                    {/* Expanded metadata */}
                    <AnimatePresence>
                      {expandedRow === comment.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex flex-wrap gap-3 pt-2 text-xs text-zinc-500"
                        >
                          {comment.videoTitle && (
                            <div className="flex items-center gap-1">
                              <Video className="h-3 w-3" />
                              <span className="max-w-[200px] truncate">{comment.videoTitle}</span>
                            </div>
                          )}
                          {comment.channelName && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{comment.channelName}</span>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-zinc-500">
                    {comment.channelName || 'Unknown'}
                  </span>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <LabelDropdown
                    value={comment.userLabel}
                    onChange={(label) => onLabelChange(comment.id, label)}
                    disabled={isSaving}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-sm text-zinc-500">
          Showing {startIndex + 1}-{Math.min(startIndex + comments.length, totalComments)} of {totalComments}
        </p>
        
        <div className="flex items-center gap-4">
          {/* Jump to page input */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">Go to:</span>
            <div className="relative flex items-center">
              <Input
                type="number"
                min={1}
                max={totalPages}
                value={jumpToPage}
                onChange={(e) => setJumpToPage(e.target.value)}
                onKeyDown={handleJumpKeyDown}
                placeholder={String(currentPage)}
                disabled={isLoading}
                className="w-16 h-8 text-center text-sm bg-zinc-800/50 border-zinc-700 
                         focus:border-amber-500 focus:ring-amber-500/20 
                         [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none 
                         [&::-webkit-inner-spin-button]:appearance-none"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleJumpToPage}
                disabled={isLoading || !jumpToPage || parseInt(jumpToPage) < 1 || parseInt(jumpToPage) > totalPages}
                className="h-8 px-2 text-zinc-400 hover:text-amber-400"
                title="Press Enter or click to jump"
              >
                <CornerDownLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Page navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
              className="border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="px-3 text-sm text-zinc-400 min-w-[100px] text-center">
              {isLoading ? 'Loading...' : `Page ${currentPage} of ${totalPages}`}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
              className="border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TableView;
