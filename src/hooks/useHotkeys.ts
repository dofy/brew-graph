import { useHotkeys } from 'react-hotkeys-hook';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSearchStore } from '@/stores/useSearchStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useSyncStore } from '@/stores/useSyncStore';

export function useGlobalHotkeys() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSearchOpen, isSearchOpen } = useSearchStore();
  const { toggleTheme, toggleSidebar } = useSettingsStore();
  const { sync, isSyncing } = useSyncStore();

  useHotkeys('mod+k', (e) => {
    e.preventDefault();
    setSearchOpen(true);
  }, { enableOnFormTags: true });

  useHotkeys('/', (e) => {
    if (isSearchOpen) return;
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
    e.preventDefault();
    setSearchOpen(true);
  });

  useHotkeys('escape', () => {
    if (isSearchOpen) {
      setSearchOpen(false);
    }
  });

  useHotkeys('d', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
    toggleTheme();
  });

  useHotkeys('mod+b', (e) => {
    e.preventDefault();
    toggleSidebar();
  });

  useHotkeys('g h', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
    e.preventDefault();
    navigate('/');
  });

  useHotkeys('g f', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
    e.preventDefault();
    navigate('/favorites');
  });

  useHotkeys('mod+shift+r', (e) => {
    e.preventDefault();
    if (!isSyncing) {
      sync(true);
    }
  });

  useHotkeys('backspace', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
    
    if (location.pathname.startsWith('/formula/') || location.pathname.startsWith('/cask/')) {
      e.preventDefault();
      navigate(-1);
    }
  });
}
