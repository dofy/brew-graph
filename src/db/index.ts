import Dexie, { type Table } from 'dexie';
import type { Formula, Cask, Favorite, Tag, SyncMeta } from '@/types';

export class BrewDatabase extends Dexie {
  formulae!: Table<Formula, string>;
  casks!: Table<Cask, string>;
  favorites!: Table<Favorite, number>;
  tags!: Table<Tag, number>;
  meta!: Table<SyncMeta, string>;

  constructor() {
    super('BrewGraph');
    
    this.version(1).stores({
      formulae: 'name, full_name, desc',
      casks: 'token, full_token, desc',
      favorites: '++id, [name+type], type, createdAt',
      tags: '++id, [name+type+tag], [name+type], tag, createdAt',
      meta: 'key',
    });
  }
}

export const db = new BrewDatabase();

export async function getLastSyncTime(): Promise<number | null> {
  const meta = await db.meta.get('lastSyncTime');
  return meta?.value as number | null;
}

export async function setLastSyncTime(time: number): Promise<void> {
  await db.meta.put({ key: 'lastSyncTime', value: time });
}

export async function isSyncExpired(hours = 48): Promise<boolean> {
  const lastSync = await getLastSyncTime();
  if (!lastSync) return true;
  
  const expireTime = hours * 60 * 60 * 1000;
  return Date.now() - lastSync > expireTime;
}

export async function clearAllData(): Promise<void> {
  await Promise.all([
    db.formulae.clear(),
    db.casks.clear(),
  ]);
}

export async function getFormulaCount(): Promise<number> {
  return db.formulae.count();
}

export async function getCaskCount(): Promise<number> {
  return db.casks.count();
}

export async function hasData(): Promise<boolean> {
  const [formulaCount, caskCount] = await Promise.all([
    getFormulaCount(),
    getCaskCount(),
  ]);
  return formulaCount > 0 || caskCount > 0;
}
