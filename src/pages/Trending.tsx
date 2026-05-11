import { useCallback, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import { PackageGrid } from "@/components/package/PackageGrid";
import { TagDialog } from "@/components/common/TagDialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePackageSnapshot } from "@/stores/usePackageSnapshot";
import { useSearchStore } from "@/stores/useSearchStore";
import { useCardNavigation } from "@/hooks/useCardNavigation";
import { useSEO } from "@/hooks/useSEO";
import type { PackageItem } from "@/hooks/usePackages";
import type { PackageType } from "@/types";

const LIMIT = 60;

function parseType(raw: string | null): PackageType | "all" {
  return raw === "formula" || raw === "cask" ? raw : "all";
}

export function Trending() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = parseType(searchParams.get("type"));

  const setType = useCallback(
    (next: PackageType | "all") => {
      const params = new URLSearchParams(searchParams);
      if (next === "all") params.delete("type");
      else params.set("type", next);
      const qs = params.toString();
      navigate(qs ? `/trending?${qs}` : "/trending", { replace: true });
    },
    [searchParams, navigate]
  );

  const formulae = usePackageSnapshot((s) => s.formulae);
  const casks = usePackageSnapshot((s) => s.casks);
  const isLoaded = usePackageSnapshot((s) => s.isLoaded);
  const analytics = usePackageSnapshot((s) => s.analytics);
  const { hideDeprecated, selectedIndex } = useSearchStore();
  const [tagDialogPkg, setTagDialogPkg] = useState<PackageItem | null>(null);

  useSEO({
    title: "Trending",
    description:
      "Most-installed Homebrew formulae and casks over the last 30 days.",
  });

  const packages = useMemo(() => {
    if (!isLoaded) return undefined;
    const pool: PackageItem[] = [];
    if (type === "all" || type === "formula") pool.push(...formulae);
    if (type === "all" || type === "cask") pool.push(...casks);
    return pool
      .filter((p) => (p.installs30d ?? 0) > 0)
      .filter((p) => !hideDeprecated || (!p.deprecated && !p.disabled))
      .sort((a, b) => (b.installs30d ?? 0) - (a.installs30d ?? 0))
      .slice(0, LIMIT);
  }, [isLoaded, formulae, casks, type, hideDeprecated]);

  const { containerRef } = useCardNavigation({
    packages,
    onTagRequest: (pkg) => setTagDialogPkg(pkg),
  });

  const noAnalytics = isLoaded && !analytics?.fetchedAt;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          <h1 className="text-2xl font-bold">Trending</h1>
          <span className="text-sm text-muted-foreground">
            Most installed in the last 30 days
          </span>
        </div>
        <Tabs value={type} onValueChange={(v) => setType(v as PackageType | "all")}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="formula">Formulae</TabsTrigger>
            <TabsTrigger value="cask">Casks</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {noAnalytics ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Install analytics aren't available yet. Try refreshing data
            (press <kbd className="px-1 py-0.5 rounded bg-muted text-xs">r</kbd>
            ).
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
