import { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useNavigate } from "react-router-dom";
import { Package, Box } from "lucide-react";
import { usePackageSnapshot } from "@/stores/usePackageSnapshot";
import type { PackageType } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Dependency graph view for a package.
 *
 * Layout strategy: a simple 3-column layered layout (no force simulation
 * needed for the relatively small fan-in/fan-out we expose).
 *
 *   [ dependents ]   ->   [ root ]   ->   [ dependencies ]
 *      (left col)         (center)         (right col)
 *
 * Edges are colored by relation kind:
 *  - runtime/required → solid primary
 *  - build            → dashed muted
 *  - optional         → dotted
 *  - reverse (used-by) → solid muted
 *
 * Node count is capped because some popular packages have thousands of
 * dependents; the cap is shown explicitly in the header.
 */

const MAX_DEPENDENTS = 40;

type DepKind = "runtime" | "build" | "optional" | "recommended" | "reverse";

interface PkgNodeData extends Record<string, unknown> {
  name: string;
  type: PackageType;
  desc: string | null;
  isRoot?: boolean;
  kindLabel?: string;
}

interface DepInfo {
  name: string;
  type: PackageType;
  kind: DepKind;
}

function PackageNode({ data }: NodeProps) {
  const d = data as PkgNodeData;
  const Icon = d.type === "formula" ? Package : Box;
  return (
    <div
      className={cn(
        "px-3 py-2 rounded-md border bg-card shadow-sm min-w-[160px] max-w-[220px]",
        d.isRoot
          ? "border-primary ring-2 ring-primary/40"
          : "border-border hover:border-primary/60"
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-muted-foreground/40"
      />
      <div className="flex items-center gap-1.5 min-w-0">
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span
          className={cn(
            "text-sm font-medium truncate",
            d.isRoot && "text-primary"
          )}
        >
          {d.name}
        </span>
      </div>
      {d.kindLabel && (
        <div className="text-[10px] text-muted-foreground mt-0.5">
          {d.kindLabel}
        </div>
      )}
      {d.desc && !d.isRoot && (
        <div className="text-[10px] text-muted-foreground line-clamp-2 mt-1">
          {d.desc}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-muted-foreground/40"
      />
    </div>
  );
}

const NODE_TYPES = { pkg: PackageNode };

interface DependencyGraphProps {
  rootName: string;
  rootType: PackageType;
  rootDesc: string | null;
  dependencies: DepInfo[];
}

export function DependencyGraph({
  rootName,
  rootType,
  rootDesc,
  dependencies,
}: DependencyGraphProps) {
  const navigate = useNavigate();
  const reverseDeps = usePackageSnapshot((s) => s.reverseDeps);
  const formulae = usePackageSnapshot((s) => s.formulae);
  const casks = usePackageSnapshot((s) => s.casks);

  const lookup = useMemo(() => {
    const map = new Map<string, { desc: string | null; type: PackageType }>();
    for (const f of formulae) map.set(`formula:${f.name}`, { desc: f.desc, type: "formula" });
    for (const c of casks) map.set(`cask:${c.name}`, { desc: c.desc, type: "cask" });
    return map;
  }, [formulae, casks]);

  const dependents = useMemo(() => {
    const list = reverseDeps.get(`${rootType}:${rootName}`) ?? [];
    return list.slice(0, MAX_DEPENDENTS);
  }, [reverseDeps, rootType, rootName]);

  const totalDependents =
    reverseDeps.get(`${rootType}:${rootName}`)?.length ?? 0;

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const X_DEPENDENTS = 0;
    const X_ROOT = 380;
    const X_DEPS = 760;
    const Y_GAP = 70;

    // Center root
    const totalRows = Math.max(dependents.length, dependencies.length, 1);
    const rootY = ((totalRows - 1) * Y_GAP) / 2;

    nodes.push({
      id: `root:${rootType}:${rootName}`,
      type: "pkg",
      position: { x: X_ROOT, y: rootY },
      data: {
        name: rootName,
        type: rootType,
        desc: rootDesc,
        isRoot: true,
      } satisfies PkgNodeData,
      draggable: false,
    });

    // Dependents on the left
    dependents.forEach((d, i) => {
      const id = `dep-rev:${d.type}:${d.name}`;
      const meta = lookup.get(`${d.type}:${d.name}`);
      nodes.push({
        id,
        type: "pkg",
        position: { x: X_DEPENDENTS, y: i * Y_GAP },
        data: {
          name: d.name,
          type: d.type,
          desc: meta?.desc ?? null,
        } satisfies PkgNodeData,
        draggable: false,
      });
      edges.push({
        id: `e:rev:${id}`,
        source: id,
        target: `root:${rootType}:${rootName}`,
        animated: false,
        style: { stroke: "var(--muted-foreground)", strokeOpacity: 0.4 },
      });
    });

    // Dependencies on the right
    dependencies.forEach((d, i) => {
      const id = `dep:${d.type}:${d.name}:${i}`;
      const meta = lookup.get(`${d.type}:${d.name}`);
      const kindLabel =
        d.kind === "runtime"
          ? undefined
          : d.kind === "build"
          ? "build"
          : d.kind === "optional"
          ? "optional"
          : d.kind === "recommended"
          ? "recommended"
          : undefined;

      nodes.push({
        id,
        type: "pkg",
        position: { x: X_DEPS, y: i * Y_GAP },
        data: {
          name: d.name,
          type: d.type,
          desc: meta?.desc ?? null,
          kindLabel,
        } satisfies PkgNodeData,
        draggable: false,
      });

      const edgeStyle =
        d.kind === "build"
          ? { stroke: "var(--muted-foreground)", strokeDasharray: "6 4" }
          : d.kind === "optional"
          ? { stroke: "var(--muted-foreground)", strokeDasharray: "2 4" }
          : d.kind === "recommended"
          ? { stroke: "var(--primary)", strokeOpacity: 0.6 }
          : { stroke: "var(--primary)" };

      edges.push({
        id: `e:fwd:${id}`,
        source: `root:${rootType}:${rootName}`,
        target: id,
        animated: false,
        style: edgeStyle,
      });
    });

    return { nodes, edges };
  }, [rootName, rootType, rootDesc, dependents, dependencies, lookup]);

  const onNodeClick = useCallback(
    (_: unknown, node: Node) => {
      const data = node.data as PkgNodeData;
      if (data.isRoot) return;
      navigate(`/${data.type}/${data.name}`);
    },
    [navigate]
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <LegendSwatch className="bg-primary" label="runtime" />
        <LegendSwatch
          className="bg-muted-foreground"
          dashed
          label="build"
        />
        <LegendSwatch
          className="bg-muted-foreground"
          dotted
          label="optional"
        />
        <LegendSwatch
          className="bg-muted-foreground"
          label={`used by (${
            totalDependents > MAX_DEPENDENTS
              ? `${MAX_DEPENDENTS} of ${totalDependents}`
              : totalDependents
          })`}
        />
      </div>
      <div
        style={{ height: 480 }}
        className="rounded-lg border overflow-hidden bg-muted/20"
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 1.2 }}
          minZoom={0.2}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} size={1} />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            className="!bg-background"
            nodeColor={() => "var(--primary)"}
          />
        </ReactFlow>
      </div>
    </div>
  );
}

function LegendSwatch({
  className,
  label,
  dashed,
  dotted,
}: {
  className: string;
  label: string;
  dashed?: boolean;
  dotted?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          "inline-block h-0.5 w-6",
          className,
          dashed && "border-t border-dashed bg-transparent",
          dotted && "border-t border-dotted bg-transparent"
        )}
        style={
          dashed || dotted
            ? { borderColor: "var(--muted-foreground)" }
            : undefined
        }
      />
      {label}
    </span>
  );
}

export type { DepInfo };
