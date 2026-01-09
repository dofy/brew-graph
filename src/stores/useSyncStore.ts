import { create } from 'zustand';
import { syncData, type SyncProgress } from '@/db/sync';
import { getLastSyncTime, isSyncExpired, hasData } from '@/db';

interface SyncState {
  isSyncing: boolean;
  progress: SyncProgress;
  lastSyncTime: number | null;
  formulaeCount: number;
  caskCount: number;
  error: string | null;
  needsSync: boolean;
  
  checkSyncStatus: () => Promise<void>;
  sync: (force?: boolean) => Promise<void>;
  clearError: () => void;
}

const initialProgress: SyncProgress = {
  stage: 'idle',
  progress: 0,
  message: '',
};

export const useSyncStore = create<SyncState>((set, get) => ({
  isSyncing: false,
  progress: initialProgress,
  lastSyncTime: null,
  formulaeCount: 0,
  caskCount: 0,
  error: null,
  needsSync: true,

  checkSyncStatus: async () => {
    const [lastSyncTime, expired, dataExists] = await Promise.all([
      getLastSyncTime(),
      isSyncExpired(),
      hasData(),
    ]);
    
    set({
      lastSyncTime,
      needsSync: expired || !dataExists,
    });
  },

  sync: async (force = false) => {
    const { isSyncing } = get();
    if (isSyncing) return;

    set({ isSyncing: true, error: null, progress: initialProgress });

    try {
      const result = await syncData(
        (progress) => set({ progress }),
        force
      );
      
      set({
        formulaeCount: result.formulaeCount,
        caskCount: result.caskCount,
        lastSyncTime: Date.now(),
        needsSync: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Sync failed',
      });
    } finally {
      set({ isSyncing: false });
    }
  },

  clearError: () => set({ error: null }),
}));
