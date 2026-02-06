'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useAuthContext } from '@/providers';
import { 
  getDatasets, 
  getAllCommentsForExport, 
  getAnnotationsForExport,
  getAnnotationsByUser 
} from '@/lib/firebase/db';
import { Dataset, Comment, Annotation } from '@/types';
import { toast } from 'sonner';

type ExportMode = 'per-labeler' | 'combined' | 'aggregated';

interface LabelerStats {
  userId: string;
  userEmail: string;
  count: number;
}

export default function ExportPage() {
  const { user } = useAuthContext();
  
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [exportMode, setExportMode] = useState<ExportMode>('per-labeler');
  const [selectedLabeler, setSelectedLabeler] = useState<string>('all');
  const [labelers, setLabelers] = useState<LabelerStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLabelers, setIsLoadingLabelers] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  // Load datasets
  useEffect(() => {
    const loadDatasets = async () => {
      try {
        const data = await getDatasets();
        setDatasets(data);
        if (data.length > 0) {
          setSelectedDatasetId(data[0].id);
        }
      } catch (error) {
        console.error('Error loading datasets:', error);
        toast.error('Failed to load datasets');
      } finally {
        setIsLoading(false);
      }
    };
    loadDatasets();
  }, []);

  // Load labelers when dataset changes
  useEffect(() => {
    const loadLabelers = async () => {
      if (!selectedDatasetId) return;
      
      setIsLoadingLabelers(true);
      try {
        const labelersMap = await getAnnotationsByUser(selectedDatasetId);
        const labelersArray = Array.from(labelersMap.values());
        setLabelers(labelersArray);
      } catch (error) {
        console.error('Error loading labelers:', error);
      } finally {
        setIsLoadingLabelers(false);
      }
    };
    loadLabelers();
  }, [selectedDatasetId]);

  const selectedDataset = datasets.find((d) => d.id === selectedDatasetId);

  // Export to CSV
  const handleExport = useCallback(async () => {
    if (!selectedDatasetId || !selectedDataset) {
      toast.error('Please select a dataset');
      return;
    }

    setIsExporting(true);
    setProgress(0);

    try {
      setProgress(10);
      
      // Fetch comments and annotations
      const [comments, annotations] = await Promise.all([
        getAllCommentsForExport(selectedDatasetId, false),
        getAnnotationsForExport(
          selectedDatasetId, 
          selectedLabeler !== 'all' ? selectedLabeler : undefined
        ),
      ]);
      
      setProgress(50);

      if (annotations.length === 0) {
        toast.error('No annotations found for the selected criteria');
        setIsExporting(false);
        return;
      }

      // Create comment lookup
      const commentMap = new Map(comments.map(c => [c.id, c]));
      
      setProgress(70);

      let csvContent: string;
      let fileName: string;

      if (exportMode === 'per-labeler' || exportMode === 'combined') {
        // Per-labeler or Combined: One row per annotation
        const headers = [
          'comment_index',
          'text',
          'label',
          'labeler_email',
          'labeled_at',
          'video_id',
          'video_title',
          'channel_name',
          'original_likes',
        ];
        
        const rows = annotations.map((annotation) => {
          const comment = commentMap.get(annotation.commentId);
          return [
            comment?.index ?? '',
            `"${(comment?.text || '').replace(/"/g, '""')}"`,
            annotation.label,
            annotation.userEmail,
            annotation.updatedAt ? new Date(annotation.updatedAt instanceof Date ? annotation.updatedAt : (annotation.updatedAt as any).seconds * 1000).toISOString() : '',
            comment?.videoId || '',
            `"${(comment?.videoTitle || '').replace(/"/g, '""')}"`,
            `"${(comment?.channelName || '').replace(/"/g, '""')}"`,
            comment?.originalLikes || 0,
          ];
        });

        csvContent = [
          headers.join(','),
          ...rows.map((row) => row.join(',')),
        ].join('\n');

        const labelerSuffix = selectedLabeler !== 'all' 
          ? `_${labelers.find(l => l.userId === selectedLabeler)?.userEmail.split('@')[0] || 'labeler'}`
          : '_all-labelers';
        fileName = `${selectedDataset.name}${labelerSuffix}_annotations.csv`;

      } else {
        // Aggregated: One row per comment, columns for each labeler
        const uniqueLabelers = Array.from(new Set(annotations.map(a => a.userEmail)));
        
        const headers = [
          'comment_index',
          'text',
          ...uniqueLabelers,
          'agreement',
          'video_id',
          'video_title',
          'channel_name',
        ];
        
        // Group annotations by comment
        const annotationsByComment = new Map<string, Annotation[]>();
        annotations.forEach(a => {
          const existing = annotationsByComment.get(a.commentId) || [];
          existing.push(a);
          annotationsByComment.set(a.commentId, existing);
        });
        
        const rows = comments
          .filter(c => annotationsByComment.has(c.id))
          .map((comment) => {
            const commentAnnotations = annotationsByComment.get(comment.id) || [];
            const labelerLabels: Record<string, string> = {};
            commentAnnotations.forEach(a => {
              labelerLabels[a.userEmail] = a.label;
            });
            
            // Calculate agreement
            const labels = Object.values(labelerLabels);
            const allSame = labels.every(l => l === labels[0]);
            const agreement = labels.length > 1 ? (allSame ? 'agree' : 'disagree') : 'single';
            
            return [
              comment.index,
              `"${(comment.text || '').replace(/"/g, '""')}"`,
              ...uniqueLabelers.map(email => labelerLabels[email] || ''),
              agreement,
              comment.videoId || '',
              `"${(comment.videoTitle || '').replace(/"/g, '""')}"`,
              `"${(comment.channelName || '').replace(/"/g, '""')}"`,
            ];
          });

        csvContent = [
          headers.join(','),
          ...rows.map((row) => row.join(',')),
        ].join('\n');

        fileName = `${selectedDataset.name}_aggregated.csv`;
      }

      setProgress(90);

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setProgress(100);

      toast.success('Export completed!', {
        description: `${annotations.length} annotations exported`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  }, [selectedDatasetId, selectedDataset, exportMode, selectedLabeler, labelers]);

  // Check if user is admin
  if (user?.role !== 'admin') {
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
          Only administrators can export data.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Export Data</h1>
        <p className="mt-1 text-zinc-400">
          Download annotations from labelers as CSV
        </p>
      </div>

      {/* Export Card */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="text-lg text-zinc-100">Export Settings</CardTitle>
          <CardDescription className="text-zinc-400">
            Select a dataset, export mode, and labeler options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : datasets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="mb-4 h-12 w-12 text-zinc-600" />
              <p className="text-zinc-400">No datasets available</p>
              <p className="mt-1 text-sm text-zinc-500">
                Upload a dataset first to export data
              </p>
            </div>
          ) : (
            <>
              {/* Dataset Selection */}
              <div className="space-y-2">
                <Label className="text-zinc-300">Dataset</Label>
                <Select
                  value={selectedDatasetId}
                  onValueChange={setSelectedDatasetId}
                >
                  <SelectTrigger className="border-zinc-700 bg-zinc-800/50">
                    <SelectValue placeholder="Select dataset" />
                  </SelectTrigger>
                  <SelectContent className="border-zinc-700 bg-zinc-800">
                    {datasets.map((ds) => (
                      <SelectItem key={ds.id} value={ds.id}>
                        {ds.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Export Mode */}
              <div className="space-y-2">
                <Label className="text-zinc-300">Export Mode</Label>
                <Select
                  value={exportMode}
                  onValueChange={(v) => setExportMode(v as ExportMode)}
                >
                  <SelectTrigger className="border-zinc-700 bg-zinc-800/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-zinc-700 bg-zinc-800">
                    <SelectItem value="per-labeler">
                      Per Labeler - Export one labeler's annotations
                    </SelectItem>
                    <SelectItem value="combined">
                      Combined - All annotations in one file
                    </SelectItem>
                    <SelectItem value="aggregated">
                      Aggregated - One row per comment, columns per labeler
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-zinc-500">
                  {exportMode === 'per-labeler' && 'Download annotations from a specific labeler'}
                  {exportMode === 'combined' && 'Download all annotations from all labelers'}
                  {exportMode === 'aggregated' && 'Each comment once with labeler columns (for IAA)'}
                </p>
              </div>

              {/* Labeler Selection (for per-labeler mode) */}
              {exportMode === 'per-labeler' && (
                <div className="space-y-2">
                  <Label className="text-zinc-300">Labeler</Label>
                  {isLoadingLabelers ? (
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading labelers...
                    </div>
                  ) : labelers.length === 0 ? (
                    <p className="text-sm text-zinc-500">No annotations found</p>
                  ) : (
                    <Select
                      value={selectedLabeler}
                      onValueChange={setSelectedLabeler}
                    >
                      <SelectTrigger className="border-zinc-700 bg-zinc-800/50">
                        <SelectValue placeholder="Select labeler" />
                      </SelectTrigger>
                      <SelectContent className="border-zinc-700 bg-zinc-800">
                        <SelectItem value="all">All Labelers</SelectItem>
                        {labelers.map((labeler) => (
                          <SelectItem key={labeler.userId} value={labeler.userId}>
                            {labeler.userEmail} ({labeler.count} annotations)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {/* Dataset Stats */}
              {selectedDataset && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-4">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-zinc-500" />
                      <span className="text-zinc-400">Comments:</span>
                      <span className="font-medium text-zinc-200">
                        {selectedDataset.totalComments.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-4 w-px bg-zinc-700" />
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-zinc-500" />
                      <span className="text-zinc-400">Labelers:</span>
                      <span className="font-medium text-zinc-200">
                        {labelers.length}
                      </span>
                    </div>
                    <div className="h-4 w-px bg-zinc-700" />
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-zinc-500" />
                      <span className="text-zinc-400">Annotations:</span>
                      <span className="font-medium text-zinc-200">
                        {labelers.reduce((sum, l) => sum + l.count, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Export Progress */}
              {isExporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Exporting...</span>
                    <span className="text-zinc-300">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {/* Export Button */}
              <Button
                onClick={handleExport}
                disabled={isExporting || labelers.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-500"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Labeler Stats */}
      {labelers.length > 0 && (
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-lg text-zinc-100">Labeler Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {labelers.map((labeler) => (
                <div
                  key={labeler.userId}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/30 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-sm font-medium text-blue-400">
                      {labeler.userEmail.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-zinc-200">{labeler.userEmail}</span>
                  </div>
                  <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                    {labeler.count} annotations
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
