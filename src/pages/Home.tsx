import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Search,
  X,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PackageGrid } from "@/components/package/PackageGrid";
import { TagDialog } from "@/components/common/TagDialog";
import { useSearchStore } from "@/stores/useSearchStore";
import {
  useSearchPackages,
  usePackageCounts,
  useTotalPackageCount,
  type PackageItem,
} from "@/hooks/usePackages";
import { useCardNavigation } from "@/hooks/useCardNavigation";
import { useSEO } from "@/hooks/useSEO";
import type { PackageType } from "@/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 30;

export function Home() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { hideDeprecated, setHideDeprecated, selectedIndex, setSelectedIndex } =
    useSearchStore();
  const [tagDialogPkg, setTagDialogPkg] = useState<PackageItem | null>(null);
  const isFirstRender = useRef(true);

  const query = searchParams.get("q") || "";
  const type = (searchParams.get("type") as PackageType | "all") || "all";
  const tag = searchParams.get("tag") || null;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

  // SEO
  useSEO({
    title: query
      ? `Search: ${query}${page > 1 ? ` - Page ${page}` : ""}`
      : page > 1
      ? `Page ${page}`
      : undefined,
    description: query
      ? `Search results for "${query}" in Homebrew packages`
      : undefined,
  });

  const packages = useSearchPackages(
    query,
    type,
    tag,
    false,
    hideDeprecated,
    PAGE_SIZE,
    (page - 1) * PAGE_SIZE
  );
  const counts = usePackageCounts();
  const totalCount = useTotalPackageCount(query, type, tag, hideDeprecated);

  const totalPages = Math.ceil((totalCount || 0) / PAGE_SIZE);

  const { containerRef } = useCardNavigation({
    packages,
    onTagRequest: (pkg) => setTagDialogPkg(pkg),
  });

  // Reset page and scroll to top when filters change
  useEffect(() => {
    setSelectedIndex(0);

    // Don't scroll on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [query, type, tag, hideDeprecated, page, setSelectedIndex]);

  const updateSearchParams = useCallback(
    (updates: Record<string, string | null>) => {
      const newParams = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (
          value === null ||
          value === "" ||
          (key === "type" && value === "all") ||
          (key === "page" && value === "1")
        ) {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });
      const queryString = newParams.toString();
      navigate(queryString ? `/?${queryString}` : "/", { replace: true });
    },
    [searchParams, navigate]
  );

  const handleQueryChange = (value: string) => {
    updateSearchParams({ q: value || null, page: null });
  };

  const handleTypeChange = (value: string) => {
    updateSearchParams({ type: value === "all" ? null : value, page: null });
  };

  const clearTag = () => {
    updateSearchParams({ tag: null, page: null });
  };

  const clearQuery = () => {
    updateSearchParams({ q: null, page: null });
  };

  const goToPage = useCallback(
    (newPage: number) => {
      if (newPage < 1 || newPage > totalPages) return;
      updateSearchParams({ page: newPage === 1 ? null : String(newPage) });
    },
    [totalPages, updateSearchParams]
  );

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search packages... (Press / to focus)"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="pl-9 pr-9"
            />
            {query && (
              <button
                onClick={clearQuery}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Tabs value={type} onValueChange={handleTypeChange}>
              <TabsList>
                <TabsTrigger value="all" title="All packages (1)">
                  All {counts && `(${counts.total.toLocaleString()})`}
                </TabsTrigger>
                <TabsTrigger value="formula" title="Formulae only (2)">
                  Formulae{" "}
                  {counts && `(${counts.formulaeCount.toLocaleString()})`}
                </TabsTrigger>
                <TabsTrigger value="cask" title="Casks only (3)">
                  Casks {counts && `(${counts.caskCount.toLocaleString()})`}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setHideDeprecated(!hideDeprecated)}
              title={
                hideDeprecated
                  ? "Show deprecated packages (X)"
                  : "Hide deprecated packages (X)"
              }
              className={cn(
                hideDeprecated &&
                  "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
              )}
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {(tag || query) && (
          <div className="flex items-center gap-2 flex-wrap">
            {query && (
              <Badge variant="secondary" className="gap-1">
                Search: {query}
                <button
                  onClick={clearQuery}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {tag && (
              <Badge variant="secondary" className="gap-1">
                Tag: {tag}
                <button
                  onClick={clearTag}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      <PackageGrid
        ref={containerRef}
        packages={packages}
        selectedIndex={selectedIndex}
        onTagRequest={(pkg) => setTagDialogPkg(pkg)}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => goToPage(1)}
            disabled={!hasPrev}
            title="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => goToPage(page - 1)}
            disabled={!hasPrev}
            title="Previous page ([)"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1 px-2 text-sm">
            <span className="text-muted-foreground">Page</span>
            <span className="font-medium">{page}</span>
            <span className="text-muted-foreground">of</span>
            <span className="font-medium">{totalPages}</span>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => goToPage(page + 1)}
            disabled={!hasNext}
            title="Next page (])"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => goToPage(totalPages)}
            disabled={!hasNext}
            title="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <TagDialog
        pkg={tagDialogPkg}
        open={!!tagDialogPkg}
        onOpenChange={(open) => !open && setTagDialogPkg(null)}
      />
    </div>
  );
}
