import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSearchStore } from '@/stores/useSearchStore';

export function SearchTrigger() {
  const { setSearchOpen } = useSearchStore();

  return (
    <Button
      variant="outline"
      className="w-full justify-start text-muted-foreground"
      onClick={() => setSearchOpen(true)}
    >
      <Search className="mr-2 h-4 w-4" />
      <span className="hidden sm:inline">Search packages...</span>
      <span className="sm:hidden">Search...</span>
      <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium opacity-100 sm:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  );
}
