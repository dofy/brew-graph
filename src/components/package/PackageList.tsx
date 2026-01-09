import { PackageCard } from './PackageCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { PackageItem } from '@/hooks/usePackages';

interface PackageListProps {
  packages: PackageItem[] | undefined;
  isLoading?: boolean;
}

export function PackageList({ packages, isLoading }: PackageListProps) {
  if (isLoading || packages === undefined) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-10 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No packages found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {packages.map((pkg) => (
        <PackageCard key={`${pkg.type}-${pkg.name}`} pkg={pkg} />
      ))}
    </div>
  );
}
