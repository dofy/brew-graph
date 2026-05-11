import { db, setLastSyncTime, isSyncExpired, hasData } from './index';
import type { Formula, Cask } from '@/types';

const FORMULA_API = 'https://formulae.brew.sh/api/formula.json';
const CASK_API = 'https://formulae.brew.sh/api/cask.json';
const FORMULA_ANALYTICS_API =
  'https://formulae.brew.sh/api/analytics/install/30d.json';
const CASK_ANALYTICS_API =
  'https://formulae.brew.sh/api/analytics/cask-install/30d.json';

export interface SyncProgress {
  stage:
    | 'idle'
    | 'fetching-formulae'
    | 'fetching-casks'
    | 'fetching-analytics'
    | 'storing-formulae'
    | 'storing-casks'
    | 'done'
    | 'error';
  progress: number;
  message: string;
}

export type SyncProgressCallback = (progress: SyncProgress) => void;

interface AnalyticsItem {
  formula?: string;
  cask?: string;
  count: string;
}

interface AnalyticsResponse {
  items: AnalyticsItem[];
}

export interface AnalyticsSnapshot {
  formula: Record<string, number>;
  cask: Record<string, number>;
  fetchedAt: number;
}

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

function parseCount(value: string): number {
  // Counts come back as US-formatted strings like "131,581".
  const n = parseInt(value.replace(/,/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

async function fetchAnalytics(): Promise<AnalyticsSnapshot> {
  // Analytics are best-effort: a failure here must not block the catalogue
  // sync since search/listing should still work without popularity data.
  const empty: AnalyticsSnapshot = { formula: {}, cask: {}, fetchedAt: 0 };
  try {
    const [formulaResp, caskResp] = await Promise.all([
      fetch(FORMULA_ANALYTICS_API),
      fetch(CASK_ANALYTICS_API),
    ]);

    const result: AnalyticsSnapshot = {
      formula: {},
      cask: {},
      fetchedAt: Date.now(),
    };

    if (formulaResp.ok) {
      const data: AnalyticsResponse = await formulaResp.json();
      for (const item of data.items || []) {
        if (item.formula) result.formula[item.formula] = parseCount(item.count);
      }
    }
    if (caskResp.ok) {
      const data: AnalyticsResponse = await caskResp.json();
      for (const item of data.items || []) {
        if (item.cask) result.cask[item.cask] = parseCount(item.count);
      }
    }
    return result;
  } catch {
    return empty;
  }
}

export async function getAnalytics(): Promise<AnalyticsSnapshot | null> {
  const meta = await db.meta.get('analytics');
  return (meta?.value as AnalyticsSnapshot) ?? null;
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

    report('fetching-analytics', 45, 'Fetching install analytics...');
    const analytics = await fetchAnalytics();

    // Both fetches succeeded — replace local data atomically so a mid-write
    // failure can't leave the user with a half-empty database.
    report('storing-formulae', 50, 'Storing formulae...');

    const BATCH_SIZE = 500;
    await db.transaction('rw', db.formulae, db.casks, db.meta, async () => {
      await db.formulae.clear();
      await db.casks.clear();

      for (let i = 0; i < formulae.length; i += BATCH_SIZE) {
        const batch = formulae.slice(i, i + BATCH_SIZE);
        await db.formulae.bulkPut(batch);
        const progress = 50 + ((i / formulae.length) * 20);
        report(
          'storing-formulae',
          progress,
          `Storing formulae... (${Math.min(i + BATCH_SIZE, formulae.length)}/${formulae.length})`
        );
      }

      report('storing-casks', 70, 'Storing casks...');
      for (let i = 0; i < casks.length; i += BATCH_SIZE) {
        const batch = casks.slice(i, i + BATCH_SIZE);
        await db.casks.bulkPut(batch);
        const progress = 70 + ((i / casks.length) * 25);
        report(
          'storing-casks',
          progress,
          `Storing casks... (${Math.min(i + BATCH_SIZE, casks.length)}/${casks.length})`
        );
      }

      await db.meta.put({ key: 'analytics', value: analytics });
    });

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
