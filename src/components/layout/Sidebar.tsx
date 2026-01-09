import { Link, useLocation } from "react-router-dom";
import { Home, Heart, Package, Box, Tags, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useSearchStore } from "@/stores/useSearchStore";
import { useFavoriteStore } from "@/stores/useFavoriteStore";
import { usePackageCounts } from "@/hooks/usePackages";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/favorites", icon: Heart, label: "Favorites" },
];

function SidebarContent() {
  const location = useLocation();
  const { setType, setTag, setFavoritesOnly, type, tag } = useSearchStore();
  const { allTags, favorites } = useFavoriteStore();
  const counts = usePackageCounts();

  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link key={item.to} to={item.to}>
              <Button
                variant={location.pathname === item.to ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
                {item.to === "/favorites" && favorites.size > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {favorites.size}
                  </Badge>
                )}
              </Button>
            </Link>
          ))}
        </nav>
      </div>

      <Separator />

      <div className="p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          Categories
        </h3>
        <div className="space-y-1">
          <Button
            variant={type === "all" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => {
              setType("all");
              setFavoritesOnly(false);
            }}
          >
            <Package className="mr-2 h-4 w-4" />
            All
            {counts && (
              <Badge variant="outline" className="ml-auto">
                {counts.total.toLocaleString()}
              </Badge>
            )}
          </Button>
          <Button
            variant={type === "formula" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => {
              setType("formula");
              setFavoritesOnly(false);
            }}
          >
            <Package className="mr-2 h-4 w-4" />
            Formulae
            {counts && (
              <Badge variant="outline" className="ml-auto">
                {counts.formulaeCount.toLocaleString()}
              </Badge>
            )}
          </Button>
          <Button
            variant={type === "cask" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => {
              setType("cask");
              setFavoritesOnly(false);
            }}
          >
            <Box className="mr-2 h-4 w-4" />
            Casks
            {counts && (
              <Badge variant="outline" className="ml-auto">
                {counts.caskCount.toLocaleString()}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {allTags.size > 0 && (
        <>
          <Separator />
          <div className="p-4 flex-1 overflow-hidden">
            <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
              <Tags className="mr-2 h-4 w-4" />
              Tags
            </h3>
            <ScrollArea className="h-[200px]">
              <div className="space-y-1">
                {Array.from(allTags).map((t) => (
                  <Button
                    key={t}
                    variant={tag === t ? "secondary" : "ghost"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setTag(tag === t ? null : t)}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
}

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useSettingsStore();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-background">
        <ScrollArea className="flex-1">
          <SidebarContent />
        </ScrollArea>
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex items-center justify-between p-4 border-b">
            <span className="font-semibold">Menu</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
}
