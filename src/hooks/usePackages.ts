import { useDeferredValue, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";
import type { PackageType } from "@/types";
import { useFavoriteStore } from "@/stores/useFavoriteStore";
import { usePackageSnapshot } from "@/stores/usePackageSnapshot";
import type { CaskKind } from "@/lib/caskKind";

export interface PackageItem {
  name: string;
  displayName: string;
  aliases: string[];
  type: PackageType;
  desc: string | null;
  version: string;
  homepage: string;
  dependencies: string[];
  deprecated: boolean;
  disabled: boolean;
  /** Homebrew analytics: install count over the past 30 days. */
  installs30d?: number;
  /** Tap (e.g. homebrew/core, homebrew/cask, third-party). */
  tap?: string;
  /** SPDX-ish license string (formula only). */
  license?: string | null;
  /** Coarse cask classification derived from `artifacts` (cask only). */
  kind?: CaskKind | null;
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
  kinds: string[]; // kind:app
  taps: string[]; // tap:homebrew/cask
  licenses: string[]; // license:mit
  deps: string[]; // dep:openssl
}

function parseSearchQuery(query: string): ParsedQuery {
  const result: ParsedQuery = {
    text: "",
    tags: [],
    favoritesOnly: false,
    kinds: [],
    taps: [],
    licenses: [],
    deps: [],
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

  // key:value tokens (must be matched before plain-text extraction)
  const kvRe = /\b(kind|tap|license|dep):([^\s]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = kvRe.exec(query)) !== null) {
    const [, key, value] = m;
    const v = value.toLowerCase();
    switch (key.toLowerCase()) {
      case "kind":
        result.kinds.push(v);
        break;
      case "tap":
        result.taps.push(v);
        break;
      case "license":
        result.licenses.push(v);
        break;
      case "dep":
        result.deps.push(v);
        break;
    }
  }

  // Extract plain text (remove special tokens)
  result.text = query
    .replace(kvRe, "")
    .replace(/#\S+/g, "")
    .replace(/\*/g, "")
    .trim()
    .toLowerCase();

  return result;
}

function calculateMatchScore(
  query: string,
  name: string,
  desc: string | null,
  aliases: string[] = []
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

  // Alias matches (e.g. cask `name[]`, formula `aliases`/`oldnames`).
  // Slightly lower weight than direct name matches so primary name still wins ties.
  let bestAliasScore = 0;
  for (const alias of aliases) {
    if (!alias) continue;
    const lowerAlias = alias.toLowerCase();
    let aliasScore = 0;
    if (lowerAlias === query) {
      aliasScore = 700;
    } else if (lowerAlias.startsWith(query)) {
      aliasScore = 350 + (query.length / lowerAlias.length) * 70;
    } else if (lowerAlias.includes(query)) {
      aliasScore = 140 + (query.length / lowerAlias.length) * 35;
    } else {
      const aliasWords = lowerAlias.split(/[-_./\s]+/);
      for (const word of aliasWords) {
        if (word === query) {
          aliasScore = Math.max(aliasScore, 200);
          break;
        } else if (word.startsWith(query)) {
          aliasScore = Math.max(aliasScore, 100);
          break;
        }
      }
    }
    if (aliasScore > bestAliasScore) bestAliasScore = aliasScore;
  }
  score += bestAliasScore;

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
  const result = useFilteredPackages(
    query,
    type,
    tag,
    favoritesOnly,
    hideDeprecated
  );
  return useMemo(
    () => (result ? result.items.slice(offset, offset + limit) : result),
    [result, offset, limit]
  );
}

export function useTotalPackageCount(
  query: string,
  type: PackageType | "all",
  tag: string | null,
  hideDeprecated: boolean
) {
  const result = useFilteredPackages(query, type, tag, false, hideDeprecated);
  return result?.items.length;
}

/**
 * Single search/filter/score pipeline shared by list and count consumers.
 * Returns `undefined` until the in-memory snapshot has loaded; `null`-ish
 * states are kept compatible with the prior `useLiveQuery` contract.
 */
function useFilteredPackages(
  query: string,
  type: PackageType | "all",
  tag: string | null,
  favoritesOnly: boolean,
  hideDeprecated: boolean
): { items: PackageItem[] } | undefined {
  const formulae = usePackageSnapshot((s) => s.formulae);
  const casks = usePackageSnapshot((s) => s.casks);
  const isLoaded = usePackageSnapshot((s) => s.isLoaded);
  const snapshotVersion = usePackageSnapshot((s) => s.version);

  const favorites = useFavoriteStore((s) => s.favorites);
  const userTags = useFavoriteStore((s) => s.tags);
  const favoritesSize = favorites.size;
  const tagsSize = userTags.size;

  // Defer the query so very fast typing doesn't block input rendering.
  const deferredQuery = useDeferredValue(query);

  return useMemo(() => {
    if (!isLoaded) return undefined;

    const parsed = parseSearchQuery(deferredQuery);
    const lowerQuery = parsed.text;
    const searchTags = parsed.tags;
    const requiredTags = tag ? [tag, ...searchTags] : searchTags;
    const requireFavorites = favoritesOnly || parsed.favoritesOnly;
    const requiredKinds = parsed.kinds;
    const requiredTaps = parsed.taps;
    const requiredLicenses = parsed.licenses;
    const requiredDeps = parsed.deps;

    const matchesPkgFilters = (pkg: PackageItem): boolean => {
      if (requireFavorites && !favorites.has(`${pkg.type}:${pkg.name}`))
        return false;

      if (requiredTags.length > 0) {
        const itemTags = userTags.get(`${pkg.type}:${pkg.name}`);
        if (!itemTags) return false;
        for (const reqTag of requiredTags) {
          const lowerReq = reqTag.toLowerCase();
          let hasTag = false;
          for (const t of itemTags) {
            if (t.toLowerCase().includes(lowerReq)) {
              hasTag = true;
              break;
            }
          }
          if (!hasTag) return false;
        }
      }

      if (hideDeprecated && (pkg.deprecated || pkg.disabled)) return false;

      if (requiredKinds.length > 0) {
        // Only casks have a kind; formula matches drop out unless user
        // explicitly typed `kind:formula`.
        if (pkg.type === "formula") {
          if (!requiredKinds.includes("formula")) return false;
        } else {
          const k = (pkg.kind || "").toLowerCase();
          if (!requiredKinds.some((rk) => rk === k)) return false;
        }
      }

      if (requiredTaps.length > 0) {
        const t = (pkg.tap || "").toLowerCase();
        if (!requiredTaps.some((rt) => t.includes(rt))) return false;
      }

      if (requiredLicenses.length > 0) {
        const l = (pkg.license || "").toLowerCase();
        if (!l) return false;
        if (!requiredLicenses.some((rl) => l.includes(rl))) return false;
      }

      if (requiredDeps.length > 0) {
        if (pkg.dependencies.length === 0) return false;
        const lowerDeps = pkg.dependencies.map((d) => d.toLowerCase());
        for (const rd of requiredDeps) {
          if (!lowerDeps.some((d) => d === rd || d.startsWith(rd + "@"))) {
            return false;
          }
        }
      }

      return true;
    };

    const scored: ScoredPackage[] = [];

    const pushIfMatch = (pkg: PackageItem) => {
      if (!matchesPkgFilters(pkg)) return;
      if (!lowerQuery) {
        scored.push({ pkg, score: 0 });
        return;
      }
      const score = calculateMatchScore(
        lowerQuery,
        pkg.name,
        pkg.desc,
        pkg.aliases
      );
      if (score > 0) scored.push({ pkg, score });
    };

    if (type === "all" || type === "formula") {
      for (const pkg of formulae) pushIfMatch(pkg);
    }
    if (type === "all" || type === "cask") {
      for (const pkg of casks) pushIfMatch(pkg);
    }

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Same relevance score: order by recent install count (popularity)
      // so e.g. an empty query lists the most-installed packages first.
      const aInstalls = a.pkg.installs30d ?? 0;
      const bInstalls = b.pkg.installs30d ?? 0;
      if (bInstalls !== aInstalls) return bInstalls - aInstalls;
      return a.pkg.name.localeCompare(b.pkg.name);
    });

    return { items: scored.map((s) => s.pkg) };
  }, [
    isLoaded,
    snapshotVersion,
    formulae,
    casks,
    deferredQuery,
    type,
    tag,
    favoritesOnly,
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
