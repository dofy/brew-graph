import { create } from "zustand";
import { db } from "@/db";
import type { Formula, Cask } from "@/types";
import type { PackageItem } from "@/hooks/usePackages";
import { getAnalytics, type AnalyticsSnapshot } from "@/db/sync";
import { getCaskKind } from "@/lib/caskKind";

/**
 * In-memory mirror of the package catalogue, pre-converted to `PackageItem`
 * for the search pipeline. Search runs ~30 keystrokes/sec on ~22k entries; the
 * `toArray()` + per-row deserialization cost from IndexedDB on every keystroke
 * is the dominant search latency, so we cache here once after sync.
 *
 * Detail pages still go through Dexie via `useFormula` / `useCask` because
 * they need the full record (artifacts, dependencies metadata, etc.).
 */
interface PackageSnapshotState {
  formulae: PackageItem[];
  casks: PackageItem[];
  analytics: AnalyticsSnapshot | null;
  isLoaded: boolean;
  isLoading: boolean;
  version: number;
  load: () => Promise<void>;
  reload: () => Promise<void>;
  clear: () => void;
}

function applyAnalytics(
  pkg: PackageItem,
  analytics: AnalyticsSnapshot | null
): PackageItem {
  if (!analytics) return pkg;
  const installs =
    pkg.type === "formula"
      ? analytics.formula[pkg.name] ?? 0
      : analytics.cask[pkg.name] ?? 0;
  if (installs <= 0) return pkg;
  return { ...pkg, installs30d: installs };
}

function formulaToPackage(formula: Formula): PackageItem {
  return {
    name: formula.name,
    displayName: formula.name,
    aliases: [...(formula.aliases || []), ...(formula.oldnames || [])],
    type: "formula",
    desc: formula.desc,
    version: formula.versions.stable,
    homepage: formula.homepage,
    dependencies: formula.dependencies,
    deprecated: formula.deprecated,
    disabled: formula.disabled,
    tap: formula.tap,
    license: formula.license,
  };
}

function caskToPackage(cask: Cask): PackageItem {
  const displayName = cask.name?.[0] || cask.token;
  return {
    name: cask.token,
    displayName,
    aliases: [...(cask.name || []), ...(cask.old_tokens || [])].filter(
      (n) => n && n !== cask.token
    ),
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
    tap: cask.tap,
    kind: getCaskKind(cask),
  };
}

export const usePackageSnapshot = create<PackageSnapshotState>((set, get) => ({
  formulae: [],
  casks: [],
  analytics: null,
  isLoaded: false,
  isLoading: false,
  version: 0,

  load: async () => {
    if (get().isLoaded || get().isLoading) return;
    set({ isLoading: true });
    try {
      const [rawFormulae, rawCasks, analytics] = await Promise.all([
        db.formulae.toArray(),
        db.casks.toArray(),
        getAnalytics(),
      ]);
      set({
        formulae: rawFormulae.map((f) =>
          applyAnalytics(formulaToPackage(f), analytics)
        ),
        casks: rawCasks.map((c) =>
          applyAnalytics(caskToPackage(c), analytics)
        ),
        analytics,
        isLoaded: true,
        isLoading: false,
        version: get().version + 1,
      });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  reload: async () => {
    set({ isLoading: true });
    const [rawFormulae, rawCasks, analytics] = await Promise.all([
      db.formulae.toArray(),
      db.casks.toArray(),
      getAnalytics(),
    ]);
    set({
      formulae: rawFormulae.map((f) =>
        applyAnalytics(formulaToPackage(f), analytics)
      ),
      casks: rawCasks.map((c) => applyAnalytics(caskToPackage(c), analytics)),
      analytics,
      isLoaded: true,
      isLoading: false,
      version: get().version + 1,
    });
  },

  clear: () =>
    set({
      formulae: [],
      casks: [],
      analytics: null,
      isLoaded: false,
      version: get().version + 1,
    }),
}));
