import { useState, useMemo } from "react";
import { Tag, Plus, X, Hash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFavoriteStore } from "@/stores/useFavoriteStore";
import type { PackageType } from "@/types";

interface TagDialogProps {
  pkg: { name: string; type: PackageType } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TagDialog({ pkg, open, onOpenChange }: TagDialogProps) {
  const { getTags, addTag, removeTag, allTags } = useFavoriteStore();
  const [newTag, setNewTag] = useState("");

  const tags = pkg ? getTags(pkg.name, pkg.type) : [];

  // Filter suggestions based on input
  const suggestions = useMemo(() => {
    if (!newTag.trim()) return [];
    const query = newTag.toLowerCase();
    return Array.from(allTags)
      .filter((t) => !tags.includes(t) && t.toLowerCase().includes(query))
      .slice(0, 5);
  }, [newTag, allTags, tags]);

  // Existing tags not already applied (for quick add)
  const existingTags = useMemo(() => {
    return Array.from(allTags).filter((t) => !tags.includes(t));
  }, [allTags, tags]);

  if (!pkg) return null;

  const handleAddTag = (tagToAdd?: string) => {
    const tag = tagToAdd || newTag.trim();
    if (tag) {
      addTag(pkg.name, pkg.type, tag);
      setNewTag("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
    if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Tags for {pkg.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current tags */}
          {tags.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Current tags:</p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                    {tag}
                    <button
                      onClick={() => removeTag(pkg.name, pkg.type, tag)}
                      className="ml-1 hover:text-destructive rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Add new tag with autocomplete */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Type to search or create tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              <Button onClick={() => handleAddTag()} disabled={!newTag.trim()}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            {/* Autocomplete suggestions */}
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {suggestions.map((tag) => (
                  <Button
                    key={tag}
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10"
                    onClick={() => handleAddTag(tag)}
                  >
                    <Hash className="h-3 w-3" />
                    {tag}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Quick add from existing tags */}
          {existingTags.length > 0 && !newTag && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Quick add from existing tags:
              </p>
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                {existingTags.map((tag) => (
                  <Button
                    key={tag}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleAddTag(tag)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
