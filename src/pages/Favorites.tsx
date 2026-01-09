import { Heart } from 'lucide-react';
import { PackageList } from '@/components/package/PackageList';
import { useSearchPackages } from '@/hooks/usePackages';

export function Favorites() {
  const packages = useSearchPackages('', 'all', null, true, 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Heart className="h-5 w-5 text-red-500" />
        <h1 className="text-2xl font-bold">Favorites</h1>
      </div>

      {packages && packages.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">No favorites yet</h2>
          <p className="text-muted-foreground">
            Click the heart icon on any package to add it to your favorites.
          </p>
        </div>
      ) : (
        <PackageList packages={packages} />
      )}
    </div>
  );
}
