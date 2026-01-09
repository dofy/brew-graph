import { useParams, Link } from "react-router-dom";
import {
  Package,
  Box,
  Heart,
  ExternalLink,
  AlertTriangle,
  Terminal,
  GitBranch,
  Tag,
  Plus,
  X,
  Ban,
  Hash,
  Scale,
  FolderTree,
  Lock,
  Activity,
  FileText,
  Info,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CopyButton } from "@/components/common/CopyButton";
import { TagDialog } from "@/components/common/TagDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useFormula, useCask } from "@/hooks/usePackages";
import { useFavoriteStore } from "@/stores/useFavoriteStore";
import { useDetailHotkeys } from "@/hooks/useDetailHotkeys";
import { useSEO } from "@/hooks/useSEO";
import type { PackageType, Formula, Cask } from "@/types";
import { cn } from "@/lib/utils";
import { useState } from "react";

function DependencyLink({
  name,
  targetType,
}: {
  name: string;
  targetType: PackageType;
}) {
  return (
    <Link to={`/${targetType}/${name}`}>
      <Button variant="ghost" size="sm" className="h-auto py-1 px-2">
        {targetType === "formula" ? (
          <Package className="h-3 w-3 mr-1" />
        ) : (
          <Box className="h-3 w-3 mr-1" />
        )}
        {name}
      </Button>
    </Link>
  );
}

function TagManager({ name, type }: { name: string; type: PackageType }) {
  const { getTags, addTag, removeTag, allTags } = useFavoriteStore();
  const [newTag, setNewTag] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const tags = getTags(name, type);

  const handleAddTag = () => {
    if (newTag.trim()) {
      addTag(name, type, newTag.trim());
      setNewTag("");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1">
            {tag}
            <button
              onClick={() => removeTag(name, type, tag)}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-6 gap-1">
              <Plus className="h-3 w-3" />
              Add Tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="start">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="New tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddTag();
                    }
                  }}
                  className="h-8"
                />
                <Button size="sm" className="h-8" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
              {allTags.size > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Existing tags:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(allTags)
                      .filter((t) => !tags.includes(t))
                      .map((tag) => (
                        <Button
                          key={tag}
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => addTag(name, type, tag)}
                        >
                          {tag}
                        </Button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

function StatusBadges({
  deprecated,
  disabled,
  deprecationReason,
  disableReason,
}: {
  deprecated: boolean;
  disabled: boolean;
  deprecationReason?: string | null;
  disableReason?: string | null;
}) {
  if (!deprecated && !disabled) return null;

  return (
    <div className="space-y-2">
      {deprecated && (
        <div className="flex items-center gap-2 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
          <div>
            <p className="font-medium text-yellow-600 dark:text-yellow-400">
              Deprecated
            </p>
            {deprecationReason && (
              <p className="text-sm text-muted-foreground">
                {deprecationReason}
              </p>
            )}
          </div>
        </div>
      )}
      {disabled && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
          <Ban className="h-5 w-5 text-destructive shrink-0" />
          <div>
            <p className="font-medium text-destructive">Disabled</p>
            {disableReason && (
              <p className="text-sm text-muted-foreground">{disableReason}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FormulaDetail({ formula }: { formula: Formula }) {
  const { toggleFavorite } = useFavoriteStore();
  const installCommand = `brew install ${formula.name}`;

  useSEO({
    title: `${formula.name} (Formula)`,
    description:
      formula.desc || `Install ${formula.name} via Homebrew: ${installCommand}`,
  });

  const { tagDialogOpen, setTagDialogOpen, favorite } = useDetailHotkeys({
    name: formula.name,
    type: "formula",
    homepage: formula.homepage,
    installCommand,
  });

  const allDependencies = [
    ...formula.dependencies,
    ...formula.build_dependencies,
    ...formula.test_dependencies,
    ...formula.recommended_dependencies,
    ...formula.optional_dependencies,
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Package className="h-8 w-8 text-primary shrink-0 mt-1" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{formula.name}</h1>
              {formula.deprecated && (
                <Badge
                  variant="outline"
                  className="text-yellow-600 border-yellow-600"
                >
                  Deprecated
                </Badge>
              )}
              {formula.disabled && (
                <Badge variant="destructive">Disabled</Badge>
              )}
            </div>
            <p className="text-muted-foreground">{formula.full_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => toggleFavorite(formula.name, "formula")}
            title="Favorite (F)"
          >
            <Heart
              className={cn(
                "h-4 w-4",
                favorite ? "fill-red-500 text-red-500" : ""
              )}
            />
          </Button>
          <Button variant="outline" asChild title="Open homepage (O)">
            <a
              href={formula.homepage}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Homepage
            </a>
          </Button>
        </div>
      </div>

      <TagDialog
        pkg={{ name: formula.name, type: "formula" }}
        open={tagDialogOpen}
        onOpenChange={setTagDialogOpen}
      />

      <StatusBadges
        deprecated={formula.deprecated}
        disabled={formula.disabled}
        deprecationReason={formula.deprecation_reason}
        disableReason={formula.disable_reason}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Install Command
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm">
            <code className="flex-1 break-all">{installCommand}</code>
            <CopyButton text={installCommand} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Version
              </span>
              <Badge variant="secondary">{formula.versions.stable}</Badge>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-2">
                <Scale className="h-4 w-4" />
                License
              </span>
              <span>{formula.license || "N/A"}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-2">
                <FolderTree className="h-4 w-4" />
                Tap
              </span>
              <span className="font-mono text-sm">{formula.tap}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Keg Only
              </span>
              <span>{formula.keg_only ? "Yes" : "No"}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Status
              </span>
              <Badge
                variant={
                  formula.disabled
                    ? "destructive"
                    : formula.deprecated
                    ? "outline"
                    : "secondary"
                }
              >
                {formula.disabled
                  ? "Disabled"
                  : formula.deprecated
                  ? "Deprecated"
                  : "Active"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TagManager name={formula.name} type="formula" />
          </CardContent>
        </Card>
      </div>

      {formula.desc && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="leading-relaxed">{formula.desc}</p>
          </CardContent>
        </Card>
      )}

      {allDependencies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Dependencies ({allDependencies.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {formula.dependencies.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Runtime</h4>
                  <div className="flex flex-wrap gap-1">
                    {formula.dependencies.map((dep) => (
                      <DependencyLink
                        key={dep}
                        name={dep}
                        targetType="formula"
                      />
                    ))}
                  </div>
                </div>
              )}
              {formula.build_dependencies.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Build</h4>
                  <div className="flex flex-wrap gap-1">
                    {formula.build_dependencies.map((dep) => (
                      <DependencyLink
                        key={dep}
                        name={dep}
                        targetType="formula"
                      />
                    ))}
                  </div>
                </div>
              )}
              {formula.optional_dependencies.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Optional</h4>
                  <div className="flex flex-wrap gap-1">
                    {formula.optional_dependencies.map((dep) => (
                      <DependencyLink
                        key={dep}
                        name={dep}
                        targetType="formula"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {formula.caveats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Caveats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg overflow-auto">
              {formula.caveats}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CaskDetail({ cask }: { cask: Cask }) {
  const { toggleFavorite } = useFavoriteStore();
  const installCommand = `brew install --cask ${cask.token}`;

  useSEO({
    title: `${cask.token} (Cask)`,
    description:
      cask.desc || `Install ${cask.token} via Homebrew: ${installCommand}`,
  });

  const { tagDialogOpen, setTagDialogOpen, favorite } = useDetailHotkeys({
    name: cask.token,
    type: "cask",
    homepage: cask.homepage,
    installCommand,
  });

  const allDependencies = [
    ...(cask.depends_on?.formula || []),
    ...(cask.depends_on?.cask || []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Box className="h-8 w-8 text-primary shrink-0 mt-1" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{cask.token}</h1>
              {cask.deprecated && (
                <Badge
                  variant="outline"
                  className="text-yellow-600 border-yellow-600"
                >
                  Deprecated
                </Badge>
              )}
              {cask.disabled && <Badge variant="destructive">Disabled</Badge>}
            </div>
            <p className="text-muted-foreground">{cask.name.join(", ")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => toggleFavorite(cask.token, "cask")}
            title="Favorite (F)"
          >
            <Heart
              className={cn(
                "h-4 w-4",
                favorite ? "fill-red-500 text-red-500" : ""
              )}
            />
          </Button>
          <Button variant="outline" asChild title="Open homepage (O)">
            <a href={cask.homepage} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Homepage
            </a>
          </Button>
        </div>
      </div>

      <TagDialog
        pkg={{ name: cask.token, type: "cask" }}
        open={tagDialogOpen}
        onOpenChange={setTagDialogOpen}
      />

      <StatusBadges
        deprecated={cask.deprecated}
        disabled={cask.disabled}
        deprecationReason={cask.deprecation_reason}
        disableReason={cask.disable_reason}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Install Command
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm">
            <code className="flex-1 break-all">{installCommand}</code>
            <CopyButton text={installCommand} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Version
              </span>
              <Badge variant="secondary">{cask.version}</Badge>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-2">
                <FolderTree className="h-4 w-4" />
                Tap
              </span>
              <span className="font-mono text-sm">{cask.tap}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-2">
                <Download className="h-4 w-4" />
                Auto Updates
              </span>
              <span>{cask.auto_updates ? "Yes" : "No"}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Status
              </span>
              <Badge
                variant={
                  cask.disabled
                    ? "destructive"
                    : cask.deprecated
                    ? "outline"
                    : "secondary"
                }
              >
                {cask.disabled
                  ? "Disabled"
                  : cask.deprecated
                  ? "Deprecated"
                  : "Active"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TagManager name={cask.token} type="cask" />
          </CardContent>
        </Card>
      </div>

      {cask.desc && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="leading-relaxed">{cask.desc}</p>
          </CardContent>
        </Card>
      )}

      {allDependencies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Dependencies ({allDependencies.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {cask.depends_on?.formula?.map((dep) => (
                <DependencyLink key={dep} name={dep} targetType="formula" />
              ))}
              {cask.depends_on?.cask?.map((dep) => (
                <DependencyLink key={dep} name={dep} targetType="cask" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {cask.caveats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Caveats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg overflow-auto">
              {cask.caveats}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function Detail() {
  const { type, name } = useParams<{ type: string; name: string }>();
  const formula = useFormula(type === "formula" ? name || "" : "");
  const cask = useCask(type === "cask" ? name || "" : "");

  if (!type || !name) {
    return <div>Invalid route</div>;
  }

  if (type === "formula") {
    if (formula === undefined) {
      return <DetailSkeleton />;
    }
    if (!formula) {
      return <NotFound name={name} type="formula" />;
    }
    return <FormulaDetail formula={formula} />;
  }

  if (type === "cask") {
    if (cask === undefined) {
      return <DetailSkeleton />;
    }
    if (!cask) {
      return <NotFound name={name} type="cask" />;
    }
    return <CaskDetail cask={cask} />;
  }

  return <div>Invalid package type</div>;
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Skeleton className="h-8 w-8 rounded" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}

function NotFound({ name, type }: { name: string; type: string }) {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold mb-2">Package not found</h1>
      <p className="text-muted-foreground">
        The {type} &quot;{name}&quot; could not be found.
      </p>
      <Link to="/">
        <Button variant="link" className="mt-4">
          Go back home
        </Button>
      </Link>
    </div>
  );
}
