// src/workers/dataLoader.worker.ts
import { JSONParser } from '@streamparser/json';
import type { RawImage, RawVulnerability, Vulnerability, WorkerMessage } from '../types';

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
      self.postMessage({ type: 'ERROR', message: `HTTP ${response.status}` } as WorkerMessage);
      return;
    }

    const contentLength = Number(response.headers.get('Content-Length') ?? '0');
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    let bytesReceived = 0;
    let batch: Vulnerability[] = [];
    let totalLoaded = 0;

    // Context state — updated as the parser walks group → repo → image
    let currentGroup: string | null = null;
    let currentRepo: string | null = null;

    const parser = new JSONParser({
      paths: [
        '$.groups.*.name',            // group display names
        '$.groups.*.repos.*.name',    // repo display names
        '$.groups.*.repos.*.images.*' // full image objects (buffered individually)
      ],
      // keepStack defaults to true — required so we can inspect ancestry in onValue
    });

    parser.onValue = ({ value, key, stack }) => {
      if (key === 'name' && typeof value === 'string') {
        // Distinguish group name from repo name by whether 'repos' appears in ancestry.
        // Avoids fragile depth magic-numbers; works regardless of stack.length.
        const insideRepos = stack.some((s) => s.key === 'repos');
        if (insideRepos) {
          currentRepo = value;
        } else {
          currentGroup = value;
          currentRepo = null; // reset repo context when entering a new group
        }
        return;
      }

      // Image object — emitted once the full image has been parsed off the stream
      if (!currentGroup || !currentRepo) return;
      const image = value as unknown as RawImage;

      for (const raw of image.vulnerabilities ?? []) {
        batch.push(transformVulnerability(raw as RawVulnerability, currentGroup, currentRepo, image));
        totalLoaded++;

        if (batch.length >= BATCH_SIZE) {
          self.postMessage({ type: 'BATCH', payload: batch } as WorkerMessage);
          batch = [];
          self.postMessage({ type: 'PROGRESS', loaded: totalLoaded } as WorkerMessage);
        }
      }
    };

    // Feed chunks to the parser as they arrive, reporting download progress in parallel
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      bytesReceived += value.byteLength;
      if (contentLength > 0) {
        self.postMessage({
          type: 'PROGRESS',
          loaded: totalLoaded,
          downloadPercent: Math.round((bytesReceived / contentLength) * 100),
        } as WorkerMessage);
      }

      parser.write(decoder.decode(value, { stream: true }));
    }

    // Flush last partial batch
    if (batch.length > 0) {
      self.postMessage({ type: 'BATCH', payload: batch } as WorkerMessage);
    }

    self.postMessage({ type: 'DONE', total: totalLoaded } as WorkerMessage);

  } catch (err) {
    console.error('[Worker] Error:', err);
    self.postMessage({
      type: 'ERROR',
      message: err instanceof Error ? err.message : 'Unknown error',
    } as WorkerMessage);
  }
};
