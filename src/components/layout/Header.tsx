import { Link } from "react-router-dom";
import {
  Moon,
  Sun,
  Monitor,
  RefreshCw,
  Heart,
  Maximize2,
  Minimize2,
  Tags,
  Settings2,
  Github,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useSyncStore } from "@/stores/useSyncStore";
import { SearchTrigger } from "@/components/search/SearchTrigger";
import { HotkeyHelp } from "@/components/common/HotkeyHelp";
import { cn } from "@/lib/utils";

export function Header() {
  const { setTheme, pageWidth, togglePageWidth } = useSettingsStore();
  const { isSyncing, sync, lastSyncTime } = useSyncStore();

  const formatLastSync = () => {
    if (!lastSyncTime) return "Never synced";
    const date = new Date(lastSyncTime);
    return `Last sync: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div
        className={cn(
          "flex h-14 items-center px-4 gap-3 mx-auto",
          pageWidth === "contained" && "container max-w-6xl"
        )}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src="/homebrew.svg" alt="Homebrew" className="h-7 w-7" />
          <span className="font-semibold text-lg hidden sm:inline">
            Brew Graph
          </span>
        </Link>

        {/* Search */}
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-xl">
            <SearchTrigger />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" asChild>
            <a
              href="https://github.com/dofy/brew-graph"
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
          </Button>

          <Link to="/favorites">
            <Button variant="ghost" size="icon" title="Favorites (Shift+F)">
              <Heart className="h-4 w-4" />
            </Button>
          </Link>

          <Link to="/tags">
            <Button variant="ghost" size="icon" title="Tags (Shift+T)">
              <Tags className="h-4 w-4" />
            </Button>
          </Link>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Settings dropdown - combines less frequently used actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" title="Settings">
                <Settings2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Theme</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="mr-2 h-4 w-4" />
                System
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Layout</DropdownMenuLabel>
              <DropdownMenuItem onClick={togglePageWidth}>
                {pageWidth === "full" ? (
                  <Minimize2 className="mr-2 h-4 w-4" />
                ) : (
                  <Maximize2 className="mr-2 h-4 w-4" />
                )}
                {pageWidth === "full" ? "Contained width" : "Full width"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => sync(true)} disabled={isSyncing}>
                <RefreshCw
                  className={cn("mr-2 h-4 w-4", isSyncing && "animate-spin")}
                />
                {isSyncing ? "Syncing..." : "Sync data"}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-xs text-muted-foreground"
                disabled
              >
                {formatLastSync()}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <HotkeyHelp />
        </div>
      </div>
    </header>
  );
}
