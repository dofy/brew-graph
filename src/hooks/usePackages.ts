import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";
import type { Formula, Cask, PackageType } from "@/types";
import { useFavoriteStore } from "@/stores/useFavoriteStore";

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
    type: "formula",
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
    type: "cask",
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

interface ScoredPackage {
  pkg: PackageItem;
  score: number;
}

// Parse search query for special syntax
interface ParsedQuery {
  text: string; // Plain text search
  tags: string[]; // #tag searches
  favoritesOnly: boolean; // * for favorites
}

function parseSearchQuery(query: string): ParsedQuery {
  const result: ParsedQuery = {
    text: "",
    tags: [],
    favoritesOnly: false,
  };

  // Match #tag patterns
  const tagMatches = query.match(/#(\S+)/g);
  if (tagMatches) {
    result.tags = tagMatches.map((t) => t.slice(1).toLowerCase());
  }

  // Check for * (favorites)
  if (query.includes("*")) {
    result.favoritesOnly = true;
  }

  // Extract plain text (remove special tokens)
  result.text = query
    .replace(/#\S+/g, "") // Remove #tag
    .replace(/\*/g, "") // Remove *
    .trim()
    .toLowerCase();

  return result;
}

function calculateMatchScore(
  query: string,
  name: string,
  desc: string | null
): number {
  if (!query) return 0;

  const lowerName = name.toLowerCase();
  const lowerDesc = desc?.toLowerCase() ?? "";
  let score = 0;

  // Exact match on name - highest priority
  if (lowerName === query) {
    score += 1000;
  }
  // Name starts with query
  else if (lowerName.startsWith(query)) {
    score += 500 + (query.length / lowerName.length) * 100;
  }
  // Name contains query
  else if (lowerName.includes(query)) {
    score += 200 + (query.length / lowerName.length) * 50;
  }

  // Word boundary match in name (e.g., "react" matches "create-react-app")
  const nameWords = lowerName.split(/[-_./]/);
  for (const word of nameWords) {
    if (word === query) {
      score += 300;
      break;
    } else if (word.startsWith(query)) {
      score += 150;
      break;
    }
  }

  // Description contains query
  if (lowerDesc.includes(query)) {
    score += 50 + (query.length / Math.max(lowerDesc.length, 1)) * 20;

    // Bonus if query appears at word boundary in description
    const descWords = lowerDesc.split(/\s+/);
    for (const word of descWords) {
      if (word === query) {
        score += 30;
        break;
      } else if (word.startsWith(query)) {
        score += 15;
        break;
      }
    }
  }

  return score;
}

export function useSearchPackages(
  query: string,
  type: PackageType | "all",
  tag: string | null,
  favoritesOnly: boolean,
  hideDeprecated: boolean,
  limit = 30,
  offset = 0
) {
  // Get store state with selectors for proper reactivity
  const favorites = useFavoriteStore((state) => state.favorites);
  const userTags = useFavoriteStore((state) => state.tags);

  // Parse query for special syntax (#tag, *)
  const parsed = parseSearchQuery(query);
  const searchText = parsed.text;
  const searchTags = parsed.tags;
  const searchFavoritesOnly = parsed.favoritesOnly;

  // Serialize favorites and tags size for dependency tracking
  const favoritesSize = favorites.size;
  const tagsSize = userTags.size;

  return useLiveQuery(async () => {
    const lowerQuery = searchText;
    const scored: ScoredPackage[] = [];

    // Combine URL tag filter with query tags
    const requiredTags = tag ? [tag, ...searchTags] : searchTags;
    // Combine URL favorites filter with query favorites
    const requireFavorites = favoritesOnly || searchFavoritesOnly;

    const matchesFilters = (
      name: string,
      pkgType: PackageType,
      deprecated: boolean,
      disabled: boolean
    ) => {
      // Check favorites
      if (requireFavorites && !favorites.has(`${pkgType}:${name}`))
        return false;

      // Check all required tags
      if (requiredTags.length > 0) {
        const itemTags = userTags.get(`${pkgType}:${name}`);
        for (const reqTag of requiredTags) {
          // Check if any tag contains the search term (partial match)
          const hasTag = itemTags
            ? Array.from(itemTags).some((t) =>
                t.toLowerCase().includes(reqTag.toLowerCase())
              )
            : false;
          if (!hasTag) return false;
        }
      }

      if (hideDeprecated && (deprecated || disabled)) return false;
      return true;
    };

    if (type === "all" || type === "formula") {
      const formulae = await db.formulae.toArray();
      for (const formula of formulae) {
        if (
          !matchesFilters(
            formula.name,
            "formula",
            formula.deprecated,
            formula.disabled
          )
        ) {
          continue;
        }

        if (!lowerQuery) {
          scored.push({ pkg: formulaToPackage(formula), score: 0 });
        } else {
          const score = calculateMatchScore(
            lowerQuery,
            formula.name,
            formula.desc
          );
          if (score > 0) {
            scored.push({ pkg: formulaToPackage(formula), score });
          }
        }
      }
    }

    if (type === "all" || type === "cask") {
      const casks = await db.casks.toArray();
      for (const cask of casks) {
        if (
          !matchesFilters(cask.token, "cask", cask.deprecated, cask.disabled)
        ) {
          continue;
        }

        if (!lowerQuery) {
          scored.push({ pkg: caskToPackage(cask), score: 0 });
        } else {
          const score = calculateMatchScore(lowerQuery, cask.token, cask.desc);
          if (score > 0) {
            scored.push({ pkg: caskToPackage(cask), score });
          }
        }
      }
    }

    // Sort by score (descending), then by name (ascending) for same scores
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.pkg.name.localeCompare(b.pkg.name);
    });

    return scored.slice(offset, offset + limit).map((s) => s.pkg);
  }, [
    searchText,
    searchTags,
    searchFavoritesOnly,
    type,
    tag,
    favoritesOnly,
    hideDeprecated,
    favorites,
    userTags,
    favoritesSize,
    tagsSize,
    limit,
    offset,
  ]);
}

export function useTotalPackageCount(
  query: string,
  type: PackageType | "all",
  tag: string | null,
  hideDeprecated: boolean
) {
  // Get store state with selectors for proper reactivity
  const favorites = useFavoriteStore((state) => state.favorites);
  const userTags = useFavoriteStore((state) => state.tags);

  // Parse query for special syntax (#tag, *)
  const parsed = parseSearchQuery(query);
  const searchText = parsed.text;
  const searchTags = parsed.tags;
  const searchFavoritesOnly = parsed.favoritesOnly;

  // Serialize for dependency tracking
  const favoritesSize = favorites.size;
  const tagsSize = userTags.size;

  return useLiveQuery(async () => {
    const lowerQuery = searchText;
    let count = 0;

    // Combine URL tag filter with query tags
    const requiredTags = tag ? [tag, ...searchTags] : searchTags;
    const requireFavorites = searchFavoritesOnly;

    const matchesFilters = (
      name: string,
      pkgType: PackageType,
      deprecated: boolean,
      disabled: boolean
    ) => {
      // Check favorites
      if (requireFavorites && !favorites.has(`${pkgType}:${name}`))
        return false;

      // Check all required tags
      if (requiredTags.length > 0) {
        const itemTags = userTags.get(`${pkgType}:${name}`);
        for (const reqTag of requiredTags) {
          const hasTag = itemTags
            ? Array.from(itemTags).some((t) =>
                t.toLowerCase().includes(reqTag.toLowerCase())
              )
            : false;
          if (!hasTag) return false;
        }
      }

      if (hideDeprecated && (deprecated || disabled)) return false;
      return true;
    };

    if (type === "all" || type === "formula") {
      const formulae = await db.formulae.toArray();
      for (const formula of formulae) {
        if (
          !matchesFilters(
            formula.name,
            "formula",
            formula.deprecated,
            formula.disabled
          )
        ) {
          continue;
        }
        if (!lowerQuery) {
          count++;
        } else {
          const score = calculateMatchScore(
            lowerQuery,
            formula.name,
            formula.desc
          );
          if (score > 0) count++;
        }
      }
    }

    if (type === "all" || type === "cask") {
      const casks = await db.casks.toArray();
      for (const cask of casks) {
        if (
          !matchesFilters(cask.token, "cask", cask.deprecated, cask.disabled)
        ) {
          continue;
        }
        if (!lowerQuery) {
          count++;
        } else {
          const score = calculateMatchScore(lowerQuery, cask.token, cask.desc);
          if (score > 0) count++;
        }
      }
    }

    return count;
  }, [
    searchText,
    searchTags,
    searchFavoritesOnly,
    type,
    tag,
    hideDeprecated,
    favorites,
    userTags,
    favoritesSize,
    tagsSize,
  ]);
}

export function useFormula(name: string) {
  return useLiveQuery(() => db.formulae.get(name), [name]);
}

export function useCask(token: string) {
  return useLiveQuery(() => db.casks.get(token), [token]);
}

export function usePackage(name: string, type: PackageType) {
  const formula = useFormula(type === "formula" ? name : "");
  const cask = useCask(type === "cask" ? name : "");

  if (type === "formula") {
    return formula ? { data: formula, type: "formula" as const } : null;
  }
  return cask ? { data: cask, type: "cask" as const } : null;
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
