import type { Cask } from "@/types";

/**
 * Cask "kind" — coarse classification derived from the cask's `artifacts`
 * array. The Homebrew Casks DSL emits a heterogeneous list of stanzas
 * (app, pkg, font, binary, qlplugin, etc.); see
 * https://docs.brew.sh/Cask-Cookbook#stanzas for the full taxonomy.
 *
 * We pick a single, user-meaningful "primary" stanza so the UI can show
 * a category badge and offer a `kind:` search filter ("kind:font",
 * "kind:app", ...). Lifecycle stanzas like `zap`, `uninstall`, `preflight`
 * are intentionally ignored.
 */
export type CaskKind =
  | "app"
  | "suite"
  | "pkg"
  | "mas"
  | "installer"
  | "font"
  | "qlplugin"
  | "preference_pane"
  | "colorpicker"
  | "screen_saver"
  | "input_method"
  | "dictionary"
  | "internet_plugin"
  | "audio_unit_plugin"
  | "vst_plugin"
  | "vst3_plugin"
  | "binary"
  | "service"
  | "stage_only"
  | "artifact";

// Higher = preferred when a cask declares multiple deliverable artifacts.
// Order roughly matches what a user would call the cask in conversation.
const KIND_PRIORITY: CaskKind[] = [
  "mas",
  "app",
  "suite",
  "pkg",
  "installer",
  "font",
  "qlplugin",
  "preference_pane",
  "colorpicker",
  "screen_saver",
  "input_method",
  "dictionary",
  "internet_plugin",
  "audio_unit_plugin",
  "vst_plugin",
  "vst3_plugin",
  "service",
  "stage_only",
  "artifact",
  "binary",
];

const KIND_SET = new Set<string>(KIND_PRIORITY);

const KIND_LABELS: Record<CaskKind, string> = {
  app: "App",
  suite: "Suite",
  pkg: "Installer Pkg",
  mas: "Mac App Store",
  installer: "Installer",
  font: "Font",
  qlplugin: "QuickLook",
  preference_pane: "Pref Pane",
  colorpicker: "Color Picker",
  screen_saver: "Screen Saver",
  input_method: "Input Method",
  dictionary: "Dictionary",
  internet_plugin: "Internet Plugin",
  audio_unit_plugin: "Audio Unit",
  vst_plugin: "VST",
  vst3_plugin: "VST3",
  binary: "CLI Binary",
  service: "Service",
  stage_only: "Stage Only",
  artifact: "Artifact",
};

export function getCaskKind(cask: Pick<Cask, "artifacts">): CaskKind | null {
  const found = new Set<CaskKind>();
  for (const stanza of cask.artifacts || []) {
    if (!stanza || typeof stanza !== "object") continue;
    for (const key of Object.keys(stanza)) {
      if (KIND_SET.has(key)) found.add(key as CaskKind);
    }
  }
  if (found.size === 0) return null;
  for (const k of KIND_PRIORITY) {
    if (found.has(k)) return k;
  }
  return null;
}

export function caskKindLabel(kind: CaskKind | null | undefined): string {
  if (!kind) return "";
  return KIND_LABELS[kind] || kind;
}
