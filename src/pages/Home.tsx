import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PackageList } from '@/components/package/PackageList';
import { useSearchStore } from '@/stores/useSearchStore';
import { useSearchPackages, usePackageCounts } from '@/hooks/usePackages';
import type { PackageType } from '@/types';

export function Home() {
  const { query, setQuery, type, setType, tag, favoritesOnly } = useSearchStore();
  const [limit, setLimit] = useState(50);
  const packages = useSearchPackages(query, type, tag, favoritesOnly, limit);
  const counts = usePackageCounts();

  const handleLoadMore = () => {
    setLimit((prev) => prev + 50);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search packages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs value={type} onValueChange={(v) => setType(v as PackageType | 'all')}>
          <TabsList>
            <TabsTrigger value="all">
              All {counts && `(${counts.total.toLocaleString()})`}
            </TabsTrigger>
            <TabsTrigger value="formula">
              Formulae {counts && `(${counts.formulaeCount.toLocaleString()})`}
            </TabsTrigger>
            <TabsTrigger value="cask">
              Casks {counts && `(${counts.caskCount.toLocaleString()})`}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {tag && (
        <div className="text-sm text-muted-foreground">
          Filtering by tag: <span className="font-medium text-foreground">{tag}</span>
        </div>
      )}

      <PackageList packages={packages} />

      {packages && packages.length >= limit && (
        <div className="flex justify-center">
          <button
            onClick={handleLoadMore}
            className="text-sm text-primary hover:underline"
          >
            Load more...
          </button>
        </div>
      )}
    </div>
  );
}
