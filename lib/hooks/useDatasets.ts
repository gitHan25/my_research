'use client';

/**
 * useDatasets Hook
 * 
 * Manages dataset fetching and selection.
 */

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Dataset } from '@/types';

interface UseDatasetReturn {
  datasets: Dataset[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useDatasets(): UseDatasetReturn {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDatasets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const datasetsRef = collection(db, 'datasets');
      const q = query(datasetsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const datasetsList: Dataset[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Dataset[];
      
      setDatasets(datasetsList);
    } catch (err) {
      console.error('Error loading datasets:', err);
      setError('Failed to load datasets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDatasets();
  }, [loadDatasets]);

  return {
    datasets,
    isLoading,
    error,
    refresh: loadDatasets,
  };
}

export default useDatasets;
