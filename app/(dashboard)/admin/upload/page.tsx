'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import Papa from 'papaparse';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileUpload, UploadPreview } from '@/components/admin';
import { useAuthContext } from '@/providers';
import { createDataset, addCommentsFromCSV } from '@/lib/firebase/db';
import { CommentCreateData } from '@/types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ParsedRow {
  text: string;
  videoId?: string;
  videoTitle?: string;
  channelName?: string;
  originalLikes?: number;
  llmLabel?: string;
  [key: string]: string | number | undefined;
}

const REQUIRED_COLUMNS = ['text'];
const OPTIONAL_COLUMNS = ['videoId', 'videoTitle', 'channelName', 'originalLikes', 'video_id', 'video_title', 'channel_name', 'likes', 'llm_label'];

// Column name mapping (from CSV column names to our schema)
const COLUMN_MAP: Record<string, string> = {
  text: 'text',
  comment: 'text',
  comment_text: 'text',
  content: 'text',
  video_id: 'videoId',
  videoId: 'videoId',
  video_title: 'videoTitle',
  videoTitle: 'videoTitle',
  title: 'videoTitle',
  channel_name: 'channelName',
  channelName: 'channelName',
  channel: 'channelName',
  author: 'channelName',
  likes: 'originalLikes',
  originalLikes: 'originalLikes',
  like_count: 'originalLikes',
  llm_label: 'llmLabel',
  llmLabel: 'llmLabel',
  label: 'llmLabel',
  predicted_label: 'llmLabel',
};

export default function UploadPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  
  const [step, setStep] = useState<'upload' | 'preview' | 'saving'>('upload');
  const [datasetName, setDatasetName] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  // Parse CSV file
  const handleFileSelect = useCallback((file: File) => {
    setFileName(file.name);
    setDatasetName(file.name.replace(/\.csv$/i, ''));
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parseErrors: string[] = [];
        
        // Get columns
        const cols = results.meta.fields || [];
        setColumns(cols);
        
        // Map columns to our schema
        const mappedData: ParsedRow[] = results.data.map((row: unknown, index: number) => {
          const typedRow = row as Record<string, string>;
          const mapped: ParsedRow = { text: '' };
          
          // Map each column
          for (const [csvCol, value] of Object.entries(typedRow)) {
            const schemaCol = COLUMN_MAP[csvCol.toLowerCase()] || COLUMN_MAP[csvCol];
            if (schemaCol) {
              if (schemaCol === 'originalLikes') {
                mapped[schemaCol] = parseInt(value) || 0;
              } else {
                mapped[schemaCol] = value;
              }
            }
          }
          
          // Check for required fields
          if (!mapped.text || mapped.text.trim() === '') {
            parseErrors.push(`Row ${index + 1}: Missing or empty 'text' field`);
          }
          
          return mapped;
        });
        
        // Check if we have the text column
        const hasTextColumn = cols.some(
          (col) => COLUMN_MAP[col.toLowerCase()] === 'text' || COLUMN_MAP[col] === 'text'
        );
        if (!hasTextColumn) {
          parseErrors.unshift('CSV must have a column for comment text (e.g., "text", "comment", "content")');
        }
        
        setParsedData(mappedData);
        setErrors(parseErrors);
        setStep('preview');
      },
      error: (error) => {
        toast.error('Failed to parse CSV file');
        console.error('CSV parse error:', error);
      },
    });
  }, []);

  // Save to Firestore
  const handleSave = useCallback(async () => {
    if (!user || parsedData.length === 0) return;
    
    // Validate
    const hasTextColumn = columns.some(
      (col) => COLUMN_MAP[col.toLowerCase()] === 'text' || COLUMN_MAP[col] === 'text'
    );
    if (!hasTextColumn) {
      toast.error('CSV must have a text column');
      return;
    }
    
    if (!datasetName.trim()) {
      toast.error('Please enter a dataset name');
      return;
    }
    
    setStep('saving');
    setProgress(0);
    
    try {
      // Create dataset
      const datasetId = await createDataset({
        name: datasetName.trim(),
        fileName,
        totalComments: parsedData.length,
        createdBy: user.id,
      });
      
      setProgress(10);
      
      // Prepare comments data
      const comments: CommentCreateData[] = parsedData
        .filter((row) => row.text && row.text.trim() !== '')
        .map((row, index) => ({
          datasetId,
          index,
          text: row.text.trim(),
          videoId: row.videoId || '',
          videoTitle: row.videoTitle || '',
          channelName: row.channelName || '',
          originalLikes: row.originalLikes || 0,
          llmLabel: row.llmLabel as 'positive' | 'negative' | 'neutral' | undefined,
        }));
      
      // Save comments in batches (progress updates)
      const batchSize = 500;
      const totalBatches = Math.ceil(comments.length / batchSize);
      
      for (let i = 0; i < comments.length; i += batchSize) {
        const batch = comments.slice(i, i + batchSize);
        await addCommentsFromCSV(datasetId, batch);
        
        const currentBatch = Math.floor(i / batchSize) + 1;
        const batchProgress = 10 + (currentBatch / totalBatches) * 90;
        setProgress(Math.round(batchProgress));
      }
      
      toast.success('Dataset uploaded successfully!', {
        description: `${comments.length} comments imported`,
      });
      
      // Navigate to labeling page
      router.push('/label');
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload dataset');
      setStep('preview');
    }
  }, [user, parsedData, columns, datasetName, fileName, router]);

  // Reset to upload step
  const handleReset = useCallback(() => {
    setStep('upload');
    setDatasetName('');
    setFileName('');
    setParsedData([]);
    setColumns([]);
    setErrors([]);
    setProgress(0);
  }, []);

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
          Only administrators can upload datasets.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-4xl space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Upload Dataset</h1>
        <p className="mt-1 text-zinc-400">
          Import a CSV file to create a new labeling dataset
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-4">
        {['Upload', 'Preview', 'Save'].map((label, idx) => {
          const stepIndex = idx;
          const currentStepIndex = step === 'upload' ? 0 : step === 'preview' ? 1 : 2;
          const isActive = stepIndex === currentStepIndex;
          const isComplete = stepIndex < currentStepIndex;
          
          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  isComplete
                    ? 'bg-green-500 text-white'
                    : isActive
                    ? 'bg-blue-500 text-white'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {isComplete ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
              </div>
              <span
                className={isActive ? 'font-medium text-zinc-100' : 'text-zinc-500'}
              >
                {label}
              </span>
              {idx < 2 && (
                <div className="mx-2 h-px w-8 bg-zinc-700" />
              )}
            </div>
          );
        })}
      </div>

      {/* Content based on step */}
      {step === 'upload' && (
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-lg text-zinc-100">Select CSV File</CardTitle>
            <CardDescription className="text-zinc-400">
              Upload a CSV file with comment data. Required column: text (or comment, content)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload onFileSelect={handleFileSelect} accept=".csv" maxSize={50} />
            
            <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
              <h4 className="mb-2 text-sm font-medium text-zinc-300">Expected CSV Format</h4>
              <code className="block overflow-x-auto text-xs text-zinc-400">
                text,videoId,videoTitle,channelName,likes<br />
                &quot;Great video!&quot;,abc123,&quot;Tutorial Video&quot;,MyChannel,42<br />
                &quot;Thanks for sharing&quot;,abc123,&quot;Tutorial Video&quot;,MyChannel,15
              </code>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'preview' && (
        <>
          {/* Dataset name input */}
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label htmlFor="datasetName" className="text-zinc-300">
                  Dataset Name
                </Label>
                <Input
                  id="datasetName"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  placeholder="Enter a name for this dataset"
                  className="border-zinc-700 bg-zinc-800/50 text-zinc-100"
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Preview */}
          <UploadPreview
            fileName={fileName}
            data={parsedData}
            columns={columns}
            errors={errors}
            requiredColumns={REQUIRED_COLUMNS}
          />
          
          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleReset}
              className="border-zinc-700 bg-zinc-800/50"
            >
              Back
            </Button>
            <Button
              onClick={handleSave}
              disabled={!datasetName.trim() || parsedData.length === 0}
              className="bg-blue-600 hover:bg-blue-500"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload {parsedData.length.toLocaleString()} Comments
            </Button>
          </div>
        </>
      )}

      {step === 'saving' && (
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-blue-500" />
            <h3 className="text-lg font-semibold text-zinc-100">Uploading Dataset</h3>
            <p className="mt-2 text-zinc-400">
              Saving {parsedData.length.toLocaleString()} comments to database...
            </p>
            
            {/* Progress bar */}
            <div className="mt-6 w-full max-w-md">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-zinc-400">Progress</span>
                <span className="font-mono text-zinc-300">{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                <motion.div
                  className="h-full bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
