'use client';

import { motion } from 'framer-motion';
import { MessageSquare, ThumbsUp, Video, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CommentWithUserLabel } from '@/types';

interface CommentCardProps {
  comment: CommentWithUserLabel;
  index: number;
  total: number;
}

export function CommentCard({ comment, index, total }: CommentCardProps) {
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
            {comment.userLabel && (
              <Badge
                variant="outline"
                className={
                  comment.userLabel === 'positive'
                    ? 'border-green-500/50 bg-green-500/10 text-green-400'
                    : comment.userLabel === 'negative'
                    ? 'border-red-500/50 bg-red-500/10 text-red-400'
                    : 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                }
              >
                {comment.userLabel}
              </Badge>
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
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default CommentCard;
