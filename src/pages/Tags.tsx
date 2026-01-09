import { Link } from "react-router-dom";
import { Tags as TagsIcon, Hash, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFavoriteStore } from "@/stores/useFavoriteStore";
import { useSEO } from "@/hooks/useSEO";

export function Tags() {
  const { allTags, getTagCount } = useFavoriteStore();

  useSEO({
    title: "Tags",
    description: "Manage your custom tags for Homebrew packages",
  });

  const sortedTags = Array.from(allTags).sort((a, b) => {
    const countA = getTagCount(a);
    const countB = getTagCount(b);
    if (countB !== countA) return countB - countA;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TagsIcon className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Tags</h1>
        <Badge variant="secondary" className="ml-2">
          {allTags.size}
        </Badge>
      </div>

      {sortedTags.length === 0 ? (
        <div className="text-center py-12">
          <TagsIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">No tags yet</h2>
          <p className="text-muted-foreground">
            Press T on any package to add a tag.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedTags.map((tag) => {
            const count = getTagCount(tag);
            return (
              <Link key={tag} to={`/tags/${encodeURIComponent(tag)}`}>
                <Card className="hover:border-primary/50 transition-colors group">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Hash className="h-4 w-4 text-violet-500 shrink-0" />
                        <span className="font-medium truncate">{tag}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary">{count}</Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
