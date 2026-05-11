import { useParams, Link } from "react-router-dom";
import {
  Package,
  Box,
  AlertTriangle,
  GitBranch,
  Plus,
  X,
  Ban,
  Hash,
  Scale,
  FolderTree,
  Lock,
  Activity,
  Info,
  Download,
  TrendingUp,
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
import { TagDialog } from "@/components/common/TagDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useFormula, useCask } from "@/hooks/usePackages";
import { useFavoriteStore } from "@/stores/useFavoriteStore";
import { usePackageSnapshot } from "@/stores/usePackageSnapshot";
import { useDetailHotkeys } from "@/hooks/useDetailHotkeys";
import { useSEO, generatePackageJsonLd } from "@/hooks/useSEO";
import {
  PackageHeader,
  InstallCommandCard,
  DescriptionCard,
  CaveatsCard,
  TagsCard,
} from "@/components/package/PackageDetailParts";
import type { PackageType, Formula, Cask } from "@/types";
import { lazy, Suspense, useState } from "react";

// Lazy-load the React Flow-powered graph view; it pulls in ~180KB of code
// that is only needed when the user opens the "Graph" tab.
const DependencyGraph = lazy(() =>
  import("@/components/package/DependencyGraph").then((m) => ({
    default: m.DependencyGraph,
  }))
);

function GraphFallback() {
  return (
    <div className="h-[480px] rounded-lg border bg-muted/20 flex items-center justify-center text-sm text-muted-foreground">
      Loading graph…
    </div>
  );
}

function formatInstalls(n: number | undefined): string {
  if (!n) return "—";
  return n.toLocaleString();
}

function ReverseDependents({
  name,
  type,
}: {
  name: string;
  type: PackageType;
}) {
  const reverseDeps = usePackageSnapshot((s) => s.reverseDeps);
  const isLoaded = usePackageSnapshot((s) => s.isLoaded);
  const dependents = reverseDeps.get(`${type}:${name}`) ?? [];

  // Some popular formulae (e.g. openssl@3) have thousands of dependents;
  // collapse the long tail behind a "show all" affordance.
  const [showAll, setShowAll] = useState(false);
  const SHOW_LIMIT = 60;

  if (!isLoaded || dependents.length === 0) return null;

  const visible = showAll ? dependents : dependents.slice(0, SHOW_LIMIT);
  const hidden = dependents.length - visible.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 rotate-180" />
          Used by ({dependents.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1">
          {visible.map((d) => (
            <DependencyLink
              key={`${d.type}-${d.name}`}
              name={d.name}
              targetType={d.type}
            />
          ))}
        </div>
        {hidden > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => setShowAll(true)}
          >
            Show {hidden} more
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

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
  deprecationReplacementFormula,
  deprecationReplacementCask,
  disableReplacementFormula,
  disableReplacementCask,
}: {
  deprecated: boolean;
  disabled: boolean;
  deprecationReason?: string | null;
  disableReason?: string | null;
  deprecationReplacementFormula?: string | null;
  deprecationReplacementCask?: string | null;
  disableReplacementFormula?: string | null;
  disableReplacementCask?: string | null;
}) {
  if (!deprecated && !disabled) return null;

  const renderReplacement = (
    formulaName: string | null | undefined,
    caskName: string | null | undefined
  ) => {
    if (!formulaName && !caskName) return null;
    return (
      <p className="text-sm">
        Replaced by{" "}
        {formulaName && (
          <Link
            to={`/formula/${formulaName}`}
            className="font-mono underline underline-offset-2 hover:text-primary"
          >
            {formulaName}
          </Link>
        )}
        {formulaName && caskName && " / "}
        {caskName && (
          <Link
            to={`/cask/${caskName}`}
            className="font-mono underline underline-offset-2 hover:text-primary"
          >
            {caskName}
          </Link>
        )}
      </p>
    );
  };

  return (
    <div className="space-y-2">
      {deprecated && (
        <div className="flex items-start gap-2 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-yellow-600 dark:text-yellow-400">
              Deprecated
            </p>
            {deprecationReason && (
              <p className="text-sm text-muted-foreground">
                {deprecationReason}
              </p>
            )}
            {renderReplacement(
              deprecationReplacementFormula,
              deprecationReplacementCask
            )}
          </div>
        </div>
      )}
      {disabled && (
        <div className="flex items-start gap-2 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
          <Ban className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-destructive">Disabled</p>
            {disableReason && (
              <p className="text-sm text-muted-foreground">{disableReason}</p>
            )}
            {renderReplacement(
              disableReplacementFormula,
              disableReplacementCask
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FormulaDetail({ formula }: { formula: Formula }) {
  const analytics = usePackageSnapshot((s) => s.analytics);
  const installs30d = analytics?.formula[formula.name];
  const installCommand = `brew install ${formula.name}`;

  useSEO({
    title: `${formula.name} (Formula)`,
    description:
      formula.desc || `Install ${formula.name} via Homebrew: ${installCommand}`,
    type: "product",
    jsonLd: generatePackageJsonLd({
      name: formula.name,
      type: "formula",
      desc: formula.desc,
      homepage: formula.homepage,
      version: formula.versions.stable,
    }),
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
      <PackageHeader
        name={formula.name}
        type="formula"
        subtitle={formula.full_name}
        homepage={formula.homepage}
        deprecated={formula.deprecated}
        disabled={formula.disabled}
        favorite={favorite}
      />

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
        deprecationReplacementFormula={formula.deprecation_replacement_formula}
        deprecationReplacementCask={formula.deprecation_replacement_cask}
        disableReplacementFormula={formula.disable_replacement_formula}
        disableReplacementCask={formula.disable_replacement_cask}
      />

      <InstallCommandCard command={installCommand} />

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
                <TrendingUp className="h-4 w-4" />
                Installs (30d)
              </span>
              <span className="font-mono text-sm">
                {formatInstalls(installs30d)}
              </span>
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

        <TagsCard>
          <TagManager name={formula.name} type="formula" />
        </TagsCard>
      </div>

      {formula.desc && <DescriptionCard desc={formula.desc} />}

      {allDependencies.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Dependencies ({allDependencies.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="list">
                <TabsList className="mb-3">
                  <TabsTrigger value="list">List</TabsTrigger>
                  <TabsTrigger value="graph">Graph</TabsTrigger>
                </TabsList>
                <TabsContent value="list">
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
                </TabsContent>
                <TabsContent value="graph">
                  <Suspense fallback={<GraphFallback />}>
                    <DependencyGraph
                      rootName={formula.name}
                      rootType="formula"
                      rootDesc={formula.desc}
                      dependencies={[
                        ...formula.dependencies.map((n) => ({
                          name: n,
                          type: "formula" as const,
                          kind: "runtime" as const,
                        })),
                        ...formula.build_dependencies.map((n) => ({
                          name: n,
                          type: "formula" as const,
                          kind: "build" as const,
                        })),
                        ...formula.recommended_dependencies.map((n) => ({
                          name: n,
                          type: "formula" as const,
                          kind: "recommended" as const,
                        })),
                        ...formula.optional_dependencies.map((n) => ({
                          name: n,
                          type: "formula" as const,
                          kind: "optional" as const,
                        })),
                      ]}
                    />
                  </Suspense>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}

      <ReverseDependents name={formula.name} type="formula" />

      {formula.versioned_formulae && formula.versioned_formulae.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Other versions ({formula.versioned_formulae.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {formula.versioned_formulae.map((v) => (
                <DependencyLink key={v} name={v} targetType="formula" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {formula.conflicts_with && formula.conflicts_with.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Conflicts with ({formula.conflicts_with.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {formula.conflicts_with.map((c) => (
                <DependencyLink key={c} name={c} targetType="formula" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {formula.caveats && <CaveatsCard caveats={formula.caveats} />}
    </div>
  );
}

function CaskDetail({ cask }: { cask: Cask }) {
  const analytics = usePackageSnapshot((s) => s.analytics);
  const installs30d = analytics?.cask[cask.token];
  const installCommand = `brew install --cask ${cask.token}`;

  useSEO({
    title: `${cask.token} (Cask)`,
    description:
      cask.desc || `Install ${cask.token} via Homebrew: ${installCommand}`,
    type: "product",
    jsonLd: generatePackageJsonLd({
      name: cask.token,
      type: "cask",
      desc: cask.desc,
      homepage: cask.homepage,
      version: cask.version,
    }),
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
      <PackageHeader
        name={cask.token}
        type="cask"
        subtitle={cask.name.join(", ")}
        homepage={cask.homepage}
        deprecated={cask.deprecated}
        disabled={cask.disabled}
        favorite={favorite}
      />

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
        deprecationReplacementFormula={cask.deprecation_replacement_formula}
        deprecationReplacementCask={cask.deprecation_replacement_cask}
        disableReplacementFormula={cask.disable_replacement_formula}
        disableReplacementCask={cask.disable_replacement_cask}
      />

      <InstallCommandCard command={installCommand} />

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
                <TrendingUp className="h-4 w-4" />
                Installs (30d)
              </span>
              <span className="font-mono text-sm">
                {formatInstalls(installs30d)}
              </span>
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

        <TagsCard>
          <TagManager name={cask.token} type="cask" />
        </TagsCard>
      </div>

      {cask.desc && <DescriptionCard desc={cask.desc} />}

      {allDependencies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Dependencies ({allDependencies.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="list">
              <TabsList className="mb-3">
                <TabsTrigger value="list">List</TabsTrigger>
                <TabsTrigger value="graph">Graph</TabsTrigger>
              </TabsList>
              <TabsContent value="list">
                <div className="flex flex-wrap gap-1">
                  {cask.depends_on?.formula?.map((dep) => (
                    <DependencyLink key={dep} name={dep} targetType="formula" />
                  ))}
                  {cask.depends_on?.cask?.map((dep) => (
                    <DependencyLink key={dep} name={dep} targetType="cask" />
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="graph">
                <Suspense fallback={<GraphFallback />}>
                  <DependencyGraph
                    rootName={cask.token}
                    rootType="cask"
                    rootDesc={cask.desc}
                    dependencies={[
                      ...(cask.depends_on?.formula || []).map((n) => ({
                        name: n,
                        type: "formula" as const,
                        kind: "runtime" as const,
                      })),
                      ...(cask.depends_on?.cask || []).map((n) => ({
                        name: n,
                        type: "cask" as const,
                        kind: "runtime" as const,
                      })),
                    ]}
                  />
                </Suspense>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <ReverseDependents name={cask.token} type="cask" />

      {cask.conflicts_with &&
        ((cask.conflicts_with.formula?.length ?? 0) > 0 ||
          (cask.conflicts_with.cask?.length ?? 0) > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Conflicts with
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {cask.conflicts_with.formula?.map((c) => (
                  <DependencyLink key={c} name={c} targetType="formula" />
                ))}
                {cask.conflicts_with.cask?.map((c) => (
                  <DependencyLink key={c} name={c} targetType="cask" />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {cask.caveats && <CaveatsCard caveats={cask.caveats} />}
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
