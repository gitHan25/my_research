'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Shield,
  UserCheck,
  AlertTriangle,
  MoreHorizontal,
  RefreshCw,
  Clock,
  XCircle,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthContext } from '@/providers';
import { getAllUsers } from '@/lib/firebase/db';
import { updateUserRole, updateUserStatus } from '@/lib/firebase/auth';
import { User, UserRole, UserStatus } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function UsersPage() {
  const { user: currentUser } = useAuthContext();
  
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Load users
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Handle role change
  const handleRoleChange = useCallback(async (userId: string, newRole: UserRole) => {
    if (userId === currentUser?.id) {
      toast.error("You can't change your own role");
      return;
    }

    setIsUpdating(userId);
    try {
      await updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update user role');
    } finally {
      setIsUpdating(null);
    }
  }, [currentUser?.id]);

  // Handle status change (approve/reject)
  const handleStatusChange = useCallback(async (userId: string, newStatus: UserStatus) => {
    if (userId === currentUser?.id) {
      toast.error("You can't change your own status");
      return;
    }

    setIsUpdating(userId);
    try {
      await updateUserStatus(userId, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
      );
      
      if (newStatus === 'active') {
        toast.success('User approved successfully');
      } else if (newStatus === 'rejected') {
        toast.success('User rejected');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update user status');
    } finally {
      setIsUpdating(null);
    }
  }, [currentUser?.id]);

  // Get initials from display name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Format date
  const formatDate = (date: Date | { seconds: number } | null): string => {
    if (!date) return 'Never';
    const d = date instanceof Date ? date : new Date(date.seconds * 1000);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status badge
  const getStatusBadge = (status: UserStatus | undefined) => {
    const s = status || 'active'; // Default for existing users
    switch (s) {
      case 'pending':
        return (
          <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-400">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case 'active':
        return (
          <Badge variant="outline" className="border-green-500/50 bg-green-500/10 text-green-400">
            <CheckCircle className="mr-1 h-3 w-3" />
            Active
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="border-red-500/50 bg-red-500/10 text-red-400">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
    }
  };

  // Stats
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const labelerCount = users.filter((u) => u.role === 'labeler').length;
  const pendingCount = users.filter((u) => u.status === 'pending').length;

  // Check if user is admin
  if (currentUser?.role !== 'admin') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="mb-6 rounded-full bg-amber-500/20 p-6">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-100">Access Denied</h2>
        <p className="mt-2 text-zinc-400">
          Only administrators can manage users.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">User Management</h1>
          <p className="mt-1 text-zinc-400">
            Manage user roles and approve registrations
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadUsers}
          disabled={isLoading}
          className="border-zinc-700 bg-zinc-800/50"
        >
          <RefreshCw className={cn('mr-2 h-4 w-4', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Total Users</p>
                <p className="mt-2 text-2xl font-bold text-zinc-100">{users.length}</p>
              </div>
              <div className="rounded-lg bg-blue-500/10 p-3">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-zinc-800 bg-zinc-900/50",
          pendingCount > 0 && "border-amber-500/30 bg-amber-500/5"
        )}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Pending Approval</p>
                <p className={cn(
                  "mt-2 text-2xl font-bold",
                  pendingCount > 0 ? "text-amber-400" : "text-zinc-100"
                )}>
                  {pendingCount}
                </p>
              </div>
              <div className={cn(
                "rounded-lg p-3",
                pendingCount > 0 ? "bg-amber-500/20" : "bg-amber-500/10"
              )}>
                <Clock className={cn(
                  "h-5 w-5",
                  pendingCount > 0 ? "text-amber-400" : "text-amber-500"
                )} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Administrators</p>
                <p className="mt-2 text-2xl font-bold text-zinc-100">{adminCount}</p>
              </div>
              <div className="rounded-lg bg-purple-500/10 p-3">
                <Shield className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Labelers</p>
                <p className="mt-2 text-2xl font-bold text-zinc-100">{labelerCount}</p>
              </div>
              <div className="rounded-lg bg-green-500/10 p-3">
                <UserCheck className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-zinc-100">All Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="mb-4 h-12 w-12 text-zinc-600" />
              <p className="text-zinc-400">No users found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">User</TableHead>
                  <TableHead className="text-zinc-400">Email</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                  <TableHead className="text-zinc-400">Role</TableHead>
                  <TableHead className="text-zinc-400">Joined</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="border-zinc-800">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 bg-zinc-800">
                          <AvatarFallback className="bg-zinc-800 text-xs text-zinc-400">
                            {getInitials(user.displayName || user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-zinc-200">
                            {user.displayName || 'Unnamed User'}
                          </p>
                          {user.id === currentUser?.id && (
                            <span className="text-xs text-zinc-500">(You)</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-400">{user.email}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          user.role === 'admin'
                            ? 'border-purple-500/50 bg-purple-500/10 text-purple-400'
                            : 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                        }
                      >
                        {user.role === 'admin' ? (
                          <Shield className="mr-1 h-3 w-3" />
                        ) : (
                          <UserCheck className="mr-1 h-3 w-3" />
                        )}
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-500">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      {user.id !== currentUser?.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isUpdating === user.id}
                              className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100"
                            >
                              {isUpdating === user.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="border-zinc-800 bg-zinc-900"
                          >
                            {/* Status actions */}
                            {user.status === 'pending' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(user.id, 'active')}
                                  className="text-green-400 focus:bg-green-500/10 focus:text-green-400"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Approve User
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(user.id, 'rejected')}
                                  className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Reject User
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-zinc-800" />
                              </>
                            )}
                            {user.status === 'rejected' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(user.id, 'active')}
                                  className="text-green-400 focus:bg-green-500/10 focus:text-green-400"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Approve User
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-zinc-800" />
                              </>
                            )}
                            {user.status === 'active' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(user.id, 'rejected')}
                                  className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Revoke Access
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-zinc-800" />
                              </>
                            )}
                            
                            {/* Role actions */}
                            {user.role === 'labeler' ? (
                              <DropdownMenuItem
                                onClick={() => handleRoleChange(user.id, 'admin')}
                                className="text-purple-400 focus:bg-purple-500/10 focus:text-purple-400"
                              >
                                <Shield className="mr-2 h-4 w-4" />
                                Make Admin
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleRoleChange(user.id, 'labeler')}
                                className="text-blue-400 focus:bg-blue-500/10 focus:text-blue-400"
                              >
                                <UserCheck className="mr-2 h-4 w-4" />
                                Make Labeler
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
