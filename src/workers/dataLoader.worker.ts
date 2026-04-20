// src/workers/dataLoader.worker.ts
import type { RawGroup, RawImage, RawVulnerability, Vulnerability, WorkerMessage } from '../types/vulnerability';

const BATCH_SIZE = 500;

function transformVulnerability(
  raw: RawVulnerability,
  groupName: string,
  repoName: string,
  image: RawImage
): Vulnerability {
  return {
    ...raw,
    id: `${groupName}__${repoName}__${image.version}__${raw.cve}`,
    groupName,
    repoName,
    imageName: image.name,
    imageVersion: image.version,
    riskFactorList: Object.keys(raw.riskFactors ?? {}),
  };
}

self.onmessage = async (e: MessageEvent<{ url: string }>) => {
  const { url } = e.data;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const msg: WorkerMessage = { type: 'ERROR', message: `HTTP ${response.status}` };
      self.postMessage(msg);
      return;
    }

    const contentLength = Number(response.headers.get('Content-Length') ?? '0');
    const reader = response.body!.getReader();
    const chunks: Uint8Array[] = [];
    let bytesReceived = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      bytesReceived += value.byteLength;
      if (contentLength > 0) {
        const downloadProgress: WorkerMessage = {
          type: 'PROGRESS',
          loaded: 0,
          downloadPercent: Math.round((bytesReceived / contentLength) * 100),
        };
        self.postMessage(downloadProgress);
      }
    }

    const merged = new Uint8Array(bytesReceived);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const text = new TextDecoder().decode(merged);
    const data = JSON.parse(text) as { groups: Record<string, RawGroup> };

    let batch: Vulnerability[] = [];
    let totalLoaded = 0;

    for (const groupKey of Object.keys(data.groups)) {
      const group = data.groups[groupKey];
      const groupName = group.name;

      for (const repoKey of Object.keys(group.repos)) {
        const repo = group.repos[repoKey];
        const repoName = repo.name;

        for (const imageKey of Object.keys(repo.images)) {
          const image = repo.images[imageKey];

          for (const raw of image.vulnerabilities ?? []) {
            batch.push(transformVulnerability(raw, groupName, repoName, image));
            totalLoaded++;

            if (batch.length >= BATCH_SIZE) {
              const batchMsg: WorkerMessage = { type: 'BATCH', payload: batch };
              self.postMessage(batchMsg);
              batch = [];

              const progressMsg: WorkerMessage = { type: 'PROGRESS', loaded: totalLoaded };
              self.postMessage(progressMsg);
            }
          }
        }
      }
    }

    if (batch.length > 0) {
      const batchMsg: WorkerMessage = { type: 'BATCH', payload: batch };
      self.postMessage(batchMsg);
    }

    const doneMsg: WorkerMessage = { type: 'DONE', total: totalLoaded };
    self.postMessage(doneMsg);

  } catch (err) {
    console.error('[Worker] Error:', err);
    const errorMsg: WorkerMessage = {
      type: 'ERROR',
      message: err instanceof Error ? err.message : 'Unknown error',
    };
    self.postMessage(errorMsg);
  }
};