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
    console.log('[Main] Worker created:', worker);

    dispatch(loadingStarted());

    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const msg = e.data;
      console.log('[Main] Message from worker:', msg.type);

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

    console.log('[Main] Posting message to worker...');
    worker.postMessage({ url: '/ui_demo.json' });

  }, [dispatch]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-center z-50">
      <div className="w-full max-w-md px-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold text-white tracking-tight">
            KAI <span className="text-red-500">Security</span>
          </div>
          <p className="text-gray-400 text-sm">
            Loading vulnerability dataset...
          </p>
        </div>

        <div className="space-y-2">
          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full bg-red-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{totalLoaded.toLocaleString()} vulnerabilities loaded</span>
            <span>{progress}%</span>
          </div>
        </div>

        <div className="flex justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}