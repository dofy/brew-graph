import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { Package, Box, Heart, AlertTriangle, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TypedBadge } from "@/components/common/TypedBadge";
import { useFavoriteStore } from "@/stores/useFavoriteStore";
import { useSearchStore } from "@/stores/useSearchStore";
import { toast } from "sonner";
import type { PackageItem } from "@/hooks/usePackages";
import { cn } from "@/lib/utils";

interface PackageGridProps {
  packages: PackageItem[] | undefined;
  selectedIndex: number;
  isLoading?: boolean;
  onTagRequest?: (pkg: PackageItem) => void;
}

export const PackageGrid = forwardRef<HTMLDivElement, PackageGridProps>(
  function PackageGrid(
    { packages, selectedIndex, isLoading, onTagRequest },
    ref
  ) {
    // Use @container queries for responsive columns based on container width
    // Breakpoints designed for: contained (max-w-6xl = 1152px) shows 3 cols
    const containerClass = "@container";
    const gridClass =
      "grid grid-cols-1 @[500px]:grid-cols-2 @[800px]:grid-cols-3 @[1200px]:grid-cols-4 @[1500px]:grid-cols-5 @[1800px]:grid-cols-6 gap-3";

    if (isLoading || packages === undefined) {
      return (
        <div ref={ref} className={containerClass}>
          <div className={gridClass}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-2 p-3 border rounded-lg">
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-8 w-full" />
                <div className="flex gap-1">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-14" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (packages.length === 0) {
      return (
        <div ref={ref} className="text-center py-12">
          <p className="text-muted-foreground">No packages found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Search tips: use{" "}
            <code className="px-1 py-0.5 bg-muted rounded text-xs">#tag</code>{" "}
            to filter by tag,{" "}
            <code className="px-1 py-0.5 bg-muted rounded text-xs">*</code> for
            favorites only
          </p>
        </div>
      );
    }

    return (
      <div ref={ref} className={containerClass}>
        <div className={gridClass}>
          {packages.map((pkg, index) => (
            <PackageCard
              key={`${pkg.type}-${pkg.name}`}
              pkg={pkg}
              index={index}
              isSelected={index === selectedIndex}
              onTagRequest={onTagRequest}
            />
          ))}
        </div>
      </div>
    );
  }
);

interface PackageCardProps {
  pkg: PackageItem;
  index: number;
  isSelected: boolean;
  onTagRequest?: (pkg: PackageItem) => void;
}

function PackageCard({
  pkg,
  index,
  isSelected,
  onTagRequest,
}: PackageCardProps) {
  const { isFavorite, toggleFavorite, getTags } = useFavoriteStore();
  const { setSelectedIndex } = useSearchStore();
  const favorite = isFavorite(pkg.name, pkg.type);
  const tags = getTags(pkg.name, pkg.type);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(pkg.name, pkg.type);
    toast.success(favorite ? "Removed from favorites" : "Added to favorites");
  };

  const handleTagClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onTagRequest?.(pkg);
  };

  const handleMouseEnter = () => {
    setSelectedIndex(index);
  };

  // Truncate long version strings
  const displayVersion =
    pkg.version.length > 12 ? pkg.version.slice(0, 12) + "…" : pkg.version;

  return (
    <Link
      to={`/${pkg.type}/${pkg.name}`}
      data-card-index={index}
      onMouseEnter={handleMouseEnter}
    >
      <Card
        className={cn(
          "h-full transition-all group gap-1 py-2.5",
          isSelected
            ? "ring-2 ring-primary border-primary"
            : "hover:border-primary/50"
        )}
      >
        <CardHeader className="px-3 py-0">
          <div className="flex items-start justify-between gap-1">
            <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
              {pkg.type === "formula" ? (
                <Package className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <Box className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <CardTitle className="text-sm font-medium truncate min-w-0">
                {pkg.name}
              </CardTitle>
            </div>
            <div className="flex items-center shrink-0">
              {(pkg.deprecated || pkg.disabled) && (
                <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleTagClick}
                title="Add tag (T)"
              >
                <Tag className="h-3 w-3 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleFavoriteClick}
                title="Toggle favorite (F)"
              >
                <Heart
                  className={cn(
                    "h-3 w-3",
                    favorite
                      ? "fill-red-500 text-red-500"
                      : "text-muted-foreground"
                  )}
                />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 py-0">
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2.5">
            {pkg.desc || "No description available"}
          </p>

          <div className="flex items-center gap-1 flex-wrap mb-1.5">
            <TypedBadge type={pkg.type} className="text-[10px] px-1.5 py-0">
              {pkg.type}
            </TypedBadge>
            <TypedBadge
              type="version"
              className="text-[10px] px-1.5 py-0 max-w-[100px] truncate"
              showIcon={false}
              title={`v${pkg.version}`}
            >
              v{displayVersion}
            </TypedBadge>
            {pkg.deprecated && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                Deprecated
              </Badge>
            )}
            {pkg.disabled && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                Disabled
              </Badge>
            )}
            {tags.slice(0, 2).map((tag) => (
              <TypedBadge
                key={tag}
                type="tag"
                className="text-[10px] px-1.5 py-0"
              >
                {tag}
              </TypedBadge>
            ))}
            {tags.length > 2 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                +{tags.length - 2}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{pkg.dependencies.length} deps</span>
            {isSelected && <span className="text-primary">Enter ↵</span>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
