import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Hash, Pencil, Trash2, Package, Box } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useFavoriteStore } from "@/stores/useFavoriteStore";
import { useSEO } from "@/hooks/useSEO";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export function TagDetail() {
  const { tagName } = useParams<{ tagName: string }>();
  const navigate = useNavigate();
  const decodedTagName = tagName ? decodeURIComponent(tagName) : "";

  const { getItemsWithTag, renameTag, deleteTag, allTags } = useFavoriteStore();
  const [newTagName, setNewTagName] = useState(decodedTagName);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

  useSEO({
    title: `Tag: ${decodedTagName}`,
    description: `Packages tagged with "${decodedTagName}"`,
  });

  // Check if tag exists
  if (!allTags.has(decodedTagName)) {
    return (
      <div className="text-center py-12">
        <Hash className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Tag not found</h1>
        <p className="text-muted-foreground mb-4">
          The tag &quot;{decodedTagName}&quot; does not exist.
        </p>
        <Link to="/tags">
          <Button variant="outline">Back to Tags</Button>
        </Link>
      </div>
    );
  }

  const items = getItemsWithTag(decodedTagName);

  const handleRename = async () => {
    const trimmed = newTagName.trim();
    if (!trimmed || trimmed === decodedTagName) {
      setRenameDialogOpen(false);
      return;
    }

    if (allTags.has(trimmed)) {
      toast.error(`Tag "${trimmed}" already exists`);
      return;
    }

    setIsRenaming(true);
    try {
      await renameTag(decodedTagName, trimmed);
      toast.success(`Tag renamed to "${trimmed}"`);
      setRenameDialogOpen(false);
      navigate(`/tags/${encodeURIComponent(trimmed)}`, { replace: true });
    } catch {
      toast.error("Failed to rename tag");
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTag(decodedTagName);
      toast.success(`Tag "${decodedTagName}" deleted`);
      navigate("/tags", { replace: true });
    } catch {
      toast.error("Failed to delete tag");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Hash className="h-6 w-6 text-violet-500" />
          <h1 className="text-2xl font-bold">{decodedTagName}</h1>
          <Badge variant="secondary">{items.length} packages</Badge>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4 mr-2" />
                Rename
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rename Tag</DialogTitle>
                <DialogDescription>
                  Enter a new name for this tag. All packages with this tag will
                  be updated.
                </DialogDescription>
              </DialogHeader>
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="New tag name"
                onKeyDown={(e) => e.key === "Enter" && handleRename()}
              />
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setRenameDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleRename} disabled={isRenaming}>
                  {isRenaming ? "Renaming..." : "Rename"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Tag</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the tag &quot;{decodedTagName}
                  &quot;? This will remove the tag from all {items.length}{" "}
                  packages. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} variant="destructive">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No packages with this tag yet.
          </p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Packages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {items.map((item) => (
                <Link
                  key={`${item.type}-${item.name}`}
                  to={`/${item.type}/${item.name}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  {item.type === "formula" ? (
                    <Package className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Box className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="font-medium">{item.name}</span>
                  <Badge variant="outline" className="ml-auto">
                    {item.type}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
