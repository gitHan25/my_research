'use client';

import { motion } from 'framer-motion';
import { MessageSquare, Video, User, ThumbsUp, Bot } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CommentWithUserLabel, SentimentLabel } from '@/types';

interface ValidationCardProps {
  comment: CommentWithUserLabel & { llmLabel?: SentimentLabel };
  index: number;
  total: number;
}

const labelColors: Record<SentimentLabel, string> = {
  positive: 'border-green-500/50 bg-green-500/20 text-green-400',
  negative: 'border-red-500/50 bg-red-500/20 text-red-400',
  neutral: 'border-amber-500/50 bg-amber-500/20 text-amber-400',
};

export function ValidationCard({ comment, index, total }: ValidationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.01 }}
    >
      <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur transition-colors hover:border-zinc-700">
        <CardContent className="p-6">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-zinc-500" />
              <span className="font-mono text-sm text-zinc-400">
                Comment #{index + 1} of {total}
              </span>
            </div>
            
            {/* LLM Label Badge */}
            {comment.llmLabel && (
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-purple-400" />
                <Badge
                  variant="outline"
                  className={`${labelColors[comment.llmLabel]} font-medium`}
                >
                  LLM: {comment.llmLabel}
                </Badge>
              </div>
            )}
          </div>

          {/* Comment Text */}
          <div className="mb-6 rounded-lg bg-zinc-800/50 p-4">
            <p className="whitespace-pre-wrap text-lg leading-relaxed text-zinc-100">
              {comment.text}
            </p>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
            {comment.videoTitle && (
              <div className="flex items-center gap-1.5">
                <Video className="h-4 w-4" />
                <span className="max-w-[200px] truncate">{comment.videoTitle}</span>
              </div>
            )}
            {comment.channelName && (
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span>{comment.channelName}</span>
              </div>
            )}
            {comment.originalLikes !== undefined && comment.originalLikes > 0 && (
              <div className="flex items-center gap-1.5">
                <ThumbsUp className="h-4 w-4" />
                <span>{comment.originalLikes.toLocaleString()} likes</span>
              </div>
            )}
          </div>

          {/* User's validation status */}
          {comment.userLabel && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-zinc-500">Your validation:</span>
              <Badge
                variant="outline"
                className={labelColors[comment.userLabel]}
              >
                {comment.userLabel}
              </Badge>
              {comment.llmLabel && comment.userLabel === comment.llmLabel && (
                <span className="text-green-400 text-xs">(Agreed)</span>
              )}
              {comment.llmLabel && comment.userLabel !== comment.llmLabel && (
                <span className="text-amber-400 text-xs">(Corrected)</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default ValidationCard;
