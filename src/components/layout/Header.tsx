import { Beer, Menu, Moon, Sun, Monitor, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useSyncStore } from '@/stores/useSyncStore';
import { SearchTrigger } from '@/components/search/SearchTrigger';
import { cn } from '@/lib/utils';

export function Header() {
  const { theme, setTheme, toggleSidebar } = useSettingsStore();
  const { isSyncing, sync, lastSyncTime } = useSyncStore();

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never synced';
    const date = new Date(lastSyncTime);
    return `Last sync: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2">
          <Beer className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg hidden sm:inline">Brew Graph</span>
        </div>

        <div className="flex-1 max-w-xl mx-auto">
          <SearchTrigger />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => sync(true)}
            disabled={isSyncing}
            title={formatLastSync()}
          >
            <RefreshCw className={cn('h-4 w-4', isSyncing && 'animate-spin')} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                {theme === 'light' ? (
                  <Sun className="h-4 w-4" />
                ) : theme === 'dark' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Monitor className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Monitor className="mr-2 h-4 w-4" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
