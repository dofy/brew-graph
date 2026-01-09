import { db, setLastSyncTime, isSyncExpired, hasData, clearAllData } from './index';
import type { Formula, Cask } from '@/types';

const FORMULA_API = 'https://formulae.brew.sh/api/formula.json';
const CASK_API = 'https://formulae.brew.sh/api/cask.json';

export interface SyncProgress {
  stage: 'idle' | 'fetching-formulae' | 'fetching-casks' | 'storing-formulae' | 'storing-casks' | 'done' | 'error';
  progress: number;
  message: string;
}

export type SyncProgressCallback = (progress: SyncProgress) => void;

async function fetchFormulae(): Promise<Formula[]> {
  const response = await fetch(FORMULA_API);
  if (!response.ok) {
    throw new Error(`Failed to fetch formulae: ${response.statusText}`);
  }
  return response.json();
}

async function fetchCasks(): Promise<Cask[]> {
  const response = await fetch(CASK_API);
  if (!response.ok) {
    throw new Error(`Failed to fetch casks: ${response.statusText}`);
  }
  return response.json();
}

export async function syncData(
  onProgress?: SyncProgressCallback,
  force = false
): Promise<{ formulaeCount: number; caskCount: number }> {
  const report = (stage: SyncProgress['stage'], progress: number, message: string) => {
    onProgress?.({ stage, progress, message });
  };

  try {
    if (!force) {
      const expired = await isSyncExpired();
      const dataExists = await hasData();
      
      if (!expired && dataExists) {
        report('done', 100, 'Data is up to date');
        const formulaeCount = await db.formulae.count();
        const caskCount = await db.casks.count();
        return { formulaeCount, caskCount };
      }
    }

    report('fetching-formulae', 10, 'Fetching formulae data...');
    const formulae = await fetchFormulae();

    report('fetching-casks', 30, 'Fetching casks data...');
    const casks = await fetchCasks();

    report('storing-formulae', 50, 'Storing formulae...');
    await clearAllData();
    
    const BATCH_SIZE = 500;
    for (let i = 0; i < formulae.length; i += BATCH_SIZE) {
      const batch = formulae.slice(i, i + BATCH_SIZE);
      await db.formulae.bulkPut(batch);
      const progress = 50 + ((i / formulae.length) * 20);
      report('storing-formulae', progress, `Storing formulae... (${Math.min(i + BATCH_SIZE, formulae.length)}/${formulae.length})`);
    }

    report('storing-casks', 70, 'Storing casks...');
    for (let i = 0; i < casks.length; i += BATCH_SIZE) {
      const batch = casks.slice(i, i + BATCH_SIZE);
      await db.casks.bulkPut(batch);
      const progress = 70 + ((i / casks.length) * 25);
      report('storing-casks', progress, `Storing casks... (${Math.min(i + BATCH_SIZE, casks.length)}/${casks.length})`);
    }

    await setLastSyncTime(Date.now());
    report('done', 100, 'Sync completed');

    return { formulaeCount: formulae.length, caskCount: casks.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    report('error', 0, message);
    throw error;
  }
}

export async function checkAndSync(
  onProgress?: SyncProgressCallback
): Promise<{ formulaeCount: number; caskCount: number } | null> {
  const expired = await isSyncExpired();
  const dataExists = await hasData();

  if (!expired && dataExists) {
    return null;
  }

  return syncData(onProgress, false);
}
