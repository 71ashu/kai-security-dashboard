// src/components/DataLoader/DataLoader.tsx
import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  loadingStarted,
  batchReceived,
  progressUpdated,
  downloadProgressUpdated,
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
  const downloadProgress = useAppSelector((s) => s.vulnerabilities.downloadProgress);
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
          if (msg.downloadPercent !== undefined) {
            dispatch(downloadProgressUpdated(msg.downloadPercent));
          } else {
            dispatch(progressUpdated(msg.loaded));
          }
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

  // With streaming, download and parse overlap — this only triggers if the download
  // finishes before the first image object has been fully parsed (very large images).
  const isParsing = totalLoaded === 0 && downloadProgress >= 100;
  const isDownloading = totalLoaded === 0 && downloadProgress < 100;
  const barPercent = isDownloading ? downloadProgress : progress;

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center z-50">
      <div className="w-full max-w-md px-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold text-gray-900 tracking-tight dark:text-white">
            KAI <span className="text-red-600 dark:text-red-500">Security</span>
          </div>
          <p className="text-gray-600 text-sm dark:text-gray-400">
            {isDownloading
              ? 'Downloading & parsing vulnerability dataset...'
              : isParsing
              ? 'Finalizing dataset...'
              : 'Loading vulnerability dataset...'}
          </p>
        </div>

        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden dark:bg-gray-800">
            {isParsing ? (
              // Indeterminate bar — fallback for when download finishes before first batch
              <div className="h-2 w-full relative overflow-hidden rounded-full bg-red-200 dark:bg-red-900">
                <div className="absolute inset-y-0 w-1/3 bg-red-600 dark:bg-red-500 rounded-full animate-[indeterminate_1.4s_ease-in-out_infinite]" />
              </div>
            ) : (
              <div
                className="h-2 rounded-full bg-red-600 dark:bg-red-500 transition-all duration-300 ease-out"
                style={{ width: `${barPercent}%` }}
              />
            )}
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500">
            <span>
              {isDownloading
                ? 'Downloading...'
                : isParsing
                ? 'Finalizing...'
                : `${totalLoaded.toLocaleString()} vulnerabilities loaded`}
            </span>
            <span>{isParsing ? '—' : `${barPercent}%`}</span>
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