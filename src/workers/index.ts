// src/workers/index.ts
export function createDataLoaderWorker(): Worker {
    return new Worker(
      new URL('./dataLoader.worker.ts', import.meta.url),
      { type: 'module' }
    );
  }