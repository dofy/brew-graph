import { Link } from 'react-router-dom';
import { Package, Box, Heart, ExternalLink, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFavoriteStore } from '@/stores/useFavoriteStore';
import { useSearchStore } from '@/stores/useSearchStore';
import type { PackageItem } from '@/hooks/usePackages';
import { cn } from '@/lib/utils';

interface PackageCardProps {
  pkg: PackageItem;
}

export function PackageCard({ pkg }: PackageCardProps) {
  const { isFavorite, toggleFavorite, getTags } = useFavoriteStore();
  const { clearBreadcrumbs } = useSearchStore();
  const favorite = isFavorite(pkg.name, pkg.type);
  const tags = getTags(pkg.name, pkg.type);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(pkg.name, pkg.type);
  };

  return (
    <Link to={`/${pkg.type}/${pkg.name}`} onClick={clearBreadcrumbs}>
      <Card className="h-full hover:border-primary/50 transition-colors group">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {pkg.type === 'formula' ? (
                <Package className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              ) : (
                <Box className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}
              <CardTitle className="text-base truncate">{pkg.name}</CardTitle>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {(pkg.deprecated || pkg.disabled) && (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleFavoriteClick}
              >
                <Heart
                  className={cn(
                    'h-4 w-4',
                    favorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                  )}
                />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
            {pkg.desc || 'No description available'}
          </p>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {pkg.type}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              v{pkg.version}
            </Badge>
            {pkg.deprecated && (
              <Badge variant="destructive" className="text-xs">
                Deprecated
              </Badge>
            )}
            {pkg.disabled && (
              <Badge variant="destructive" className="text-xs">
                Disabled
              </Badge>
            )}
          </div>

          {tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap pt-1">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs bg-primary/10">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              {pkg.dependencies.length} dependencies
            </span>
            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
