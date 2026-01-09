import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Box, Heart, ExternalLink } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { useSearchStore } from '@/stores/useSearchStore';
import { useFavoriteStore } from '@/stores/useFavoriteStore';
import { useSearchPackages } from '@/hooks/usePackages';

export function SearchDialog() {
  const navigate = useNavigate();
  const { query, setQuery, isSearchOpen, setSearchOpen, clearBreadcrumbs } = useSearchStore();
  const { isFavorite } = useFavoriteStore();
  const results = useSearchPackages(query, 'all', null, false, 20);

  const handleSelect = useCallback((name: string, type: 'formula' | 'cask') => {
    clearBreadcrumbs();
    setSearchOpen(false);
    setQuery('');
    navigate(`/${type}/${name}`);
  }, [navigate, setSearchOpen, setQuery, clearBreadcrumbs]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(!isSearchOpen);
      }
      if (e.key === '/' && !isSearchOpen) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setSearchOpen(true);
        }
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isSearchOpen, setSearchOpen]);

  return (
    <CommandDialog open={isSearchOpen} onOpenChange={setSearchOpen}>
      <CommandInput
        placeholder="Search packages..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {query ? 'No packages found.' : 'Type to search packages...'}
        </CommandEmpty>
        {results && results.length > 0 && (
          <CommandGroup heading="Packages">
            {results.map((pkg) => (
              <CommandItem
                key={`${pkg.type}-${pkg.name}`}
                value={`${pkg.type}-${pkg.name}`}
                onSelect={() => handleSelect(pkg.name, pkg.type)}
                className="flex items-center gap-2"
              >
                {pkg.type === 'formula' ? (
                  <Package className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Box className="h-4 w-4 text-muted-foreground" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{pkg.name}</span>
                    {isFavorite(pkg.name, pkg.type) && (
                      <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                    )}
                    <Badge variant="outline" className="text-xs">
                      {pkg.type}
                    </Badge>
                  </div>
                  {pkg.desc && (
                    <p className="text-xs text-muted-foreground truncate">
                      {pkg.desc}
                    </p>
                  )}
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
