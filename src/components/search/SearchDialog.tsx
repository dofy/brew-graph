import { useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Box,
  Heart,
  ArrowRight,
  Search,
  Tag,
  Star,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { useSearchStore } from "@/stores/useSearchStore";
import { useFavoriteStore } from "@/stores/useFavoriteStore";
import { useSearchPackages } from "@/hooks/usePackages";

// Parse query to extract special syntax
function parseSearchQuery(query: string) {
  const tags: string[] = [];
  let favoritesOnly = false;

  // Match #tag patterns
  const tagMatches = query.match(/#(\S+)/g);
  if (tagMatches) {
    tags.push(...tagMatches.map((t) => t.slice(1).toLowerCase()));
  }

  // Check for * (favorites)
  if (query.includes("*")) {
    favoritesOnly = true;
  }

  // Extract plain text
  const text = query
    .replace(/#\S+/g, "")
    .replace(/\*/g, "")
    .trim();

  // Check if currently typing a tag (ends with # or #partial)
  const isTypingTag = /#\S*$/.test(query);
  const currentTagInput = isTypingTag
    ? (query.match(/#(\S*)$/)?.[1] || "").toLowerCase()
    : null;

  return { text, tags, favoritesOnly, isTypingTag, currentTagInput };
}

export function SearchDialog() {
  const navigate = useNavigate();
  const { query, setQuery, isSearchOpen, setSearchOpen, hideDeprecated } =
    useSearchStore();
  const { isFavorite, getTags, tags: userTags } = useFavoriteStore();

  // Parse the query
  const parsed = useMemo(() => parseSearchQuery(query), [query]);

  // Get all unique tags for autocomplete
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    userTags.forEach((tagSet2) => {
      tagSet2.forEach((t) => tagSet.add(t));
    });
    return Array.from(tagSet).sort();
  }, [userTags]);

  // Filter tags for autocomplete based on current input
  const suggestedTags = useMemo(() => {
    if (!parsed.isTypingTag) return [];
    const input = parsed.currentTagInput || "";
    return allTags
      .filter(
        (t) =>
          t.toLowerCase().includes(input) && !parsed.tags.includes(t.toLowerCase())
      )
      .slice(0, 5);
  }, [allTags, parsed.isTypingTag, parsed.currentTagInput, parsed.tags]);

  // Search results
  const results = useSearchPackages(
    query,
    "all",
    null,
    false,
    hideDeprecated,
    20
  );

  const handleSelect = useCallback(
    (name: string, type: "formula" | "cask") => {
      setSearchOpen(false);
      setQuery("");
      navigate(`/${type}/${name}`);
    },
    [navigate, setSearchOpen, setQuery]
  );

  // Navigate to home page with search query
  const handleSearchAll = useCallback(() => {
    if (!query.trim()) return;
    setSearchOpen(false);
    const searchQuery = encodeURIComponent(query);
    navigate(`/?q=${searchQuery}`);
    setQuery("");
  }, [query, navigate, setSearchOpen, setQuery]);

  // Insert tag into query
  const insertTag = useCallback(
    (tagName: string) => {
      // Replace the current #partial with #tagName
      const newQuery = query.replace(/#\S*$/, `#${tagName} `);
      setQuery(newQuery);
    },
    [query, setQuery]
  );

  // Insert * for favorites
  const insertFavorites = useCallback(() => {
    if (!query.includes("*")) {
      setQuery(query + "* ");
    }
  }, [query, setQuery]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(!isSearchOpen);
      }
      if (e.key === "/" && !isSearchOpen) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          setSearchOpen(true);
        }
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isSearchOpen, setSearchOpen]);

  // Show active filters
  const hasActiveFilters = parsed.tags.length > 0 || parsed.favoritesOnly;

  return (
    <CommandDialog open={isSearchOpen} onOpenChange={setSearchOpen}>
      <CommandInput
        placeholder="Search... (use #tag or * for favorites)"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {/* Active filters indicator */}
        {hasActiveFilters && (
          <div className="flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground border-b">
            <span>Filtering by:</span>
            {parsed.favoritesOnly && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                Favorites
              </Badge>
            )}
            {parsed.tags.map((t) => (
              <Badge
                key={t}
                variant="secondary"
                className="gap-1 text-xs text-violet-600 dark:text-violet-400"
              >
                #{t}
              </Badge>
            ))}
          </div>
        )}

        <CommandEmpty>
          {query
            ? `No packages found${hasActiveFilters ? " with current filters" : ""}.`
            : "Type to search... Use #tag or * for special filters."}
        </CommandEmpty>

        {/* Tag autocomplete suggestions */}
        {parsed.isTypingTag && suggestedTags.length > 0 && (
          <CommandGroup heading="Tag suggestions">
            {suggestedTags.map((t) => (
              <CommandItem
                key={`tag-${t}`}
                value={`suggest-tag-${t}`}
                onSelect={() => insertTag(t)}
                className="flex items-center gap-2"
              >
                <Tag className="h-4 w-4 text-violet-500" />
                <span>#{t}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Quick filters when no query */}
        {!query && allTags.length > 0 && (
          <CommandGroup heading="Quick filters">
            <CommandItem
              value="filter-favorites"
              onSelect={insertFavorites}
              className="flex items-center gap-2"
            >
              <Star className="h-4 w-4 text-yellow-500" />
              <span>Show favorites only</span>
              <Badge variant="outline" className="ml-auto text-xs">
                *
              </Badge>
            </CommandItem>
            {allTags.slice(0, 3).map((t) => (
              <CommandItem
                key={`quick-${t}`}
                value={`quick-tag-${t}`}
                onSelect={() => setQuery(`#${t} `)}
                className="flex items-center gap-2"
              >
                <Tag className="h-4 w-4 text-violet-500" />
                <span>Filter by #{t}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {query && (
          <>
            <CommandGroup heading="Actions">
              <CommandItem
                value={`search-all-${query}`}
                onSelect={handleSearchAll}
                className="flex items-center gap-2"
              >
                <Search className="h-4 w-4 text-muted-foreground" />
                <span>
                  Search all for "<span className="font-medium">{query}</span>"
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {results && results.length > 0 && (
          <CommandGroup
            heading={`Results (${results.length}${results.length >= 20 ? "+" : ""})`}
          >
            {results.map((pkg) => {
              const pkgTags = getTags(pkg.name, pkg.type);
              return (
                <CommandItem
                  key={`${pkg.type}-${pkg.name}`}
                  value={`${pkg.type}-${pkg.name}`}
                  onSelect={() => handleSelect(pkg.name, pkg.type)}
                  className="flex items-center gap-2"
                >
                  {pkg.type === "formula" ? (
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
                      {pkgTags.length > 0 && (
                        <Badge
                          variant="secondary"
                          className="text-xs text-violet-600 dark:text-violet-400"
                        >
                          #{pkgTags[0]}
                          {pkgTags.length > 1 && `+${pkgTags.length - 1}`}
                        </Badge>
                      )}
                    </div>
                    {pkg.desc && (
                      <p className="text-xs text-muted-foreground truncate">
                        {pkg.desc}
                      </p>
                    )}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
