// src/components/DataLoader/DataLoader.tsx
import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  loadingStarted,
  batchReceived,
  progressUpdated,
  loadingCompleted,
  loadingFailed,
} from '../../store/vulnerabilitiesSlice';
import { compareSelectionCleared } from '../../store/comparisonSlice';
import { DATA_URL } from '../../config';
import { createDataLoaderWorker } from '../../workers';
import type { WorkerMessage } from '../../types/vulnerability';

export function DataLoader() {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((s) => s.vulnerabilities.isLoading);
  const totalLoaded = useAppSelector((s) => s.vulnerabilities.totalLoaded);
  const progress = useAppSelector((s) => s.vulnerabilities.loadingProgress);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // If already loading or already loaded, do nothing
    if (workerRef.current) return;

    const worker = createDataLoaderWorker();
    workerRef.current = worker;

    dispatch(loadingStarted());
    dispatch(compareSelectionCleared());

    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const msg = e.data;

      switch (msg.type) {
        case 'BATCH':
          dispatch(batchReceived(msg.payload));
          break;
        case 'PROGRESS':
          dispatch(progressUpdated(msg.loaded));
          break;
        case 'DONE':
          dispatch(loadingCompleted(msg.total));
          worker.terminate();
          workerRef.current = null;
          break;
        case 'ERROR':
          dispatch(loadingFailed(msg.message));
          worker.terminate();
          workerRef.current = null;
          break;
      }
    };

    worker.onerror = (e) => {
      console.error('[Main] Worker error:', e);
      dispatch(loadingFailed(e.message ?? 'Worker failed'));
      worker.terminate();
      workerRef.current = null;
    };

    worker.postMessage({ url: DATA_URL });

  }, [dispatch]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center z-50">
      <div className="w-full max-w-md px-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold text-gray-900 tracking-tight dark:text-white">
            KAI <span className="text-red-600 dark:text-red-500">Security</span>
          </div>
          <p className="text-gray-600 text-sm dark:text-gray-400">
            Loading vulnerability dataset...
          </p>
        </div>

        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden dark:bg-gray-800">
            <div
              className="h-2 rounded-full bg-red-600 dark:bg-red-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500">
            <span>{totalLoaded.toLocaleString()} vulnerabilities loaded</span>
            <span>{progress}%</span>
          </div>
        </div>

        <div className="flex justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-500 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}