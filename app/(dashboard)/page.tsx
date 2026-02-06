'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuthContext } from '@/providers';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const { user } = useAuthContext();

  // TODO: Replace with real data from Firestore
  const stats = {
    total: 15000,
    labeled: 4523,
    remaining: 10477,
    percentage: 30.2,
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-zinc-100">
          Welcome back, {user?.displayName || 'User'}
        </h1>
        <p className="mt-1 text-zinc-400">
          Here&apos;s an overview of your labeling progress
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={itemVariants}>
          <StatsCard
            title="Total Comments"
            value={stats.total.toLocaleString()}
            icon={<FileText className="h-5 w-5" />}
            iconColor="text-blue-500"
            iconBg="bg-blue-500/10"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <StatsCard
            title="Labeled"
            value={stats.labeled.toLocaleString()}
            icon={<CheckCircle2 className="h-5 w-5" />}
            iconColor="text-green-500"
            iconBg="bg-green-500/10"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <StatsCard
            title="Remaining"
            value={stats.remaining.toLocaleString()}
            icon={<Clock className="h-5 w-5" />}
            iconColor="text-amber-500"
            iconBg="bg-amber-500/10"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <StatsCard
            title="Progress"
            value={`${stats.percentage}%`}
            icon={<TrendingUp className="h-5 w-5" />}
            iconColor="text-purple-500"
            iconBg="bg-purple-500/10"
          />
        </motion.div>
      </motion.div>

      {/* Progress Section */}
      <motion.div variants={itemVariants}>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-lg text-zinc-100">
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">
                {stats.labeled.toLocaleString()} of {stats.total.toLocaleString()} comments labeled
              </span>
              <span className="font-mono text-zinc-100">{stats.percentage}%</span>
            </div>
            <Progress 
              value={stats.percentage} 
              className="h-3 bg-zinc-800"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card className="border-zinc-800 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-lg font-semibold text-zinc-100">
                Ready to continue labeling?
              </h3>
              <p className="mt-1 text-sm text-zinc-400">
                Pick up where you left off and help complete the dataset
              </p>
            </div>
            <Link href="/label">
              <Button className="bg-blue-600 hover:bg-blue-500">
                Start Labeling
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity - Placeholder */}
      <motion.div variants={itemVariants}>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-lg text-zinc-100">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-zinc-800 p-4">
                <Clock className="h-8 w-8 text-zinc-500" />
              </div>
              <p className="mt-4 text-sm text-zinc-500">
                No recent activity yet
              </p>
              <p className="mt-1 text-xs text-zinc-600">
                Start labeling to see your activity here
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
}

function StatsCard({ title, value, icon, iconColor, iconBg }: StatsCardProps) {
  return (
    <Card className="border-zinc-800 bg-zinc-900/50 transition-colors hover:border-zinc-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400">{title}</p>
            <p className="mt-2 text-2xl font-bold text-zinc-100">{value}</p>
          </div>
          <div className={`rounded-lg p-3 ${iconBg}`}>
            <span className={iconColor}>{icon}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
