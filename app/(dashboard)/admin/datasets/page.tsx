'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Database,
  Trash2,
  Edit2,
  AlertTriangle,
  RefreshCw,
  FileText,
  Users,
  MessageSquare,
  X,
  Wrench,
  FilePlus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthContext } from '@/providers';
import { getDatasets, deleteDataset, updateDataset, syncDatasetStats, addCommentsFromCSV, getAllUsers } from '@/lib/firebase/db';
import Papa from 'papaparse';
import { Dataset, User } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function DatasetsPage() {
  const { user: currentUser } = useAuthContext();
  
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [isAppending, setIsAppending] = useState<string | null>(null);
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editDataset, setEditDataset] = useState<Dataset | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  
  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Dataset | null>(null);

  // Append modal state
  const [appendModalOpen, setAppendModalOpen] = useState(false);
  const [appendTarget, setAppendTarget] = useState<Dataset | null>(null);
  const [appendStartIndex, setAppendStartIndex] = useState('');
  const [appendFile, setAppendFile] = useState<File | null>(null);

  // Load datasets and users
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [datasetsData, usersData] = await Promise.all([
        getDatasets(),
        getAllUsers(),
      ]);
      setDatasets(datasetsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle edit
  const openEditModal = (dataset: Dataset) => {
    setEditDataset(dataset);
    setEditName(dataset.name);
    setEditDescription(dataset.description || '');
    setEditModalOpen(true);
  };

  const handleEdit = async () => {
    if (!editDataset || !editName.trim()) return;
    
    setIsEditing(editDataset.id);
    try {
      await updateDataset(editDataset.id, {
        name: editName.trim(),
        description: editDescription.trim(),
      });
      setDatasets((prev) =>
        prev.map((d) =>
          d.id === editDataset.id
            ? { ...d, name: editName.trim(), description: editDescription.trim() }
            : d
        )
      );
      toast.success('Dataset updated');
      setEditModalOpen(false);
    } catch (error) {
      console.error('Error updating dataset:', error);
      toast.error('Failed to update dataset');
    } finally {
      setIsEditing(null);
    }
  };

  // Handle delete
  const openDeleteModal = (dataset: Dataset) => {
    setDeleteTarget(dataset);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    setIsDeleting(deleteTarget.id);
    try {
      await deleteDataset(deleteTarget.id);
      setDatasets((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      toast.success('Dataset deleted');
      setDeleteModalOpen(false);
    } catch (error) {
      console.error('Error deleting dataset:', error);
      toast.error('Failed to delete dataset');
    } finally {
      setIsDeleting(null);
    }
  };

  // Handle sync stats (totalComments + labeledCount from real Firestore data)
  const handleSyncCount = async (dataset: Dataset) => {
    setIsSyncing(dataset.id);
    try {
      const { totalComments, labeledCount } = await syncDatasetStats(dataset.id);
      setDatasets((prev) =>
        prev.map((d) =>
          d.id === dataset.id ? { ...d, totalComments, labeledCount } : d
        )
      );
      toast.success(
        `Synced: ${totalComments.toLocaleString()} comments, ${labeledCount.toLocaleString()} labeled`
      );
    } catch (error) {
      console.error('Error syncing stats:', error);
      toast.error('Failed to sync dataset stats');
    } finally {
      setIsSyncing(null);
    }
  };

  // Open the append dialog
  const handleAppendCSV = (dataset: Dataset) => {
    setAppendTarget(dataset);
    setAppendStartIndex(String(dataset.totalComments));
    setAppendFile(null);
    setAppendModalOpen(true);
  };

  // Run the actual append after the user confirms in the dialog
  const handleAppendSubmit = async () => {
    if (!appendTarget || !appendFile) return;
    const startFrom = parseInt(appendStartIndex, 10);
    if (isNaN(startFrom) || startFrom < 0) {
      toast.error('Invalid start index');
      return;
    }

    setIsAppending(appendTarget.id);
    setAppendModalOpen(false);
    try {
      const parsed = await new Promise<Papa.ParseResult<Record<string, string>>>(
        (resolve, reject) => {
          Papa.parse<Record<string, string>>(appendFile, {
            header: true,
            skipEmptyLines: true,
            complete: resolve,
            error: reject,
          });
        }
      );

      const missingRows = parsed.data.slice(startFrom);
      if (missingRows.length === 0) {
        toast.info('No missing rows found — dataset is already complete.');
        return;
      }

      const COLUMN_MAP: Record<string, string> = {
        text: 'text', comment: 'text', comment_text: 'text', content: 'text',
        video_id: 'videoId', videoId: 'videoId',
        video_title: 'videoTitle', videoTitle: 'videoTitle', title: 'videoTitle',
        channel_name: 'channelName', channelName: 'channelName', channel: 'channelName',
        likes: 'originalLikes', like_count: 'originalLikes', originalLikes: 'originalLikes',
        llm_label: 'llmLabel', llmLabel: 'llmLabel', label: 'llmLabel',
      };

      const comments = missingRows
        .map((row, i) => {
          const mapped: Record<string, unknown> = {};
          for (const [col, val] of Object.entries(row)) {
            const key = COLUMN_MAP[col.toLowerCase()] || COLUMN_MAP[col];
            if (key) mapped[key] = key === 'originalLikes' ? parseInt(val) || 0 : val;
          }
          return {
            datasetId: appendTarget.id,
            index: startFrom + i,
            text: (mapped.text as string)?.trim() || '',
            videoId: (mapped.videoId as string) || '',
            videoTitle: (mapped.videoTitle as string) || '',
            channelName: (mapped.channelName as string) || '',
            originalLikes: (mapped.originalLikes as number) || 0,
            llmLabel: mapped.llmLabel as 'positive' | 'negative' | 'neutral' | undefined,
          };
        })
        .filter((c) => c.text !== '');

      const BATCH = 500;
      for (let i = 0; i < comments.length; i += BATCH) {
        await addCommentsFromCSV(appendTarget.id, comments.slice(i, i + BATCH));
      }

      // Update local state — click the sync (wrench) button to persist to Firestore
      const newTotal = startFrom + comments.length;
      setDatasets((prev) =>
        prev.map((d) =>
          d.id === appendTarget.id ? { ...d, totalComments: newTotal } : d
        )
      );

      toast.success(
        `Appended ${comments.length.toLocaleString()} comments (rows ${startFrom}–${startFrom + comments.length - 1})`
      );
    } catch (error) {
      console.error('Error appending comments:', error);
      toast.error('Failed to append comments');
    } finally {
      setIsAppending(null);
    }
  };

  // Format date
  const formatDate = (date: Date | { seconds: number } | null): string => {
    if (!date) return '—';
    const d = date instanceof Date ? date : new Date(date.seconds * 1000);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Stats
  const totalComments = datasets.reduce((sum, d) => sum + d.totalComments, 0);
  const activeLabelers = users.filter((u) => u.role === 'labeler' && u.status === 'active').length;

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
          Only administrators can manage datasets.
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
          <h1 className="text-2xl font-bold text-zinc-100">Database Management</h1>
          <p className="mt-1 text-zinc-400">
            Manage datasets and their data
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadData}
          disabled={isLoading}
          className="border-zinc-700 bg-zinc-800/50"
        >
          <RefreshCw className={cn('mr-2 h-4 w-4', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Total Datasets</p>
                <p className="mt-2 text-2xl font-bold text-zinc-100">{datasets.length}</p>
              </div>
              <div className="rounded-lg bg-blue-500/10 p-3">
                <Database className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Total Comments</p>
                <p className="mt-2 text-2xl font-bold text-zinc-100">{totalComments.toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-purple-500/10 p-3">
                <MessageSquare className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Active Labelers</p>
                <p className="mt-2 text-2xl font-bold text-zinc-100">{activeLabelers}</p>
              </div>
              <div className="rounded-lg bg-green-500/10 p-3">
                <Users className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Datasets Table */}
      <Card className="border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-zinc-100">All Datasets</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : datasets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="mb-4 h-12 w-12 text-zinc-600" />
              <p className="text-zinc-400">No datasets found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Name</TableHead>
                  <TableHead className="text-zinc-400">Comments</TableHead>
                  <TableHead className="text-zinc-400">Progress</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                  <TableHead className="text-zinc-400">Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datasets.map((dataset) => {
                  const progress = dataset.totalComments > 0
                    ? Math.round((dataset.labeledCount / dataset.totalComments) * 100)
                    : 0;
                  
                  return (
                    <TableRow key={dataset.id} className="border-zinc-800">
                      <TableCell>
                        <div>
                          <p className="font-medium text-zinc-200">{dataset.name}</p>
                          {dataset.description && (
                            <p className="text-xs text-zinc-500 line-clamp-1">
                              {dataset.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-300">
                        {dataset.totalComments.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 rounded-full bg-zinc-800">
                            <div
                              className="h-full rounded-full bg-blue-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-zinc-400">{progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            dataset.status === 'completed'
                              ? 'border-green-500/50 bg-green-500/10 text-green-400'
                              : 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                          }
                        >
                          {dataset.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-500">
                        {formatDate(dataset.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(dataset)}
                            className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100"
                            title="Edit dataset"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSyncCount(dataset)}
                            disabled={isSyncing === dataset.id}
                            className="h-8 w-8 p-0 text-zinc-400 hover:text-amber-400"
                            title="Sync stats: fix totalComments and labeledCount from Firestore"
                          >
                            {isSyncing === dataset.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Wrench className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAppendCSV(dataset)}
                            disabled={isAppending === dataset.id}
                            className="h-8 w-8 p-0 text-zinc-400 hover:text-green-400"
                            title="Append missing rows from CSV (resumes from last uploaded index)"
                          >
                            {isAppending === dataset.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <FilePlus className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteModal(dataset)}
                            disabled={isDeleting === dataset.id}
                            className="h-8 w-8 p-0 text-zinc-400 hover:text-red-400"
                            title="Delete dataset"
                          >
                            {isDeleting === dataset.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-900">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Edit Dataset</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Update the dataset name and description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-300">Name</Label>
              <Input
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="border-zinc-700 bg-zinc-800/50 text-zinc-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-zinc-300">Description</Label>
              <Input
                id="description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Optional description"
                className="border-zinc-700 bg-zinc-800/50 text-zinc-100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              className="border-zinc-700 bg-zinc-800/50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={isEditing !== null || !editName.trim()}
              className="bg-blue-600 hover:bg-blue-500"
            >
              {isEditing ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Append CSV Modal */}
      <Dialog open={appendModalOpen} onOpenChange={setAppendModalOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-zinc-100">
              <FilePlus className="h-5 w-5 text-green-400" />
              Append Missing Comments
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Uploads only the rows after the start index — existing comments and labels are untouched.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-zinc-300">Start from CSV row index</Label>
              <Input
                type="number"
                min={0}
                value={appendStartIndex}
                onChange={(e) => setAppendStartIndex(e.target.value)}
                className="border-zinc-700 bg-zinc-800/50 text-zinc-100"
              />
              <p className="text-xs text-zinc-500">
                Default is the current synced total ({appendTarget?.totalComments.toLocaleString()}).
                Run the Sync (wrench) button first if this looks wrong.
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">CSV file</Label>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-zinc-700 bg-zinc-800/30 p-4 hover:border-zinc-500 transition-colors">
                <FilePlus className="h-5 w-5 text-zinc-400 shrink-0" />
                <span className="text-sm text-zinc-400 truncate">
                  {appendFile ? appendFile.name : 'Click to choose CSV file…'}
                </span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => setAppendFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAppendModalOpen(false)}
              className="border-zinc-700 bg-zinc-800/50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAppendSubmit}
              disabled={!appendFile || appendStartIndex === ''}
              className="bg-green-600 hover:bg-green-500"
            >
              Append Comments
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Delete Dataset
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              This action cannot be undone. This will permanently delete:
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <ul className="space-y-2 text-sm text-zinc-300">
              <li className="flex items-center gap-2">
                <Database className="h-4 w-4 text-red-400" />
                Dataset: <strong>{deleteTarget?.name}</strong>
              </li>
              <li className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-red-400" />
                {deleteTarget?.totalComments.toLocaleString()} comments
              </li>
              <li className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-red-400" />
                All annotations from all labelers
              </li>
            </ul>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              className="border-zinc-700 bg-zinc-800/50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting !== null}
              className="bg-red-600 hover:bg-red-500"
            >
              {isDeleting ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
