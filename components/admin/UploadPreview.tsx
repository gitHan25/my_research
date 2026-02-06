'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface ParsedRow {
  text: string;
  videoId?: string;
  videoTitle?: string;
  channelName?: string;
  originalLikes?: number;
  [key: string]: string | number | undefined;
}

interface UploadPreviewProps {
  fileName: string;
  data: ParsedRow[];
  columns: string[];
  errors: string[];
  requiredColumns: string[];
}

export function UploadPreview({
  fileName,
  data,
  columns,
  errors,
  requiredColumns,
}: UploadPreviewProps) {
  const [showAll, setShowAll] = useState(false);
  const displayData = showAll ? data.slice(0, 100) : data.slice(0, 5);
  
  const missingColumns = requiredColumns.filter((col) => !columns.includes(col));
  const hasRequiredColumns = missingColumns.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Summary Card */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="text-zinc-100">Upload Preview</span>
            <Badge
              variant="outline"
              className={
                hasRequiredColumns && errors.length === 0
                  ? 'border-green-500/50 bg-green-500/10 text-green-400'
                  : 'border-amber-500/50 bg-amber-500/10 text-amber-400'
              }
            >
              {hasRequiredColumns && errors.length === 0 ? (
                <>
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Ready
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Issues Found
                </>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-zinc-800/50 p-3">
              <span className="text-2xl font-bold text-zinc-100">
                {data.length.toLocaleString()}
              </span>
              <p className="text-sm text-zinc-500">Total Rows</p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-3">
              <span className="text-2xl font-bold text-zinc-100">
                {columns.length}
              </span>
              <p className="text-sm text-zinc-500">Columns</p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-3">
              <span className={cn(
                'text-2xl font-bold',
                errors.length > 0 ? 'text-amber-400' : 'text-green-400'
              )}>
                {errors.length}
              </span>
              <p className="text-sm text-zinc-500">Warnings</p>
            </div>
          </div>

          {/* Column mapping */}
          <div>
            <h4 className="mb-2 text-sm font-medium text-zinc-400">Detected Columns</h4>
            <div className="flex flex-wrap gap-2">
              {columns.map((col) => (
                <Badge
                  key={col}
                  variant="outline"
                  className={cn(
                    requiredColumns.includes(col)
                      ? 'border-green-500/50 bg-green-500/10 text-green-400'
                      : 'border-zinc-700 bg-zinc-800/50 text-zinc-400'
                  )}
                >
                  {col}
                  {requiredColumns.includes(col) && (
                    <CheckCircle2 className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Missing columns warning */}
          {missingColumns.length > 0 && (
            <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-400" />
                <div>
                  <p className="text-sm font-medium text-amber-400">
                    Missing required column{missingColumns.length > 1 ? 's' : ''}
                  </p>
                  <p className="mt-1 text-xs text-amber-400/80">
                    {missingColumns.join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3">
              <p className="text-sm font-medium text-zinc-400">Warnings</p>
              <ul className="mt-2 space-y-1">
                {errors.slice(0, 5).map((error, i) => (
                  <li key={i} className="text-xs text-zinc-500">
                    • {error}
                  </li>
                ))}
                {errors.length > 5 && (
                  <li className="text-xs text-zinc-500">
                    ...and {errors.length - 5} more
                  </li>
                )}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Preview */}
      <Card className="border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-zinc-100">
            Sample Data
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="w-[60px] text-zinc-400">#</TableHead>
                  {columns.slice(0, 5).map((col) => (
                    <TableHead key={col} className="text-zinc-400">
                      {col}
                    </TableHead>
                  ))}
                  {columns.length > 5 && (
                    <TableHead className="text-zinc-500">
                      +{columns.length - 5} more
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayData.map((row, idx) => (
                  <TableRow key={idx} className="border-zinc-800">
                    <TableCell className="font-mono text-sm text-zinc-500">
                      {idx + 1}
                    </TableCell>
                    {columns.slice(0, 5).map((col) => (
                      <TableCell key={col} className="max-w-[200px] truncate text-zinc-300">
                        {String(row[col] ?? '')}
                      </TableCell>
                    ))}
                    {columns.length > 5 && (
                      <TableCell className="text-zinc-500">...</TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Show more button */}
          {data.length > 5 && (
            <div className="border-t border-zinc-800 p-2">
              <button
                onClick={() => setShowAll(!showAll)}
                className="flex w-full items-center justify-center gap-1 rounded-lg py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show more ({Math.min(data.length, 100)} rows)
                  </>
                )}
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default UploadPreview;
