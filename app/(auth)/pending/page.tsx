'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Clock, LogOut, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthContext } from '@/providers';
import { signOut } from '@/lib/firebase/auth';

export default function PendingPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthContext();

  // Redirect if user is already active
  useEffect(() => {
    if (!isLoading && user?.status === 'active') {
      router.push('/');
    }
  }, [user, isLoading, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4">
      {/* Animated background gradient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-600/5 blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(63 63 70) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
          <CardHeader className="space-y-4 text-center">
            {/* Icon */}
            <motion.div 
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <Clock className="h-10 w-10 text-amber-500" />
            </motion.div>
            
            <div>
              <CardTitle className="text-2xl font-bold text-zinc-100">
                Pending Approval
              </CardTitle>
              <CardDescription className="mt-2 text-zinc-400">
                Your account is waiting for admin approval
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="text-center text-sm text-amber-200/80">
                An administrator will review your registration and grant access to the platform.
                You will receive access once approved.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 p-3">
                <span className="text-sm text-zinc-400">Email</span>
                <span className="text-sm font-medium text-zinc-200">{user?.email || '—'}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 p-3">
                <span className="text-sm text-zinc-400">Status</span>
                <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                  <Clock className="mr-1 h-3 w-3" />
                  Pending
                </span>
              </div>
            </div>

            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </CardContent>
        </Card>

        {/* Bottom text */}
        <motion.div 
          className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Tag className="h-3 w-3" />
          <span>CDSA Labeling Platform</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
