'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Clock,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Minus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { getDatasets, getAllCommentsForExport } from '@/lib/firebase/db';
import { Dataset, Comment } from '@/types';
import { toast } from 'sonner';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

interface LabelStats {
  positive: number;
  negative: number;
  neutral: number;
  unlabeled: number;
}

export default function ProgressPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [labelStats, setLabelStats] = useState<Record<string, LabelStats>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load datasets and calculate stats
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getDatasets();
        setDatasets(data);

        // Load label stats for each dataset
        const stats: Record<string, LabelStats> = {};
        for (const dataset of data) {
          try {
            const comments = await getAllCommentsForExport(dataset.id, false);
            stats[dataset.id] = {
              positive: comments.filter((c) => c.label === 'positive').length,
              negative: comments.filter((c) => c.label === 'negative').length,
              neutral: comments.filter((c) => c.label === 'neutral').length,
              unlabeled: comments.filter((c) => c.label === null).length,
            };
          } catch {
            stats[dataset.id] = { positive: 0, negative: 0, neutral: 0, unlabeled: dataset.totalComments };
          }
        }
        setLabelStats(stats);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load progress data');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Calculate overall stats
  const overallStats = datasets.reduce(
    (acc, ds) => {
      acc.total += ds.totalComments;
      acc.labeled += ds.labeledCount;
      return acc;
    },
    { total: 0, labeled: 0 }
  );

  const overallPercentage = overallStats.total > 0
    ? Math.round((overallStats.labeled / overallStats.total) * 100)
    : 0;

  // Calculate overall label distribution
  const overallLabels = Object.values(labelStats).reduce(
    (acc, stats) => {
      acc.positive += stats.positive;
      acc.negative += stats.negative;
      acc.neutral += stats.neutral;
      return acc;
    },
    { positive: 0, negative: 0, neutral: 0 }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-zinc-100">Progress Overview</h1>
        <p className="mt-1 text-zinc-400">
          Track labeling progress across all datasets
        </p>
      </motion.div>

      {/* Overall Stats */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-4">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Total Comments</p>
                <p className="mt-2 text-2xl font-bold text-zinc-100">
                  {overallStats.total.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-blue-500/10 p-3">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Labeled</p>
                <p className="mt-2 text-2xl font-bold text-zinc-100">
                  {overallStats.labeled.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-green-500/10 p-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Remaining</p>
                <p className="mt-2 text-2xl font-bold text-zinc-100">
                  {(overallStats.total - overallStats.labeled).toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-amber-500/10 p-3">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Completion</p>
                <p className="mt-2 text-2xl font-bold text-zinc-100">
                  {overallPercentage}%
                </p>
              </div>
              <div className="rounded-lg bg-purple-500/10 p-3">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Overall Progress */}
      <motion.div variants={itemVariants}>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-lg text-zinc-100">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">
                {overallStats.labeled.toLocaleString()} of {overallStats.total.toLocaleString()} comments labeled
              </span>
              <span className="font-mono text-zinc-100">{overallPercentage}%</span>
            </div>
            <Progress value={overallPercentage} className="h-3 bg-zinc-800" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Label Distribution */}
      <motion.div variants={itemVariants}>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-lg text-zinc-100">Label Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-4 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
                <div className="rounded-full bg-green-500/20 p-3">
                  <ThumbsUp className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">
                    {overallLabels.positive.toLocaleString()}
                  </p>
                  <p className="text-sm text-zinc-500">Positive</p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                <div className="rounded-full bg-red-500/20 p-3">
                  <ThumbsDown className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-400">
                    {overallLabels.negative.toLocaleString()}
                  </p>
                  <p className="text-sm text-zinc-500">Negative</p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="rounded-full bg-amber-500/20 p-3">
                  <Minus className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-400">
                    {overallLabels.neutral.toLocaleString()}
                  </p>
                  <p className="text-sm text-zinc-500">Neutral</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Dataset Breakdown */}
      <motion.div variants={itemVariants}>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-lg text-zinc-100">Dataset Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {datasets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BarChart3 className="mb-4 h-12 w-12 text-zinc-600" />
                <p className="text-zinc-400">No datasets available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {datasets.map((dataset) => {
                  const stats = labelStats[dataset.id] || {
                    positive: 0,
                    negative: 0,
                    neutral: 0,
                    unlabeled: dataset.totalComments,
                  };
                  const percentage = dataset.totalComments > 0
                    ? Math.round((dataset.labeledCount / dataset.totalComments) * 100)
                    : 0;

                  return (
                    <div
                      key={dataset.id}
                      className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-zinc-500" />
                          <span className="font-medium text-zinc-200">{dataset.name}</span>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            percentage === 100
                              ? 'border-green-500/50 bg-green-500/10 text-green-400'
                              : 'border-zinc-700 text-zinc-400'
                          }
                        >
                          {percentage}%
                        </Badge>
                      </div>

                      <div className="mb-2">
                        <Progress value={percentage} className="h-2 bg-zinc-700" />
                      </div>

                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        <span>
                          {dataset.labeledCount.toLocaleString()} / {dataset.totalComments.toLocaleString()} labeled
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-green-400">
                            <ThumbsUp className="h-3 w-3" />
                            {stats.positive}
                          </span>
                          <span className="flex items-center gap-1 text-red-400">
                            <ThumbsDown className="h-3 w-3" />
                            {stats.negative}
                          </span>
                          <span className="flex items-center gap-1 text-amber-400">
                            <Minus className="h-3 w-3" />
                            {stats.neutral}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
