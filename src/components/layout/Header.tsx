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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useSyncStore } from "@/stores/useSyncStore";
import { SearchTrigger } from "@/components/search/SearchTrigger";
import { HotkeyHelp } from "@/components/common/HotkeyHelp";
import { cn } from "@/lib/utils";

export function Header() {
  const { theme, setTheme, pageWidth, togglePageWidth } = useSettingsStore();
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
          "flex h-14 items-center px-4 gap-4 mx-auto",
          pageWidth === "contained" && "container max-w-6xl"
        )}
      >
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <img src="/homebrew.svg" alt="Homebrew" className="h-7 w-7" />
          <span className="font-semibold text-lg hidden sm:inline">
            Brew Graph
          </span>
        </Link>

        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-xl">
            <SearchTrigger />
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
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

          <Button
            variant="ghost"
            size="icon"
            onClick={() => sync(true)}
            disabled={isSyncing}
            title={formatLastSync()}
          >
            <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={togglePageWidth}
            title={
              pageWidth === "full"
                ? "Switch to contained width (W)"
                : "Switch to full width (W)"
            }
          >
            {pageWidth === "full" ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>

          <HotkeyHelp />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" title="Theme (D)">
                {theme === "light" ? (
                  <Sun className="h-4 w-4" />
                ) : theme === "dark" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Monitor className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
