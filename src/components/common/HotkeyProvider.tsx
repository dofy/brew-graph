import { useGlobalHotkeys } from '@/hooks/useHotkeys';

export function HotkeyProvider({ children }: { children: React.ReactNode }) {
  useGlobalHotkeys();
  return <>{children}</>;
}
