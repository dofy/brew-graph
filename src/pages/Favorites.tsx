import { useState } from "react";
import { Heart } from "lucide-react";
import { PackageGrid } from "@/components/package/PackageGrid";
import { TagDialog } from "@/components/common/TagDialog";
import { useSearchPackages, type PackageItem } from "@/hooks/usePackages";
import { useSearchStore } from "@/stores/useSearchStore";
import { useCardNavigation } from "@/hooks/useCardNavigation";
import { useSEO } from "@/hooks/useSEO";

export function Favorites() {
  const { hideDeprecated, selectedIndex } = useSearchStore();

  useSEO({
    title: "Favorites",
    description: "Your favorite Homebrew packages",
  });
  const [tagDialogPkg, setTagDialogPkg] = useState<PackageItem | null>(null);
  const packages = useSearchPackages(
    "",
    "all",
    null,
    true,
    hideDeprecated,
    100
  );

  const { containerRef } = useCardNavigation({
    packages,
    onTagRequest: (pkg) => setTagDialogPkg(pkg),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Heart className="h-5 w-5 text-red-500 fill-red-500" />
        <h1 className="text-2xl font-bold">Favorites</h1>
      </div>

      {packages && packages.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">No favorites yet</h2>
          <p className="text-muted-foreground">
            Press F on any package to add it to your favorites.
          </p>
        </div>
      ) : (
        <PackageGrid
          ref={containerRef}
          packages={packages}
          selectedIndex={selectedIndex}
          onTagRequest={(pkg) => setTagDialogPkg(pkg)}
        />
      )}

      <TagDialog
        pkg={tagDialogPkg}
        open={!!tagDialogPkg}
        onOpenChange={(open) => !open && setTagDialogPkg(null)}
      />
    </div>
  );
}
