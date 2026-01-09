import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type { Formula, Cask, PackageType } from '@/types';
import { useFavoriteStore } from '@/stores/useFavoriteStore';

export interface PackageItem {
  name: string;
  type: PackageType;
  desc: string | null;
  version: string;
  homepage: string;
  dependencies: string[];
  deprecated: boolean;
  disabled: boolean;
}

function formulaToPackage(formula: Formula): PackageItem {
  return {
    name: formula.name,
    type: 'formula',
    desc: formula.desc,
    version: formula.versions.stable,
    homepage: formula.homepage,
    dependencies: formula.dependencies,
    deprecated: formula.deprecated,
    disabled: formula.disabled,
  };
}

function caskToPackage(cask: Cask): PackageItem {
  return {
    name: cask.token,
    type: 'cask',
    desc: cask.desc,
    version: cask.version,
    homepage: cask.homepage,
    dependencies: [
      ...(cask.depends_on?.formula || []),
      ...(cask.depends_on?.cask || []),
    ],
    deprecated: cask.deprecated,
    disabled: cask.disabled,
  };
}

export function useSearchPackages(
  query: string,
  type: PackageType | 'all',
  tag: string | null,
  favoritesOnly: boolean,
  limit = 50
) {
  const { favorites, tags } = useFavoriteStore();
  
  return useLiveQuery(async () => {
    const results: PackageItem[] = [];
    const lowerQuery = query.toLowerCase().trim();
    
    const matchesQuery = (name: string, desc: string | null) => {
      if (!lowerQuery) return true;
      return (
        name.toLowerCase().includes(lowerQuery) ||
        (desc?.toLowerCase().includes(lowerQuery) ?? false)
      );
    };

    const matchesFavorites = (name: string, pkgType: PackageType) => {
      if (!favoritesOnly) return true;
      return favorites.has(`${pkgType}:${name}`);
    };

    const matchesTag = (name: string, pkgType: PackageType) => {
      if (!tag) return true;
      const itemTags = tags.get(`${pkgType}:${name}`);
      return itemTags?.has(tag) ?? false;
    };

    if (type === 'all' || type === 'formula') {
      const formulae = await db.formulae.toArray();
      for (const formula of formulae) {
        if (results.length >= limit) break;
        if (
          matchesQuery(formula.name, formula.desc) &&
          matchesFavorites(formula.name, 'formula') &&
          matchesTag(formula.name, 'formula')
        ) {
          results.push(formulaToPackage(formula));
        }
      }
    }

    if ((type === 'all' || type === 'cask') && results.length < limit) {
      const casks = await db.casks.toArray();
      for (const cask of casks) {
        if (results.length >= limit) break;
        if (
          matchesQuery(cask.token, cask.desc) &&
          matchesFavorites(cask.token, 'cask') &&
          matchesTag(cask.token, 'cask')
        ) {
          results.push(caskToPackage(cask));
        }
      }
    }

    return results;
  }, [query, type, tag, favoritesOnly, favorites, tags, limit]);
}

export function useFormula(name: string) {
  return useLiveQuery(
    () => db.formulae.get(name),
    [name]
  );
}

export function useCask(token: string) {
  return useLiveQuery(
    () => db.casks.get(token),
    [token]
  );
}

export function usePackage(name: string, type: PackageType) {
  const formula = useFormula(type === 'formula' ? name : '');
  const cask = useCask(type === 'cask' ? name : '');
  
  if (type === 'formula') {
    return formula ? { data: formula, type: 'formula' as const } : null;
  }
  return cask ? { data: cask, type: 'cask' as const } : null;
}

export function usePackageCounts() {
  return useLiveQuery(async () => {
    const [formulaeCount, caskCount] = await Promise.all([
      db.formulae.count(),
      db.casks.count(),
    ]);
    return { formulaeCount, caskCount, total: formulaeCount + caskCount };
  });
}
