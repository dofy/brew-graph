import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useSyncStore } from '@/stores/useSyncStore';
import { useFavoriteStore } from '@/stores/useFavoriteStore';
import { usePackageSnapshot } from '@/stores/usePackageSnapshot';

export function SyncOverlay() {
  const { isSyncing, progress, needsSync, sync, checkSyncStatus } = useSyncStore();
  const { loadFromDB, isLoading: favoritesLoading } = useFavoriteStore();
  const loadSnapshot = usePackageSnapshot((s) => s.load);
  const reloadSnapshot = usePackageSnapshot((s) => s.reload);
  const snapshotLoaded = usePackageSnapshot((s) => s.isLoaded);

  useEffect(() => {
    const init = async () => {
      await checkSyncStatus();
      await loadFromDB();
    };
    init();
  }, [checkSyncStatus, loadFromDB]);

  useEffect(() => {
    if (needsSync && !isSyncing) {
      sync();
    }
  }, [needsSync, isSyncing, sync]);

  // Load the in-memory snapshot once data is available, and refresh it after
  // a sync completes (covers both initial sync and user-triggered refresh).
  useEffect(() => {
    if (isSyncing) return;
    if (needsSync) return;
    if (!snapshotLoaded) {
      loadSnapshot();
    } else if (progress.stage === 'done') {
      reloadSnapshot();
    }
  }, [isSyncing, needsSync, snapshotLoaded, progress.stage, loadSnapshot, reloadSnapshot]);

  if (!isSyncing && !favoritesLoading && !needsSync) {
    return null;
  }

  if (!isSyncing && favoritesLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 p-8 rounded-lg bg-card border shadow-lg max-w-sm w-full mx-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="text-center">
          <h3 className="font-semibold text-lg mb-1">Syncing Data</h3>
          <p className="text-sm text-muted-foreground">{progress.message || 'Initializing...'}</p>
        </div>
        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${progress.progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {Math.round(progress.progress)}% complete
        </p>
      </div>
    </div>
  );
}
